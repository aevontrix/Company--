from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.users.models import User, Friendship
from apps.courses.models import Course
from apps.learning.models import LessonProgress, CourseEnrollment
from apps.messaging.models import Chat, Message
from .models import UserProfile
from .services import GamificationService
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone

@receiver(post_save, sender=User)
def user_created_xp(sender, instance, created, **kwargs):
    """Create gamification profile and award XP when user registers"""
    if created:
        # Создать gamification профиль для нового пользователя
        profile, profile_created = UserProfile.objects.get_or_create(
            user=instance,
            defaults={
                'xp': 0,
                'level': 1,
                'streak': 0,
            }
        )
        
        # Начислить XP за регистрацию
        if profile_created:
            GamificationService.award_xp(instance, 'register')

@receiver(post_save, sender=LessonProgress)
def lesson_completed_xp(sender, instance, created, **kwargs):
    """Award XP when lesson is completed and send real-time updates"""
    if instance.status == 'completed' and instance.completed_at:
        user = instance.module_progress.enrollment.user

        # Get profile before XP award
        profile, _ = UserProfile.objects.get_or_create(user=user)
        old_xp = profile.xp
        old_level = profile.level

        # Award XP
        xp_gained = GamificationService.award_xp(user, 'complete_lesson')

        # Refresh profile to get updated values
        profile.refresh_from_db()

        # Send real-time WebSocket update
        channel_layer = get_channel_layer()

        # Send lesson completed notification
        async_to_sync(channel_layer.group_send)(
            f'progress_{user.id}',
            {
                'type': 'lesson_completed',
                'lesson_id': str(instance.lesson.id) if hasattr(instance, 'lesson') else '',
                'lesson_title': instance.lesson.title if hasattr(instance, 'lesson') else 'Lesson',
                'xp_gained': xp_gained,
                'total_xp': profile.xp,
                'progress_percent': instance.module_progress.enrollment.progress_percentage if hasattr(instance, 'module_progress') else 0,
                'timestamp': timezone.now().isoformat(),
            }
        )

        # Send XP gained notification
        async_to_sync(channel_layer.group_send)(
            f'progress_{user.id}',
            {
                'type': 'xp_gained',
                'amount': xp_gained,
                'total_xp': profile.xp,
                'level': profile.level,
                'source': 'lesson',
                'timestamp': timezone.now().isoformat(),
            }
        )

        # Check for level up
        if profile.level > old_level:
            async_to_sync(channel_layer.group_send)(
                f'progress_{user.id}',
                {
                    'type': 'level_up',
                    'old_level': old_level,
                    'new_level': profile.level,
                    'total_xp': profile.xp,
                    'xp_to_next_level': profile.level * 1000,
                    'timestamp': timezone.now().isoformat(),
                }
            )

        # Update dashboard
        async_to_sync(channel_layer.group_send)(
            f'dashboard_{user.id}',
            {
                'type': 'dashboard_update',
                'data': {
                    'xp': profile.xp,
                    'level': profile.level,
                    'streak': profile.streak,
                }
            }
        )

        # Update leaderboard (broadcast to all)
        async_to_sync(channel_layer.group_send)(
            'leaderboard_global',
            {
                'type': 'user_xp_updated',
                'user_id': user.id,
                'username': f"{user.first_name} {user.last_name}" if user.first_name else user.email,
                'xp': profile.xp,
                'level': profile.level,
                'timestamp': timezone.now().isoformat(),
            }
        )

@receiver(post_save, sender=CourseEnrollment)
def course_completed_xp(sender, instance, created, **kwargs):
    """Award XP when course is completed"""
    if not created and instance.status == 'completed' and instance.completed_at:
        GamificationService.award_xp(instance.user, 'complete_course')

@receiver(post_save, sender=Friendship)
def friendship_accepted_xp(sender, instance, created, **kwargs):
    """Award XP when friendship is accepted"""
    if not created and instance.status == 'accepted':
        # Award XP to both users
        GamificationService.award_xp(instance.from_user, 'friend_added')
        GamificationService.award_xp(instance.to_user, 'friend_added')

@receiver(post_save, sender=Message)
def message_sent_xp(sender, instance, created, **kwargs):
    """Award XP when message is sent (limited)"""
    if created:
        # Only award XP for first 50 messages per day to prevent spam
        from django.utils import timezone
        today = timezone.now().date()
        messages_today = Message.objects.filter(
            sender=instance.sender,
            created_at__date=today
        ).count()

        if messages_today <= 50:
            GamificationService.award_xp(instance.sender, 'send_message')


