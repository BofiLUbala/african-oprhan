from django.conf import settings
from django.db import models


class Channel(models.Model):
    """Espace de discussion structuré (Slack-like), avec accès par rôle."""
    KIND_CHOICES = [
        ("public", "Public"),
        ("role", "Réservé à un rôle"),
        ("emergency", "Urgences"),
        ("announcement", "Annonces"),
        ("project", "Projet"),
    ]

    name = models.CharField(max_length=100, verbose_name="Nom")
    slug = models.SlugField(max_length=100, unique=True, verbose_name="Slug")
    icon = models.CharField(max_length=10, default="#", verbose_name="Icône")
    description = models.CharField(max_length=255, blank=True, verbose_name="Description")
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default="public", verbose_name="Type")
    # [] = visible par tous ; sinon liste de rôles autorisés à VOIR le canal
    allowed_roles = models.JSONField(default=list, blank=True, verbose_name="Rôles autorisés")
    # [] = tout lecteur peut publier ; sinon liste de rôles autorisés à PUBLIER
    post_roles = models.JSONField(default=list, blank=True, verbose_name="Rôles publieurs")
    position = models.PositiveSmallIntegerField(default=0, verbose_name="Ordre")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Canal"
        verbose_name_plural = "Canaux"
        ordering = ["position", "name"]

    def __str__(self):
        return f"#{self.slug}"

    def can_view(self, user):
        if not user.is_authenticated:
            return False
        role = getattr(user, "role", "")
        if role == "supermaster":  # administration voit tout
            return True
        return not self.allowed_roles or role in self.allowed_roles

    def can_post(self, user):
        if not self.can_view(user):
            return False
        role = getattr(user, "role", "")
        if role == "supermaster":
            return True
        return not self.post_roles or role in self.post_roles


class ChannelMessage(models.Model):
    channel = models.ForeignKey(
        Channel, on_delete=models.CASCADE, related_name="messages", verbose_name="Canal"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="channel_messages", verbose_name="Expéditeur"
    )
    content = models.TextField(verbose_name="Contenu")
    edited = models.BooleanField(default=False, verbose_name="Modifié")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Message de canal"
        verbose_name_plural = "Messages de canaux"
        ordering = ["created_at"]

    def __str__(self):
        return f"#{self.channel.slug} — {self.sender.full_name}"


class ChannelReaction(models.Model):
    message = models.ForeignKey(
        ChannelMessage, on_delete=models.CASCADE, related_name="reactions", verbose_name="Message"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="channel_reactions", verbose_name="Utilisateur"
    )
    emoji = models.CharField(max_length=16, verbose_name="Émoji")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Réaction"
        verbose_name_plural = "Réactions"
        unique_together = [("message", "user", "emoji")]

    def __str__(self):
        return f"{self.emoji} par {self.user.full_name}"


class Conversation(models.Model):
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="conversations",
        verbose_name="Participants"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Conversation"
        verbose_name_plural = "Conversations"

    def __str__(self):
        return f"Conversation {self.id}"

class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
        verbose_name="Conversation"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
        verbose_name="Expéditeur"
    )
    content = models.TextField(verbose_name="Contenu")
    is_read = models.BooleanField(default=False, verbose_name="Lu")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        ordering = ["created_at"]

    def __str__(self):
        return f"Message de {self.sender.full_name} ({self.created_at})"

class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name="Utilisateur"
    )
    title = models.CharField(max_length=255, verbose_name="Titre")
    content = models.TextField(verbose_name="Contenu")
    link = models.CharField(max_length=255, blank=True, verbose_name="Lien")
    is_read = models.BooleanField(default=False, verbose_name="Lu")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification: {self.title} pour {self.user.full_name}"
