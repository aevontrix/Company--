# apps/notifications/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
     NotificationViewSet,
     NotificationPreferenceViewSet,
     EmailQueueViewSet,
     PushNotificationViewSet,
     NotificationLogViewSet,
     BulkNotificationView,
     NotificationStatsView,
)

app_name = 'notifications'

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')
router.register(r'preferences', NotificationPreferenceViewSet, basename='notification-preference')
router.register(r'email-queue', EmailQueueViewSet, basename='email-queue')
router.register(r'push', PushNotificationViewSet, basename='push-notification')
router.register(r'logs', NotificationLogViewSet, basename='notification-log')

urlpatterns = [
    path('', include(router.urls)),

    # ============================================================
    # РАБОЧИЕ ENDPOINTS
    # ============================================================
    # Эти методы реализованы и работают:

    # Preferences - работают через NotificationPreferenceViewSet
    path('my/preferences/',
         NotificationPreferenceViewSet.as_view({'get': 'my_preferences', 'put': 'update_preferences'}),
         name='my-notification-preferences'),

    # Analytics и существующие views - работают
    path('analytics/stats/',
         NotificationStatsView.as_view(),
         name='notification-stats'),
    path('bulk/send/',
         BulkNotificationView.as_view(),
         name='bulk-send-notifications-view'),
]

# ====================================================================
# ДОПОЛНИТЕЛЬНЫЕ ENDPOINTS - ЗАКОММЕНТИРОВАНЫ ДО РЕАЛИЗАЦИИ
# ====================================================================
# Раскомментируйте когда добавите соответствующие методы в ViewSets

# # User notification management - требуют реализации методов
# urlpatterns += [
#     # path('my/notifications/',
#     #      NotificationViewSet.as_view({'get': 'my_notifications', 'delete': 'clear_all'}),
#     #      name='my-notifications'),
#     # path('my/notifications/unread/',
#     #      NotificationViewSet.as_view({'get': 'unread_notifications'}),
#     #      name='unread-notifications'),
#     # path('my/notifications/mark-read/',
#     #      NotificationViewSet.as_view({'post': 'mark_all_read'}),
#     #      name='mark-all-read'),
#
#     # Notification actions - требуют реализации
#     # path('<int:pk>/mark-read/',
#     #      NotificationViewSet.as_view({'post': 'mark_read'}),
#     #      name='mark-notification-read'),
#     # path('<int:pk>/mark-unread/',
#     #      NotificationViewSet.as_view({'post': 'mark_unread'}),
#     #      name='mark-notification-unread'),
#     # path('<int:pk>/dismiss/',
#     #      NotificationViewSet.as_view({'post': 'dismiss'}),
#     #      name='dismiss-notification'),
#
#     # Bulk operations - требуют реализации
#     # path('bulk/delete/',
#     #      NotificationViewSet.as_view({'post': 'bulk_delete'}),
#     #      name='bulk-delete-notifications'),
#
#     # Real-time notifications - требуют реализации
#     # path('stream/',
#     #      NotificationViewSet.as_view({'get': 'notification_stream'}),
#     #      name='notification-stream'),
#     # path('websocket/connect/',
#     #      NotificationViewSet.as_view({'get': 'websocket_connect'}),
#     #      name='websocket-connect'),
#
#     # Device management - используйте стандартные router endpoints
#     # Вместо кастомных используйте:
#     # POST /api/notifications/push/ для регистрации
#     # DELETE /api/notifications/push/{id}/ для удаления
# ]
