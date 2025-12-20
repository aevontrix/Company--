# apps/gamification/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator


class UserProfile(models.Model):
    """Extended user profile with gamification data"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='gamification_profile'
    )
    
    # XP and Level
    xp = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    level = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    
    # Streak
    streak = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    longest_streak = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    last_activity_date = models.DateField(null=True, blank=True)
    
    # Badges and Achievements (JSON fields)
    badges = models.JSONField(default=list, blank=True)
    achievements = models.JSONField(default=list, blank=True)
    
    # Activity tracking
    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'gamification_user_profiles'
        verbose_name = 'Gamification Profile'
        verbose_name_plural = 'Gamification Profiles'
        # ✅ FIX: Add indexes for performance
        indexes = [
            models.Index(fields=['xp'], name='idx_user_xp'),  # For leaderboard queries
            models.Index(fields=['level'], name='idx_user_level'),  # For level filtering
            models.Index(fields=['last_activity_date'], name='idx_last_activity'),  # For streak checks
            models.Index(fields=['-xp'], name='idx_xp_desc'),  # For leaderboard DESC
        ]
    
    def __str__(self):
        return f"{self.user.username} - Level {self.level} ({self.xp} XP)"
    
    def update_streak(self):
        """Update user streak based on activity"""
        today = timezone.now().date()
        
        if self.last_activity_date:
            days_diff = (today - self.last_activity_date).days
            
            if days_diff == 0:
                # Same day, no change
                pass
            elif days_diff == 1:
                # Consecutive day, increment streak
                self.streak += 1
                if self.streak > self.longest_streak:
                    self.longest_streak = self.streak
            else:
                # Streak broken
                self.streak = 1
        else:
            # First activity
            self.streak = 1
        
        self.last_activity_date = today
        self.save()
    
    def add_xp(self, amount):
        """Add XP and check for level up"""
        old_level = self.level
        self.xp += amount
        
        # Simple leveling: 2000 XP per level
        new_level = (self.xp // 2000) + 1
        
        if new_level > old_level:
            self.level = new_level
            self.save()
            return True, old_level, new_level  # Leveled up
        
        self.save()
        return False, old_level, self.level  # No level up


class Achievement(models.Model):
    """User achievements/badges"""
    
    CATEGORY_CHOICES = [
        ('learning', 'Learning'),
        ('streak', 'Streak'),
        ('completion', 'Completion'),
        ('quiz', 'Quiz'),
        ('special', 'Special'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='user_achievements'
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='learning')
    icon = models.CharField(max_length=50, blank=True, help_text='Icon name or emoji')
    xp_reward = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_achievements'
        verbose_name = 'Achievement'
        verbose_name_plural = 'Achievements'
        ordering = ['-earned_at']
        indexes = [
            models.Index(fields=['user', 'category']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"


class DailyTask(models.Model):
    """Daily tasks for gamification"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='daily_tasks'
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    xp_reward = models.IntegerField(default=10, validators=[MinValueValidator(0)])
    
    date = models.DateField(default=timezone.now)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'daily_tasks'
        verbose_name = 'Daily Task'
        verbose_name_plural = 'Daily Tasks'
        unique_together = [['user', 'title', 'date']]
        ordering = ['-date', 'completed']
        indexes = [
            models.Index(fields=['user', 'date', 'completed']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.title} ({self.date})"
    
    def mark_complete(self):
        """Mark task as completed and award XP"""
        if not self.completed:
            self.completed = True
            self.completed_at = timezone.now()
            self.save()
            
            # Award XP to user profile
            profile, _ = UserProfile.objects.get_or_create(user=self.user)
            profile.add_xp(self.xp_reward)
            
            return True
        return False


class FocusSession(models.Model):
    """Track focus/pomodoro sessions"""
    
    MODE_CHOICES = [
        ('focus', 'Фокус'),
        ('break', 'Короткий перерыв'),
        ('longBreak', 'Длинный перерыв'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='focus_sessions'
    )
    duration = models.IntegerField(help_text='Duration in minutes')
    xp_earned = models.IntegerField(default=0)
    completed = models.BooleanField(default=False, help_text='Was session completed fully')
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='focus')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'focus_sessions'
        verbose_name = 'Focus Session'
        verbose_name_plural = 'Focus Sessions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        status = "✅" if self.completed else "⏸️"
        return f"{status} {self.user.username} - {self.duration}m ({self.mode})"