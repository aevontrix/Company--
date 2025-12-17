from django.contrib import admin
from .models import CourseEnrollment, ModuleProgress, LessonProgress, Note, QuizAttempt, Review, Bookmark

@admin.register(CourseEnrollment)
class CourseEnrollmentAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'status', 'progress_percentage', 'enrolled_at']
    list_filter = ['status']
    search_fields = ['user__email', 'course__title']
    list_select_related = ['user', 'course']

@admin.register(ModuleProgress)
class ModuleProgressAdmin(admin.ModelAdmin):
    list_display = ['enrollment', 'module', 'is_completed', 'progress_percentage']
    list_filter = ['is_completed']
    search_fields = ['enrollment__user__email', 'module__title']
    list_select_related = ['enrollment', 'module']

@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ['module_progress', 'lesson', 'status', 'progress_percentage', 'last_accessed']
    list_filter = ['status']
    search_fields = ['module_progress__enrollment__user__email', 'lesson__title']
    list_select_related = ['module_progress', 'lesson']

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['user', 'lesson', 'title', 'created_at']
    search_fields = ['title', 'content', 'user__email']
    list_select_related = ['user', 'lesson']

@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['lesson_progress', 'quiz', 'status', 'score', 'passed', 'started_at']
    list_filter = ['status', 'passed']
    search_fields = ['quiz__title', 'lesson_progress__module_progress__enrollment__user__email']
    list_select_related = ['lesson_progress', 'quiz']

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'rating', 'created_at']
    list_filter = ['rating']
    search_fields = ['user__email', 'course__title']
    list_select_related = ['user', 'course']

@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'lesson', 'created_at']
    search_fields = ['user__email']
    list_select_related = ['user', 'course', 'lesson']
