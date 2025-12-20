# onthego/routing.py
from django.urls import re_path
# ✅ CONSOLIDATED: All main consumers now in apps.websockets
from apps.websockets import consumers as ws_consumers
from apps.messaging import consumers as messaging_consumers
from apps.notifications import consumers as notification_consumers

websocket_urlpatterns = [
    # ✅ Main WebSocket consumers (consolidated in apps.websockets)
    re_path(r'ws/dashboard/$', ws_consumers.DashboardConsumer.as_asgi()),
    re_path(r'ws/progress/$', ws_consumers.ProgressConsumer.as_asgi()),
    re_path(r'ws/leaderboard/$', ws_consumers.LeaderboardConsumer.as_asgi()),
    re_path(r'ws/achievements/$', ws_consumers.AchievementConsumer.as_asgi()),
    re_path(r'ws/streak/$', ws_consumers.StreakConsumer.as_asgi()),
    re_path(r'ws/daily-tasks/$', ws_consumers.DailyTaskConsumer.as_asgi()),
    re_path(r'ws/focus/$', ws_consumers.FocusModeConsumer.as_asgi()),
    re_path(r'ws/profile/$', ws_consumers.ProfileConsumer.as_asgi()),

    # Notifications consumer - ✅ Real-time notifications
    re_path(r'ws/notifications/$', notification_consumers.NotificationConsumer.as_asgi()),

    # Messaging consumers
    re_path(r'ws/chat/(?P<room_name>\w+)/$', messaging_consumers.ChatConsumer.as_asgi()),
]