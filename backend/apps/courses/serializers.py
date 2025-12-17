from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Category, Course, Module, Lesson, Quiz, Question

User = get_user_model()


class CategorySerializer(serializers.ModelSerializer):
    """Сериализатор для категорий с подкатегориями"""
    subcategories = serializers.SerializerMethodField()
    courses_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'order',
                  'parent', 'subcategories', 'courses_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_subcategories(self, obj):
        subs = obj.subcategories.all()
        return CategorySerializer(subs, many=True).data
    
    def get_courses_count(self, obj):
        return obj.courses.count()


class UserBasicSerializer(serializers.ModelSerializer):
    """Базовая информация о пользователе"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name']
        read_only_fields = ['id']
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class QuestionSerializer(serializers.ModelSerializer):
    """Сериализатор для вопросов в тесте"""
    
    class Meta:
        model = Question
        fields = ['id', 'quiz', 'text', 'question_type', 'options', 'image_url',
                  'points', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class QuestionDetailSerializer(serializers.ModelSerializer):
    """Полная информация о вопросе (с ответами)"""
    
    class Meta:
        model = Question
        fields = ['id', 'quiz', 'text', 'question_type', 'options', 'image_url',
                  'points', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class QuizSerializer(serializers.ModelSerializer):
    """Упрощённый сериализатор для тестов"""
    questions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ['id', 'lesson', 'title', 'description', 'max_attempts',
                  'passing_score', 'time_limit_minutes', 'shuffle_questions',
                  'show_correct_answers', 'is_required', 'questions_count',
                  'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_questions_count(self, obj):
        return obj.questions.count()


class QuizDetailSerializer(serializers.ModelSerializer):
    """Полный сериализатор для теста с вопросами"""
    questions = QuestionDetailSerializer(many=True, read_only=True)
    questions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ['id', 'lesson', 'title', 'description', 'max_attempts',
                  'passing_score', 'time_limit_minutes', 'shuffle_questions',
                  'show_correct_answers', 'is_required', 'created_at',
                  'updated_at', 'questions', 'questions_count']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_questions_count(self, obj):
        return obj.questions.count()


class LessonSerializer(serializers.ModelSerializer):
    """Упрощённый сериализатор для уроков"""
    
    class Meta:
        model = Lesson
        fields = ['id', 'module', 'title', 'content_type', 'video_url',
                  'duration_minutes', 'order', 'is_published', 'is_free_preview',
                  'created_at']
        read_only_fields = ['id', 'created_at']


class LessonDetailSerializer(serializers.ModelSerializer):
    """Полный сериализатор для урока с материалами и тестом"""
    quiz = QuizDetailSerializer(read_only=True)
    
    class Meta:
        model = Lesson
        fields = ['id', 'module', 'title', 'content', 'content_type',
                  'video_url', 'audio_url', 'attachments', 'resources',
                  'duration_minutes', 'order', 'is_published', 'is_free_preview',
                  'created_at', 'updated_at', 'quiz']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ModuleSerializer(serializers.ModelSerializer):
    """Упрощённый сериализатор для модулей"""
    lessons_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Module
        fields = ['id', 'course', 'title', 'description', 'order',
                  'duration_minutes', 'is_published', 'created_at', 'lessons_count']
        read_only_fields = ['id', 'created_at']
    
    def get_lessons_count(self, obj):
        return obj.lessons.count()


class ModuleDetailSerializer(serializers.ModelSerializer):
    """Полный сериализатор для модуля с уроками"""
    lessons = LessonDetailSerializer(many=True, read_only=True)
    lessons_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Module
        fields = ['id', 'course', 'title', 'description', 'order',
                  'duration_minutes', 'is_published', 'created_at', 'updated_at',
                  'lessons', 'lessons_count']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_lessons_count(self, obj):
        return obj.lessons.count()


class CourseListSerializer(serializers.ModelSerializer):
    """Упрощённый сериализатор для списка курсов"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    instructor_name = serializers.CharField(source='instructor.get_full_name', read_only=True)
    modules_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['id', 'slug', 'title', 'short_description', 'thumbnail',
                  'difficulty', 'duration_hours', 'rating', 'reviews_count',
                  'enrolled_count', 'is_free', 'is_featured', 'status',
                  'category', 'category_name', 'instructor_name', 'modules_count',
                  'created_at']
        read_only_fields = ['id', 'created_at', 'enrolled_count', 'rating', 'reviews_count']
    
    def get_modules_count(self, obj):
        return obj.modules.count()


class CourseDetailSerializer(serializers.ModelSerializer):
    """Полный сериализатор для деталей курса"""
    category = CategorySerializer(read_only=True)
    instructor = UserBasicSerializer(read_only=True)
    modules = ModuleDetailSerializer(many=True, read_only=True)
    modules_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'slug', 'title', 'description', 'short_description',
                  'thumbnail', 'difficulty', 'duration_hours', 'rating',
                  'reviews_count', 'enrolled_count', 'is_free', 'is_featured',
                  'status', 'category', 'instructor', 'keywords', 'learning_outcomes',
                  'prerequisites', 'target_audience', 'meta_title',
                  'meta_description', 'published_at',
                  'created_at', 'updated_at', 'modules', 'modules_count', 'is_enrolled']
        read_only_fields = ['id', 'created_at', 'updated_at', 'enrolled_count',
                           'rating', 'reviews_count', 'is_enrolled']

    def get_modules_count(self, obj):
        return obj.modules.count()

    def get_is_enrolled(self, obj):
        """Check if current user is enrolled in this course"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.enrollments.filter(user_id=request.user.id).exists()
        return False


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания и обновления курса"""
    
    class Meta:
        model = Course
        fields = ['title', 'description', 'short_description', 'thumbnail',
                  'difficulty', 'duration_hours', 'is_free', 'is_featured',
                  'status', 'category', 'keywords', 'learning_outcomes',
                  'prerequisites', 'target_audience', 'meta_title',
                  'meta_description']
    
    def create(self, validated_data):
        validated_data['instructor'] = self.context['request'].user
        return super().create(validated_data)


class ModuleCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания и обновления модуля"""
    
    class Meta:
        model = Module
        fields = ['title', 'description', 'order', 'is_published', 'duration_minutes']


class LessonCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания и обновления урока"""
    
    class Meta:
        model = Lesson
        fields = ['title', 'content', 'content_type', 'video_url', 'audio_url',
                  'attachments', 'resources', 'duration_minutes', 'order',
                  'is_published', 'is_free_preview']


class QuizCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания и обновления теста"""
    
    class Meta:
        model = Quiz
        fields = ['title', 'description', 'max_attempts', 'passing_score',
                  'time_limit_minutes', 'shuffle_questions', 'show_correct_answers',
                  'is_required']


class QuestionCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания и обновления вопроса"""
    
    class Meta:
        model = Question
        fields = ['text', 'question_type', 'options', 'image_url', 'points', 'order']


# Backwards-compatible alias used by other apps
# Some modules expect `CourseSerializer` to exist — alias it to `CourseListSerializer`.
CourseSerializer = CourseListSerializer