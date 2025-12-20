from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import UserSettings, UserDevice, Friendship, UserProfile
import os

User = get_user_model()


# ✅ Avatar upload validation constants
AVATAR_MAX_SIZE_MB = 5
AVATAR_MAX_SIZE_BYTES = AVATAR_MAX_SIZE_MB * 1024 * 1024  # 5MB
AVATAR_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
AVATAR_ALLOWED_CONTENT_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif'
]
AVATAR_MAX_DIMENSIONS = (2000, 2000)  # Max width x height


def validate_avatar(file):
    """
    Validate avatar upload:
    - File size (max 5MB)
    - File extension (jpg, png, webp, gif)
    - Content type verification
    - Image dimensions (max 2000x2000)
    """
    if not file:
        return file

    # Check file size
    if file.size > AVATAR_MAX_SIZE_BYTES:
        raise serializers.ValidationError(
            f"Размер файла не должен превышать {AVATAR_MAX_SIZE_MB}MB. "
            f"Текущий размер: {file.size / (1024 * 1024):.1f}MB"
        )

    # Check file extension
    ext = os.path.splitext(file.name)[1].lower().lstrip('.')
    if ext not in AVATAR_ALLOWED_EXTENSIONS:
        raise serializers.ValidationError(
            f"Недопустимый формат файла. Разрешены: {', '.join(AVATAR_ALLOWED_EXTENSIONS)}"
        )

    # Check content type
    content_type = getattr(file, 'content_type', None)
    if content_type and content_type not in AVATAR_ALLOWED_CONTENT_TYPES:
        raise serializers.ValidationError(
            f"Недопустимый тип файла: {content_type}. "
            f"Разрешены только изображения."
        )

    # Validate actual image content and dimensions
    try:
        from PIL import Image

        # Reset file pointer
        file.seek(0)
        img = Image.open(file)
        img.verify()  # Verify it's a valid image

        # Re-open to get dimensions (verify closes the file)
        file.seek(0)
        img = Image.open(file)
        width, height = img.size

        if width > AVATAR_MAX_DIMENSIONS[0] or height > AVATAR_MAX_DIMENSIONS[1]:
            raise serializers.ValidationError(
                f"Размер изображения слишком большой ({width}x{height}). "
                f"Максимум: {AVATAR_MAX_DIMENSIONS[0]}x{AVATAR_MAX_DIMENSIONS[1]} пикселей."
            )

        # Reset file pointer for saving
        file.seek(0)

    except serializers.ValidationError:
        raise
    except Exception as e:
        raise serializers.ValidationError(
            f"Не удалось обработать изображение. Убедитесь, что файл является корректным изображением."
        )

    return file


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

    # ✅ Avatar field with custom validation
    avatar = serializers.ImageField(
        required=False,
        allow_null=True,
        validators=[validate_avatar],
        help_text=f"Аватар пользователя. Макс. размер: {AVATAR_MAX_SIZE_MB}MB. "
                  f"Форматы: {', '.join(AVATAR_ALLOWED_EXTENSIONS)}"
    )

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'avatar', 'phone'
        ]

    def validate_avatar(self, value):
        """Additional avatar validation at field level"""
        if value:
            return validate_avatar(value)
        return value


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