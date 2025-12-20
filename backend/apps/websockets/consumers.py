"""
Consolidated WebSocket Consumers for Real-time Updates
All WebSocket consumers are consolidated here for better organization.

Consumers:
- DashboardConsumer: Dashboard page real-time updates
- ProgressConsumer: Progress tracking (lessons, XP, level-ups, achievements)
- LeaderboardConsumer: Leaderboard real-time updates
- AchievementConsumer: Achievement unlock notifications
- StreakConsumer: Streak updates and warnings
- DailyTaskConsumer: Daily task progress and completion
- FocusModeConsumer: Focus/Pomodoro timer
- ProfileConsumer: Profile page real-time updates
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class DashboardConsumer(AsyncWebsocketConsumer):
    """
    Consumer for Dashboard page - combines all user data
    Sends initial data and real-time updates for XP, streak, courses, tasks
    """

    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        self.user_id = self.user.id
        self.room_group_name = f'dashboard_{self.user_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Send initial dashboard data
        data = await self.get_dashboard_data()
        await self.send(text_data=json.dumps({
            'type': 'dashboard_init',
            'data': data
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))
        elif message_type == 'refresh':
            # Manual refresh request
            dashboard_data = await self.get_dashboard_data()
            await self.send(text_data=json.dumps({
                'type': 'dashboard_update',
                'data': dashboard_data
            }))

    @database_sync_to_async
    def get_dashboard_data(self):
        from apps.learning.models import CourseEnrollment
        from apps.gamification.models import UserProfile, Achievement, DailyTask

        user = self.user

        # Get or create user profile
        profile, _ = UserProfile.objects.get_or_create(user=user)

        # Get active courses
        enrollments = CourseEnrollment.objects.filter(
            user=user,
            status='active'
        ).select_related('course')[:5]

        courses = [{
            'id': str(e.course.id),
            'title': e.course.title,
            'progress': e.progress_percentage,
        } for e in enrollments]

        # Get achievements (recent 5)
        achievements = Achievement.objects.filter(user=user).order_by('-earned_at')[:5]
        achievements_data = [{
            'id': str(a.id),
            'title': a.title,
            'description': a.description,
            'earned_at': a.earned_at.isoformat(),
        } for a in achievements]

        # Get today's tasks
        today = timezone.now().date()
        daily_tasks = DailyTask.objects.filter(
            user=user,
            date=today,
            completed=False
        )

        tasks_data = [{
            'id': str(t.id),
            'title': t.title,
            'description': t.description,
            'xp_reward': t.xp_reward,
        } for t in daily_tasks]

        return {
            'xp': profile.xp,
            'level': profile.level,
            'streak': profile.streak,
            'courses': courses,
            'achievements': achievements_data,
            'daily_tasks': tasks_data,
        }

    # Event handlers from channel layer
    async def dashboard_update(self, event):
        """Send dashboard update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'dashboard_update',
            'data': event['data']
        }))


class ProgressConsumer(AsyncWebsocketConsumer):
    """
    Consumer for real-time progress updates
    Sends updates when user completes lessons, gains XP, levels up, unlocks achievements
    """

    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        self.room_group_name = f'progress_{self.user.id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to progress updates'
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

    async def lesson_completed(self, event):
        """Send lesson completion update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'lesson_completed',
            'lesson_id': event['lesson_id'],
            'lesson_title': event['lesson_title'],
            'xp_gained': event['xp_gained'],
            'total_xp': event['total_xp'],
            'progress_percent': event['progress_percent'],
            'timestamp': event['timestamp']
        }))

    async def level_up(self, event):
        """Send level up notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'level_up',
            'old_level': event['old_level'],
            'new_level': event['new_level'],
            'total_xp': event['total_xp'],
            'xp_to_next_level': event['xp_to_next_level'],
            'timestamp': event['timestamp']
        }))

    async def xp_gained(self, event):
        """Send XP gain notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'xp_gained',
            'amount': event['amount'],
            'total_xp': event['total_xp'],
            'level': event['level'],
            'source': event.get('source', 'lesson'),
            'timestamp': event['timestamp']
        }))

    async def progress_updated(self, event):
        """Send general progress update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'progress_updated',
            'course_id': event.get('course_id'),
            'completed_lessons': event['completed_lessons'],
            'total_lessons': event['total_lessons'],
            'time_spent': event.get('time_spent', 0),
            'timestamp': event['timestamp']
        }))

    # ✅ FIX: Added missing achievement_unlocked handler
    async def achievement_unlocked(self, event):
        """Send achievement unlock notification to progress channel"""
        await self.send(text_data=json.dumps({
            'type': 'achievement_unlocked',
            'achievement_id': event['achievement_id'],
            'name': event['name'],
            'description': event['description'],
            'icon': event['icon'],
            'timestamp': event['timestamp']
        }))


