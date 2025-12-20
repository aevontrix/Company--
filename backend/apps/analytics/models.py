import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import timedelta
from apps.users.models import User
from apps.courses.models import Course


class LearningStats(models.Model):
    """User learning statistics"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='learning_stats')
    
    # General stats
    total_study_time = models.IntegerField(default=0, help_text='in minutes')
    total_lessons_completed = models.IntegerField(default=0)
    total_courses_enrolled = models.IntegerField(default=0)
    total_courses_completed = models.IntegerField(default=0)
    total_quizzes_taken = models.IntegerField(default=0)
    average_quiz_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Streak tracking
    current_streak_days = models.IntegerField(default=0)
    longest_streak_days = models.IntegerField(default=0)
    last_learning_date = models.DateField(null=True, blank=True)
    
    # Achievements
    badges_earned = models.IntegerField(default=0)
    points = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'learning_stats'
        verbose_name = _('Learning Stats')
        verbose_name_plural = _('Learning Stats')
    
    def __str__(self):
        return f"Stats for {self.user.email}"


class DailyActivity(models.Model):
    """Track daily user activity"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_activities')
    
    date = models.DateField()
    time_spent = models.IntegerField(default=0, help_text='in minutes')
    lessons_completed = models.IntegerField(default=0)
    quizzes_taken = models.IntegerField(default=0)
    xp_earned = models.IntegerField(default=0, help_text='XP earned on this day')
    streak_preserved = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'daily_activities'
        unique_together = [['user', 'date']]
        verbose_name = _('Daily Activity')
        verbose_name_plural = _('Daily Activities')
        ordering = ['-date']
        indexes = [
            models.Index(fields=['user', 'date']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.date}"


class CourseStats(models.Model):
    """Statistics for each course"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.OneToOneField(Course, on_delete=models.CASCADE, related_name='stats')
    
    total_enrollments = models.IntegerField(default=0)
    active_learners = models.IntegerField(default=0)
    completed_learners = models.IntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_reviews = models.IntegerField(default=0)
    
    average_time_spent = models.IntegerField(default=0, help_text='in minutes')
    completion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    engagement_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'course_stats'
        verbose_name = _('Course Stats')
        verbose_name_plural = _('Course Stats')
    
    def __str__(self):
        return f"Stats for {self.course.title}"


class UserLearningPath(models.Model):
    """Recommended learning paths for users"""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_paths')
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    courses = models.ManyToManyField(Course, related_name='learning_paths')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    progress_percentage = models.IntegerField(default=0)
    
    recommended_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'user_learning_paths'
        verbose_name = _('User Learning Path')
        verbose_name_plural = _('User Learning Paths')
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"


class Recommendation(models.Model):
    """AI-generated course recommendations"""
    
    REASON_CHOICES = [
        ('interest', 'Matches your interests'),
        ('skill', 'Matches your skill level'),
        ('trending', 'Popular course'),
        ('relevant', 'Related to completed courses'),
        ('ai', 'AI recommended'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recommendations')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='recommendations')
    
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    score = models.DecimalField(max_digits=5, decimal_places=3)
    
    clicked = models.BooleanField(default=False)
    enrolled = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'recommendations'
        verbose_name = _('Recommendation')
        verbose_name_plural = _('Recommendations')
        ordering = ['-score']
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"Recommendation: {self.course.title} for {self.user.email}"


class AuditLog(models.Model):
    """System audit log for important actions"""
    
    ACTION_CHOICES = [
        ('user_create', 'User Created'),
        ('user_update', 'User Updated'),
        ('course_create', 'Course Created'),
        ('course_publish', 'Course Published'),
        ('enrollment', 'User Enrolled'),
        ('completion', 'Lesson Completed'),
        ('quiz_submit', 'Quiz Submitted'),
        ('payment', 'Payment Processed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    resource_type = models.CharField(max_length=50)
    resource_id = models.UUIDField()
    
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        verbose_name = _('Audit Log')
        verbose_name_plural = _('Audit Logs')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.action} - {self.created_at}"