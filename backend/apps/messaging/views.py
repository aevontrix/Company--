from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Max
from django.utils import timezone

from .models import Chat, ChatMember, Message
from .serializers import (
    ChatSerializer, ChatDetailSerializer, MessageSerializer,
    ChatMemberSerializer, CreateGroupChatSerializer
)


class ChatViewSet(viewsets.ModelViewSet):
    """API для управления чатами"""
    permission_classes = [IsAuthenticated]
    serializer_class = ChatSerializer

    def get_queryset(self):
        """Получить чаты пользователя"""
        if getattr(self, 'swagger_fake_view', False):
            return Chat.objects.none()

        # ✅ Fix: last_message is a property, not a field - can't use select_related on it
        return Chat.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants').distinct()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ChatDetailSerializer
        return ChatSerializer

    @action(detail=False, methods=['post'])
    def create_direct(self, request):
        """Создать личный чат с пользователем"""
        other_user_id = request.data.get('user_id')
        if not other_user_id:
            return Response(
                {'error': 'user_id required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверяем, существует ли уже такой чат
        existing_chat = Chat.objects.filter(
            type='direct',
            participants=request.user
        ).filter(
            participants__id=other_user_id
        ).first()

        if existing_chat:
            serializer = self.get_serializer(existing_chat)
            return Response(serializer.data)

        # Создаем новый чат
        chat = Chat.objects.create(type='direct')
        ChatMember.objects.create(chat=chat, user=request.user, role='member')
        ChatMember.objects.create(
            chat=chat,
            user_id=other_user_id,
            role='member'
        )

        serializer = self.get_serializer(chat)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def create_group(self, request):
        """Создать групповой чат"""
        from apps.users.models import User

        serializer = CreateGroupChatSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        # Validate all participant IDs exist
        participant_ids = data.get('participant_ids', [])
        if participant_ids:
            existing_users = User.objects.filter(id__in=participant_ids).values_list('id', flat=True)
            missing_ids = set(participant_ids) - set(existing_users)
            if missing_ids:
                return Response(
                    {'error': f'Users not found: {list(missing_ids)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        chat = Chat.objects.create(
            type='group',
            name=data['name'],
            avatar=data.get('avatar', '👥')
        )

        # Добавляем создателя как owner
        ChatMember.objects.create(
            chat=chat,
            user=request.user,
            role='owner'
        )

        # Добавляем других участников
        for user_id in participant_ids:
            ChatMember.objects.create(
                chat=chat,
                user_id=user_id,
                role='member'
            )

        # Award XP for creating group
        from apps.gamification.services import GamificationService
        GamificationService.award_xp(request.user, 'create_group')

        response_serializer = ChatDetailSerializer(chat, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Отметить все сообщения как прочитанные"""
        chat = self.get_object()
        member = ChatMember.objects.filter(
            chat=chat,
            user=request.user
        ).first()

        if not member:
            return Response(
                {'error': 'Not a member of this chat'},
                status=status.HTTP_403_FORBIDDEN
            )

        member.last_read_at = timezone.now()
        member.save()

        return Response({'status': 'marked as read'})


class MessageViewSet(viewsets.ModelViewSet):
    """API для сообщений"""
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        """Получить сообщения чата"""
        if getattr(self, 'swagger_fake_view', False):
            return Message.objects.none()

        chat_id = self.request.query_params.get('chat_id')
        if not chat_id:
            return Message.objects.none()

        # Проверяем, является ли пользователь участником чата
        is_member = ChatMember.objects.filter(
            chat_id=chat_id,
            user=self.request.user
        ).exists()

        if not is_member:
            return Message.objects.none()

        return Message.objects.filter(
            chat_id=chat_id,
            is_deleted=False
        ).select_related('sender').order_by('created_at')

    def perform_create(self, serializer):
        """Отправить сообщение"""
        serializer.save(sender=self.request.user)
