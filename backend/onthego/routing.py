# onthego/routing.py
from django.urls import re_path
from apps.gamification import consumers as gamification_consumers
from apps.learning import consumers as learning_consumers
from apps.messaging import consumers as messaging_consumers
from apps.notifications import consumers as notification_consumers

websocket_urlpatterns = [
    # Gamification consumers
    re_path(r'ws/dashboard/$', gamification_consumers.DashboardConsumer.as_asgi()),
    re_path(r'ws/progress/$', gamification_consumers.ProgressConsumer.as_asgi()),
    re_path(r'ws/leaderboard/$', gamification_consumers.LeaderboardConsumer.as_asgi()),
    re_path(r'ws/achievements/$', gamification_consumers.AchievementConsumer.as_asgi()),
    re_path(r'ws/streak/$', gamification_consumers.StreakConsumer.as_asgi()),
    re_path(r'ws/daily-tasks/$', gamification_consumers.DailyTaskConsumer.as_asgi()),
    re_path(r'ws/focus/$', gamification_consumers.FocusModeConsumer.as_asgi()),
    re_path(r'ws/profile/$', gamification_consumers.ProfileConsumer.as_asgi()),

    # Notifications consumer - ✅ Real-time notifications
    re_path(r'ws/notifications/$', notification_consumers.NotificationConsumer.as_asgi()),

    # Messaging consumers
    re_path(r'ws/chat/(?P<room_name>\w+)/$', messaging_consumers.ChatConsumer.as_asgi()),
]