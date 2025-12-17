import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.users.models import User
from apps.courses.models import Course, Module, Lesson, Question


class CourseEnrollment(models.Model):
    """Track user enrollments in courses"""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped'),
        ('paused', 'Paused'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    progress_percentage = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    total_time_spent = models.IntegerField(default=0, help_text='in minutes')
    
    enrolled_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_accessed = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'course_enrollments'
        unique_together = [['user', 'course']]
        verbose_name = _('Course Enrollment')
        verbose_name_plural = _('Course Enrollments')
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['course', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.course.title}"


class ModuleProgress(models.Model):
    """Track progress through course modules"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enrollment = models.ForeignKey(CourseEnrollment, on_delete=models.CASCADE, related_name='module_progress')
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    
    is_completed = models.BooleanField(default=False)
    progress_percentage = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    time_spent = models.IntegerField(default=0, help_text='in minutes')
    
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'module_progress'
        unique_together = [['enrollment', 'module']]
        verbose_name = _('Module Progress')
        verbose_name_plural = _('Module Progress')
        indexes = [
            models.Index(fields=['enrollment', 'is_completed']),
        ]
    
    def __str__(self):
        return f"{self.enrollment.user.email} - {self.module.title}"


class LessonProgress(models.Model):
    """Track progress through lessons"""
    
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('passed', 'Passed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module_progress = models.ForeignKey(ModuleProgress, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    is_viewed = models.BooleanField(default=False)
    progress_percentage = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    time_spent = models.IntegerField(default=0, help_text='in seconds')
    
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_accessed = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'lesson_progress'
        unique_together = [['module_progress', 'lesson']]
        verbose_name = _('Lesson Progress')
        verbose_name_plural = _('Lesson Progress')
        indexes = [
            models.Index(fields=['module_progress', 'status']),
        ]
    
    def __str__(self):
        return f"{self.module_progress.enrollment.user.email} - {self.lesson.title}"


class QuizAttempt(models.Model):
    """Track quiz attempts"""
    
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lesson_progress = models.ForeignKey(LessonProgress, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey('courses.Quiz', on_delete=models.CASCADE)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    passed = models.BooleanField(default=False)
    
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    time_taken = models.IntegerField(default=0, help_text='in seconds')
    
    class Meta:
        db_table = 'quiz_attempts'
        verbose_name = _('Quiz Attempt')
        verbose_name_plural = _('Quiz Attempts')
        indexes = [
            models.Index(fields=['lesson_progress', 'status']),
        ]
    
    def __str__(self):
        return f"Attempt on {self.quiz.title}"


class QuestionAnswer(models.Model):
    """Store user answers to quiz questions"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz_attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    
    user_answer = models.JSONField()
    is_correct = models.BooleanField(default=False)
    points_earned = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    answered_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'question_answers'
        verbose_name = _('Question Answer')
        verbose_name_plural = _('Question Answers')
        unique_together = [['quiz_attempt', 'question']]
    
    def __str__(self):
        return f"Answer to {self.question.text[:50]}"


class Note(models.Model):
    """User notes on lessons"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lesson_progress = models.ForeignKey(LessonProgress, on_delete=models.CASCADE, related_name='notes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    
    title = models.CharField(max_length=255, blank=True)
    content = models.TextField()
    timestamp = models.IntegerField(default=0, help_text='Timestamp in video in seconds')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notes'
        verbose_name = _('Note')
        verbose_name_plural = _('Notes')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Note by {self.user.email} on {self.lesson.title}"


class Bookmark(models.Model):
    """User bookmarks for courses/lessons"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True, related_name='bookmarked_by')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, null=True, blank=True, related_name='bookmarked_by')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'bookmarks'
        verbose_name = _('Bookmark')
        verbose_name_plural = _('Bookmarks')
        indexes = [
            models.Index(fields=['user', 'course']),
            models.Index(fields=['user', 'lesson']),
        ]
    
    def __str__(self):
        item = self.course or self.lesson
        return f"{self.user.email} bookmarked {item.title}"


class Review(models.Model):
    """Course reviews and ratings"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='reviews')
    
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=255, blank=True)
    comment = models.TextField(blank=True)
    
    helpful_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reviews'
        unique_together = [['user', 'course']]
        verbose_name = _('Review')
        verbose_name_plural = _('Reviews')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['course', 'rating']),
        ]
    
    def __str__(self):
        return f"Review on {self.course.title} by {self.user.email}"

# ============================================
# ============================================

class FlashcardDeck(models.Model):
    """Flashcard decks for spaced repetition learning"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flashcard_decks')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True, related_name='flashcard_decks')
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'flashcard_decks'
        verbose_name = _('Flashcard Deck')
        verbose_name_plural = _('Flashcard Decks')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'course']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"


class Flashcard(models.Model):
    """Individual flashcards with SM-2 spaced repetition algorithm"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deck = models.ForeignKey(FlashcardDeck, on_delete=models.CASCADE, related_name='flashcards')
    
    question = models.TextField()
    answer = models.TextField()
    hint = models.TextField(blank=True)
    
    # SM-2 Spaced Repetition Algorithm fields
    easiness_factor = models.FloatField(default=2.5, validators=[MinValueValidator(1.3)])
    interval = models.IntegerField(default=0, help_text='Days until next review')
    repetitions = models.IntegerField(default=0, help_text='Number of successful repetitions')
    next_review = models.DateTimeField(default=timezone.now)
    last_reviewed = models.DateTimeField(null=True, blank=True)
    mastered = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'flashcards'
        verbose_name = _('Flashcard')
        verbose_name_plural = _('Flashcards')
        ordering = ['next_review']
        indexes = [
            models.Index(fields=['deck', 'next_review']),
            models.Index(fields=['deck', 'mastered']),
        ]
    
    def __str__(self):
        return f"{self.deck.title} - {self.question[:50]}"