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

    VISIBILITY_CHOICES = [
        # tout le monde voit le canal et tous ses messages
        ("open", "Ouvert"),
        # tout le monde voit le canal et peut y publier ; seuls les rôles
        # de allowed_roles (et supermaster) voient TOUS les messages, les
        # autres ne voient que leurs propres publications
        ("role_filtered", "Filtré par rôle"),
        # comportement historique : seuls les rôles de allowed_roles voient le canal
        ("private", "Privé"),
    ]

    name = models.CharField(max_length=100, verbose_name="Nom")
    slug = models.SlugField(max_length=100, unique=True, verbose_name="Slug")
    icon = models.CharField(max_length=10, default="#", verbose_name="Icône")
    description = models.CharField(max_length=255, blank=True, verbose_name="Description")
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default="public", verbose_name="Type")
    # [] = visible par tous ; sinon liste de rôles "propriétaires" du canal
    allowed_roles = models.JSONField(default=list, blank=True, verbose_name="Rôles autorisés")
    # [] = tout lecteur peut publier ; sinon liste de rôles autorisés à PUBLIER
    post_roles = models.JSONField(default=list, blank=True, verbose_name="Rôles publieurs")
    visibility_mode = models.CharField(
        max_length=20, choices=VISIBILITY_CHOICES, default="open", verbose_name="Mode de visibilité"
    )
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
        if self.visibility_mode == "private":
            return not self.allowed_roles or role in self.allowed_roles
        return True

    def can_post(self, user):
        if not self.can_view(user):
            return False
        role = getattr(user, "role", "")
        if role == "supermaster":
            return True
        return not self.post_roles or role in self.post_roles

    def sees_all_messages(self, user):
        """Le rôle propriétaire (et supermaster) voit tout ; en mode
        role_filtered, les autres ne voient que leurs propres messages."""
        role = getattr(user, "role", "")
        if role == "supermaster":
            return True
        if self.visibility_mode != "role_filtered":
            return True
        return not self.allowed_roles or role in self.allowed_roles

    def can_see_message(self, user, message):
        if not self.can_view(user):
            return False
        return self.sees_all_messages(user) or message.sender_id == user.pk


class ChannelMessage(models.Model):
    channel = models.ForeignKey(
        Channel, on_delete=models.CASCADE, related_name="messages", verbose_name="Canal"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="channel_messages", verbose_name="Expéditeur"
    )
    content = models.TextField(verbose_name="Contenu")
    reply_to = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="replies", verbose_name="Réponse à"
    )
    edited = models.BooleanField(default=False, verbose_name="Modifié")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Message de canal"
        verbose_name_plural = "Messages de canaux"
        ordering = ["created_at"]

    def __str__(self):
        return f"#{self.channel.slug} — {self.sender.full_name}"


def _attachment_kind(name, mime=""):
    name = (name or "").lower()
    mime = (mime or "").lower()
    ext = name.rsplit(".", 1)[-1] if "." in name else ""
    if mime.startswith("image/") or ext in ("jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"):
        return "image"
    if mime.startswith("video/") or ext in ("mp4", "webm", "mov", "avi", "mkv"):
        return "video"
    if mime.startswith("audio/") or ext in ("mp3", "wav", "ogg", "m4a", "webm", "oga"):
        return "audio"
    if ext in ("pdf",):
        return "pdf"
    if ext in ("doc", "docx", "odt"):
        return "word"
    if ext in ("xls", "xlsx", "ods", "csv"):
        return "excel"
    if ext in ("ppt", "pptx", "odp"):
        return "powerpoint"
    if ext in ("zip", "rar", "7z", "tar", "gz"):
        return "archive"
    return "file"


class ChannelAttachment(models.Model):
    message = models.ForeignKey(
        ChannelMessage, on_delete=models.CASCADE, related_name="attachments", verbose_name="Message"
    )
    file = models.FileField(upload_to="channel_files/%Y/%m/", verbose_name="Fichier")
    original_name = models.CharField(max_length=255, verbose_name="Nom d'origine")
    size = models.PositiveIntegerField(default=0, verbose_name="Taille (octets)")
    mime = models.CharField(max_length=120, blank=True, verbose_name="Type MIME")
    kind = models.CharField(max_length=20, default="file", verbose_name="Catégorie")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Pièce jointe"
        verbose_name_plural = "Pièces jointes"

    def __str__(self):
        return self.original_name


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
    content = models.TextField(verbose_name="Contenu", blank=True)
    reply_to = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="replies", verbose_name="Réponse à"
    )
    is_read = models.BooleanField(default=False, verbose_name="Lu")
    read_at = models.DateTimeField(null=True, blank=True, verbose_name="Lu le")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        ordering = ["created_at"]

    def __str__(self):
        return f"Message de {self.sender.full_name} ({self.created_at})"


class MessageAttachment(models.Model):
    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name="attachments", verbose_name="Message"
    )
    file = models.FileField(upload_to="dm_files/%Y/%m/", verbose_name="Fichier")
    original_name = models.CharField(max_length=255, verbose_name="Nom d'origine")
    size = models.PositiveIntegerField(default=0, verbose_name="Taille (octets)")
    mime = models.CharField(max_length=120, blank=True, verbose_name="Type MIME")
    kind = models.CharField(max_length=20, default="file", verbose_name="Catégorie")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Pièce jointe (DM)"
        verbose_name_plural = "Pièces jointes (DM)"

    def __str__(self):
        return self.original_name


class MessageReaction(models.Model):
    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name="reactions", verbose_name="Message"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="dm_reactions", verbose_name="Utilisateur"
    )
    emoji = models.CharField(max_length=16, verbose_name="Émoji")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Réaction (DM)"
        verbose_name_plural = "Réactions (DM)"
        # une seule réaction par utilisateur et par message (style WhatsApp)
        unique_together = [("message", "user")]

    def __str__(self):
        return f"{self.emoji} par {self.user.full_name}"

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
