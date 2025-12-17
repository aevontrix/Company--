from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.utils import timezone
from django.db import models
from datetime import timedelta, datetime
from .models import (
    LearningStats, DailyActivity, CourseStats, UserLearningPath,
    Recommendation, AuditLog
)
from .serializers import (
    LearningStatsSerializer, DailyActivitySerializer, CourseStatsSerializer,
    UserLearningPathSerializer, RecommendationSerializer,
    RecommendationListSerializer, AuditLogSerializer, AnalyticsDashboardSerializer,
    UserProgressReportSerializer
)


class LearningStatsViewSet(viewsets.ReadOnlyModelViewSet):
    """User learning statistics"""
    
    serializer_class = LearningStatsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return LearningStats.objects.none()
        if self.request.user.is_staff:
            return LearningStats.objects.all()
        return LearningStats.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_stats(self, request):
        """Get current user stats"""
        try:
            stats = LearningStats.objects.get(user=request.user)
        except LearningStats.DoesNotExist:
            stats = LearningStats.objects.create(user=request.user)
        
        serializer = self.get_serializer(stats)
        return Response(serializer.data)


class DailyActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """Daily user activity tracking"""
    
    serializer_class = DailyActivitySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['date', 'user']
    ordering = ['-date']
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return DailyActivity.objects.none()
        if self.request.user.is_staff:
            return DailyActivity.objects.all()
        return DailyActivity.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def week(self, request):
        """Get weekly activity"""
        user = request.user
        week_ago = timezone.now().date() - timedelta(days=7)
        
        activities = DailyActivity.objects.filter(
            user=user,
            date__gte=week_ago
        ).order_by('date')
        
        serializer = self.get_serializer(activities, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def month(self, request):
        """Get monthly activity"""
        user = request.user
        month_ago = timezone.now().date() - timedelta(days=30)
        
        activities = DailyActivity.objects.filter(
            user=user,
            date__gte=month_ago
        ).order_by('date')
        
        serializer = self.get_serializer(activities, many=True)
        return Response(serializer.data)


class CourseStatsViewSet(viewsets.ReadOnlyModelViewSet):
    """Course statistics"""
    
    queryset = CourseStats.objects.all()
    serializer_class = CourseStatsSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['course']
    ordering = ['-completion_rate']
    
    @action(detail=False, methods=['get'])
    def top_courses(self, request):
        """Get top performing courses"""
        stats = CourseStats.objects.order_by('-engagement_score')[:10]
        serializer = self.get_serializer(stats, many=True)
        return Response(serializer.data)


class UserLearningPathViewSet(viewsets.ModelViewSet):
    """User learning paths"""
    
    serializer_class = UserLearningPathSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return UserLearningPath.objects.none()
        if self.request.user.is_staff:
            return UserLearningPath.objects.all()
        return UserLearningPath.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active learning paths"""
        paths = self.get_queryset().filter(status='active')
        serializer = self.get_serializer(paths, many=True)
        return Response(serializer.data)


class RecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    """Course recommendations"""
    
    serializer_class = RecommendationListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering = ['-score']
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Recommendation.objects.none()
        return Recommendation.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_clicked(self, request, pk=None):
        """Mark recommendation as clicked"""
        recommendation = self.get_object()
        recommendation.clicked = True
        recommendation.save()
        return Response({'status': 'Marked as clicked'})
    
    @action(detail=True, methods=['post'])
    def mark_enrolled(self, request, pk=None):
        """Mark recommendation as enrolled"""
        recommendation = self.get_object()
        recommendation.enrolled = True
        recommendation.save()
        return Response({'status': 'Marked as enrolled'})


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Audit logs (admin only)"""
    
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['action', 'resource_type']
    ordering = ['-created_at']


class UserProgressReportView(generics.GenericAPIView):
    """Get detailed user progress report"""

    permission_classes = [IsAuthenticated]
    serializer_class = UserProgressReportSerializer

    def get(self, request):
        from apps.learning.models import CourseEnrollment, LessonProgress
        
        user = request.user
        
        try:
            stats = LearningStats.objects.get(user=user)
        except LearningStats.DoesNotExist:
            stats = LearningStats.objects.create(user=user)
        
        enrollments = CourseEnrollment.objects.filter(user=user)
        total_progress = enrollments.aggregate(
            avg=models.Avg('progress_percentage')
        )['avg'] or 0

        # Получаем последнюю активность из enrollments
        last_enrollment = enrollments.order_by('-last_accessed').first()
        last_activity = last_enrollment.last_accessed if last_enrollment else None

        report_data = {
            'total_study_time': stats.total_study_time,
            'completion_percentage': total_progress,
            'average_score': stats.average_quiz_score,
            'courses_completed': stats.total_courses_completed,
            'current_streak': stats.current_streak_days,
            'last_activity': last_activity,
        }
        
        serializer = UserProgressReportSerializer(report_data)
        return Response(serializer.data)


class AnalyticsDashboardView(generics.GenericAPIView):
    """Get analytics dashboard data"""

    permission_classes = [IsAuthenticated]
    serializer_class = AnalyticsDashboardSerializer

    def get(self, request):
        from apps.learning.models import CourseEnrollment
        
        user = request.user
        
        try:
            stats = LearningStats.objects.get(user=user)
        except LearningStats.DoesNotExist:
            stats = LearningStats.objects.create(user=user)
        
        week_ago = timezone.now().date() - timedelta(days=7)

        # Optimize: select only needed fields
        daily_activities = DailyActivity.objects.filter(
            user=user,
            date__gte=week_ago
        ).only('date', 'time_spent', 'lessons_completed', 'quizzes_taken')

        # Optimize: prefetch courses for ManyToMany relationship
        learning_paths = UserLearningPath.objects.filter(
            user=user,
            status='active'
        ).prefetch_related('courses').only(
            'id', 'title', 'description', 'status', 'progress_percentage'
        )

        # Optimize: select_related course for ForeignKey
        recommendations = Recommendation.objects.filter(
            user=user
        ).select_related('course').only(
            'id', 'reason', 'score',
            'course__id', 'course__title', 'course__slug',
            'course__thumbnail', 'course__difficulty'
        )[:10]
        
        data = {
            'user_stats': LearningStatsSerializer(stats).data,
            'daily_activities': DailyActivitySerializer(daily_activities, many=True).data,
            'learning_paths': UserLearningPathSerializer(learning_paths, many=True).data,
            'recommendations': RecommendationListSerializer(recommendations, many=True).data,
        }
        
        return Response(data)


from django.db import models