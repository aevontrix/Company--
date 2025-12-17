import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Chat(models.Model):
    """Чат (личный или групповой)"""

    CHAT_TYPE_CHOICES = [
        ('direct', 'Личный'),
        ('group', 'Групповой'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=10, choices=CHAT_TYPE_CHOICES, default='direct')
    name = models.CharField(max_length=255, blank=True, help_text='Название группового чата')
    avatar = models.CharField(max_length=50, blank=True, help_text='Emoji аватар')

    # Для личных чатов
    participants = models.ManyToManyField(User, related_name='chats', through='ChatMember')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chats'
        verbose_name = 'Чат'
        verbose_name_plural = 'Чаты'
        ordering = ['-updated_at']

    def __str__(self):
        if self.type == 'group':
            return self.name or f"Group Chat {self.id}"
        else:
            members = self.participants.all()[:2]
            return f"Direct: {' & '.join([u.email for u in members])}"

    @property
    def last_message(self):
        """Получить последнее сообщение в чате"""
        return self.messages.order_by('-created_at').first()


class ChatMember(models.Model):
    """Участник чата"""

    ROLE_CHOICES = [
        ('member', 'Участник'),
        ('admin', 'Администратор'),
        ('owner', 'Создатель'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')

    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'chat_members'
        unique_together = [['chat', 'user']]
        verbose_name = 'Участник чата'
        verbose_name_plural = 'Участники чатов'
        indexes = [
            models.Index(fields=['chat', 'user']),
            models.Index(fields=['user', 'last_read_at']),
        ]

    def __str__(self):
        return f"{self.user.email} in {self.chat}"

    @property
    def unread_count(self):
        """Количество непрочитанных сообщений"""
        if not self.last_read_at:
            return self.chat.messages.count()
        return self.chat.messages.filter(created_at__gt=self.last_read_at).count()


class Message(models.Model):
    """Сообщение в чате"""

    MESSAGE_TYPE_CHOICES = [
        ('text', 'Текст'),
        ('image', 'Изображение'),
        ('file', 'Файл'),
        ('system', 'Системное'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')

    type = models.CharField(max_length=10, choices=MESSAGE_TYPE_CHOICES, default='text')
    content = models.TextField()

    # Для изображений и файлов
    file_url = models.URLField(blank=True)
    file_name = models.CharField(max_length=255, blank=True)

    # Метаданные
    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'messages'
        verbose_name = 'Сообщение'
        verbose_name_plural = 'Сообщения'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['chat', 'created_at']),
            models.Index(fields=['sender', 'created_at']),
        ]

    def __str__(self):
        content_preview = self.content[:50] if len(self.content) > 50 else self.content
        return f"{self.sender.email}: {content_preview}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Обновляем updated_at чата при новом сообщении
        self.chat.updated_at = self.created_at
        self.chat.save(update_fields=['updated_at'])
