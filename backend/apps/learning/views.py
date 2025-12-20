from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from onthego.pagination import StandardResultsSetPagination

from .models import (
    CourseEnrollment, ModuleProgress, LessonProgress, Note,
    QuizAttempt, QuestionAnswer, Review, Bookmark
)
from .serializers import (
    CourseEnrollmentSerializer,
    ModuleProgressSerializer,
    LessonProgressSerializer,
    NoteSerializer,
    QuizAttemptSerializer,
    QuestionAnswerSerializer,
    ReviewSerializer,
    BookmarkSerializer,
)


class CourseEnrollmentViewSet(viewsets.ModelViewSet):
    """API для регистрации на курсы и управления регистрацией"""

    # Optimize: Pagination for enrollments list
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated]
    serializer_class = CourseEnrollmentSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'course']
    ordering_fields = ['enrolled_at', 'completed_at', '-enrolled_at']
    ordering = ['-enrolled_at']
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return CourseEnrollment.objects.none()
        # ✅ Optimize: Load user's gamification_profile for serializers
        return CourseEnrollment.objects.filter(
            user=self.request.user
        ).select_related('course', 'user', 'user__gamification_profile')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Отметить курс как завершённый"""
        enrollment = self.get_object()
        enrollment.status = 'completed'
        enrollment.save()
        return Response({'status': 'Курс отмечен как завершённый'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def last_lesson(self, request, pk=None):
        """Получить последний просмотренный урок для продолжения обучения"""
        enrollment = self.get_object()

        # Find the most recently accessed lesson for this enrollment
        last_lesson_progress = LessonProgress.objects.filter(
            module_progress__enrollment=enrollment
        ).select_related('lesson', 'module_progress__module').order_by('-last_accessed').first()

        if last_lesson_progress:
            return Response({
                'lesson_id': last_lesson_progress.lesson.id,
                'lesson_title': last_lesson_progress.lesson.title,
                'module_id': last_lesson_progress.module_progress.module.id,
                'module_title': last_lesson_progress.module_progress.module.title,
                'status': last_lesson_progress.status,
                'last_accessed': last_lesson_progress.last_accessed,
            })
        else:
            # No progress yet, return first lesson of first module
            first_module = enrollment.course.modules.order_by('order').first()
            if first_module:
                first_lesson = first_module.lessons.order_by('order').first()
                if first_lesson:
                    return Response({
                        'lesson_id': first_lesson.id,
                        'lesson_title': first_lesson.title,
                        'module_id': first_module.id,
                        'module_title': first_module.title,
                        'status': 'not_started',
                        'last_accessed': None,
                    })

            return Response({'message': 'No lessons available'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """Получить подробный прогресс по курсу"""
        from django.db import transaction

        enrollment = self.get_object()

        # Optimize: Prefetch modules with lessons in one query
        modules = enrollment.course.modules.prefetch_related('lessons').all()

        # Get all existing module progress in bulk
        module_ids = [m.id for m in modules]
        existing_module_progress = {
            mp.module_id: mp
            for mp in ModuleProgress.objects.filter(
                enrollment=enrollment,
                module_id__in=module_ids
            ).select_related('module')
        }

        # Get all lesson IDs
        all_lesson_ids = []
        for module in modules:
            all_lesson_ids.extend([lesson.id for lesson in module.lessons.all()])

        # Get all existing lesson progress in bulk
        existing_lesson_progress = {}
        if all_lesson_ids:
            for lp in LessonProgress.objects.filter(
                module_progress__enrollment=enrollment,
                lesson_id__in=all_lesson_ids
            ).select_related('lesson', 'module_progress'):
                key = (lp.module_progress.module_id, lp.lesson_id)
                existing_lesson_progress[key] = lp

        # Prepare bulk create lists
        module_progress_to_create = []
        lesson_progress_to_create = []
        module_progress_map = {}

        progress_data = {
            'enrollment_id': enrollment.id,
            'course': enrollment.course.title,
            'status': enrollment.status,
            'enrolled_at': enrollment.enrolled_at,
            'modules': []
        }

        # First pass: create missing module progress objects
        for module in modules:
            if module.id not in existing_module_progress:
                mp = ModuleProgress(enrollment=enrollment, module=module)
                module_progress_to_create.append(mp)
                module_progress_map[module.id] = mp
            else:
                module_progress_map[module.id] = existing_module_progress[module.id]

        # Bulk create module progress
        if module_progress_to_create:
            with transaction.atomic():
                ModuleProgress.objects.bulk_create(module_progress_to_create)

        # Reload to get IDs for newly created module progress
        if module_progress_to_create:
            existing_module_progress = {
                mp.module_id: mp
                for mp in ModuleProgress.objects.filter(
                    enrollment=enrollment,
                    module_id__in=module_ids
                )
            }
            module_progress_map = existing_module_progress

        # Second pass: create missing lesson progress and build response
        for module in modules:
            mp = module_progress_map[module.id]

            lessons_data = []
            for lesson in module.lessons.all():
                key = (module.id, lesson.id)

                if key not in existing_lesson_progress:
                    lp = LessonProgress(
                        module_progress=mp,
                        lesson=lesson,
                        status='not_started',
                        time_spent=0
                    )
                    lesson_progress_to_create.append(lp)
                    # Use default values for response
                    lessons_data.append({
                        'lesson_id': lesson.id,
                        'title': lesson.title,
                        'status': 'not_started',
                        'time_spent': 0,
                    })
                else:
                    lp = existing_lesson_progress[key]
                    lessons_data.append({
                        'lesson_id': lesson.id,
                        'title': lesson.title,
                        'status': lp.status,
                        'time_spent': lp.time_spent,
                    })

            progress_data['modules'].append({
                'module_id': module.id,
                'title': module.title,
                'is_completed': mp.is_completed,
                'progress_percentage': mp.progress_percentage,
                'lessons': lessons_data
            })

        # Bulk create lesson progress
        if lesson_progress_to_create:
            with transaction.atomic():
                LessonProgress.objects.bulk_create(lesson_progress_to_create, batch_size=100)

        return Response(progress_data)


class ModuleProgressViewSet(viewsets.ReadOnlyModelViewSet):
    """API для просмотра прогресса по модулям"""
    permission_classes = [IsAuthenticated]
    serializer_class = ModuleProgressSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['enrollment', 'is_completed']
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ModuleProgress.objects.none()
        return ModuleProgress.objects.filter(
            enrollment__user=self.request.user
        ).select_related('module', 'enrollment')


class LessonProgressViewSet(viewsets.ModelViewSet):
    """API для управления прогрессом по урокам"""
    permission_classes = [IsAuthenticated]
    serializer_class = LessonProgressSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['module_progress', 'status', 'lesson']  # ✅ FIX: Add lesson filter

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return LessonProgress.objects.none()
        return LessonProgress.objects.filter(
            module_progress__enrollment__user=self.request.user
        ).select_related('lesson', 'module_progress')

    def list(self, request, *args, **kwargs):
        """✅ FIX: Auto-create lesson progress if filtering by lesson and doesn't exist"""
        lesson_id = request.query_params.get('lesson')
        if lesson_id:
            try:
                from apps.courses.models import Lesson
                from apps.learning.models import CourseEnrollment, ModuleProgress
                from django.db import transaction

                lesson = Lesson.objects.get(id=lesson_id)

                # ✅ FIX: Use atomic transaction to prevent race conditions
                with transaction.atomic():
                    # Get or create enrollment for this lesson's course
                    enrollment, _ = CourseEnrollment.objects.get_or_create(
                        user=request.user,
                        course=lesson.module.course,
                        defaults={'status': 'active'}
                    )

                    # Get or create module progress
                    module_progress, _ = ModuleProgress.objects.get_or_create(
                        enrollment=enrollment,
                        module=lesson.module,
                        defaults={'progress_percentage': 0}
                    )

                    # Get or create lesson progress
                    lesson_progress, created = LessonProgress.objects.get_or_create(
                        module_progress=module_progress,
                        lesson=lesson,
                        defaults={'status': 'in_progress', 'progress_percentage': 0}
                    )

                    if created:
                        print(f"✅ Auto-created lesson progress for user {request.user.email}, lesson {lesson.title}")

            except Exception as e:
                print(f"⚠️ Error auto-creating lesson progress: {e}")

        return super().list(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Отметить урок как завершённый (XP начисляется через signal)"""
        from django.utils import timezone
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        lesson_progress = self.get_object()
        user = lesson_progress.module_progress.enrollment.user

        print(f"🔔 MARK_COMPLETED called: User {user.email}, Lesson {lesson_progress.lesson.title}")

        # Only mark completed if not already completed
        was_already_completed = lesson_progress.status == 'completed'

        if not was_already_completed:
            lesson_progress.status = 'completed'
            lesson_progress.completed_at = timezone.now()
            lesson_progress._just_completed = True  # ✅ Flag for signal to know this is a new completion
            lesson_progress.save()

            # ✅ XP will be awarded by signal automatically (gamification/signals.py:lesson_completed_xp)
            # ⚠️ DO NOT call GamificationService.award_xp() here - it causes double XP!

            # Update course progress percentage
            enrollment = lesson_progress.module_progress.enrollment
            progress_percentage = self._update_course_progress(enrollment)

            # Get XP amount for response (but don't award it here, signal does it)
            from apps.gamification.services import GamificationService
            xp_amount = GamificationService.XP_REWARDS.get('complete_lesson', 50)

            # ✅ FIX: Send WebSocket notification for progress update
            channel_layer = get_channel_layer()
            user = lesson_progress.module_progress.enrollment.user
            user_group = f'progress_{user.id}'

            try:
                async_to_sync(channel_layer.group_send)(
                    user_group,
                    {
                        'type': 'lesson_completed',
                        'lesson_id': lesson_progress.lesson.id,
                        'lesson_title': lesson_progress.lesson.title,
                        'xp_gained': xp_amount,
                        'total_xp': request.user.gamification_profile.xp if hasattr(request.user, 'gamification_profile') else 0,
                        'progress_percent': progress_percentage,
                        'timestamp': timezone.now().isoformat()
                    }
                )
            except Exception as e:
                print(f'Failed to send WebSocket notification: {e}')
        else:
            xp_amount = 0

        return Response({
            'status': 'Урок отмечен как завершённый',
            'xp_awarded': xp_amount,
            'lesson_id': lesson_progress.lesson.id,
            'lesson_title': lesson_progress.lesson.title,
        }, status=status.HTTP_200_OK)

    def _update_course_progress(self, enrollment):
        """Calculate and update course progress percentage"""
        # Get all lessons in the course
        total_lessons = 0
        completed_lessons = 0

        for module in enrollment.course.modules.all():
            module_lessons = module.lessons.count()
            total_lessons += module_lessons

            # Count completed lessons for this module
            completed_count = LessonProgress.objects.filter(
                module_progress__enrollment=enrollment,
                module_progress__module=module,
                status='completed'
            ).count()
            completed_lessons += completed_count

        # Calculate progress percentage
        if total_lessons > 0:
            progress_percentage = int((completed_lessons / total_lessons) * 100)
        else:
            progress_percentage = 0

        # Update enrollment
        enrollment.progress_percentage = progress_percentage
        if progress_percentage == 100 and enrollment.status != 'completed':
            enrollment.status = 'completed'
            enrollment.completed_at = timezone.now()
        enrollment.save()

        return progress_percentage


class NoteViewSet(viewsets.ModelViewSet):
    """API для управления заметками"""
    permission_classes = [IsAuthenticated]
    serializer_class = NoteSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['lesson']
    search_fields = ['content']
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Note.objects.none()
        return Note.objects.filter(user=self.request.user).select_related('lesson', 'user')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class QuizAttemptViewSet(viewsets.ModelViewSet):
    """API для управления попытками прохождения тестов"""

    # Optimize: Pagination for quiz attempts
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated]
    serializer_class = QuizAttemptSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'quiz']
    ordering_fields = ['started_at', 'score', '-started_at']
    ordering = ['-started_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return QuizAttempt.objects.none()
        return QuizAttempt.objects.filter(
            lesson_progress__module_progress__enrollment__user=self.request.user
        ).select_related('quiz', 'lesson_progress').prefetch_related('answers')
    
    @action(detail=True, methods=['post'])
    def submit_answers(self, request, pk=None):
        """Отправить ответы на тест"""
        from django.db import transaction

        quiz_attempt = self.get_object()
        answers = request.data.get('answers', [])

        # Optimize: Fetch all questions in one query for validation
        question_ids = [a.get('question_id') for a in answers if a.get('question_id')]
        questions = {
            q.id: q
            for q in Question.objects.filter(id__in=question_ids).only('id', 'points')
        }

        # Optimize: Prepare bulk create list
        answers_to_create = []
        total_points = 0

        for answer_data in answers:
            question_id = answer_data.get('question_id')
            user_answer = answer_data.get('user_answer')

            question = questions.get(question_id)
            if not question:
                continue

            answers_to_create.append(QuestionAnswer(
                quiz_attempt=quiz_attempt,
                question_id=question_id,
                user_answer=user_answer
            ))

            # Логика подсчёта баллов
            total_points += 1

        # Optimize: Bulk create in transaction
        with transaction.atomic():
            QuestionAnswer.objects.bulk_create(answers_to_create)
            quiz_attempt.score = total_points
            quiz_attempt.status = 'completed'
            quiz_attempt.save()

        serializer = self.get_serializer(quiz_attempt)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReviewViewSet(viewsets.ModelViewSet):
    """API для управления отзывами о курсах"""

    # Optimize: Pagination for reviews (courses may have many reviews)
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated]
    serializer_class = ReviewSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['course', 'rating']
    ordering_fields = ['rating', 'created_at', 'helpful_count', '-helpful_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Review.objects.select_related('course', 'user').order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_helpful(self, request, pk=None):
        """Отметить отзыв как полезный"""
        review = self.get_object()
        review.helpful_count += 1
        review.save()
        return Response({'helpful_count': review.helpful_count}, status=status.HTTP_200_OK)


class BookmarkViewSet(viewsets.ModelViewSet):
    """API для управления закладками"""
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['lesson', 'course']
    ordering = ['-created_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Bookmark.objects.none()
        return Bookmark.objects.filter(user=self.request.user).select_related('lesson', 'course', 'user')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_bookmarks(self, request):
        """Получить все закладки пользователя"""
        bookmarks = self.get_queryset()
        serializer = self.get_serializer(bookmarks, many=True)
        return Response(serializer.data)