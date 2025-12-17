from django.urls import path
from apps.gamification import consumers

websocket_urlpatterns = [
    path('ws/dashboard/', consumers.DashboardConsumer.as_asgi()),
    path('ws/progress/', consumers.ProgressConsumer.as_asgi()),
    path('ws/leaderboard/', consumers.LeaderboardConsumer.as_asgi()),
    path('ws/achievements/', consumers.AchievementConsumer.as_asgi()),
    path('ws/streak/', consumers.StreakConsumer.as_asgi()),
    path('ws/daily-tasks/', consumers.DailyTaskConsumer.as_asgi()),
    path('ws/focus/', consumers.FocusModeConsumer.as_asgi()),
    path('ws/profile/', consumers.ProfileConsumer.as_asgi()),
]