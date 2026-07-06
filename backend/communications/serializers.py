from rest_framework import serializers
from .models import Conversation, Message, Notification


def user_initials(user):
    return ((user.first_name or '')[:1] + (user.last_name or '')[:1]).upper() or (user.email[:2].upper())


class ChatUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    initials = serializers.CharField()

    def to_representation(self, user):
        return {
            'id': user.id,
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'email': user.email,
            'role': getattr(user, 'role', ''),
            'full_name': f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email,
            'initials': user_initials(user),
        }


class LastMessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source='sender.id')

    class Meta:
        model = Message
        fields = ['content', 'created_at', 'sender_id']


class ConversationSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'last_message', 'unread_count', 'updated_at']

    def get_participants(self, obj):
        return [ChatUserSerializer().to_representation(u) for u in obj.participants.all()]

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if msg is None:
            return None
        return {'content': msg.content, 'created_at': str(msg.created_at), 'sender_id': msg.sender_id}

    def get_unread_count(self, obj):
        user = self.context.get('request').user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'is_read', 'created_at']

    def get_sender(self, obj):
        return ChatUserSerializer().to_representation(obj.sender)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'content', 'link', 'is_read', 'created_at']
        read_only_fields = ['id', 'title', 'content', 'link', 'is_read', 'created_at']
