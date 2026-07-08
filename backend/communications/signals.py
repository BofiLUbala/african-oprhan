from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import ChannelMessage, Message, Notification

User = get_user_model()


def _display_name(user):
    return f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email


@receiver(post_save, sender=ChannelMessage)
def notify_channel_message(sender, instance, created, **kwargs):
    """Notifie les utilisateurs qui peuvent VOIR ce message dans le canal
    (mode role_filtered : uniquement les détenteurs du rôle et supermaster)."""
    if not created:
        return
    ch = instance.channel
    recipients = []
    for u in User.objects.filter(is_active=True).exclude(pk=instance.sender_id):
        if ch.can_view(u) and ch.can_see_message(u, instance):
            recipients.append(u)
    if not recipients:
        return
    preview = (instance.content or '').strip()[:80] or 'Pièce jointe'
    Notification.objects.bulk_create([
        Notification(
            user=u,
            title=f"#{ch.name} — {_display_name(instance.sender)}",
            content=preview,
            link=f"communication:channel:{ch.slug}",
        )
        for u in recipients
    ])


@receiver(post_save, sender=Message)
def notify_direct_message(sender, instance, created, **kwargs):
    """Notifie les autres participants d'une conversation privée."""
    if not created:
        return
    others = instance.conversation.participants.exclude(pk=instance.sender_id)
    if not others.exists():
        return
    preview = (instance.content or '').strip()[:80] or 'Pièce jointe'
    Notification.objects.bulk_create([
        Notification(
            user=u,
            title=f"Message de {_display_name(instance.sender)}",
            content=preview,
            link=f"communication:dm:{instance.conversation_id}",
        )
        for u in others
    ])
