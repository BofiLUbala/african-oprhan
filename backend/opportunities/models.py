from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class Opportunity(models.Model):
    OPPORTUNITY_TYPES = [
        ("child", "Profil Enfant"),
        ("project", "Projet de Financement"),
        ("orphanage_need", "Besoin Orphelinat"),
        ("campaign", "Campagne Fédération"),
        ("emergency", "Urgence"),
        ("education", "Éducation"),
        ("healthcare", "Santé"),
    ]

    STATUS_CHOICES = [
        ("draft", "Brouillon"),
        ("published", "Publié"),
        ("funding", "En recherche de financement"),
        ("in_progress", "En cours"),
        ("completed", "Terminé"),
        ("expired", "Expiré"),
    ]

    PRIORITY_CHOICES = [
        ("normal", "Normale"),
        ("urgent", "Urgente"),
        ("critical", "Critique"),
    ]

    type = models.CharField(max_length=30, choices=OPPORTUNITY_TYPES, verbose_name="Type d'opportunité")
    title = models.CharField(max_length=255, verbose_name="Titre")
    description = models.TextField(blank=True, verbose_name="Description")
    summary = models.CharField(max_length=255, blank=True, verbose_name="Résumé")
    image = models.ImageField(upload_to="opportunities/", blank=True, null=True, verbose_name="Image")
    images = models.JSONField(default=list, blank=True, verbose_name="Images supplémentaires")
    videos = models.JSONField(default=list, blank=True, verbose_name="Vidéos")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="published", verbose_name="Statut")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="normal", verbose_name="Priorité")

    funding_goal = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Objectif de financement")
    current_funding = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Financement actuel")
    beneficiary_count = models.IntegerField(default=0, verbose_name="Nombre de bénéficiaires")

    location = models.CharField(max_length=255, blank=True, verbose_name="Localisation")
    deadline = models.DateField(null=True, blank=True, verbose_name="Date limite")
    tags = models.JSONField(default=list, blank=True, verbose_name="Étiquettes")

    related_object_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    related_object_id = models.PositiveIntegerField(null=True, blank=True)
    related_object = GenericForeignKey("related_object_type", "related_object_id")

    orphanage = models.ForeignKey(
        "orphanages.Orphanage", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="opportunities", verbose_name="Orphelinat"
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="opportunities_created", verbose_name="Créé par"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    class Meta:
        verbose_name = "Opportunité"
        verbose_name_plural = "Opportunités"
        ordering = ["-priority", "-created_at"]
        indexes = [
            models.Index(fields=["type", "status"]),
            models.Index(fields=["priority", "status"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"[{self.get_type_display()}] {self.title}"

    @property
    def funding_percentage(self):
        if self.funding_goal > 0:
            return min(100, int((self.current_funding / self.funding_goal) * 100))
        return 0

    @property
    def is_urgent(self):
        return self.priority in ("urgent", "critical")
