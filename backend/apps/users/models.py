from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    """
    Расширенная модель пользователя
    """
    email = models.EmailField(unique=True, verbose_name='Email')
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Телефон')
    date_of_birth = models.DateField(blank=True, null=True, verbose_name='Дата рождения')
    bio = models.TextField(blank=True, null=True, verbose_name='О себе')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='Аватар')
    
    # Роли пользователя
    USER_ROLE_CHOICES = [
        ('student', 'Студент'),
        ('teacher', 'Преподаватель'),
        ('admin', 'Администратор'),
    ]
    role = models.CharField(
        max_length=20, 
        choices=USER_ROLE_CHOICES, 
        default='student',
        verbose_name='Роль'
    )
    
    is_verified = models.BooleanField(default=False, verbose_name='Верифицирован')

    # УДАЛЕНЫ gamification fields - они теперь в apps.gamification.UserProfile
    # xp = models.IntegerField(default=0, verbose_name='Experience Points')
    # level = models.IntegerField(default=1, verbose_name='Level')
    # streak = models.IntegerField(default=0, verbose_name='Current Streak')
    # last_activity_date = models.DateField(null=True, blank=True, verbose_name='Last Activity')
    # badges = models.JSONField(default=list, blank=True, verbose_name='Badges')
    # achievements = models.JSONField(default=list, blank=True, verbose_name='Achievements')  ← ЭТО ВЫЗЫВАЛО ОШИБКУ!

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата регистрации')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.email} ({self.get_full_name()})"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username


class UserSettings(models.Model):
    """
    Профиль пользователя с дополнительной информацией
    (переименован с UserProfile чтобы не конфликтовать с gamification.UserProfile)
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    
    # Предпочтения обучения
    preferred_language = models.CharField(max_length=10, default='ru', verbose_name='Язык')
    timezone = models.CharField(max_length=50, default='UTC', verbose_name='Часовой пояс')
    
    # Настройки уведомлений
    email_notifications = models.BooleanField(default=True, verbose_name='Email уведомления')
    push_notifications = models.BooleanField(default=True, verbose_name='Push уведомления')
    
    # Статистика
    total_courses_completed = models.IntegerField(default=0, verbose_name='Курсов завершено')
    total_learning_time = models.IntegerField(default=0, verbose_name='Время обучения (минуты)')
    current_streak = models.IntegerField(default=0, verbose_name='Текущая серия (дни)')
    longest_streak = models.IntegerField(default=0, verbose_name='Лучшая серия (дни)')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_settings'
        verbose_name = 'Настройки пользователя'
        verbose_name_plural = 'Настройки пользователей'
    
    def __str__(self):
        return f"Настройки: {self.user.email}"


class UserDevice(models.Model):
    """
    Устройства пользователя для push-уведомлений
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    device_token = models.CharField(max_length=255, unique=True, verbose_name='Токен устройства')
    device_type = models.CharField(
        max_length=20,
        choices=[
            ('ios', 'iOS'),
            ('android', 'Android'),
            ('web', 'Web'),
        ],
        verbose_name='Тип устройства'
    )
    device_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='Название устройства')
    is_active = models.BooleanField(default=True, verbose_name='Активно')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_devices'
        verbose_name = 'Устройство пользователя'
        verbose_name_plural = 'Устройства пользователей'
    
    def __str__(self):
        return f"{self.user.email} - {self.device_type}"


class Friendship(models.Model):
    """Модель дружбы между пользователями"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_friend_requests')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_friend_requests')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'friendships'
        verbose_name = 'Дружба'
        verbose_name_plural = 'Дружбы'
        unique_together = ['from_user', 'to_user']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['from_user', 'status']),
            models.Index(fields=['to_user', 'status']),
        ]

    def __str__(self):
        return f"{self.from_user} -> {self.to_user} ({self.status})"
   
UserProfile = UserSettings