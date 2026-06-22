from django.conf import settings
from django.db import models


class Child(models.Model):
    SEXE_CHOICES = [
        ("M", "Masculin"),
        ("F", "Féminin"),
    ]

    uid = models.CharField(max_length=12, unique=True, editable=False, verbose_name="UID")
    nom = models.CharField(max_length=100, blank=True, default="", verbose_name="Nom")
    prenom = models.CharField(max_length=100, blank=True, default="", verbose_name="Prénom")
    sexe = models.CharField(max_length=1, choices=SEXE_CHOICES, blank=True, default="", verbose_name="Sexe")
    date_naissance = models.DateField(null=True, blank=True, verbose_name="Date de naissance")
    nationalite = models.CharField(max_length=100, blank=True, default="", verbose_name="Nationalité")
    photo = models.ImageField(upload_to="enfants/", blank=True, null=True, verbose_name="Photo")
    adresse = models.TextField(blank=True, verbose_name="Adresse d'origine")
    extra_data = models.JSONField(default=dict, blank=True, verbose_name="Données supplémentaires")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="enfants",
        verbose_name="Créé par",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    class Meta:
        verbose_name = "Enfant"
        verbose_name_plural = "Enfants"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.uid})"
