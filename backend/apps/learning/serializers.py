from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    CourseEnrollment, ModuleProgress, LessonProgress, Note,
    QuizAttempt, QuestionAnswer, Review, Bookmark
)
from apps.courses.models import Course
from apps.courses.serializers import CourseListSerializer

User = get_user_model()


class CourseEnrollmentSerializer(serializers.ModelSerializer):
    """Регистрация пользователя на курс"""
    course = CourseListSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        source='course',
        write_only=True
    )
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = CourseEnrollment
        fields = ['id', 'user', 'user_name', 'course', 'course_id', 'status',
                  'enrolled_at', 'completed_at', 'progress_percentage']
        read_only_fields = ['id', 'user', 'enrolled_at', 'completed_at']
    
    def get_progress_percentage(self, obj):
        total = obj.course.modules.count()
        if total == 0:
            return 0
        # ✅ Исправлено: module_progress → moduleprogress
        completed = obj.course.modules.filter(
            moduleprogress__enrollment=obj,
            moduleprogress__is_completed=True
        ).count()
        return (completed / total) * 100
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ModuleProgressSerializer(serializers.ModelSerializer):
    """Прогресс по модулю"""
    module_title = serializers.CharField(source='module.title', read_only=True)
    
    class Meta:
        model = ModuleProgress
        fields = ['id', 'enrollment', 'module', 'module_title', 'is_completed',
                  'progress_percentage', 'time_spent', 'started_at', 'completed_at']
        read_only_fields = ['id', 'started_at', 'completed_at']


class LessonProgressSerializer(serializers.ModelSerializer):
    """Прогресс по уроку"""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    
    class Meta:
        model = LessonProgress
        fields = ['id', 'module_progress', 'lesson', 'lesson_title', 'status',
                  'is_viewed', 'progress_percentage', 'time_spent', 'started_at',
                  'completed_at', 'last_accessed']
        read_only_fields = ['id', 'started_at', 'completed_at', 'last_accessed']


class NoteSerializer(serializers.ModelSerializer):
    """Заметки пользователя по уроку"""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = Note
        fields = ['id', 'user', 'user_name', 'lesson_progress', 'lesson', 'lesson_title',
                  'title', 'content', 'timestamp', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class QuestionAnswerSerializer(serializers.ModelSerializer):
    """Ответы на вопросы теста"""
    question_text = serializers.CharField(source='question.text', read_only=True)

    class Meta:
        model = QuestionAnswer
        fields = ['id', 'quiz_attempt', 'question', 'question_text', 'user_answer',
                  'is_correct', 'points_earned', 'answered_at']
        read_only_fields = ['id', 'is_correct', 'points_earned', 'answered_at']


class QuizAttemptSerializer(serializers.ModelSerializer):
    """Попытка прохождения теста"""
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    lesson_title = serializers.CharField(source='lesson_progress.lesson.title', read_only=True)
    answers = QuestionAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = QuizAttempt
        fields = ['id', 'lesson_progress', 'quiz', 'quiz_title', 'lesson_title',
                  'status', 'score', 'passed', 'time_taken', 'answers', 'started_at', 'submitted_at']
        read_only_fields = ['id', 'score', 'status', 'passed', 'started_at', 'submitted_at']


class ReviewSerializer(serializers.ModelSerializer):
    """Отзыв о курсе"""
    course_title = serializers.CharField(source='course.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user', 'user_name', 'course', 'course_title', 'rating',
                  'title', 'comment', 'helpful_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'helpful_count', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class BookmarkSerializer(serializers.ModelSerializer):
    """Закладка урока или курса"""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True, allow_null=True)
    course_title = serializers.CharField(source='course.title', read_only=True, allow_null=True)

    class Meta:
        model = Bookmark
        fields = ['id', 'user', 'course', 'lesson', 'course_title', 'lesson_title', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)