@receiver(post_save, sender=UserProfile)
def check_achievements(sender, instance, created, **kwargs):
    """
    ✅ AUTO-UNLOCK ACHIEVEMENTS
    Автоматически проверять и разблокировать достижения при изменении профиля
    """
    if created:
        return  # Пропустить при создании профиля

    from .models import Achievement

    user = instance.user
    channel_layer = get_channel_layer()

    # Список достижений для разблокировки
    achievements_to_unlock = []

    # ✅ XP-BASED ACHIEVEMENTS
    if instance.xp >= 100 and not Achievement.objects.filter(user=user, title='First Steps').exists():
        achievements_to_unlock.append({
            'title': 'First Steps',
            'description': 'Earned 100 XP',
            'category': 'learning',
            'icon': '🎯',
            'xp_reward': 50
        })

    if instance.xp >= 1000 and not Achievement.objects.filter(user=user, title='Rising Star').exists():
        achievements_to_unlock.append({
            'title': 'Rising Star',
            'description': 'Earned 1000 XP',
            'category': 'learning',
            'icon': '⭐',
            'xp_reward': 100
        })

    if instance.xp >= 5000 and not Achievement.objects.filter(user=user, title='Expert').exists():
        achievements_to_unlock.append({
            'title': 'Expert',
            'description': 'Earned 5000 XP',
            'category': 'learning',
            'icon': '🏆',
            'xp_reward': 250
        })

    # ✅ LEVEL-BASED ACHIEVEMENTS
    if instance.level >= 5 and not Achievement.objects.filter(user=user, title='Level 5').exists():
        achievements_to_unlock.append({
            'title': 'Level 5',
            'description': 'Reached level 5',
            'category': 'learning',
            'icon': '5️⃣',
            'xp_reward': 100
        })

    if instance.level >= 10 and not Achievement.objects.filter(user=user, title='Level 10').exists():
        achievements_to_unlock.append({
            'title': 'Level 10',
            'description': 'Reached level 10',
            'category': 'learning',
            'icon': '🔟',
            'xp_reward': 200
        })

    # ✅ STREAK-BASED ACHIEVEMENTS
    if instance.streak >= 7 and not Achievement.objects.filter(user=user, title='Week Warrior').exists():
        achievements_to_unlock.append({
            'title': 'Week Warrior',
            'description': '7 day streak',
            'category': 'streak',
            'icon': '🔥',
            'xp_reward': 150
        })

    if instance.streak >= 30 and not Achievement.objects.filter(user=user, title='Month Master').exists():
        achievements_to_unlock.append({
            'title': 'Month Master',
            'description': '30 day streak',
            'category': 'streak',
            'icon': '🌟',
            'xp_reward': 500
        })

    if instance.streak >= 100 and not Achievement.objects.filter(user=user, title='Century Streak').exists():
        achievements_to_unlock.append({
            'title': 'Century Streak',
            'description': '100 day streak',
            'category': 'streak',
            'icon': '💯',
            'xp_reward': 1000
        })

    # ✅ РАЗБЛОКИРОВАТЬ ДОСТИЖЕНИЯ
    for achievement_data in achievements_to_unlock:
        # Создать achievement
        achievement = Achievement.objects.create(
            user=user,
            **achievement_data
        )

        # Начислить XP за достижение
        if achievement_data['xp_reward'] > 0:
            instance.xp += achievement_data['xp_reward']
            instance.save(update_fields=['xp'])

        # Отправить WebSocket уведомление
        async_to_sync(channel_layer.group_send)(
            f'achievements_{user.id}',
            {
                'type': 'achievement_unlocked',
                'achievement_id': str(achievement.id),
                'name': achievement.title,
                'description': achievement.description,
                'icon': achievement.icon,
                'rarity': achievement.category,
                'xp_reward': achievement.xp_reward,
                'timestamp': timezone.now().isoformat(),
            }
        )

        # Также отправить в progress consumer
        async_to_sync(channel_layer.group_send)(
            f'progress_{user.id}',
            {
                'type': 'achievement_unlocked',
                'achievement_id': str(achievement.id),
                'name': achievement.title,
                'description': achievement.description,
                'icon': achievement.icon,
                'timestamp': timezone.now().isoformat(),
            }
        )