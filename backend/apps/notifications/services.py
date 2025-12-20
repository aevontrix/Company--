"""
Email and Push Notification Services

Provides centralized notification delivery for the ONTHEGO platform.
"""

from typing import Optional, List, Dict, Any
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from django.conf import settings
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import (
    Notification,
    NotificationPreference,
    EmailQueue,
    PushNotification,
    NotificationLog,
)


class EmailService:
    """
    Service for sending emails with queue support.

    Supports:
    - Direct email sending
    - Queue-based email delivery
    - HTML and plain text emails
    - Template-based emails
    """

    @staticmethod
    def send_email(
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        from_email: Optional[str] = None,
        fail_silently: bool = False,
    ) -> bool:
        """
        Send an email directly (synchronous).

        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Plain text body
            html_body: Optional HTML body
            from_email: Sender email (defaults to DEFAULT_FROM_EMAIL)
            fail_silently: If True, don't raise exceptions on failure

        Returns:
            bool: True if sent successfully
        """
        try:
            from_email = from_email or settings.DEFAULT_FROM_EMAIL

            if html_body:
                msg = EmailMultiAlternatives(
                    subject=subject,
                    body=body,
                    from_email=from_email,
                    to=[to_email],
                )
                msg.attach_alternative(html_body, "text/html")
                msg.send(fail_silently=fail_silently)
            else:
                send_mail(
                    subject=subject,
                    message=body,
                    from_email=from_email,
                    recipient_list=[to_email],
                    fail_silently=fail_silently,
                )

            print(f"[EMAIL] Sent to {to_email}: {subject}")
            return True

        except Exception as e:
            print(f"[EMAIL] Failed to send to {to_email}: {e}")
            if not fail_silently:
                raise
            return False

    @staticmethod
    def queue_email(
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        notification: Optional[Notification] = None,
    ) -> EmailQueue:
        """
        Add email to queue for later sending.

        Args:
            to_email: Recipient email
            subject: Email subject
            body: Plain text body
            html_body: Optional HTML body
            notification: Optional related notification

        Returns:
            EmailQueue: Created queue entry
        """
        email_entry = EmailQueue.objects.create(
            notification=notification,
            recipient_email=to_email,
            subject=subject,
            body=body,
            html_body=html_body,
            status='pending',
        )
        print(f"[EMAIL] Queued for {to_email}: {subject}")
        return email_entry

    @classmethod
    def process_queue(cls, batch_size: int = 50) -> Dict[str, int]:
        """
        Process pending emails in queue.

        Args:
            batch_size: Maximum emails to process

        Returns:
            dict: Stats with 'sent', 'failed', 'skipped' counts
        """
        stats = {'sent': 0, 'failed': 0, 'skipped': 0}

        pending_emails = EmailQueue.objects.filter(
            status='pending'
        ).select_related('notification')[:batch_size]

        for email_entry in pending_emails:
            if email_entry.attempts >= email_entry.max_attempts:
                email_entry.status = 'failed'
                email_entry.error_message = 'Max attempts exceeded'
                email_entry.save()
                stats['skipped'] += 1
                continue

            email_entry.attempts += 1

            try:
                success = cls.send_email(
                    to_email=email_entry.recipient_email,
                    subject=email_entry.subject,
                    body=email_entry.body,
                    html_body=email_entry.html_body,
                    fail_silently=False,
                )

                if success:
                    email_entry.status = 'sent'
                    email_entry.sent_at = timezone.now()
                    stats['sent'] += 1
                else:
                    email_entry.status = 'failed'
                    stats['failed'] += 1

            except Exception as e:
                email_entry.error_message = str(e)
                if email_entry.attempts >= email_entry.max_attempts:
                    email_entry.status = 'failed'
                stats['failed'] += 1

            email_entry.save()

        print(f"[EMAIL] Queue processed: {stats}")
        return stats

    @staticmethod
    def send_password_reset_email(user, reset_url: str) -> bool:
        """
        Send password reset email to user.

        Args:
            user: User model instance
            reset_url: URL for password reset

        Returns:
            bool: True if sent successfully
        """
        subject = "ONTHEGO - Сброс пароля"

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #0A0E27; color: #ffffff; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #1a1f3a; border-radius: 12px; padding: 30px;">
                <h1 style="color: #4DBDFF; margin-bottom: 20px;">ONTHEGO</h1>
                <h2 style="color: #ffffff;">Сброс пароля</h2>
                <p style="color: #a0a0a0; line-height: 1.6;">
                    Здравствуйте, {user.first_name or user.email}!
                </p>
                <p style="color: #a0a0a0; line-height: 1.6;">
                    Вы запросили сброс пароля для вашего аккаунта ONTHEGO.
                    Нажмите кнопку ниже, чтобы установить новый пароль:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" style="display: inline-block; background: linear-gradient(135deg, #4DBDFF, #B13CFF); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Сбросить пароль
                    </a>
                </div>
                <p style="color: #666; font-size: 12px;">
                    Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
                    Ссылка действительна в течение 24 часов.
                </p>
            </div>
        </body>
        </html>
        """

        plain_body = f"""
        Здравствуйте, {user.first_name or user.email}!

        Вы запросили сброс пароля для вашего аккаунта ONTHEGO.

        Перейдите по ссылке для сброса пароля:
        {reset_url}

        Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
        """

        return EmailService.send_email(
            to_email=user.email,
            subject=subject,
            body=plain_body,
            html_body=html_body,
        )

    @staticmethod
    def send_welcome_email(user) -> bool:
        """
        Send welcome email to new user.

        Args:
            user: User model instance

        Returns:
            bool: True if sent successfully
        """
        subject = "Добро пожаловать в ONTHEGO!"

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #0A0E27; color: #ffffff; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #1a1f3a; border-radius: 12px; padding: 30px;">
                <h1 style="color: #4DBDFF; margin-bottom: 20px;">ONTHEGO</h1>
                <h2 style="color: #ffffff;">Добро пожаловать!</h2>
                <p style="color: #a0a0a0; line-height: 1.6;">
                    Здравствуйте, {user.first_name or 'друг'}!
                </p>
                <p style="color: #a0a0a0; line-height: 1.6;">
                    Спасибо за регистрацию на платформе ONTHEGO.
                    Вы получили <strong style="color: #4DBDFF;">+50 XP</strong> за регистрацию!
                </p>
                <p style="color: #a0a0a0; line-height: 1.6;">
                    Начните обучение прямо сейчас и зарабатывайте XP,
                    открывайте достижения и соревнуйтесь с друзьями!
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3000/courses" style="display: inline-block; background: linear-gradient(135deg, #4DBDFF, #B13CFF); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Начать обучение
                    </a>
                </div>
            </div>
        </body>
        </html>
        """

        plain_body = f"""
        Здравствуйте, {user.first_name or 'друг'}!

        Спасибо за регистрацию на платформе ONTHEGO.
        Вы получили +50 XP за регистрацию!

        Начните обучение прямо сейчас и зарабатывайте XP,
        открывайте достижения и соревнуйтесь с друзьями!

        http://localhost:3000/courses
        """

        return EmailService.send_email(
            to_email=user.email,
            subject=subject,
            body=plain_body,
            html_body=html_body,
        )

    @staticmethod
    def send_achievement_email(user, achievement) -> bool:
        """
        Send achievement unlock notification email.

        Args:
            user: User model instance
            achievement: Achievement model instance

        Returns:
            bool: True if sent successfully
        """
        subject = f"ONTHEGO - Новое достижение: {achievement.title}"

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #0A0E27; color: #ffffff; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #1a1f3a; border-radius: 12px; padding: 30px;">
                <h1 style="color: #4DBDFF; margin-bottom: 20px;">ONTHEGO</h1>
                <div style="text-align: center; margin: 20px 0;">
                    <span style="font-size: 64px;">{achievement.icon}</span>
                </div>
                <h2 style="color: #ffffff; text-align: center;">
                    Поздравляем!
                </h2>
                <h3 style="color: #4DBDFF; text-align: center;">
                    {achievement.title}
                </h3>
                <p style="color: #a0a0a0; line-height: 1.6; text-align: center;">
                    {achievement.description}
                </p>
                <p style="color: #B13CFF; font-size: 18px; text-align: center; font-weight: bold;">
                    +{achievement.xp_reward} XP
                </p>
            </div>
        </body>
        </html>
        """

        plain_body = f"""
        Поздравляем, {user.first_name or user.email}!

        Вы получили достижение: {achievement.title}
        {achievement.description}

        +{achievement.xp_reward} XP
        """

        return EmailService.send_email(
            to_email=user.email,
            subject=subject,
            body=plain_body,
            html_body=html_body,
        )


class PushNotificationService:
    """
    Service for sending push notifications.

    NOTE: This is a stub implementation.
    For production, integrate with Firebase Cloud Messaging (FCM)
    or Apple Push Notification service (APNs).
    """

    @staticmethod
    def send_push(
        user,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        notification: Optional[Notification] = None,
    ) -> List[PushNotification]:
        """
        Send push notification to all user's devices.

        Args:
            user: User model instance
            title: Notification title
            body: Notification body
            data: Optional additional data payload
            notification: Optional related notification

        Returns:
            list: List of created PushNotification entries
        """
        from apps.users.models import UserDevice

        # Get user's active devices
        devices = UserDevice.objects.filter(
            user=user,
            is_active=True,
        )

        if not devices.exists():
            print(f"[PUSH] No active devices for user {user.email}")
            return []

        push_notifications = []

        for device in devices:
            # Create push notification record
            push_notif = PushNotification.objects.create(
                notification=notification,
                device=device,
                title=title,
                body=body,
                data=data or {},
                status='pending',
            )

            # TODO: Integrate with FCM/APNs
            # For now, just mark as "sent" (stub)
            try:
                # Stub: In production, call FCM/APNs API here
                # firebase_admin.messaging.send(...)

                push_notif.status = 'sent'
                push_notif.sent_at = timezone.now()
                print(f"[PUSH] Stub sent to {device.device_type}: {title}")

            except Exception as e:
                push_notif.status = 'failed'
                push_notif.error_message = str(e)
                print(f"[PUSH] Failed: {e}")

            push_notif.save()
            push_notifications.append(push_notif)

        return push_notifications

    @staticmethod
    def register_device(
        user,
        device_token: str,
        device_type: str,
        device_name: Optional[str] = None,
    ):
        """
        Register a device for push notifications.

        Args:
            user: User model instance
            device_token: FCM/APNs device token
            device_type: 'android', 'ios', or 'web'
            device_name: Optional device name

        Returns:
            UserDevice: Created or updated device
        """
        from apps.users.models import UserDevice

        device, created = UserDevice.objects.update_or_create(
            user=user,
            device_token=device_token,
            defaults={
                'device_type': device_type,
                'device_name': device_name or f'{device_type.title()} Device',
                'is_active': True,
            }
        )

        action = 'Registered' if created else 'Updated'
        print(f"[PUSH] {action} device for {user.email}: {device_type}")

        return device


class NotificationService:
    """
    Unified notification service that handles all notification channels.
    """

    @staticmethod
    def create_notification(
        user,
        notification_type: str,
        title: str,
        message: str,
        priority: str = 'normal',
        action_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        send_email: bool = True,
        send_push: bool = True,
        send_websocket: bool = True,
    ) -> Notification:
        """
        Create and deliver a notification through all enabled channels.

        Args:
            user: User to notify
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            priority: Priority level
            action_url: Optional action URL
            metadata: Optional metadata dict
            send_email: Whether to send email
            send_push: Whether to send push notification
            send_websocket: Whether to send WebSocket update

        Returns:
            Notification: Created notification
        """
        # Create notification record
        notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            action_url=action_url,
            metadata=metadata or {},
        )

        # Get user preferences
        prefs = NotificationPreference.objects.filter(user=user).first()

        # Send WebSocket notification (real-time)
        if send_websocket and (not prefs or prefs.in_app_enabled):
            NotificationService._send_websocket(user, notification)

        # Queue email notification
        if send_email and (not prefs or prefs.email_enabled):
            EmailService.queue_email(
                to_email=user.email,
                subject=f"ONTHEGO - {title}",
                body=message,
                notification=notification,
            )

        # Send push notification
        if send_push and (not prefs or prefs.push_enabled):
            PushNotificationService.send_push(
                user=user,
                title=title,
                body=message,
                notification=notification,
            )

        return notification

    @staticmethod
    def _send_websocket(user, notification: Notification):
        """Send real-time WebSocket notification."""
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f'notifications_{user.id}',
                    {
                        'type': 'notification_received',
                        'notification_id': str(notification.id),
                        'notification_type': notification.notification_type,
                        'title': notification.title,
                        'message': notification.message,
                        'priority': notification.priority,
                        'timestamp': notification.created_at.isoformat(),
                    }
                )
                print(f"[WS] Notification sent to user {user.id}")
        except Exception as e:
            print(f"[WS] Failed to send notification: {e}")

    @staticmethod
    def mark_as_read(notification_ids: List[str], user) -> int:
        """
        Mark notifications as read.

        Args:
            notification_ids: List of notification IDs
            user: User who owns the notifications

        Returns:
            int: Number of notifications marked as read
        """
        return Notification.objects.filter(
            id__in=notification_ids,
            user=user,
            is_read=False,
        ).update(
            is_read=True,
            read_at=timezone.now(),
        )

    @staticmethod
    def get_unread_count(user) -> int:
        """Get count of unread notifications for user."""
        return Notification.objects.filter(
            user=user,
            is_read=False,
        ).count()
