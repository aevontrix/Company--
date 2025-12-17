from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserSettings, UserDevice  # ← ИСПРАВЛЕНО: UserProfile -> UserSettings


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'role']
    
    def get_list_display(self, request):
        display = ['email', 'username', 'role']
        if hasattr(User, 'subscription_tier'):
            display.append('subscription_tier')
        if hasattr(User, 'created_at'):
            display.append('created_at')
        return display
    
    def get_list_filter(self, request):
        filters = ['role']
        if hasattr(User, 'subscription_tier'):
            filters.append('subscription_tier')
        if hasattr(User, 'created_at'):
            filters.append('created_at')
        return filters
    
    search_fields = ['email', 'username', 'first_name', 'last_name']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': (
                'phone', 'avatar', 'role'
            )
        }),
    )
    
    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        additional_fields = []
        
        if hasattr(User, 'subscription_tier'):
            additional_fields.append('subscription_tier')
        if hasattr(User, 'subscription_expires'):
            additional_fields.append('subscription_expires')
            
        if additional_fields:
            fieldsets_list = list(fieldsets)
            fieldsets_list[-1][1]['fields'] = tuple(list(fieldsets_list[-1][1]['fields']) + additional_fields)
            return tuple(fieldsets_list)
        
        return fieldsets


@admin.register(UserSettings)  # ← ИСПРАВЛЕНО: UserProfile -> UserSettings
class UserSettingsAdmin(admin.ModelAdmin):  # ← ИСПРАВЛЕНО: UserProfileAdmin -> UserSettingsAdmin
    list_display = ['user']
    
    def get_list_display(self, request):
        display = ['user']
        if hasattr(UserSettings, 'preferred_language'):  # ← ИСПРАВЛЕНО: UserProfile -> UserSettings
            display.append('preferred_language')
        if hasattr(UserSettings, 'total_learning_time'):  # ← ИСПРАВЛЕНО
            display.append('total_learning_time_display')
        if hasattr(UserSettings, 'total_courses_completed'):  # ← ИСПРАВЛЕНО
            display.append('courses_completed_display')
        return display
    
    def get_list_filter(self, request):
        filters = []
        if hasattr(UserSettings, 'preferred_language'):  # ← ИСПРАВЛЕНО
            filters.append('preferred_language')
        if hasattr(UserSettings, 'created_at'):  # ← ИСПРАВЛЕНО
            filters.append('created_at')
        return filters
    
    search_fields = ['user__email']
    
    def get_readonly_fields(self, request, obj=None):
        readonly = []
        if hasattr(UserSettings, 'total_learning_time'):  # ← ИСПРАВЛЕНО
            readonly.append('total_learning_time')
        if hasattr(UserSettings, 'total_courses_completed'):  # ← ИСПРАВЛЕНО
            readonly.append('total_courses_completed')
        if hasattr(UserSettings, 'current_streak'):  # ← ИСПРАВЛЕНО
            readonly.append('current_streak')
        return readonly
    
    # Методы для отображения вычисляемых полей
    def total_learning_time_display(self, obj):
        return getattr(obj, 'total_learning_time', 0)
    total_learning_time_display.short_description = 'Total Learning Time'
    
    def courses_completed_display(self, obj):
        return getattr(obj, 'total_courses_completed', 0)
    courses_completed_display.short_description = 'Courses Completed'


@admin.register(UserDevice)
class UserDeviceAdmin(admin.ModelAdmin):
    list_display = ['user', 'device_type', 'is_active']
    
    def get_list_display(self, request):
        display = ['user', 'device_type', 'is_active']
        if hasattr(UserDevice, 'device_token'):
            display.insert(2, 'device_name')
        if hasattr(UserDevice, 'updated_at'):
            display.append('updated_at')
        return display
    
    list_filter = ['device_type', 'is_active']
    
    def get_list_filter(self, request):
        filters = ['device_type', 'is_active']
        if hasattr(UserDevice, 'created_at'):
            filters.append('created_at')
        return filters
    
    search_fields = ['user__email', 'device_name']
    
    def get_readonly_fields(self, request, obj=None):
        readonly = []
        if hasattr(UserDevice, 'created_at'):
            readonly.append('created_at')
        if hasattr(UserDevice, 'updated_at'):
            readonly.append('updated_at')
        return readonly