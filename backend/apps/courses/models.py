from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify

User = get_user_model()


class Category(models.Model):
    """Категория курсов"""
    name = models.CharField(max_length=100, unique=True, verbose_name='Название')
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True, verbose_name='Описание')
    icon = models.CharField(max_length=50, blank=True, verbose_name='Иконка')
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subcategories',
        verbose_name='Родительская категория'
    )
    order = models.IntegerField(default=0, verbose_name='Порядок сортировки')
    is_active = models.BooleanField(default=True, verbose_name='Активна')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Course(models.Model):
    """Модель курса"""
    
    DIFFICULTY_CHOICES = [
        ('beginner', 'Начинающий'),
        ('intermediate', 'Средний'),
        ('advanced', 'Продвинутый'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('published', 'Опубликован'),
        ('archived', 'Архивирован'),
    ]
    
    title = models.CharField(max_length=200, verbose_name='Название')
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField(verbose_name='Описание')
    short_description = models.CharField(max_length=500, blank=True, verbose_name='Краткое описание')
    
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='courses',
        verbose_name='Категория'
    )
    
    instructor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_courses',
        verbose_name='Инструктор'
    )
    
    thumbnail = models.URLField(blank=True, verbose_name='Обложка курса')
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default='beginner',
        verbose_name='Уровень сложности'
    )
    
    duration_hours = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Длительность (часы)'
    )
    
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Цена'
    )
    
    is_free = models.BooleanField(default=True, verbose_name='Бесплатный')
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name='Статус'
    )
    
    # Метрики
    enrolled_count = models.IntegerField(default=0, verbose_name='Количество студентов')
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        verbose_name='Рейтинг'
    )
    reviews_count = models.IntegerField(default=0, verbose_name='Количество отзывов')
    
    # SEO
    meta_title = models.CharField(max_length=200, blank=True, verbose_name='Meta заголовок')
    meta_description = models.TextField(blank=True, verbose_name='Meta описание')
    keywords = models.CharField(max_length=500, blank=True, verbose_name='Ключевые слова')
    
    # Даты
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    published_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата публикации')
    
    # Дополнительные настройки
    is_featured = models.BooleanField(default=False, verbose_name='Рекомендованный')
    prerequisites = models.TextField(blank=True, verbose_name='Требования')
    learning_outcomes = models.TextField(blank=True, verbose_name='Чему научитесь')
    target_audience = models.TextField(blank=True, verbose_name='Для кого курс')
    
    class Meta:
        verbose_name = 'Курс'
        verbose_name_plural = 'Курсы'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['category', 'status']),
        ]
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class Module(models.Model):
    """Модуль курса"""
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='modules',
        verbose_name='Курс'
    )
    title = models.CharField(max_length=200, verbose_name='Название модуля')
    description = models.TextField(blank=True, verbose_name='Описание')
    order = models.IntegerField(default=0, verbose_name='Порядок')
    duration_minutes = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Длительность (минуты)'
    )
    is_published = models.BooleanField(default=False, verbose_name='Опубликован')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Модуль'
        verbose_name_plural = 'Модули'
        ordering = ['course', 'order']
        unique_together = ['course', 'order']
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"


class Lesson(models.Model):
    """Урок"""
    
    CONTENT_TYPE_CHOICES = [
        ('video', 'Видео'),
        ('text', 'Текст'),
        ('audio', 'Аудио'),
        ('quiz', 'Тест'),
        ('practice', 'Практика'),
    ]
    
    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name='lessons',
        verbose_name='Модуль'
    )
    title = models.CharField(max_length=200, verbose_name='Название урока')
    description = models.TextField(blank=True, verbose_name='Описание')
    content_type = models.CharField(
        max_length=20,
        choices=CONTENT_TYPE_CHOICES,
        default='video',
        verbose_name='Тип контента'
    )
    content = models.TextField(verbose_name='Содержание')
    video_url = models.URLField(blank=True, verbose_name='URL видео')
    audio_url = models.URLField(blank=True, verbose_name='URL аудио')
    
    duration_minutes = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Длительность (минуты)'
    )
    
    order = models.IntegerField(default=0, verbose_name='Порядок')
    is_free_preview = models.BooleanField(default=False, verbose_name='Бесплатный просмотр')
    is_published = models.BooleanField(default=False, verbose_name='Опубликован')
    
    # Дополнительные материалы
    attachments = models.JSONField(default=list, blank=True, verbose_name='Вложения')
    resources = models.JSONField(default=list, blank=True, verbose_name='Ресурсы')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Урок'
        verbose_name_plural = 'Уроки'
        ordering = ['module', 'order']
        unique_together = ['module', 'order']
    
    def __str__(self):
        return f"{self.module.title} - {self.title}"


class Quiz(models.Model):
    """Тест/Квиз"""
    lesson = models.OneToOneField(
        Lesson,
        on_delete=models.CASCADE,
        related_name='quiz',
        verbose_name='Урок'
    )
    title = models.CharField(max_length=200, verbose_name='Название теста')
    description = models.TextField(blank=True, verbose_name='Описание')
    passing_score = models.IntegerField(
        default=70,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Проходной балл (%)'
    )
    time_limit_minutes = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        verbose_name='Ограничение времени (минуты)'
    )
    max_attempts = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1)],
        verbose_name='Максимум попыток'
    )
    shuffle_questions = models.BooleanField(default=True, verbose_name='Перемешивать вопросы')
    show_correct_answers = models.BooleanField(default=True, verbose_name='Показывать правильные ответы')
    is_required = models.BooleanField(default=False, verbose_name='Обязательный')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Тест'
        verbose_name_plural = 'Тесты'
    
    def __str__(self):
        return self.title


class Question(models.Model):
    """Вопрос теста"""
    
    QUESTION_TYPE_CHOICES = [
        ('single', 'Один правильный ответ'),
        ('multiple', 'Несколько правильных ответов'),
        ('true_false', 'Верно/Неверно'),
        ('text', 'Текстовый ответ'),
    ]
    
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='questions',
        verbose_name='Тест'
    )
    question_type = models.CharField(
        max_length=20,
        choices=QUESTION_TYPE_CHOICES,
        default='single',
        verbose_name='Тип вопроса'
    )
    text = models.TextField(verbose_name='Текст вопроса')
    explanation = models.TextField(blank=True, verbose_name='Объяснение')
    order = models.IntegerField(default=0, verbose_name='Порядок')
    points = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name='Баллы'
    )
    
    # Варианты ответов хранятся в JSON
    # Формат: [{"text": "Ответ 1", "is_correct": true}, ...]
    options = models.JSONField(default=list, verbose_name='Варианты ответов')
    
    image_url = models.URLField(blank=True, verbose_name='URL изображения')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Вопрос'
        verbose_name_plural = 'Вопросы'
        ordering = ['quiz', 'order']
        unique_together = ['quiz', 'order']
    
    def __str__(self):
        return f"{self.quiz.title} - Вопрос {self.order}"