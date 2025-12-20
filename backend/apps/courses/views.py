from rest_framework import viewsets, status, filters, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
try:
    from django_filters.rest_framework import DjangoFilterBackend
except Exception:
    DjangoFilterBackend = None
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from onthego.throttles import SearchRateThrottle
from .models import Category, Course, Module, Lesson, Quiz, Question
from .serializers import (
    CategorySerializer, CourseListSerializer, CourseDetailSerializer,
    CourseCreateUpdateSerializer, ModuleSerializer, ModuleDetailSerializer,
    ModuleCreateUpdateSerializer, LessonSerializer, LessonDetailSerializer,
    LessonCreateUpdateSerializer, QuizSerializer, QuizDetailSerializer,
    QuizCreateUpdateSerializer, QuestionSerializer, QuestionCreateUpdateSerializer
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Category endpoints - read only"""
    
    queryset = Category.objects.prefetch_related('subcategories')
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get category tree structure"""
        categories = Category.objects.filter(parent=None).prefetch_related('subcategories')
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)


class CourseViewSet(viewsets.ModelViewSet):
    """Course endpoints with caching and rate limiting"""

    queryset = Course.objects.all()
    serializer_class = CourseListSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    filter_backends = [b for b in (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter) if b]
    filterset_fields = ['category', 'difficulty', 'is_free', 'status']
    search_fields = ['title', 'description', 'keywords']
    ordering_fields = ['created_at', 'rating', 'enrolled_count']
    ordering = ['-created_at']

    def get_throttles(self):
        """Apply search throttle when search query is present"""
        if self.request.query_params.get('search'):
            return [SearchRateThrottle()]
        return []

    def get_permissions(self):
        """Allow any user to view courses"""
        if self.action in ['list', 'retrieve', 'course_structure', 'modules']:
            return [AllowAny()]
        return [IsAuthenticated()]

    # ✅ FIX: Cache course list for 5 minutes
    @method_decorator(cache_page(60 * 5, key_prefix='courses_list'))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    # ✅ FIX: Cache course detail for 10 minutes
    @method_decorator(cache_page(60 * 10, key_prefix='course_detail'))
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return CourseCreateUpdateSerializer
        return CourseListSerializer
    
    def get_queryset(self):
        queryset = Course.objects.all()

        # Optimize: Different strategies for different actions
        if self.action == 'list':
            # For list view: filter only published, limit fields
            return queryset.filter(status='published').select_related(
                'instructor', 'category'
            ).only(
                'id', 'slug', 'title', 'short_description', 'thumbnail',
                'difficulty', 'duration_hours', 'rating', 'enrolled_count',
                'is_free', 'price', 'status', 'created_at',
                'instructor__id', 'instructor__first_name', 'instructor__last_name',
                'category__id', 'category__name', 'category__slug'
            )
        elif self.action == 'retrieve':
            # For detail view: prefetch related data deeply
            return queryset.select_related('instructor', 'category').prefetch_related(
                'modules__lessons'
            )

        # For other actions (create, update, etc.)
        return queryset
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(instructor=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        course = self.get_object()
        
        if course.instructor != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'You do not have permission to edit this course.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def modules(self, request, slug=None):
        """Get all modules for a course"""
        course = self.get_object()
        # Optimize: Use only() to limit fields loaded for modules and lessons
        modules = course.modules.filter(is_published=True).prefetch_related(
            'lessons'
        ).only(
            'id', 'title', 'description', 'order', 'duration_minutes',
            'is_published', 'created_at', 'course_id'
        )
        serializer = ModuleDetailSerializer(modules, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='structure')
    def course_structure(self, request, slug=None):
        """
        Get full course structure with modules and lessons
        Returns hierarchical structure: Course -> Modules -> Lessons
        For instructors/admins: includes unpublished content
        For students: only published content
        """
        course = self.get_object()

        # Check if user can see unpublished content
        show_unpublished = (
            request.user.is_authenticated and
            (request.user.is_staff or course.instructor == request.user)
        )

        # Build queryset based on permissions
        modules_qs = course.modules.all() if show_unpublished else course.modules.filter(is_published=True)
        modules_qs = modules_qs.prefetch_related(
            'lessons'  # Prefetch all lessons
        ).order_by('order')

        # Serialize with full nested structure
        modules_data = []
        for module in modules_qs:
            # Filter lessons based on permissions
            lessons = module.lessons.all() if show_unpublished else module.lessons.filter(is_published=True)
            lessons = lessons.order_by('order')

            module_data = {
                'id': module.id,
                'title': module.title,
                'description': module.description,
                'order': module.order,
                'duration_minutes': module.duration_minutes,
                'is_published': module.is_published,
                'lessons': [
                    {
                        'id': lesson.id,
                        'title': lesson.title,
                        'content_type': lesson.content_type,
                        'duration_minutes': lesson.duration_minutes,
                        'order': lesson.order,
                        'is_published': lesson.is_published,
                        'is_free_preview': lesson.is_free_preview,
                        'video_url': lesson.video_url if lesson.content_type == 'video' else None,
                    }
                    for lesson in lessons
                ]
            }
            modules_data.append(module_data)

        return Response({
            'course_id': course.id,
            'course_slug': course.slug,
            'course_title': course.title,
            'modules': modules_data,
            'total_modules': len(modules_data),
            'total_lessons': sum(len(m['lessons']) for m in modules_data)
        })

    @action(detail=True, methods=['get'])
    def reviews(self, request, slug=None):
        """Get course reviews"""
        course = self.get_object()
        # Закомментировано для избежания ImportError
        return Response({'detail': 'Reviews not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, slug=None):
        """Get course statistics"""
        course = self.get_object()
        return Response({
            'enrolled_count': course.enrolled_count,
            'rating': float(course.rating),
            'reviews_count': course.reviews_count,
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def enroll(self, request, slug=None):
        """Enroll in course"""
        from apps.learning.models import CourseEnrollment
        from django.utils import timezone
        from django.db import transaction

        course = self.get_object()
        user = request.user

        # ✅ FIX: Use atomic transaction to prevent race condition
        with transaction.atomic():
            # Use select_for_update to lock the row during enrollment
            existing_enrollment = CourseEnrollment.objects.select_for_update().filter(
                user=user,
                course=course
            ).first()

            if existing_enrollment:
                if existing_enrollment.status == 'dropped':
                    # Re-activate dropped enrollment
                    existing_enrollment.status = 'active'
                    existing_enrollment.save()
                    return Response({
                        'message': 'Successfully re-enrolled in course',
                        'enrollment_id': str(existing_enrollment.id),
                        'status': existing_enrollment.status
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'error': 'Already enrolled in this course',
                        'enrollment_id': str(existing_enrollment.id),
                        'status': existing_enrollment.status
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Create new enrollment
            enrollment = CourseEnrollment.objects.create(
                user=user,
                course=course,
                status='active',
                started_at=timezone.now()
            )

        # ✅ FIX: Create module and lesson progress for all modules/lessons
        from apps.learning.models import ModuleProgress, LessonProgress
        for module in course.modules.all():
            module_progress = ModuleProgress.objects.create(
                enrollment=enrollment,
                module=module
            )
            # Create lesson progress for all lessons in this module
            for lesson in module.lessons.all():
                LessonProgress.objects.create(
                    module_progress=module_progress,
                    lesson=lesson,
                    status='not_started'
                )

        # Increment enrolled count
        course.enrolled_count += 1
        course.save(update_fields=['enrolled_count'])

        # Award XP for enrolling
        try:
            from apps.gamification.services import GamificationService
            GamificationService.award_xp(user, 'enroll_course', 50)
        except Exception as e:
            # Don't fail enrollment if XP fails
            print(f'Failed to award XP: {e}')

        return Response({
            'message': 'Successfully enrolled in course',
            'enrollment_id': str(enrollment.id),
            'course': {
                'id': course.id,
                'slug': course.slug,
                'title': course.title
            }
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def publish(self, request, slug=None):
        """Publish course (instructor only)"""
        course = self.get_object()

        if course.instructor != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'Only instructor can publish this course.'},
                status=status.HTTP_403_FORBIDDEN)

        course.status = 'published'
        from django.utils import timezone
        course.published_at = timezone.now()
        course.save()

        return Response({'status': 'Course published'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def archive(self, request, slug=None):
        """Archive course"""
        course = self.get_object()

        if course.instructor != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'Only instructor can archive this course.'},
                status=status.HTTP_403_FORBIDDEN)

        course.status = 'archived'
        course.save()

        return Response({'status': 'Course archived'})


class ModuleViewSet(viewsets.ModelViewSet):
    """Module endpoints"""

    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    filter_backends = [b for b in (DjangoFilterBackend,) if b]
    filterset_fields = ['course', 'is_published']

    def get_permissions(self):
        """
        View/list: AllowAny
        Create/Update/Delete: IsAuthenticated (instructor or admin)
        """
        if self.action in ['list', 'retrieve', 'lessons']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ModuleDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ModuleCreateUpdateSerializer
        return ModuleSerializer

    @action(detail=True, methods=['get'])
    def lessons(self, request, pk=None):
        """Get all lessons in a module"""
        module = self.get_object()
        # Optimize: Use only() to limit fields loaded
        lessons = module.lessons.filter(is_published=True).only(
            'id', 'title', 'content_type', 'content',
            'duration_minutes', 'order', 'is_published', 'created_at',
            'module_id'
        )
        serializer = LessonDetailSerializer(lessons, many=True)
        return Response(serializer.data)


class LessonViewSet(viewsets.ModelViewSet):
    """Lesson endpoints"""

    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    filter_backends = [b for b in (DjangoFilterBackend,) if b]
    filterset_fields = ['module', 'content_type', 'is_published']

    def get_permissions(self):
        """
        View/list: AllowAny
        Create/Update/Delete: IsAuthenticated (instructor or admin)
        """
        if self.action in ['list', 'retrieve', 'quiz']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LessonDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return LessonCreateUpdateSerializer
        return LessonSerializer

    @action(detail=True, methods=['get'])
    def quiz(self, request, pk=None):
        """Get quiz for lesson"""
        lesson = self.get_object()

        if not hasattr(lesson, 'quiz'):
            return Response({'detail': 'This lesson has no quiz.'},
                            status=status.HTTP_404_NOT_FOUND)

        serializer = QuizDetailSerializer(lesson.quiz)
        return Response(serializer.data)


class QuizViewSet(viewsets.ModelViewSet):
    """Quiz endpoints"""

    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer

    def get_permissions(self):
        """
        View/list/questions: AllowAny (students need to see quizzes)
        Submit: IsAuthenticated (logged in users can submit answers)
        Create/Update/Delete: IsAdminUser (only admins/instructors)
        """
        if self.action in ['list', 'retrieve', 'questions']:
            return [AllowAny()]
        elif self.action == 'submit':
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuizDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return QuizCreateUpdateSerializer
        return QuizSerializer

    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Get all questions for quiz"""
        quiz = self.get_object()
        # Optimize: Defer explanation field (can be large)
        # Students shouldn't see explanation before answering
        questions = quiz.questions.all().defer('explanation')
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """
        Submit quiz answers and calculate score
        Expected payload: {
            "answers": [
                {"question_id": 1, "selected_answer": "option_a"},
                {"question_id": 2, "selected_answer": "option_c"},
                ...
            ]
        }
        Returns: {
            "score": 8,
            "total": 10,
            "percentage": 80,
            "xp_awarded": 100,
            "passed": true
        }
        """
        # ✅ FIX: Check authentication BEFORE accessing quiz object
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication required to submit quiz.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        from apps.gamification.services import GamificationService

        quiz = self.get_object()
        answers = request.data.get('answers', [])

        # Get all questions for this quiz
        questions = quiz.questions.all()
        total_questions = questions.count()

        if total_questions == 0:
            return Response(
                {'detail': 'This quiz has no questions.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Build answer map for quick lookup
        answer_map = {ans['question_id']: ans['selected_answer'] for ans in answers}

        # Calculate score
        correct_count = 0
        results = []

        for question in questions:
            selected = answer_map.get(question.id)

            # ✅ FIX: Find correct answer from options JSON
            # Format: [{"text": "Answer 1", "is_correct": true}, ...]
            correct_answers = [opt['text'] for opt in question.options if opt.get('is_correct', False)]
            correct_answer = correct_answers[0] if correct_answers else None

            # Check if selected answer is correct
            is_correct = selected == correct_answer if correct_answer else False

            if is_correct:
                correct_count += 1

            results.append({
                'question_id': question.id,
                'question_text': question.text,  # ✅ FIX: use 'text' not 'question_text'
                'selected_answer': selected,
                'correct_answer': correct_answer,
                'is_correct': is_correct,
                'explanation': question.explanation
            })

        percentage = (correct_count / total_questions) * 100 if total_questions > 0 else 0
        passed = percentage >= (quiz.passing_score if hasattr(quiz, 'passing_score') else 60)

        # Award XP
        xp_awarded = 0
        if request.user.is_authenticated:
            if passed:
                # Perfect score gets bonus XP
                if percentage == 100:
                    xp_awarded = GamificationService.award_xp(request.user, 'perfect_quiz')
                else:
                    # Regular XP for completing quiz
                    xp_awarded = 50  # Base XP for quiz completion
                    try:
                        from apps.gamification.models import UserProfile as GamificationProfile
                        profile, _ = GamificationProfile.objects.get_or_create(user=request.user)
                        profile.xp += xp_awarded
                        profile.save()
                    except Exception as e:
                        print(f'Error awarding XP: {e}')

        return Response({
            'score': correct_count,
            'total': total_questions,
            'percentage': round(percentage, 2),
            'xp_awarded': xp_awarded,
            'passed': passed,
            'results': results
        })


class QuestionViewSet(viewsets.ModelViewSet):
    """Question endpoints"""

    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['quiz', 'question_type']

    def get_permissions(self):
        """
        View/list: AllowAny (students need to see questions)
        Create/Update/Delete: IsAdminUser (only admins can manage questions)
        """
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return QuestionCreateUpdateSerializer
        return QuestionSerializer


class SearchCoursesView(generics.ListAPIView):
    """Advanced course search"""

    serializer_class = CourseListSerializer
    permission_classes = [AllowAny]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    filterset_fields = ['category', 'difficulty', 'is_free']

    search_fields = ['title', 'description', 'keywords', 'learning_outcomes']

    ordering = ['-rating']

    def get_queryset(self):
        # Optimize: Limit fields loaded for search results
        return Course.objects.filter(status='published').select_related(
            'instructor', 'category'
        ).only(
            'id', 'slug', 'title', 'short_description', 'thumbnail',
            'difficulty', 'duration_hours', 'rating', 'enrolled_count',
            'is_free', 'price', 'status', 'created_at',
            'instructor__id', 'instructor__first_name', 'instructor__last_name',
            'category__id', 'category__name', 'category__slug'
        )