class LeaderboardConsumer(AsyncWebsocketConsumer):
    """
    Consumer for real-time leaderboard updates
    Sends updates when rankings change
    """

    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        self.room_group_name = 'leaderboard_global'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to leaderboard updates'
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

    async def ranking_changed(self, event):
        """Send ranking change notification"""
        if event['user_id'] == self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'ranking_changed',
                'old_rank': event['old_rank'],
                'new_rank': event['new_rank'],
                'rank_change': event['rank_change'],
                'xp': event['xp'],
                'timestamp': event['timestamp']
            }))

    async def leaderboard_updated(self, event):
        """Send full leaderboard update"""
        await self.send(text_data=json.dumps({
            'type': 'leaderboard_updated',
            'top_users': event['top_users'],
            'your_rank': event.get('your_rank'),
            'timestamp': event['timestamp']
        }))

    async def user_xp_updated(self, event):
        """Send when another user's XP changes"""
        await self.send(text_data=json.dumps({
            'type': 'user_xp_updated',
            'user_id': event['user_id'],
            'username': event['username'],
            'xp': event['xp'],
            'level': event['level'],
            'timestamp': event['timestamp']
        }))


class AchievementConsumer(AsyncWebsocketConsumer):
    """
    Consumer for real-time achievement notifications
    Sends updates when user unlocks achievements
    """

    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        self.room_group_name = f'achievements_{self.user.id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to achievement updates'
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

    async def achievement_unlocked(self, event):
        """Send achievement unlock notification"""
        await self.send(text_data=json.dumps({
            'type': 'achievement_unlocked',
            'achievement_id': event['achievement_id'],
            'name': event['name'],
            'description': event['description'],
            'icon': event['icon'],
            'rarity': event.get('rarity', 'common'),
            'xp_reward': event.get('xp_reward', 0),
            'timestamp': event['timestamp']
        }))


class StreakConsumer(AsyncWebsocketConsumer):
    """
    Consumer for real-time streak notifications
    Sends updates about daily streak status
    """

    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        self.room_group_name = f'streak_{self.user.id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to streak updates'
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

    async def streak_updated(self, event):
        """Send streak update notification"""
        await self.send(text_data=json.dumps({
            'type': 'streak_updated',
            'current_streak': event['current_streak'],
            'longest_streak': event.get('longest_streak', 0),
            'hours_until_reset': event.get('hours_until_reset', 24),
            'timestamp': event['timestamp']
        }))

    async def streak_milestone(self, event):
        """Send streak milestone notification"""
        await self.send(text_data=json.dumps({
            'type': 'streak_milestone',
            'streak': event['streak'],
            'milestone': event['milestone'],
            'reward_xp': event.get('reward_xp', 0),
            'message': event.get('message', f'Поздравляем! {event["streak"]} дней подряд!'),
            'timestamp': event['timestamp']
        }))

    async def streak_warning(self, event):
        """Send streak at risk warning"""
        await self.send(text_data=json.dumps({
            'type': 'streak_warning',
            'current_streak': event['current_streak'],
            'hours_remaining': event['hours_remaining'],
            'message': event.get('message', 'Ваша серия под угрозой! Завершите урок сегодня.'),
            'timestamp': event['timestamp']
        }))


class DailyTaskConsumer(AsyncWebsocketConsumer):
    """
    Consumer for real-time daily task updates
    Sends updates when tasks are completed
    """

    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        self.room_group_name = f'daily_tasks_{self.user.id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to daily task updates'
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

    async def task_progress_updated(self, event):
        """Send task progress update"""
        await self.send(text_data=json.dumps({
            'type': 'task_progress_updated',
            'task_id': event['task_id'],
            'title': event['title'],
            'current_progress': event['current_progress'],
            'target_progress': event['target_progress'],
            'percentage': event.get('percentage', 0),
            'timestamp': event['timestamp']
        }))

    async def task_completed(self, event):
        """Send task completion notification"""
        await self.send(text_data=json.dumps({
            'type': 'task_completed',
            'task_id': event['task_id'],
            'title': event['title'],
            'reward_xp': event.get('reward_xp', 0),
            'reward_coins': event.get('reward_coins', 0),
            'all_tasks_completed': event.get('all_tasks_completed', False),
            'timestamp': event['timestamp']
        }))


