# apps/gamification/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Sum, F
from .models import FocusSession, UserProfile, Achievement, DailyTask
from django.contrib.auth import get_user_model

User = get_user_model()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_focus_session(request):
    """
    Сохранить Pomodoro сессию (завершённую или частичную)
    
    Body:
    {
        "duration": 25,  // В минутах
        "xp_earned": 50,  // XP (только для завершённых)
        "completed": true,  // Завершена ли сессия
        "mode": "focus"  // "focus", "break", "longBreak"
    }
    """
    user = request.user
    duration = request.data.get('duration', 0)
    xp_earned = request.data.get('xp_earned', 0)
    completed = request.data.get('completed', False)
    mode = request.data.get('mode', 'focus')
    
    # Создать запись сессии
    session = FocusSession.objects.create(
        user=user,
        duration=duration,
        xp_earned=xp_earned if completed else 0,
        completed=completed,
        mode=mode
    )
    
    # Если сессия завершена - начислить XP
    if completed and mode == 'focus':
        try:
            profile = UserProfile.objects.get(user=user)
            old_level = profile.level
            profile.add_xp(xp_earned)

            # ✅ FIX: Update DailyActivity with focus session data
            from apps.analytics.models import DailyActivity
            from django.utils import timezone
            today = timezone.now().date()
            daily_activity, _ = DailyActivity.objects.get_or_create(
                user=user,
                date=today,
                defaults={'time_spent': 0, 'lessons_completed': 0, 'quizzes_taken': 0, 'xp_earned': 0}
            )
            daily_activity.time_spent += duration
            daily_activity.xp_earned += xp_earned
            daily_activity.save(update_fields=['time_spent', 'xp_earned'])

            # Проверить level up
            level_up = profile.level > old_level
            
            return Response({
                'status': 'success',
                'session_id': session.id,
                'xp_earned': xp_earned,
                'total_xp': profile.xp,
                'level': profile.level,
                'level_up': level_up,
                'message': f'Отличная работа! +{xp_earned} XP' + (' 🎉 Level Up!' if level_up else '')
            })
        except UserProfile.DoesNotExist:
            # Создать профиль если не существует
            profile = UserProfile.objects.create(user=user, xp=xp_earned, level=1)
            
            return Response({
                'status': 'success',
                'session_id': session.id,
                'xp_earned': xp_earned,
                'total_xp': profile.xp,
                'level': 1,
                'level_up': False
            })
    
    # Если частичная сессия (pause/reset)
    return Response({
        'status': 'progress_saved',
        'session_id': session.id,
        'duration': duration,
        'message': f'Прогресс сохранён: {duration} мин'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_focus_stats(request):
    """
    Получить статистику Pomodoro для пользователя
    
    Возвращает:
    {
        "sessions": 12,  // Завершённых сессий
        "xp": 600,  // Всего XP заработано
        "total_time": 5,  // Общее время фокуса в часах
        "today_sessions": 3,  // Сессий сегодня
        "today_time": 75  // Время сегодня (минуты)
    }
    """
    user = request.user
    
    # Все завершённые сессии
    completed_sessions = FocusSession.objects.filter(
        user=user,
        completed=True,
        mode='focus'
    )
    
    # Статистика за сегодня
    today = timezone.now().date()
    today_sessions = completed_sessions.filter(created_at__date=today)
    
    # Подсчитать статистику
    total_sessions = completed_sessions.count()
    total_xp = completed_sessions.aggregate(Sum('xp_earned'))['xp_earned__sum'] or 0
    total_time = completed_sessions.aggregate(Sum('duration'))['duration__sum'] or 0
    
    today_count = today_sessions.count()
    today_time = today_sessions.aggregate(Sum('duration'))['duration__sum'] or 0
    
    return Response({
        'sessions': total_sessions,
        'xp': total_xp,
        'total_time': total_time // 60,  # В часах
        'today_sessions': today_count,
        'today_time': today_time
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_stats(request):
    """
    Получить полную статистику пользователя
    """
    user = request.user
    
    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=user)
    
    # Достижения
    achievements_count = Achievement.objects.filter(user=user).count()
    
    # Ежедневные задания
    today = timezone.now().date()
    daily_tasks = DailyTask.objects.filter(user=user, date=today)
    tasks_completed = daily_tasks.filter(completed=True).count()
    tasks_total = daily_tasks.count()
    
    # Focus сессии
    focus_sessions = FocusSession.objects.filter(
        user=user,
        completed=True,
        mode='focus'
    )
    total_focus_time = focus_sessions.aggregate(Sum('duration'))['duration__sum'] or 0
    
    return Response({
        'xp': profile.xp,
        'level': profile.level,
        'streak': profile.streak,
        'longest_streak': profile.longest_streak,
        'achievements': achievements_count,
        'daily_tasks_completed': tasks_completed,
        'daily_tasks_total': tasks_total,
        'focus_sessions_completed': focus_sessions.count(),
        'total_focus_time': total_focus_time,
        'last_activity': profile.last_activity_date
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_streak(request):
    """
    Обновить streak пользователя
    """
    user = request.user
    
    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=user)
    
    # Обновить streak
    profile.update_streak()
    
    return Response({
        'streak': profile.streak,
        'longest_streak': profile.longest_streak,
        'last_activity_date': profile.last_activity_date
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_leaderboard(request):
    """
    Получить топ пользователей по XP
    """
    limit = int(request.GET.get('limit', 10))
    
    # Топ пользователей
    top_users = UserProfile.objects.select_related('user').order_by('-xp')[:limit]
    
    leaderboard = []
    for rank, profile in enumerate(top_users, 1):
        user = profile.user
        # ✅ Fix: Return first_name and last_name instead of just username
        display_name = user.get_full_name() if hasattr(user, 'get_full_name') else user.username
        if not display_name or display_name.strip() == '':
            display_name = user.username

        leaderboard.append({
            'rank': rank,
            'user__id': user.id,
            'user__username': user.username,
            'user__first_name': user.first_name or '',
            'user__last_name': user.last_name or '',
            'display_name': display_name,
            'email': user.email,
            'avatar': user.avatar.url if user.avatar else None,
            'xp': profile.xp,
            'level': profile.level,
            'streak': profile.streak
        })
    
    # Позиция текущего пользователя
    try:
        current_profile = UserProfile.objects.get(user=request.user)
        current_rank = UserProfile.objects.filter(xp__gt=current_profile.xp).count() + 1
    except UserProfile.DoesNotExist:
        current_rank = None
    
    return Response({
        'leaderboard': leaderboard,
        'current_user_rank': current_rank
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def award_xp(request):
    """
    Начислить XP пользователю

    Body:
    {
        "amount": 50,
        "reason": "Completed lesson"  // or "action"
    }
    """
    user = request.user
    amount = request.data.get('amount', 0)
    # ✅ FIX: Accept both 'reason' and 'action' parameters for frontend compatibility
    reason = request.data.get('reason') or request.data.get('action', '')
    
    if amount <= 0:
        return Response(
            {'error': 'Amount must be positive'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=user)
    
    old_level = profile.level
    leveled_up, _, new_level = profile.add_xp(amount)
    
    # Обновить streak
    profile.update_streak()
    
    response_data = {
        'xp_earned': amount,
        'total_xp': profile.xp,
        'level': profile.level,
        'leveled_up': leveled_up,
        'streak': profile.streak
    }
    
    if leveled_up:
        response_data['message'] = f'🎉 Level Up! Теперь вы {new_level} уровня!'
    
    return Response(response_data)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def gamification_stats(request):
    """
    Получить статистику геймификации для пользователя
    """
    user = request.user
    
    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=user)
    
    # Достижения
    achievements_count = Achievement.objects.filter(user=user).count()
    
    # Ежедневные задания за сегодня
    today = timezone.now().date()
    daily_tasks = DailyTask.objects.filter(user=user, date=today)
    tasks_completed = daily_tasks.filter(completed=True).count()
    tasks_total = daily_tasks.count()
    
    return Response({
        'xp': profile.xp,
        'level': profile.level,
        'streak': profile.streak,
        'longest_streak': profile.longest_streak,
        'achievements_count': achievements_count,
        'completed_tasks_today': tasks_completed,
        'total_tasks_today': tasks_total,
    })