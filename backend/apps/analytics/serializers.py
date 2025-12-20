from rest_framework import serializers
from .models import (
    LearningStats, DailyActivity, CourseStats, UserLearningPath,
    Recommendation, AuditLog
)
from apps.courses.serializers import CourseSerializer


class LearningStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningStats
        fields = [
            'id', 'user', 'total_study_time', 'total_lessons_completed',
            'total_courses_enrolled', 'total_courses_completed',
            'total_quizzes_taken', 'average_quiz_score', 'current_streak_days',
            'longest_streak_days', 'last_learning_date', 'badges_earned',
            'points', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DailyActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyActivity
        fields = [
            'id', 'user', 'date', 'time_spent', 'lessons_completed',
            'quizzes_taken', 'xp_earned', 'streak_preserved', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CourseStatsSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    
    class Meta:
        model = CourseStats
        fields = [
            'id', 'course', 'total_enrollments', 'active_learners',
            'completed_learners', 'average_rating', 'total_reviews',
            'average_time_spent', 'completion_rate', 'engagement_score',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserLearningPathSerializer(serializers.ModelSerializer):
    courses = CourseSerializer(many=True, read_only=True)
    
    class Meta:
        model = UserLearningPath
        fields = [
            'id', 'user', 'title', 'description', 'courses', 'status',
            'progress_percentage', 'recommended_at', 'started_at',
            'completed_at'
        ]
        read_only_fields = ['id', 'recommended_at']


class RecommendationSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    
    class Meta:
        model = Recommendation
        fields = [
            'id', 'user', 'course', 'reason', 'score', 'clicked',
            'enrolled', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class RecommendationListSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    
    class Meta:
        model = Recommendation
        fields = [
            'id', 'course', 'reason', 'score', 'clicked', 'enrolled'
        ]


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True, allow_null=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'action', 'resource_type',
            'resource_id', 'details', 'ip_address', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AnalyticsDashboardSerializer(serializers.Serializer):
    """Serializer for analytics dashboard data"""
    
    user_stats = LearningStatsSerializer()
    daily_activities = DailyActivitySerializer(many=True)
    learning_paths = UserLearningPathSerializer(many=True)
    recommendations = RecommendationListSerializer(many=True)
    
    class Meta:
        fields = [
            'user_stats', 'daily_activities', 'learning_paths',
            'recommendations'
        ]


class UserProgressReportSerializer(serializers.Serializer):
    """Serializer for user progress report"""
    
    total_study_time = serializers.IntegerField()
    completion_percentage = serializers.IntegerField()
    average_score = serializers.DecimalField(max_digits=5, decimal_places=2)
    courses_completed = serializers.IntegerField()
    current_streak = serializers.IntegerField()
    last_activity = serializers.DateTimeField()
    
    class Meta:
        fields = [
            'total_study_time', 'completion_percentage', 'average_score',
            'courses_completed', 'current_streak', 'last_activity'
        ]