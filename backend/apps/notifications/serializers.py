from rest_framework import serializers
from .models import (
    Notification, NotificationPreference, EmailQueue,
    PushNotification, NotificationLog
)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'notification_type', 'title', 'message',
            'priority', 'is_read', 'read_at', 'action_url', 'metadata',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class NotificationListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message', 'priority',
            'is_read', 'created_at'
        ]


class NotificationDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message', 'priority',
            'related_object_type', 'related_object_id', 'is_read',
            'read_at', 'action_url', 'metadata', 'created_at', 'updated_at'
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'user', 'email_enabled', 'push_enabled', 'in_app_enabled',
            'sms_enabled', 'course_updates', 'assignments', 'quiz_results',
            'progress_updates', 'achievements', 'reminders', 'recommendations',
            'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class EmailQueueSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailQueue
        fields = [
            'id', 'recipient_email', 'subject', 'status', 'attempts',
            'error_message', 'created_at', 'sent_at'
        ]
        read_only_fields = ['id', 'created_at', 'sent_at']


class PushNotificationSerializer(serializers.ModelSerializer):
    device_id = serializers.CharField(source='device.device_id', read_only=True)
    device_type = serializers.CharField(source='device.device_type', read_only=True)
    
    class Meta:
        model = PushNotification
        fields = [
            'id', 'device', 'device_id', 'device_type', 'title', 'body',
            'data', 'status', 'created_at', 'sent_at'
        ]
        read_only_fields = ['id', 'created_at', 'sent_at']


class NotificationLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = NotificationLog
        fields = [
            'id', 'user', 'user_email', 'channel', 'sent',
            'delivery_status', 'sent_at'
        ]
        read_only_fields = ['id', 'sent_at']


class BulkNotificationSerializer(serializers.Serializer):
    """Serializer for bulk sending notifications"""
    
    title = serializers.CharField(max_length=255)
    message = serializers.CharField()
    notification_type = serializers.ChoiceField(
        choices=[
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
    )
    priority = serializers.ChoiceField(
        choices=[
            ('low', 'Low'),
            ('normal', 'Normal'),
            ('high', 'High'),
            ('urgent', 'Urgent'),
        ],
        default='normal'
    )
    recipient_filter = serializers.JSONField(
        help_text="Filter criteria: {'role': 'student', 'subscription_tier': 'pro'}"
    )
    channels = serializers.ListField(
        child=serializers.ChoiceField(
            choices=['email', 'push', 'in_app', 'sms']
        ),
        default=['in_app']
    )
    
    class Meta:
        fields = [
            'title', 'message', 'notification_type', 'priority',
            'recipient_filter', 'channels'
        ]


class NotificationStatsSerializer(serializers.Serializer):
    """Serializer for notification statistics"""
    
    total_sent = serializers.IntegerField()
    total_read = serializers.IntegerField()
    read_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    by_type = serializers.DictField()
    by_channel = serializers.DictField()
    
    class Meta:
        fields = [
            'total_sent', 'total_read', 'read_rate', 'by_type', 'by_channel'
        ]