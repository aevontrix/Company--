from rest_framework import viewsets, status, generics, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from onthego.pagination import LargeResultsSetPagination
from .models import (
    Notification, NotificationPreference, EmailQueue,
    PushNotification, NotificationLog
)
from .serializers import (
    NotificationSerializer, NotificationListSerializer, NotificationDetailSerializer,
    NotificationPreferenceSerializer, EmailQueueSerializer,
    PushNotificationSerializer, NotificationLogSerializer,
    BulkNotificationSerializer, NotificationStatsSerializer
)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """User notifications"""

    # Optimize: Use larger page size for notifications (users may have many)
    pagination_class = LargeResultsSetPagination
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_read', 'notification_type', 'priority']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return NotificationDetailSerializer
        return NotificationListSerializer
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Notification.objects.none()
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications"""
        notifications = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def count(self, request):
        """Get unread notifications count"""
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()
        return Response({'unread_count': count})
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({'status': 'Marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read"""
        from django.utils import timezone

        # Optimize: Bulk update in one query instead of N queries
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )

        return Response({'marked_as_read': count})
    
    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """Delete all notifications"""
        Notification.objects.filter(user=request.user).delete()
        return Response({'status': 'All notifications cleared'})
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get notifications grouped by type"""
        notifications = self.get_queryset()
        
        types_dict = {}
        for notification in notifications:
            notif_type = notification.notification_type
            if notif_type not in types_dict:
                types_dict[notif_type] = []
            types_dict[notif_type].append(NotificationListSerializer(notification).data)
        
        return Response(types_dict)


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """Notification preferences"""
    
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return NotificationPreference.objects.all()
        return NotificationPreference.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_preferences(self, request):
        """Get current user preferences"""
        try:
            preferences = NotificationPreference.objects.get(user=request.user)
        except NotificationPreference.DoesNotExist:
            preferences = NotificationPreference.objects.create(user=request.user)
        
        serializer = self.get_serializer(preferences)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put'])
    def update_preferences(self, request):
        """Update user preferences"""
        try:
            preferences = NotificationPreference.objects.get(user=request.user)
        except NotificationPreference.DoesNotExist:
            preferences = NotificationPreference.objects.create(user=request.user)
        
        serializer = self.get_serializer(preferences, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class EmailQueueViewSet(viewsets.ReadOnlyModelViewSet):
    """Email queue management (admin only)"""
    
    queryset = EmailQueue.objects.all()
    serializer_class = EmailQueueSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'recipient_email']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        """Resend email"""
        email = self.get_object()
        
        if email.attempts >= email.max_attempts:
            return Response(
                {'error': 'Max attempts exceeded'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        email.attempts += 1
        email.status = 'pending'
        email.save()
        
        return Response({'status': 'Email marked for resending'})


class PushNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """Push notification tracking"""
    
    queryset = PushNotification.objects.all()
    serializer_class = PushNotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return PushNotification.objects.all()
        return PushNotification.objects.filter(
            device__user=self.request.user
        )


class NotificationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Notification delivery logs"""
    
    serializer_class = NotificationLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['channel', 'sent']
    ordering = ['-sent_at']
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return NotificationLog.objects.none()
        if self.request.user.is_staff:
            return NotificationLog.objects.all()
        return NotificationLog.objects.filter(user=self.request.user)


class BulkNotificationView(generics.CreateAPIView):
    """Send bulk notifications (admin only)"""
    
    serializer_class = BulkNotificationSerializer
    permission_classes = [IsAdminUser]
    
    def create(self, request, *args, **kwargs):
        from django.db import transaction

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Filter users based on criteria
        filters = serializer.validated_data.get('recipient_filter', {})
        users = User.objects.all()

        if 'role' in filters:
            users = users.filter(role=filters['role'])
        if 'subscription_tier' in filters:
            users = users.filter(subscription_tier=filters['subscription_tier'])

        # Optimize: Use only() to fetch only ID
        users = users.only('id')

        # Optimize: Prepare bulk create list instead of N individual creates
        notifications_to_create = [
            Notification(
                user=user,
                notification_type=serializer.validated_data['notification_type'],
                title=serializer.validated_data['title'],
                message=serializer.validated_data['message'],
                priority=serializer.validated_data.get('priority', 'normal')
            )
            for user in users
        ]

        # Bulk create in transaction with batching for large datasets
        with transaction.atomic():
            Notification.objects.bulk_create(notifications_to_create, batch_size=500)

        return Response(
            {'created': len(notifications_to_create)},
            status=status.HTTP_201_CREATED
        )


class NotificationStatsView(generics.GenericAPIView):
    """Get notification statistics (admin only)"""

    permission_classes = [IsAdminUser]
    serializer_class = NotificationStatsSerializer

    def get(self, request):
        total_sent = Notification.objects.count()
        total_read = Notification.objects.filter(is_read=True).count()
        read_rate = (total_read / total_sent * 100) if total_sent > 0 else 0
        
        # By type
        from django.db.models import Count
        by_type = {}
        notifications = Notification.objects.values('notification_type').annotate(count=Count('id'))
        for item in notifications:
            by_type[item['notification_type']] = item['count']
        
        # By channel
        by_channel = {}
        logs = NotificationLog.objects.values('channel').annotate(count=Count('id'))
        for item in logs:
            by_channel[item['channel']] = item['count']
        
        data = {
            'total_sent': total_sent,
            'total_read': total_read,
            'read_rate': read_rate,
            'by_type': by_type,
            'by_channel': by_channel,
        }
        
        serializer = NotificationStatsSerializer(data)
        return Response(serializer.data)