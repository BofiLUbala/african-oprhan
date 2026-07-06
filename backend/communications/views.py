from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Channel, ChannelMessage, Conversation, Message, Notification
from .serializers import (
    ConversationSerializer, MessageSerializer,
    NotificationSerializer, ChatUserSerializer,
)

User = get_user_model()


def _channel_payload(ch, user):
    return {
        "id": ch.pk,
        "slug": ch.slug,
        "name": ch.name,
        "icon": ch.icon,
        "description": ch.description,
        "kind": ch.kind,
        "can_post": ch.can_post(user),
        "restricted": bool(ch.allowed_roles),
        "messages_count": ch.messages.count(),
    }


def _channel_message_payload(m):
    u = m.sender
    return {
        "id": m.pk,
        "sender": u.pk,
        "sender_name": u.full_name,
        "sender_role": u.role,
        "sender_initials": ((u.first_name[:1] or "") + (u.last_name[:1] or "")).upper() or "?",
        "sender_hue": (u.first_name or "U").encode("utf-8")[0] * 37 % 360,
        "content": m.content,
        "created_at": m.created_at,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def channel_list(request):
    """Canaux visibles pour le rôle de l'utilisateur connecté."""
    channels = [c for c in Channel.objects.all() if c.can_view(request.user)]
    return Response([_channel_payload(c, request.user) for c in channels])


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def channel_messages(request, slug):
    try:
        ch = Channel.objects.get(slug=slug)
    except Channel.DoesNotExist:
        return Response({'error': 'Canal introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if not ch.can_view(request.user):
        return Response({'error': 'Accès refusé à ce canal.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        msgs = ch.messages.select_related('sender').order_by('created_at')[:200]
        return Response([_channel_message_payload(m) for m in msgs])

    if not ch.can_post(request.user):
        return Response({'error': 'Votre rôle ne peut pas publier dans ce canal.'}, status=status.HTTP_403_FORBIDDEN)

    content = request.data.get('content', '').strip()
    if not content:
        return Response({'error': 'Contenu requis.'}, status=status.HTTP_400_BAD_REQUEST)

    m = ChannelMessage.objects.create(channel=ch, sender=request.user, content=content)
    return Response(_channel_message_payload(m), status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conversation_list(request):
    if request.method == 'GET':
        convs = Conversation.objects.filter(participants=request.user).order_by('-updated_at')
        return Response(ConversationSerializer(convs, many=True, context={'request': request}).data)

    participant_id = request.data.get('participant_id')
    if not participant_id:
        return Response({'error': 'participant_id requis.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        other = User.objects.get(pk=participant_id)
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    # Find existing conversation between exactly these two users
    existing = Conversation.objects.filter(participants=request.user).filter(participants=other)
    if existing.exists():
        conv = existing.first()
        return Response(ConversationSerializer(conv, context={'request': request}).data, status=status.HTTP_200_OK)

    conv = Conversation.objects.create()
    conv.participants.set([request.user, other])
    return Response(ConversationSerializer(conv, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def message_list(request, conversation_id):
    try:
        conv = Conversation.objects.get(pk=conversation_id)
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if not conv.participants.filter(pk=request.user.pk).exists():
        return Response({'error': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        messages = conv.messages.select_related('sender').order_by('created_at')
        return Response(MessageSerializer(messages, many=True).data)

    content = request.data.get('content', '').strip()
    if not content:
        return Response({'error': 'Contenu requis.'}, status=status.HTTP_400_BAD_REQUEST)

    msg = Message.objects.create(conversation=conv, sender=request.user, content=content)
    # Update conversation updated_at so it sorts to top
    conv.save()
    return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_read(request, conversation_id):
    try:
        conv = Conversation.objects.get(pk=conversation_id)
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if not conv.participants.filter(pk=request.user.pk).exists():
        return Response({'error': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)

    count = conv.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
    return Response({'marked': count})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_user_list(request):
    users = User.objects.exclude(pk=request.user.pk).filter(is_active=True).order_by('first_name', 'last_name')
    return Response([ChatUserSerializer().to_representation(u) for u in users])


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    if request.method == 'GET':
        qs = Notification.objects.filter(user=request.user)
        return Response(NotificationSerializer(qs, many=True).data)

    mark_read_all = request.data.get('mark_read', False)
    if mark_read_all:
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'ok'})

    nid = request.data.get('id')
    if nid:
        try:
            n = Notification.objects.get(pk=nid, user=request.user)
            n.is_read = True
            n.save(update_fields=['is_read'])
            return Response(NotificationSerializer(n).data)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    return Response({'error': 'Aucune action spécifiée.'}, status=status.HTTP_400_BAD_REQUEST)
