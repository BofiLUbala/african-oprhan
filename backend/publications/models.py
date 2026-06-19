from django.conf import settings
from django.db import models


class Post(models.Model):
    POST_TYPES = [
        ("text", "Texte"),
        ("image", "Image"),
        ("video", "Vidéo"),
        ("story", "Histoire"),
    ]

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="posts",
        verbose_name="Auteur",
    )
    content = models.TextField(verbose_name="Contenu", blank=True)
    post_type = models.CharField(
        max_length=10, choices=POST_TYPES, default="text", verbose_name="Type"
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
    content = models.TextField(verbose_name="Contenu")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Commenté le")

    class Meta:
        verbose_name = "Commentaire"
        verbose_name_plural = "Commentaires"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.author.full_name} : {self.content[:50]}"


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
