from django.contrib import admin
from .models import (
    LearningStats, DailyActivity, CourseStats, UserLearningPath,
    Recommendation, AuditLog
)


@admin.register(LearningStats)
class LearningStatsAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'total_study_time', 'total_courses_completed',
        'current_streak_days', 'points'
    ]
    list_filter = ['created_at'] if hasattr(LearningStats, 'created_at') else []
    search_fields = ['user__email']
    readonly_fields = [
        'total_study_time', 'total_lessons_completed', 'total_courses_enrolled',
        'total_courses_completed', 'total_quizzes_taken', 'average_quiz_score',
        'current_streak_days', 'longest_streak_days', 'last_learning_date'
    ]


@admin.register(DailyActivity)
class DailyActivityAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'time_spent', 'lessons_completed', 'streak_preserved']
    list_filter = ['date', 'streak_preserved', 'created_at']
    search_fields = ['user__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CourseStats)
class CourseStatsAdmin(admin.ModelAdmin):
    list_display = [
        'course', 'total_enrollments', 'completion_rate',
        'average_rating', 'engagement_score'
    ]
    list_filter = ['created_at']
    search_fields = ['course__title']
    readonly_fields = [
        'total_enrollments', 'active_learners', 'completed_learners',
        'average_rating', 'total_reviews', 'average_time_spent',
        'completion_rate', 'engagement_score'
    ]


@admin.register(UserLearningPath)
class UserLearningPathAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'status', 'progress_percentage']
    # Исправлено: убран created_at если его нет в модели
    list_filter = ['status'] + (['created_at'] if hasattr(UserLearningPath, 'created_at') else [])
    search_fields = ['user__email', 'title']
    filter_horizontal = ['courses']
    readonly_fields = ['recommended_at']


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'reason', 'score', 'clicked', 'enrolled']
    list_filter = ['reason', 'clicked', 'enrolled', 'created_at']
    search_fields = ['user__email', 'course__title']
    readonly_fields = ['created_at', 'score']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'resource_type', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['user__email']
    readonly_fields = ['created_at', 'user', 'action', 'resource_type', 'resource_id', 'details']
