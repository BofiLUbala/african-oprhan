from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.utils import timezone

from .models import (
    Channel, ChannelAttachment, ChannelMessage, ChannelReaction,
    Conversation, Message, MessageAttachment, MessageReaction,
    Notification, _attachment_kind,
)

# Limite de taille par fichier : 25 Mo
MAX_UPLOAD_BYTES = 25 * 1024 * 1024
from .serializers import (
    ConversationSerializer, MessageSerializer,
    NotificationSerializer, ChatUserSerializer,
)

User = get_user_model()


def _visible_messages(ch, user):
    """Messages du canal visibles par cet utilisateur (mode role_filtered :
    les non-membres du rôle ne voient que leurs propres messages)."""
    qs = ch.messages.all()
    if not ch.sees_all_messages(user):
        qs = qs.filter(sender=user)
    return qs


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
        "sees_all": ch.sees_all_messages(user),
        "visibility_mode": ch.visibility_mode,
        "messages_count": _visible_messages(ch, user).count(),
    }


def _reply_snippet(reply):
    """Aperçu compact du message cité, style WhatsApp."""
    if reply is None:
        return None
    first_att = reply.attachments.first()
    return {
        "id": reply.pk,
        "sender": reply.sender_id,
        "sender_name": reply.sender.full_name,
        "content": (reply.content or "")[:140],
        "kind": first_att.kind if first_att else "text",
        "attachment_name": first_att.original_name if first_att else "",
    }


