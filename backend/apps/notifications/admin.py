from django.contrib import admin
from .models import (
    Notification, NotificationPreference, EmailQueue,
    PushNotification, NotificationLog
)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'notification_type', 'title', 'is_read',
        'priority', 'created_at'
    ]
    list_filter = ['notification_type', 'is_read', 'priority', 'created_at']
    search_fields = ['user__email', 'title', 'message']
    readonly_fields = ['created_at', 'updated_at', 'read_at']


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_enabled', 'push_enabled', 'in_app_enabled']
    list_filter = ['email_enabled', 'push_enabled', 'in_app_enabled']
    search_fields = ['user__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(EmailQueue)
class EmailQueueAdmin(admin.ModelAdmin):
    list_display = ['recipient_email', 'subject', 'status', 'attempts', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['recipient_email', 'subject']
    readonly_fields = ['created_at', 'sent_at']


@admin.register(PushNotification)
class PushNotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'device', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['title', 'body']
    readonly_fields = ['created_at', 'sent_at']


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'channel', 'sent', 'sent_at']
    list_filter = ['channel', 'sent', 'sent_at']
    search_fields = ['user__email']
    readonly_fields = ['sent_at']