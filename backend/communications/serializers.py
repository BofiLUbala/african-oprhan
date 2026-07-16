from rest_framework import serializers
from .models import Conversation, Message, Notification


def user_initials(user):
    return ((user.first_name or '')[:1] + (user.last_name or '')[:1]).upper() or (user.email[:2].upper())


class ChatUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    initials = serializers.CharField()

    def to_representation(self, user):
        avatar = None
        if getattr(user, 'avatar', None):
            try:
                avatar = user.avatar.url
            except Exception:
                avatar = None
        return {
            'id': user.id,
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'email': user.email,
            'role': getattr(user, 'role', ''),
            'full_name': f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email,
            'initials': user_initials(user),
            'avatar': avatar,
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
    attachments = serializers.SerializerMethodField()
    reply_to = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'edited', 'reply_to',
                  'attachments', 'reactions', 'is_read', 'read_at', 'created_at']

    def get_sender(self, obj):
        return ChatUserSerializer().to_representation(obj.sender)

    def get_attachments(self, obj):
        return [
            {'id': a.pk, 'url': a.file.url, 'name': a.original_name,
             'size': a.size, 'mime': a.mime, 'kind': a.kind}
            for a in obj.attachments.all()
        ]

    def get_reply_to(self, obj):
        r = obj.reply_to
        if r is None:
            return None
        first_att = r.attachments.first()
        return {
            'id': r.pk,
            'sender': r.sender_id,
            'sender_name': f"{r.sender.first_name or ''} {r.sender.last_name or ''}".strip() or r.sender.email,
            'content': (r.content or '')[:140],
            'kind': first_att.kind if first_att else 'text',
            'attachment_name': first_att.original_name if first_att else '',
        }

    def get_reactions(self, obj):
        me = None
        request = self.context.get('request')
        if request is not None:
            me = request.user.pk
        grouped = {}
        for r in obj.reactions.select_related('user').all():
            g = grouped.setdefault(r.emoji, {'emoji': r.emoji, 'count': 0, 'users': [], 'me': False})
            g['count'] += 1
            g['users'].append(f"{r.user.first_name or ''} {r.user.last_name or ''}".strip() or r.user.email)
            if me is not None and r.user_id == me:
                g['me'] = True
        return list(grouped.values())


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'content', 'link', 'is_read', 'created_at']
        read_only_fields = ['id', 'title', 'content', 'link', 'is_read', 'created_at']
