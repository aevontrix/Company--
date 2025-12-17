from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserSettings, UserDevice, Friendship, UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    
    class Meta:
        model = UserSettings
        fields = [
            'user', 'preferred_language', 'timezone', 'email_notifications', 'push_notifications',
            'total_courses_completed', 'total_learning_time', 'current_streak', 'longest_streak',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'user', 'total_courses_completed', 'total_learning_time',
            'current_streak', 'longest_streak', 'created_at', 'updated_at'
        ]


class UserDeviceSerializer(serializers.ModelSerializer):
    """Serializer for user devices"""
    
    class Meta:
        model = UserDevice
        fields = [
            'id', 'device_token', 'device_type', 'device_name', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user"""
    
    profile = UserProfileSerializer(read_only=True)
    devices = UserDeviceSerializer(many=True, read_only=True)
    
    # Gamification поля из связанного профиля
    xp = serializers.IntegerField(source='gamification_profile.xp', read_only=True, default=0)
    level = serializers.IntegerField(source='gamification_profile.level', read_only=True, default=1)
    streak = serializers.IntegerField(source='gamification_profile.streak', read_only=True, default=0)
    total_focus_time = serializers.IntegerField(source='gamification_profile.total_focus_time', read_only=True, default=0)
    
    # Badges и achievements из gamification
    badges = serializers.SerializerMethodField()
    achievements = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'avatar', 'phone', 'role', 
            # Gamification поля
            'xp', 'level', 'streak', 'total_focus_time',
            'badges', 'achievements', 
            'created_at', 'updated_at', 'profile', 'devices'
        ]
        read_only_fields = [
            'id', 'xp', 'level', 'streak', 'total_focus_time',
            'badges', 'achievements', 'created_at', 'updated_at'
        ]
    
    def get_badges(self, obj):
        """Get user badges from gamification app"""
        try:
            from apps.gamification.models import UserAchievement
            user_achievements = UserAchievement.objects.filter(
                user=obj, 
                achievement__achievement_type='badge'
            ).select_related('achievement')
            return [ua.achievement.name for ua in user_achievements]
        except:
            return []
    
    def get_achievements(self, obj):
        """Get user achievements from gamification app"""
        try:
            from apps.gamification.models import UserAchievement
            user_achievements = UserAchievement.objects.filter(
                user=obj
            ).select_related('achievement')
            return [{
                'id': ua.achievement.id,
                'name': ua.achievement.name,
                'description': ua.achievement.description,
                'earned_at': ua.earned_at
            } for ua in user_achievements]
        except:
            return []


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed user serializer"""
    
    profile = UserProfileSerializer(read_only=True)
    devices = UserDeviceSerializer(many=True, read_only=True)
    courses_count = serializers.SerializerMethodField()
    
    # Gamification поля
    xp = serializers.IntegerField(source='gamification_profile.xp', read_only=True, default=0)
    level = serializers.IntegerField(source='gamification_profile.level', read_only=True, default=1)
    streak = serializers.IntegerField(source='gamification_profile.streak', read_only=True, default=0)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'avatar', 'phone', 'role', 
            'xp', 'level', 'streak',
            'created_at', 'updated_at', 'profile', 'devices', 'courses_count'
        ]
        read_only_fields = [
            'id', 'xp', 'level', 'streak', 'created_at', 'updated_at'
        ]
    
    def get_courses_count(self, obj):
        return obj.course_enrollments.count()


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    phone_number = serializers.CharField(required=False, allow_blank=True, write_only=True, source='phone')
    country = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number', 'country'
        ]

    def validate(self, attrs):
        password = attrs.get('password')
        password_confirm = attrs.pop('password_confirm', None)

        if password_confirm and password != password_confirm:
            raise serializers.ValidationError({
                "password": "Пароли не совпадают."
            })
        return attrs

    def create(self, validated_data):
        validated_data.pop('country', None)

        # Auto-generate username from email
        email = validated_data['email']
        username = email.split('@')[0]

        # Ensure username is unique
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        validated_data['username'] = username

        user = User.objects.create_user(**validated_data)
        
        # Create user profile
        UserSettings.objects.create(user=user)
        
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change"""
    
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                "new_password": "Password fields didn't match."
            })
        return attrs


class UpdatePasswordSerializer(serializers.Serializer):
    """Serializer for password update"""
    
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    
    class Meta:
        fields = ['old_password', 'new_password']


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for profile updates"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'avatar', 'phone'
        ]


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    class Meta:
        fields = ['email', 'password']


class UserSearchSerializer(serializers.ModelSerializer):
    """Serializer for searching users"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'avatar', 'role']


class UserPublicSerializer(serializers.ModelSerializer):
    """Public user info serializer"""
    
    courses_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'avatar',
            'role', 'courses_count'
        ]
    
    def get_courses_count(self, obj):
        if obj.role == 'instructor':
            return obj.authored_courses.filter(status='published').count()
        return 0


class InstructorSerializer(serializers.ModelSerializer):
    """Serializer for instructor profile"""
    
    courses = serializers.SerializerMethodField()
    students_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'avatar', 'phone', 'courses', 'students_count'
        ]
    
    def get_courses(self, obj):
        courses = obj.authored_courses.filter(status='published')
        from apps.courses.serializers import CourseSerializer
        return CourseSerializer(courses, many=True).data
    
    def get_students_count(self, obj):
        from apps.courses.models import Course
        from apps.learning.models import CourseEnrollment
        
        courses = Course.objects.filter(instructor=obj)
        return CourseEnrollment.objects.filter(
            course__in=courses,
            status__in=['active', 'completed']
        ).values('user').distinct().count()


class BulkUserImportSerializer(serializers.Serializer):
    """Serializer for bulk importing users"""
    
    users = serializers.ListField(
        child=serializers.JSONField(),
        help_text="List of user objects with email, username, password, role"
    )
    
    class Meta:
        fields = ['users']


class UserBriefSerializer(serializers.ModelSerializer):
    """Brief user info for lists"""
    
    # Gamification поля из профиля
    xp = serializers.IntegerField(source='gamification_profile.xp', read_only=True, default=0)
    level = serializers.IntegerField(source='gamification_profile.level', read_only=True, default=1)

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'avatar', 'xp', 'level']
        read_only_fields = ['id', 'xp', 'level']


class FriendshipSerializer(serializers.ModelSerializer):
    """Serializer for friendship"""

    from_user = UserBriefSerializer(read_only=True)
    to_user = UserBriefSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'from_user', 'to_user', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']