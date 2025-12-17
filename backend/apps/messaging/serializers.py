from rest_framework import serializers
from .models import Chat, ChatMember, Message
from apps.users.models import User


class UserBriefSerializer(serializers.ModelSerializer):
    """@0B:0O 8=D>@<0F8O > ?>;L7>20B5;5 4;O G0B>2"""

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']


class MessageSerializer(serializers.ModelSerializer):
    """!5@80;870B>@ 4;O A>>1I5=89"""
    sender = UserBriefSerializer(read_only=True)
    sender_id = serializers.IntegerField(write_only=True, required=False)
    is_own = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'chat', 'sender', 'sender_id', 'type', 'content',
            'file_url', 'file_name', 'is_edited', 'is_deleted',
            'created_at', 'updated_at', 'is_own'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_edited']

    def get_is_own(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.sender_id == request.user.id
        return False


class ChatMemberSerializer(serializers.ModelSerializer):
    """!5@80;870B>@ 4;O CG0AB=8:>2 G0B0"""
    user = UserBriefSerializer(read_only=True)
    unread_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ChatMember
        fields = ['id', 'chat', 'user', 'role', 'joined_at', 'last_read_at', 'unread_count']
        read_only_fields = ['id', 'joined_at']


class ChatSerializer(serializers.ModelSerializer):
    """!5@80;870B>@ 4;O G0B>2"""
    last_message = MessageSerializer(read_only=True)
    members_count = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = [
            'id', 'type', 'name', 'avatar', 'created_at', 'updated_at',
            'last_message', 'members_count', 'unread_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_members_count(self, obj):
        return obj.participants.count()

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            member = obj.members.filter(user=request.user).first()
            if member:
                return member.unread_count
        return 0


class ChatDetailSerializer(serializers.ModelSerializer):
    """5B0;L=K9 A5@80;870B>@ G0B0 A CG0AB=8:0<8"""
    members = ChatMemberSerializer(many=True, read_only=True)
    last_message = MessageSerializer(read_only=True)

    class Meta:
        model = Chat
        fields = [
            'id', 'type', 'name', 'avatar', 'created_at', 'updated_at',
            'members', 'last_message'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CreateGroupChatSerializer(serializers.Serializer):
    """Serializer for creating group chat"""
    name = serializers.CharField(max_length=255)
    avatar = serializers.CharField(max_length=50, required=False, default='👥')
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list
    )
