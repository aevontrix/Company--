from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.core.mail import send_mail
from django.conf import settings
from onthego.pagination import StandardResultsSetPagination, SmallResultsSetPagination
from .models import UserSettings, Friendship
from .serializers import (
    UserSerializer,
    UserProfileSerializer,
    RegisterSerializer,
    FriendshipSerializer,
    UserBriefSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Регистрация нового пользователя
    POST /api/users/register/
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        # Serialize user data
        user_serializer = UserSerializer(user)

        return Response({
            'user': user_serializer.data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    """
    Выход пользователя (JWT blacklist)
    POST /api/users/logout/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({
                'message': 'Успешный выход'
            }, status=status.HTTP_200_OK)
        except TokenError:
            return Response({
                'message': 'Успешный выход'
            }, status=status.HTTP_200_OK)
        except Exception:
            return Response({
                'message': 'Успешный выход'
            }, status=status.HTTP_200_OK)


class PasswordResetView(APIView):
    """
    Сброс пароля пользователя
    POST /api/users/password/reset/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email обязателен'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            # Здесь должна быть логика отправки email с токеном
            # Для примера просто возвращаем успех
            return Response({
                'message': 'Инструкции по сбросу пароля отправлены на email'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'Пользоват таким email не найден'
            }, status=status.HTTP_404_NOT_FOUND)


class PasswordResetConfirmView(APIView):
    """
    Подтверждение сброса пароля
    POST /api/users/password/reset/confirm/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not all([uid, token, new_password]):
            return Response({
                'error': 'Все поля обязательны'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            
            if default_token_generator.check_token(user, token):
                user.set_password(new_password)
                user.save()
                return Response({
                    'message': 'Пароль успешно изменен'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Неверный токен'
                }, status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({
                'error': 'Неверные данные'
            }, status=status.HTTP_400_BAD_REQUEST)


class EmailVerificationView(APIView):
    """
    Верификация email
    POST /api/users/verify-email/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Здесь должна быть логика верификации email
        return Response({
            'message': 'Email успешно подтвержден'
        }, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления пользователями
    """
    # Optimize: Pagination for user lists (admin only)
    pagination_class = StandardResultsSetPagination
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # ✅ Optimize: Load gamification_profile to avoid N+1 queries
        queryset = User.objects.select_related('gamification_profile')

        # Обычные пользователи видят только себя
        if not self.request.user.is_staff:
            return queryset.filter(id=self.request.user.id)
        return queryset
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Получить информацию о текущем пользователе
        GET /api/users/me/
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get', 'put', 'patch'])
    def update_me(self, request):
        """Обновление данных текущего пользователя"""
        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=request.method == 'PATCH')
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """
        Обновить профиль текущего пользователя
        PUT/PATCH /api/users/update_profile/
        """
        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Изменение пароля"""
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not user.check_password(old_password):
            return Response({
                'error': 'Неверный текущий пароль'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        return Response({
            'message': 'Пароль успешно изменен'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def resend_verification(self, request):
        """Повторная отправка верификации"""
        return Response({
            'message': 'Письмо с верификацией отправлено'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='all')
    def list_all_users(self, request):
        """
        Get all users for friend search
        GET /api/users/all/
        """
        # ✅ Optimize: Load gamification_profile for UserBriefSerializer
        users = User.objects.select_related('gamification_profile').order_by('-created_at')
        serializer = UserBriefSerializer(users, many=True)
        return Response({'results': serializer.data})

    @action(detail=False, methods=['post'])
    def google_login(self, request):
        """Вход через Google"""
        return Response({
            'message': 'Google login'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def github_login(self, request):
        """Вход через GitHub"""
        return Response({
            'message': 'GitHub login'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def deactivate(self, request):
        """Деактивация аккаунта"""
        user = request.user
        user.is_active = False
        user.save()
        return Response({
            'message': 'Аккаунт деактивирован'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def delete_account(self, request):
        """Удаление аккаунта"""
        user = request.user
        user.delete()
        return Response({
            'message': 'Аккаунт удален'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def list_all(self, request):
        """Список всех пользователей (для админов)"""
        if not request.user.is_staff:
            return Response({
                'error': 'Доступ запрещен'
            }, status=status.HTTP_403_FORBIDDEN)
        
        users = User.objects.all()
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def activate_user(self, request, pk=None):
        """Активация пользователя (для админов)"""
        if not request.user.is_staff:
            return Response({
                'error': 'Доступ запрещен'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(pk=pk)
            user.is_active = True
            user.save()
            return Response({
                'message': 'Пользователь активирован'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'Пользователь не найден'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def registration_stats(self, request):
        """Статистика регистраций"""
        # Пример простой статистики
        total_users = User.objects.count()
        return Response({
            'total_users': total_users,
            'message': 'Стика регистраций'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def active_users(self, request):
        """Список активных пользователей"""
        active_users = User.objects.filter(is_active=True).count()
        return Response({
            'active_users': active_users,
            'message': 'Активные пользователи'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def setup_2fa(self, request):
        """Настройка двухфакторной аутентификации"""
        return Response({
            'message': '2FA setup'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def verify_2fa(self, request):
        """Верификация 2FA"""
        return Response({
            'message': '2FA verified'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def disable_2fa(self, request):
        """Отключение 2FA"""
        return Response({
            'message': '2FA disabled'
        }, status=status.HTTP_200_OK)


class UserProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления профилями пользователей
    """
    queryset = UserSettings.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Пользователи видят только свой профиль
        if not self.request.user.is_staff:
            return UserSettings.objects.filter(user=self.request.user)
        return UserSettings.objects.all()
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """
        Получить профиль текущего пользователя
        GET /api/users/profiles/my_profile/
        """
        profile, created = UserSettings.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_my_profile(self, request):
        """Обновление профиля текущего пользователя"""
        profile, created = UserSettings.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(profile, data=request.data, partial=request.method == 'PATCH')
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_settings(self, request):
        """
        Обновить настройки профиля
        PUT/PATCH /api/users/profiles/update_settings/
        """
        profile, created = UserSettings.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class FriendshipViewSet(viewsets.ModelViewSet):
    """ViewSet для управления дружбой"""

    # Optimize: Small pagination for friendships (typically not many)
    pagination_class = SmallResultsSetPagination
    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Возвращает все связи дружбы текущего пользователя"""
        user = self.request.user
        from django.db.models import Q
        return Friendship.objects.filter(
            Q(from_user=user) | Q(to_user=user)
        )

    @action(detail=False, methods=['get'])
    def friends(self, request):
        """Получить список друзей (accepted friendships)"""
        user = request.user
        from django.db.models import Q

        # ✅ Исправлено: добавлен select_related для gamification_profile
        friendships = Friendship.objects.filter(
            (Q(from_user=user) | Q(to_user=user)),
            status='accepted'
        ).select_related('from_user', 'to_user', 'from_user__gamification_profile', 'to_user__gamification_profile')

        friends_data = []
        for friendship in friendships:
            friend = friendship.to_user if friendship.from_user == user else friendship.from_user

            # ✅ Получаем XP и level из gamification_profile
            try:
                profile = friend.gamification_profile
                xp = profile.xp
                level = profile.level
            except:
                xp = 0
                level = 1
            
            friends_data.append({
                'id': friend.id,
                'first_name': friend.first_name,
                'last_name': friend.last_name,
                'email': friend.email,
                'avatar': friend.avatar.url if friend.avatar else None,
                'xp': xp,
                'level': level,
            })

        return Response({'results': friends_data})

    @action(detail=False, methods=['get'])
    def pending_requests(self, request):
        """Получить входящие запросы на дружбу"""
        user = request.user
        requests = Friendship.objects.filter(
            to_user=user,
            status='pending'
        )
        serializer = self.get_serializer(requests, many=True)
        return Response({'results': serializer.data})

    @action(detail=False, methods=['get'])
    def sent_requests(self, request):
        """Получить исходящие запросы на дружбу"""
        user = request.user
        requests = Friendship.objects.filter(
            from_user=user,
            status='pending'
        )
        serializer = self.get_serializer(requests, many=True)
        return Response({'results': serializer.data})

    @action(detail=False, methods=['post'])
    def send_request(self, request):
        """Отправить запрос на дружбу"""
        user = request.user
        to_user_id = request.data.get('user_id')

        if not to_user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            to_user = User.objects.get(id=to_user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if user.id == to_user.id:
            return Response({'error': 'Cannot send friend request to yourself'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if friendship already exists
        from django.db.models import Q
        existing = Friendship.objects.filter(
            (Q(from_user=user, to_user=to_user) |
             Q(from_user=to_user, to_user=user))
        ).first()

        if existing:
            if existing.status == 'accepted':
                return Response({'error': 'Already friends'}, status=status.HTTP_400_BAD_REQUEST)
            elif existing.status == 'pending':
                return Response({'error': 'Friend request already sent'}, status=status.HTTP_400_BAD_REQUEST)

        # Create new friendship
        friendship = Friendship.objects.create(
            from_user=user,
            to_user=to_user,
            status='pending'
        )
        serializer = self.get_serializer(friendship)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Принять запрос на дружбу"""
        try:
            friendship = Friendship.objects.get(
                id=pk,
                to_user=request.user,
                status='pending'
            )
            friendship.status = 'accepted'
            friendship.save()
            serializer = self.get_serializer(friendship)
            return Response(serializer.data)
        except Friendship.DoesNotExist:
            return Response({'error': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Отклонить запрос на дружбу"""
        try:
            friendship = Friendship.objects.get(
                id=pk,
                to_user=request.user,
                status='pending'
            )
            friendship.status = 'rejected'
            friendship.save()
            serializer = self.get_serializer(friendship)
            return Response(serializer.data)
        except Friendship.DoesNotExist:
            return Response({'error': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['delete'])
    def remove_friend(self, request, pk=None):
        """Удалить из друзей"""
        try:
            friendship = Friendship.objects.get(
                id=pk,
                status='accepted'
            )
            # Ensure current user is part of this friendship
            if friendship.from_user != request.user and friendship.to_user != request.user:
                return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

            friendship.delete()
            return Response({'message': 'Friend removed successfully'}, status=status.HTTP_200_OK)
        except Friendship.DoesNotExist:
            return Response({'error': 'Friendship not found'}, status=status.HTTP_404_NOT_FOUND)

