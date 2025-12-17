# apps/messaging/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone

class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket для чата"""
    
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        
        if self.scope["user"].is_anonymous:
            await self.close()
            return
        
        # Присоединяемся к группе комнаты
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # ✅ FIX: НЕ отправляем историю при подключении
        # Frontend должен загрузить историю через REST API
        # Это предотвращает мигание и дублирование при реконнекте

        # Уведомляем других что пользователь подключился
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_join',
                'username': self.scope["user"].username,
            }
        )
    
    async def disconnect(self, close_code):
        # Уведомляем что пользователь отключился
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_leave',
                'username': self.scope["user"].username,
            }
        )
        
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
    
    async def receive(self, text_data):
        """Получение сообщения от клиента"""
        data = json.loads(text_data)
        message = data['message']

        # Сохраняем сообщение в БД
        message_data = await self.save_message(message)

        # ✅ FIX: Отправляем всем в комнате, включая информацию об отправителе
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'user': self.scope["user"].username,
                'user_id': self.scope["user"].id,
                'timestamp': message_data['timestamp'],
                'message_id': message_data['id'],
                'sender_channel': self.channel_name,  # ← ID канала отправителя
            }
        )

    async def chat_message(self, event):
        """Отправка сообщения клиенту"""
        # ✅ FIX: Не отправлять сообщение обратно отправителю
        if event.get('sender_channel') == self.channel_name:
            return  # Пропустить отправку отправителю

        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message'],
            'user': event['user'],
            'user_id': event['user_id'],
            'timestamp': event['timestamp'],
            'message_id': event['message_id'],
        }))
    
    async def user_join(self, event):
        """Пользователь присоединился"""
        await self.send(text_data=json.dumps({
            'type': 'user_join',
            'username': event['username'],
        }))
    
    async def user_leave(self, event):
        """Пользователь вышел"""
        await self.send(text_data=json.dumps({
            'type': 'user_leave',
            'username': event['username'],
        }))
    
    @database_sync_to_async
    def save_message(self, message):
        from apps.messaging.models import Chat, Message

        # Получаем чат по ID (room_name это chat_id)
        try:
            chat = Chat.objects.get(id=self.room_name)
        except Chat.DoesNotExist:
            # Чат не найден, возвращаем пустой результат
            return {'id': None, 'timestamp': None}

        # Сохраняем сообщение
        msg = Message.objects.create(
            chat=chat,
            sender=self.scope["user"],
            content=message,
            type='text'
        )

        return {
            'id': str(msg.id),
            'timestamp': msg.created_at.isoformat(),
        }
    
    @database_sync_to_async
    def get_message_history(self):
        from apps.messaging.models import Chat, Message

        try:
            chat = Chat.objects.get(id=self.room_name)
            messages = Message.objects.filter(chat=chat).order_by('-created_at')[:50]

            return [
                {
                    'id': str(msg.id),
                    'user': msg.sender.username if hasattr(msg.sender, 'username') else msg.sender.email,
                    'user_id': msg.sender.id,
                    'message': msg.content,
                    'timestamp': msg.created_at.isoformat(),
                }
                for msg in reversed(messages)
            ]
        except Chat.DoesNotExist:
            return []


# Утилита для отправки уведомлений
def send_message_notification(user_id, data):
    """Отправить уведомление о новом сообщении"""
    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer
    
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"notifications_{user_id}",
        {
            "type": "send_notification",
            "data": {
                "type": "new_message",
                **data
            }
        }
    )