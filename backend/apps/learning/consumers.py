"""
WebSocket Consumers for Real-time Updates
Handles live updates for progress, leaderboard, achievements, and streaks
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model




class ProgressConsumer(AsyncWebsocketConsumer):
    """
    Consumer for real-time progress updates
    Sends updates when user completes lessons, gains XP, levels up
    """

    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        # Create room group name based on user ID
        self.room_group_name = f'progress_{self.user.id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Send initial connection message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to progress updates'
        }))

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        # Handle ping/pong for keep-alive
        if message_type == 'ping':
            await self.send(text_data=json.dumps({
                'type': 'pong'
            }))

    # Receive message from room group
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

        # Join global leaderboard group
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
        # Only send if it's about the current user
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
