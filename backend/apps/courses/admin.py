from django.contrib import admin
from .models import Category, Course, Module, Lesson, Quiz, Question

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'parent', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'parent']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'instructor', 'category', 'difficulty', 'status', 'price', 'is_free', 'enrolled_count', 'rating', 'created_at']
    list_filter = ['status', 'difficulty', 'category', 'is_free', 'is_featured', 'created_at']
    search_fields = ['title', 'description', 'instructor__username', 'instructor__email']
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'created_at'
    readonly_fields = ['enrolled_count', 'rating', 'reviews_count', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'slug', 'description', 'short_description', 'instructor', 'thumbnail')
        }),
        ('Категория и уровень', {
            'fields': ('category', 'difficulty')
        }),
        ('Цена и доступ', {
            'fields': ('price', 'is_free')
        }),
        ('Публикация', {
            'fields': ('status', 'is_featured', 'published_at')
        }),
        ('Длительность и метрики', {
            'fields': ('duration_hours', 'enrolled_count', 'rating', 'reviews_count'),
            'classes': ('collapse',)
        }),
        ('Дополнительная информация', {
            'fields': ('prerequisites', 'learning_outcomes', 'target_audience'),
            'classes': ('collapse',)
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description', 'keywords'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['publish_courses', 'unpublish_courses', 'make_featured', 'remove_featured']
    
    def publish_courses(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(status='published', published_at=timezone.now())
        self.message_user(request, f'{updated} курсов опубликовано.')
    publish_courses.short_description = 'Опубликовать выбранные курсы'
    
    def unpublish_courses(self, request, queryset):
        updated = queryset.update(status='draft')
        self.message_user(request, f'{updated} курсов сняты с публикации.')
    unpublish_courses.short_description = 'Снять с публикации выбранные курсы'
    
    def make_featured(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f'{updated} курсов отмечены как рекомендованные.')
    make_featured.short_description = 'Сделать рекомендованными'
    
    def remove_featured(self, request, queryset):
        updated = queryset.update(is_featured=False)
        self.message_user(request, f'{updated} курсов удалены из рекомендованных.')
    remove_featured.short_description = 'Убрать из рекомендованных'


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'order', 'duration_minutes', 'is_published', 'created_at']
    list_filter = ['is_published', 'course', 'created_at']
    search_fields = ['title', 'description', 'course__title']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['title', 'module', 'order', 'content_type', 'duration_minutes', 'is_published', 'is_free_preview']
    list_filter = ['content_type', 'is_published', 'is_free_preview', 'module__course', 'created_at']
    search_fields = ['title', 'description', 'content', 'module__title']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['title', 'lesson', 'passing_score', 'time_limit_minutes', 'max_attempts', 'is_required']
    list_filter = ['is_required', 'shuffle_questions', 'show_correct_answers', 'lesson__module__course']
    search_fields = ['title', 'description', 'lesson__title']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['get_question_text', 'quiz', 'question_type', 'points', 'order']
    list_filter = ['question_type', 'quiz']
    search_fields = ['text', 'quiz__title']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_question_text(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    get_question_text.short_description = 'Текст вопроса'