def _channel_message_payload(m, user=None):
    u = m.sender
    # Réactions groupées par émoji, avec les NOMS RÉELS des agents qui ont réagi
    grouped = {}
    for r in m.reactions.select_related("user").all():
        g = grouped.setdefault(r.emoji, {"emoji": r.emoji, "count": 0, "users": [], "me": False})
        g["count"] += 1
        g["users"].append(r.user.full_name)
        if user is not None and r.user_id == user.pk:
            g["me"] = True
    return {
        "id": m.pk,
        "sender": u.pk,
        "sender_name": u.full_name,
        "sender_role": u.role,
        "sender_initials": ((u.first_name[:1] or "") + (u.last_name[:1] or "")).upper() or "?",
        "sender_hue": (u.first_name or "U").encode("utf-8")[0] * 37 % 360,
        "content": m.content,
        "edited": m.edited,
        "reply_to": _reply_snippet(m.reply_to),
        "reactions": list(grouped.values()),
        "attachments": [
            {
                "id": a.pk,
                "url": a.file.url,
                "name": a.original_name,
                "size": a.size,
                "mime": a.mime,
                "kind": a.kind,
            }
            for a in m.attachments.all()
        ],
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
        # ouvrir le canal marque ses notifications comme lues (badge auto-décrémenté)
        Notification.objects.filter(
            user=request.user, is_read=False, link=f"communication:channel:{ch.slug}"
        ).update(is_read=True)
        msgs = _visible_messages(ch, request.user).select_related('sender', 'reply_to__sender').prefetch_related('reactions__user', 'attachments', 'reply_to__attachments').order_by('created_at')[:200]
        return Response([_channel_message_payload(m, request.user) for m in msgs])

    if not ch.can_post(request.user):
        return Response({'error': 'Votre rôle ne peut pas publier dans ce canal.'}, status=status.HTTP_403_FORBIDDEN)

    content = request.data.get('content', '').strip()
    files = request.FILES.getlist('files')

    for f in files:
        if f.size > MAX_UPLOAD_BYTES:
            return Response({'error': f"« {f.name} » dépasse la taille maximale de 25 Mo."}, status=status.HTTP_400_BAD_REQUEST)

    if not content and not files:
        return Response({'error': 'Un message ou une pièce jointe est requis.'}, status=status.HTTP_400_BAD_REQUEST)

    reply_to = None
    reply_id = request.data.get('reply_to')
    if reply_id:
        try:
            candidate = ChannelMessage.objects.get(pk=reply_id, channel=ch)
            if ch.can_see_message(request.user, candidate):
                reply_to = candidate
        except (ChannelMessage.DoesNotExist, ValueError, TypeError):
            pass  # réponse à un message invalide → message simple

    m = ChannelMessage.objects.create(channel=ch, sender=request.user, content=content, reply_to=reply_to)
    for f in files:
        ChannelAttachment.objects.create(
            message=m, file=f, original_name=f.name[:255], size=f.size,
            mime=getattr(f, 'content_type', '') or '',
            kind=_attachment_kind(f.name, getattr(f, 'content_type', '')),
        )
    return Response(_channel_message_payload(m, request.user), status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def channel_message_detail(request, message_id):
    """Modifier ou supprimer SON propre message de canal."""
    try:
        m = ChannelMessage.objects.select_related('channel', 'sender').get(pk=message_id)
    except ChannelMessage.DoesNotExist:
        return Response({'error': 'Message introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if m.sender_id != request.user.pk:
        return Response({'error': 'Vous ne pouvez modifier que vos propres messages.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'DELETE':
        m.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    content = request.data.get('content', '').strip()
    if not content:
        return Response({'error': 'Contenu requis.'}, status=status.HTTP_400_BAD_REQUEST)
    m.content = content
    m.edited = True
    m.save(update_fields=['content', 'edited'])
    return Response(_channel_message_payload(m, request.user))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def channel_message_react(request, message_id):
    """Basculer une réaction émoji sur un message de canal."""
    try:
        m = ChannelMessage.objects.select_related('channel').get(pk=message_id)
    except ChannelMessage.DoesNotExist:
        return Response({'error': 'Message introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if not m.channel.can_see_message(request.user, m):
        return Response({'error': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)

    emoji = (request.data.get('emoji') or '').strip()[:16]
    if not emoji:
        return Response({'error': 'Émoji requis.'}, status=status.HTTP_400_BAD_REQUEST)

    # Sémantique WhatsApp : une seule réaction par utilisateur et par message.
    # Même émoji → retrait ; émoji différent → remplacement.
    mine = list(ChannelReaction.objects.filter(message=m, user=request.user))
    had_same = any(r.emoji == emoji for r in mine)
    ChannelReaction.objects.filter(message=m, user=request.user).delete()
    if not had_same:
        ChannelReaction.objects.create(message=m, user=request.user, emoji=emoji)
    return Response(_channel_message_payload(m, request.user))


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
        qs = conv.messages.select_related('sender', 'reply_to__sender').prefetch_related(
            'attachments', 'reactions__user', 'reply_to__attachments'
        )
        # pagination "avant tel message" pour l'historique infini
        before_id = request.query_params.get('before_id')
        if before_id:
            try:
                qs = qs.filter(pk__lt=int(before_id))
            except (ValueError, TypeError):
                pass
        messages = list(qs.order_by('-created_at', '-pk')[:100])
        messages.reverse()  # ordre chronologique pour l'affichage
        return Response(MessageSerializer(messages, many=True, context={'request': request}).data)

    content = (request.data.get('content') or '').strip()
    files = request.FILES.getlist('files')
    for f in files:
        if f.size > MAX_UPLOAD_BYTES:
            return Response({'error': f"« {f.name} » dépasse la taille maximale de 25 Mo."}, status=status.HTTP_400_BAD_REQUEST)
    if not content and not files:
        return Response({'error': 'Un message ou une pièce jointe est requis.'}, status=status.HTTP_400_BAD_REQUEST)

    reply_to = None
    reply_id = request.data.get('reply_to')
    if reply_id:
        try:
            reply_to = Message.objects.get(pk=reply_id, conversation=conv)
        except (Message.DoesNotExist, ValueError, TypeError):
            pass

    msg = Message.objects.create(conversation=conv, sender=request.user, content=content, reply_to=reply_to)
    for f in files:
        MessageAttachment.objects.create(
            message=msg, file=f, original_name=f.name[:255], size=f.size,
            mime=getattr(f, 'content_type', '') or '',
            kind=_attachment_kind(f.name, getattr(f, 'content_type', '')),
        )
    # Update conversation updated_at so it sorts to top
    conv.save()
    return Response(MessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_read(request, conversation_id):
    try:
        conv = Conversation.objects.get(pk=conversation_id)
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if not conv.participants.filter(pk=request.user.pk).exists():
        return Response({'error': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)

    count = conv.messages.filter(is_read=False).exclude(sender=request.user).update(
        is_read=True, read_at=timezone.now()
    )
    # lire la conversation efface ses notifications (badge auto-décrémenté)
    Notification.objects.filter(
        user=request.user, is_read=False, link=f"communication:dm:{conv.pk}"
    ).update(is_read=True)
    return Response({'marked': count})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def message_react(request, message_id):
    """Réaction émoji sur un message privé (sémantique WhatsApp :
    une seule réaction par utilisateur, remplaçable, retirable)."""
    try:
        m = Message.objects.select_related('conversation').get(pk=message_id)
    except Message.DoesNotExist:
        return Response({'error': 'Message introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if not m.conversation.participants.filter(pk=request.user.pk).exists():
        return Response({'error': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)

    emoji = (request.data.get('emoji') or '').strip()[:16]
    if not emoji:
        return Response({'error': 'Émoji requis.'}, status=status.HTTP_400_BAD_REQUEST)

    mine = list(MessageReaction.objects.filter(message=m, user=request.user))
    had_same = any(r.emoji == emoji for r in mine)
    MessageReaction.objects.filter(message=m, user=request.user).delete()
    if not had_same:
        MessageReaction.objects.create(message=m, user=request.user, emoji=emoji)
    return Response(MessageSerializer(m, context={'request': request}).data)


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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@throttle_classes([])
def notification_unread_count(request):
    """Compteur léger pour le polling des badges (Dashboard + Communication).
    Exempté du throttling : lecture seule, une requête COUNT."""
    count = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({'count': count})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_broadcast(request):
    """Crée une notification pour tous les utilisateurs actifs (broadcast système).
    Réservé à l'administration : supermaster et fédération."""
    if getattr(request.user, 'role', '') not in ('supermaster', 'federation'):
        return Response({'error': 'Réservé à l’administration.'}, status=status.HTTP_403_FORBIDDEN)
    title = request.data.get('title', '').strip()
    content = request.data.get('content', '').strip()
    link = request.data.get('link', '').strip()
    if not title:
        return Response({'error': 'Titre requis.'}, status=status.HTTP_400_BAD_REQUEST)
    users = User.objects.filter(is_active=True)
    notifications = [Notification(user=u, title=title, content=content, link=link) for u in users]
    Notification.objects.bulk_create(notifications)
    return Response({'status': 'ok', 'count': len(notifications)})
