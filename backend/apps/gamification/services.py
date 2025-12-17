from django.utils import timezone
from datetime import timedelta
from apps.users.models import User
from apps.gamification.models import UserProfile
import math


class GamificationService:
    """Service for handling gamification logic"""

    # XP rewards for different actions
    XP_REWARDS = {
        'register': 100,
        'enroll_course': 50,
        'complete_lesson': 50,
        'complete_module': 200,
        'complete_course': 1000,
        'daily_login': 10,
        'streak_bonus': 50,
        'quiz_perfect': 100,
        'quiz_pass': 50,
        'comment': 5,
        'help_others': 20,
        'create_group': 30,
        'send_message': 2,
        'friend_added': 25,
    }

    # Level calculation: XP = 100 * level^2
    @staticmethod
    def calculate_level(xp: int) -> int:
        """Calculate level based on total XP"""
        if xp < 100:
            return 1
        return int(math.sqrt(xp / 100)) + 1

    @staticmethod
    def xp_for_next_level(current_level: int) -> int:
        """Calculate XP needed for next level"""
        return 100 * (current_level ** 2)

    @staticmethod
    def xp_progress_in_level(xp: int, level: int) -> dict:
        """Get progress within current level"""
        current_level_xp = 100 * ((level - 1) ** 2)
        next_level_xp = 100 * (level ** 2)
        xp_in_level = xp - current_level_xp
        xp_needed = next_level_xp - current_level_xp
        return {
            'current': xp_in_level,
            'needed': xp_needed,
            'percentage': int((xp_in_level / xp_needed) * 100) if xp_needed > 0 else 0
        }

    @staticmethod
    def get_or_create_profile(user: User) -> UserProfile:
        """Get or create user's gamification profile"""
        profile, created = UserProfile.objects.get_or_create(user=user)
        return profile

    @staticmethod
    def award_xp(user: User, action: str, amount: int = None) -> dict:
        """
        Award XP to user for an action
        Returns dict with: xp_gained, total_xp, old_level, new_level, leveled_up, badges_unlocked
        """
        profile = GamificationService.get_or_create_profile(user)
        
        if amount is None:
            amount = GamificationService.XP_REWARDS.get(action, 0)

        old_level = profile.level
        old_xp = profile.xp

        profile.xp += amount
        profile.level = GamificationService.calculate_level(profile.xp)

        leveled_up = profile.level > old_level
        badges_unlocked = []

        # Check for badge unlocks
        new_badges = GamificationService.check_badges(profile)
        if new_badges:
            badges_unlocked = new_badges
            if not isinstance(profile.badges, list):
                profile.badges = []
            profile.badges.extend(new_badges)

        profile.save()

        return {
            'xp_gained': amount,
            'total_xp': profile.xp,
            'old_level': old_level,
            'new_level': profile.level,
            'leveled_up': leveled_up,
            'badges_unlocked': badges_unlocked,
            'action': action
        }

    @staticmethod
    def update_streak(user: User) -> dict:
        """
        Update user's streak based on last activity
        Returns: streak_continued, streak_broken, streak_count, bonus_xp
        """
        profile = GamificationService.get_or_create_profile(user)
        
        today = timezone.now().date()
        last_activity = profile.last_activity_date

        streak_continued = False
        streak_broken = False
        bonus_xp = 0

        if last_activity is None:
            # First activity
            profile.streak = 1
            profile.last_activity_date = today
            streak_continued = True
        elif last_activity == today:
            # Already logged in today
            return {
                'streak_continued': False,
                'streak_broken': False,
                'streak_count': profile.streak,
                'bonus_xp': 0,
                'already_counted': True
            }
        elif last_activity == today - timedelta(days=1):
            # Consecutive day
            profile.streak += 1
            if profile.streak > profile.longest_streak:
                profile.longest_streak = profile.streak
            profile.last_activity_date = today
            streak_continued = True

            # Bonus XP for streak milestones
            if profile.streak % 7 == 0:  # Weekly milestone
                bonus_xp = 100
            elif profile.streak % 30 == 0:  # Monthly milestone
                bonus_xp = 500
            else:
                bonus_xp = GamificationService.XP_REWARDS['daily_login']

            profile.xp += bonus_xp
            profile.level = GamificationService.calculate_level(profile.xp)

        else:
            # Streak broken
            profile.streak = 1
            profile.last_activity_date = today
            streak_broken = True

        profile.save()

        return {
            'streak_continued': streak_continued,
            'streak_broken': streak_broken,
            'streak_count': profile.streak,
            'bonus_xp': bonus_xp,
            'already_counted': False
        }

    @staticmethod
    def check_badges(profile: UserProfile) -> list:
        """Check and return newly unlocked badges"""
        current_badges = profile.badges if isinstance(profile.badges, list) else []
        new_badges = []

        badge_definitions = {
            'first_steps': {'xp': 100, 'name': 'Первые шаги', 'emoji': '👶'},
            'novice': {'xp': 500, 'name': 'Новичок', 'emoji': '🌱'},
            'learner': {'xp': 1000, 'name': 'Ученик', 'emoji': '📚'},
            'scholar': {'xp': 5000, 'name': 'Учёный', 'emoji': '🎓'},
            'expert': {'xp': 10000, 'name': 'Эксперт', 'emoji': '⭐'},
            'master': {'xp': 25000, 'name': 'Мастер', 'emoji': '🏆'},
            'legend': {'xp': 50000, 'name': 'Легенда', 'emoji': '👑'},
            'streak_7': {'streak': 7, 'name': 'Неделя силы', 'emoji': '🔥'},
            'streak_30': {'streak': 30, 'name': 'Месяц упорства', 'emoji': '💪'},
            'streak_100': {'streak': 100, 'name': 'Стальная воля', 'emoji': '⚡'},
            'level_5': {'level': 5, 'name': 'Уровень 5', 'emoji': '5️⃣'},
            'level_10': {'level': 10, 'name': 'Уровень 10', 'emoji': '🔟'},
            'level_25': {'level': 25, 'name': 'Уровень 25', 'emoji': '🌟'},
            'level_50': {'level': 50, 'name': 'Уровень 50', 'emoji': '💎'},
        }

        for badge_id, criteria in badge_definitions.items():
            if badge_id in current_badges:
                continue

            unlocked = False
            if 'xp' in criteria and profile.xp >= criteria['xp']:
                unlocked = True
            elif 'streak' in criteria and profile.streak >= criteria['streak']:
                unlocked = True
            elif 'level' in criteria and profile.level >= criteria['level']:
                unlocked = True

            if unlocked:
                new_badges.append({
                    'id': badge_id,
                    'name': criteria['name'],
                    'emoji': criteria['emoji'],
                    'unlocked_at': timezone.now().isoformat()
                })

        return new_badges

    @staticmethod
    def get_user_stats(user: User) -> dict:
        """Get comprehensive user gamification stats"""
        profile = GamificationService.get_or_create_profile(user)
        progress = GamificationService.xp_progress_in_level(profile.xp, profile.level)

        return {
            'xp': profile.xp,
            'level': profile.level,
            'streak': profile.streak,
            'badges': profile.badges if isinstance(profile.badges, list) else [],
            'achievements': profile.achievements if isinstance(profile.achievements, list) else [],
            'progress': progress,
            'next_level_xp': GamificationService.xp_for_next_level(profile.level),
        }

    @staticmethod
    def get_leaderboard(limit: int = 10, period: str = 'all_time') -> list:
        """Get top users by XP"""
        profiles = UserProfile.objects.select_related('user').order_by('-xp')[:limit]

        return [{
            'id': profile.user.id,
            'username': profile.user.username,
            'first_name': profile.user.first_name,
            'last_name': profile.user.last_name,
            'xp': profile.xp,
            'level': profile.level,
            'avatar': profile.user.avatar.url if profile.user.avatar else None,
        } for profile in profiles]