class FocusModeConsumer(AsyncWebsocketConsumer):
    """
    Consumer for Focus Mode (Pomodoro timer)
    Handles timer completion and XP rewards
    """

    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        self.room_group_name = f'focus_{self.user.id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to focus mode'
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))
        elif message_type == 'timer_complete':
            await self.process_timer_complete(data)

    @database_sync_to_async
    def process_timer_complete(self, data):
        from apps.gamification.models import UserProfile, FocusSession

        user = self.user
        duration = data.get('duration', 25)  # In minutes

        # Get or create profile
        profile, _ = UserProfile.objects.get_or_create(user=user)

        # Create focus session
        xp_earned = duration // 5  # 1 XP per 5 minutes
        session = FocusSession.objects.create(
            user=user,
            duration=duration,
            xp_earned=xp_earned
        )

        # Update user XP
        profile.xp += xp_earned
        profile.save()

        # Send update through channel layer
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            self.room_group_name,
            {
                "type": "session_complete",
                "xp_earned": xp_earned,
                "total_xp": profile.xp,
                "level": profile.level,
                "timestamp": timezone.now().isoformat(),
            }
        )

    async def session_complete(self, event):
        """Send session completion notification"""
        await self.send(text_data=json.dumps({
            'type': 'session_complete',
            'xp_earned': event['xp_earned'],
            'total_xp': event['total_xp'],
            'level': event['level'],
            'timestamp': event['timestamp']
        }))


class ProfileConsumer(AsyncWebsocketConsumer):
    """
    Consumer for Profile page
    Sends real-time updates for profile data, friends, and requests
    """

    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        self.room_group_name = f'profile_{self.user.id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Send initial profile data
        data = await self.get_profile_data()
        await self.send(text_data=json.dumps({
            'type': 'profile_init',
            'data': data
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

    @database_sync_to_async
    def get_profile_data(self):
        from apps.gamification.models import UserProfile

        user = self.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

        return {
            'username': user.username,
            'email': user.email,
            'xp': profile.xp,
            'level': profile.level,
            'streak': profile.streak,
        }

    async def profile_update(self, event):
        """Send profile update"""
        await self.send(text_data=json.dumps({
            'type': 'profile_update',
            'data': event['data']
        }))

    # ✅ NEW: Friend request handlers
    async def friend_request_received(self, event):
        """Send friend request received notification"""
        await self.send(text_data=json.dumps({
            'type': 'friend_request_received',
            'from_user': event['from_user'],
            'request_id': event['request_id'],
            'timestamp': event['timestamp']
        }))

    async def friend_request_accepted(self, event):
        """Send friend request accepted notification"""
        await self.send(text_data=json.dumps({
            'type': 'friend_request_accepted',
            'friend': event['friend'],
            'request_id': event['request_id'],
            'timestamp': event['timestamp']
        }))

    async def friend_added(self, event):
        """Send friend added notification"""
        await self.send(text_data=json.dumps({
            'type': 'friend_added',
            'friend': event['friend'],
            'timestamp': event['timestamp']
        }))


# ============================================
# Utility functions for sending updates
# ============================================

def send_dashboard_update(user_id, data):
    """Send update to Dashboard"""
    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"dashboard_{user_id}",
        {
            "type": "dashboard_update",
            "data": data
        }
    )


def send_profile_update(user_id, data):
    """Send update to Profile"""
    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"profile_{user_id}",
        {
            "type": "profile_update",
            "data": data
        }
    )


def send_progress_update(user_id, event_type, data):
    """Send update to Progress consumer"""
    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"progress_{user_id}",
        {
            "type": event_type,
            **data
        }
    )


def send_streak_update(user_id, data):
    """Send update to Streak consumer"""
    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"streak_{user_id}",
        {
            "type": "streak_updated",
            **data
        }
    )
