import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from apps.users.models import User


class Notification(models.Model):
    """User notifications"""
    
    TYPE_CHOICES = [
        ('course_update', 'Course Update'),
        ('assignment', 'New Assignment'),
        ('quiz_result', 'Quiz Result'),
        ('progress', 'Progress Update'),
        ('achievement', 'Achievement Unlocked'),
        ('reminder', 'Learning Reminder'),
        ('message', 'New Message'),
        ('system', 'System Notice'),
        ('recommendation', 'Course Recommendation'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal')
    
    related_object_type = models.CharField(max_length=50, blank=True)
    related_object_id = models.UUIDField(null=True, blank=True)
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    action_url = models.URLField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notifications'
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['user', 'notification_type']),  # For by_type() optimization
        ]
    
    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"


class NotificationPreference(models.Model):
    """User notification preferences"""
    
    FREQUENCY_CHOICES = [
        ('instantly', 'Instantly'),
        ('daily', 'Daily Digest'),
        ('weekly', 'Weekly Digest'),
        ('never', 'Never'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Notification channels
    email_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    
    # Notification types preferences
    course_updates = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    assignments = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='instantly')
    quiz_results = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='instantly')
    progress_updates = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    achievements = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='instantly')
    reminders = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    recommendations = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='weekly')
    
    # Time preferences
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_preferences'
        verbose_name = _('Notification Preference')
        verbose_name_plural = _('Notification Preferences')
    
    def __str__(self):
        return f"Preferences for {self.user.email}"


class EmailQueue(models.Model):
    """Queue for emails to be sent"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('bounced', 'Bounced'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='email_queue', null=True, blank=True)
    
    recipient_email = models.EmailField()
    subject = models.CharField(max_length=255)
    body = models.TextField()
    html_body = models.TextField(blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=3)
    
    error_message = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'email_queue'
        verbose_name = _('Email Queue')
        verbose_name_plural = _('Email Queues')
        ordering = ['status', 'created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"Email to {self.recipient_email} - {self.status}"


class PushNotification(models.Model):
    """Push notifications for mobile apps"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='push_notifications')
    device = models.ForeignKey('users.UserDevice', on_delete=models.CASCADE, related_name='push_notifications')
    
    title = models.CharField(max_length=255)
    body = models.CharField(max_length=255)
    data = models.JSONField(default=dict, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'push_notifications'
        verbose_name = _('Push Notification')
        verbose_name_plural = _('Push Notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"Push: {self.title}"


class NotificationLog(models.Model):
    """Log of all sent notifications"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification = models.ForeignKey(Notification, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notification_logs')
    channel = models.CharField(max_length=50)  # email, push, in_app, sms
    
    sent = models.BooleanField(default=False)
    delivery_status = models.CharField(max_length=50, blank=True, null=True)
    
    sent_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notification_logs'
        verbose_name = _('Notification Log')
        verbose_name_plural = _('Notification Logs')
        ordering = ['-sent_at']
        indexes = [
            models.Index(fields=['user', 'sent_at']),
        ]
    
    def __str__(self):
        return f"Log for {self.user.email} - {self.channel}"