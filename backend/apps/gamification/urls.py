from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.gamification_stats, name='gamification-stats'),
    path('streak/', views.update_streak, name='gamification-streak'),
    path('leaderboard/', views.get_leaderboard, name='gamification-leaderboard'),
    path('award/', views.award_xp, name='gamification-award'),
]