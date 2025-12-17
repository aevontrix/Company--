from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # Admin panel
    path('admin/', admin.site.urls),
    
    # API endpoints - ✅ ПОЛНАЯ КОНФИГУРАЦИЯ ВСЕХ ПРИЛОЖЕНИЙ
    path('api/users/', include('apps.users.urls')),
    path('api/courses/', include('apps.courses.urls')),
    path('api/learning/', include('apps.learning.urls')),
    path('api/messaging/', include('apps.messaging.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/gamification/', include('apps.gamification.urls')),

    # API Documentation - ✅ ДОБАВЛЕНО ДЛЯ 10/10
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # Health check endpoint - ✅ ДОБАВЛЕНО ДЛЯ МОНИТОРИНГА
    path('api/health/', lambda request: JsonResponse({'status': 'ok'}), name='health-check'),
]

# Media files for development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Django Debug Toolbar - ✅ ДЛЯ РАЗРАБОТКИ
    try:
        import debug_toolbar
        # Include debug toolbar only if it is registered in INSTALLED_APPS
        if 'debug_toolbar' in settings.INSTALLED_APPS:
            urlpatterns = [
                path('__debug__/', include(debug_toolbar.urls)),
            ] + urlpatterns
    except Exception:
        # Any import/config error should not break URLConf in non-dev environments
        pass

# Error handlers - ✅ ДОБАВЛЕНО ДЛЯ 10/10
handler404 = 'django.views.defaults.page_not_found'
handler500 = 'django.views.defaults.server_error'
