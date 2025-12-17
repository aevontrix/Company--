"""
Notification WebSocket Consumer
Real-time notification delivery via WebSocket
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket Consumer для уведомлений
    Отправляет уведомления в реальном времени
    """

    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        self.user_id = self.user.id
        self.room_group_name = f'notifications_{self.user_id}'

        # Присоединяемся к группе пользователя
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Отправляем текущее количество непрочитанных уведомлений
        unread_count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'unread_count': unread_count,
            'message': 'Connected to notifications'
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """Обработка сообщений от клиента"""
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

        elif message_type == 'mark_read':
            notification_id = data.get('notification_id')
            if notification_id:
                success = await self.mark_notification_read(notification_id)
                if success:
                    unread_count = await self.get_unread_count()
                    await self.send(text_data=json.dumps({
                        'type': 'marked_read',
                        'notification_id': notification_id,
                        'unread_count': unread_count
                    }))

        elif message_type == 'mark_all_read':
            count = await self.mark_all_notifications_read()
            await self.send(text_data=json.dumps({
                'type': 'all_marked_read',
                'count': count,
                'unread_count': 0
            }))

    async def send_notification(self, event):
        """
        Отправить уведомление клиенту
        Вызывается через channel_layer.group_send
        """
        notification_data = event['data']

        # Сохранить уведомление в БД
        notification = await self.save_notification(notification_data)

        # Отправить клиенту
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': notification
        }))

    async def notification_update(self, event):
        """Обновление уведомления"""
        await self.send(text_data=json.dumps({
            'type': 'notification_update',
            'data': event['data']
        }))

    # Database operations (sync_to_async)

    @database_sync_to_async
    def get_unread_count(self):
        """Получить количество непрочитанных уведомлений"""
        from .models import Notification
        return Notification.objects.filter(
            user=self.user,
            is_read=False
        ).count()

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Отметить уведомление как прочитанное"""
        from .models import Notification
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=self.user
            )
            notification.mark_as_read()
            return True
        except Notification.DoesNotExist:
            return False

    @database_sync_to_async
    def mark_all_notifications_read(self):
        """Отметить все уведомления как прочитанные"""
        from .models import Notification
        count = Notification.objects.filter(
            user=self.user,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        return count

    @database_sync_to_async
    def save_notification(self, notification_data):
        """Сохранить уведомление в БД и вернуть сериализованные данные"""
        from .models import Notification

        notification = Notification.objects.create(
            user_id=self.user_id,
            notification_type=notification_data.get('type', 'system'),
            title=notification_data.get('title', ''),
            message=notification_data.get('message', ''),
            priority=notification_data.get('priority', 'normal'),
            metadata=notification_data.get('metadata', {}),
            action_url=notification_data.get('action_url', None),
        )

        return {
            'id': str(notification.id),
            'type': notification.notification_type,
            'title': notification.title,
            'message': notification.message,
            'priority': notification.priority,
            'action_url': notification.action_url,
            'metadata': notification.metadata,
            'is_read': notification.is_read,
            'created_at': notification.created_at.isoformat(),
        }


# ============================================
# Utility functions для отправки уведомлений
# ============================================

def send_notification_to_user(user_id, notification_data):
    """
    Отправить уведомление пользователю через WebSocket

    Args:
        user_id: ID пользователя
        notification_data: dict с полями:
            - type: тип уведомления
            - title: заголовок
            - message: текст сообщения
            - priority: приоритет (optional)
            - metadata: дополнительные данные (optional)
            - action_url: URL для действия (optional)
    """
    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"notifications_{user_id}",
        {
            "type": "send_notification",
            "data": notification_data
        }
    )


def notify_xp_gained(user_id, xp_amount, source):
    """Уведомление о получении XP"""
    send_notification_to_user(user_id, {
        'type': 'progress',
        'title': f'Получено {xp_amount} XP!',
        'message': f'Вы заработали {xp_amount} опыта за {source}',
        'priority': 'normal',
        'metadata': {
            'xp_amount': xp_amount,
            'source': source
        }
    })


def notify_level_up(user_id, new_level):
    """Уведомление о повышении уровня"""
    send_notification_to_user(user_id, {
        'type': 'achievement',
        'title': f'🎉 Уровень {new_level}!',
        'message': f'Поздравляем! Вы достигли уровня {new_level}!',
        'priority': 'high',
        'metadata': {
            'level': new_level
        }
    })


def notify_achievement_unlocked(user_id, achievement_name, achievement_icon):
    """Уведомление о разблокировке достижения"""
    send_notification_to_user(user_id, {
        'type': 'achievement',
        'title': f'{achievement_icon} Достижение разблокировано!',
        'message': f'Вы получили достижение: {achievement_name}',
        'priority': 'high',
        'metadata': {
            'achievement_name': achievement_name,
            'icon': achievement_icon
        }
    })


def notify_streak_warning(user_id, hours_remaining):
    """Уведомление о риске потери streak"""
    send_notification_to_user(user_id, {
        'type': 'reminder',
        'title': '🔥 Ваша серия под угрозой!',
        'message': f'У вас осталось {hours_remaining} часов, чтобы сохранить серию. Завершите урок!',
        'priority': 'high',
        'metadata': {
            'hours_remaining': hours_remaining
        }
    })


def notify_new_message(user_id, sender_name, chat_id):
    """Уведомление о новом сообщении"""
    send_notification_to_user(user_id, {
        'type': 'message',
        'title': 'Новое сообщение',
        'message': f'{sender_name} отправил вам сообщение',
        'priority': 'normal',
        'metadata': {
            'sender_name': sender_name,
            'chat_id': str(chat_id)
        },
        'action_url': f'/messages/{chat_id}'
    })


def notify_friend_request(user_id, sender_name):
    """Уведомление о запросе дружбы"""
    send_notification_to_user(user_id, {
        'type': 'system',
        'title': 'Новый запрос в друзья',
        'message': f'{sender_name} хочет добавить вас в друзья',
        'priority': 'normal',
        'metadata': {
            'sender_name': sender_name
        },
        'action_url': '/friends'
    })
