from django.conf import settings
from django.db import models


class Post(models.Model):
    POST_TYPES = [
        ("text", "Texte"),
        ("image", "Image"),
        ("video", "Vidéo"),
        ("story", "Histoire"),
    ]

    AUDIENCE_CHOICES = [
        ("public", "Public"),
        ("ambassador", "Ambassadeur"),
        ("director", "Chef d'orphelinat"),
        ("federation", "Chef de confederation"),
    ]
    STATUS_CHOICES = [
        ("pending", "En attente de validation"),
        ("approved", "Approuvé"),
        ("rejected", "Refusé"),
        ("needs_changes", "Modifications demandées"),
    ]

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="posts",
        verbose_name="Auteur",
    )
    review_ambassador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="posts_to_review",
        limit_choices_to={"role": "ambassador"},
        verbose_name="Ambassadeur validateur",
    )
    content = models.TextField(verbose_name="Contenu", blank=True)
    post_type = models.CharField(
        max_length=10, choices=POST_TYPES, default="text", verbose_name="Type"
    )
    audience = models.CharField(
        max_length=20, choices=AUDIENCE_CHOICES, default="public", verbose_name="Audience"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="approved", verbose_name="Statut"
    )
    rejection_reason = models.TextField(blank=True, verbose_name="Raison du refus")
    child = models.ForeignKey(
        "children.Child",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="posts",
        verbose_name="Enfant concerné"
    )
    location = models.CharField(
        max_length=200, blank=True, verbose_name="Localisation"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    class Meta:
        verbose_name = "Publication"
        verbose_name_plural = "Publications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.author.full_name} - {self.get_post_type_display()} ({self.created_at:%d/%m/%Y})"

    @property
    def likes_count(self):
        return self.likes.count()

    @property
    def comments_count(self):
        return self.comments.count()

    @property
    def views_count(self):
        return self.views.count()

    @property
    def dislikes_count(self):
        return self.dislikes.count()

    @property
    def shares_count(self):
        return self.shares.count()


class PostMedia(models.Model):
    MEDIA_TYPES = [
        ("image", "Image"),
        ("video", "Vidéo"),
    ]

    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="media", verbose_name="Publication"
    )
    file = models.FileField(
        upload_to="posts/", verbose_name="Fichier", blank=True, null=True
    )
    media_type = models.CharField(
        max_length=10, choices=MEDIA_TYPES, verbose_name="Type de média"
    )
    url = models.URLField(blank=True, verbose_name="URL externe")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Média"
        verbose_name_plural = "Médias"

    def __str__(self):
        return f"{self.get_media_type_display()} #{self.pk}"


class PostView(models.Model):
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="views", verbose_name="Publication"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="post_views",
        verbose_name="Utilisateur",
    )
    viewed_at = models.DateTimeField(auto_now_add=True, verbose_name="Vu le")

    class Meta:
        verbose_name = "Vue"
        verbose_name_plural = "Vues"
        unique_together = ("post", "user")

    def __str__(self):
        return f"{self.user.full_name} a vu #{self.post.pk}"


class PostLike(models.Model):
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="likes", verbose_name="Publication"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="post_likes",
        verbose_name="Utilisateur",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Aimé le")

    class Meta:
        verbose_name = "J'aime"
        verbose_name_plural = "J'aime"
        unique_together = ("post", "user")

    def __str__(self):
        return f"{self.user.full_name} aime #{self.post.pk}"


class PostDislike(models.Model):
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="dislikes", verbose_name="Publication"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="post_dislikes",
        verbose_name="Utilisateur",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Détesté le")

    class Meta:
        verbose_name = "Je n'aime pas"
        verbose_name_plural = "Je n'aime pas"
        unique_together = ("post", "user")

    def __str__(self):
        return f"{self.user.full_name} n'aime pas #{self.post.pk}"


class Comment(models.Model):
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="comments",
        verbose_name="Publication",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comments",
        verbose_name="Auteur",
    )
    content = models.TextField(verbose_name="Contenu", blank=True)
    edited = models.BooleanField(default=False, verbose_name="Modifié")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Commenté le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    class Meta:
        verbose_name = "Commentaire"
        verbose_name_plural = "Commentaires"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.author.full_name} : {self.content[:50]}"


def _comment_attachment_kind(name, mime=""):
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


class CommentAttachment(models.Model):
    comment = models.ForeignKey(
        Comment, on_delete=models.CASCADE, related_name="attachments", verbose_name="Commentaire"
    )
    file = models.FileField(upload_to="comment_files/%Y/%m/", verbose_name="Fichier")
    original_name = models.CharField(max_length=255, verbose_name="Nom d'origine")
    size = models.PositiveIntegerField(default=0, verbose_name="Taille (octets)")
    mime = models.CharField(max_length=120, blank=True, verbose_name="Type MIME")
    kind = models.CharField(max_length=20, default="file", verbose_name="Catégorie")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Pièce jointe (commentaire)"
        verbose_name_plural = "Pièces jointes (commentaires)"

    def __str__(self):
        return self.original_name


class PostShare(models.Model):
    """Traçabilité des partages d'une publication (analytics + qui a partagé)."""
    METHOD_CHOICES = [
        ("copy", "Lien copié"), ("internal", "Partage interne"), ("email", "E-mail"),
        ("whatsapp", "WhatsApp"), ("telegram", "Telegram"), ("facebook", "Facebook"),
        ("linkedin", "LinkedIn"), ("x", "X (Twitter)"),
    ]
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="shares", verbose_name="Publication"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="post_shares", verbose_name="Utilisateur"
    )
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default="copy", verbose_name="Méthode")
    destination = models.CharField(max_length=120, blank=True, verbose_name="Destination")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Partagé le")

    class Meta:
        verbose_name = "Partage"
        verbose_name_plural = "Partages"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.full_name} a partagé #{self.post_id} ({self.method})"


class Story(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="stories",
        verbose_name="Auteur",
    )
    media = models.FileField(
        upload_to="stories/", verbose_name="Média", blank=True, null=True
    )
    media_url = models.URLField(blank=True, verbose_name="URL du média")
    caption = models.TextField(blank=True, verbose_name="Légende")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    expires_at = models.DateTimeField(verbose_name="Expire le")

    class Meta:
        verbose_name = "Histoire"
        verbose_name_plural = "Histoires"
        ordering = ["-created_at"]

    @property
    def views_count(self):
        return self.story_views.count()

    def __str__(self):
        return f"Histoire de {self.author.full_name}"


class StoryView(models.Model):
    story = models.ForeignKey(
        Story, on_delete=models.CASCADE, related_name="story_views", verbose_name="Histoire"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="story_views",
        verbose_name="Utilisateur",
    )
    viewed_at = models.DateTimeField(auto_now_add=True, verbose_name="Vu le")

    class Meta:
        verbose_name = "Vue d'histoire"
        verbose_name_plural = "Vues d'histoires"
        unique_together = ("story", "user")

    def __str__(self):
        return f"{self.user.full_name} a vu l'histoire #{self.story.pk}"
