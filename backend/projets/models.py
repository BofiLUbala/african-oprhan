import string
import random

from django.conf import settings
from django.db import models

from .constants import (
    STATUTS_CHOICES, STATUTS_PROJET,
    TYPES_PROJET_CHOICES,
    ROLES_CREATEUR_CHOICES,
    STATUTS_CANDIDATURE_CHOICES,
    MODALITES_CHOICES,
    TYPES_EVENEMENTS_CHOICES,
)


def generer_code_unique():
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=8))


class Project(models.Model):
    type = models.CharField(max_length=20, choices=TYPES_PROJET_CHOICES, verbose_name="Type")
    titre = models.CharField(max_length=255, verbose_name="Titre")
    description = models.TextField(verbose_name="Description")
    resume = models.CharField(max_length=255, blank=True, verbose_name="Résumé")

    orphelinat = models.ForeignKey(
        "orphanages.Orphanage", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="projets", verbose_name="Orphelinat",
    )
    enfant = models.ForeignKey(
        "children.Child", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="projets", verbose_name="Enfant",
    )
    source_update = models.ForeignKey(
        "children.ChildUpdate", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="projets_generes",
        verbose_name="Mise à jour d'origine",
    )

    createur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="projets_crees", verbose_name="Créateur",
    )
    createur_role = models.CharField(
        max_length=20, choices=ROLES_CREATEUR_CHOICES, verbose_name="Rôle du créateur",
    )
    ambassadeur_validateur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="projets_valides", verbose_name="Validateur",
    )

    statut = models.CharField(
        max_length=30, choices=STATUTS_CHOICES, default=STATUTS_PROJET['BROUILLON'],
        verbose_name="Statut",
    )
    motif_rejet = models.TextField(blank=True, verbose_name="Motif de rejet")
    commentaire_modification = models.TextField(blank=True, verbose_name="Commentaire de modification")

    budget_total = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Budget total")
    montant_collecte = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Montant collecté")
    beneficiaires = models.IntegerField(default=0, verbose_name="Bénéficiaires")

    date_debut = models.DateField(null=True, blank=True, verbose_name="Date de début")
    date_fin = models.DateField(null=True, blank=True, verbose_name="Date de fin")

    documents = models.JSONField(default=dict, blank=True, verbose_name="Documents")
    pdf_file = models.FileField(upload_to="projets/", blank=True, null=True, verbose_name="Fichier PDF")

    followers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="followed_projects",
        verbose_name="Followers",
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    # backward-compat aliases for existing frontend references
    @property
    def code(self):
        return f"PRJ-{self.pk:04d}" if self.pk else ""

    @property
    def title(self):
        return self.titre

    @property
    def summary(self):
        return self.resume or self.description[:80] if self.description else ""

    @property
    def amount(self):
        return self.budget_total

    @property
    def raised(self):
        return self.montant_collecte

    @property
    def start_date(self):
        return self.date_debut

    @property
    def end_date(self):
        return self.date_fin

    class Meta:
        verbose_name = "Projet"
        verbose_name_plural = "Projets"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.code} — {self.titre}"

    def peut_transitionner_vers(self, nouveau_statut):
        from .constants import TRANSITIONS_AUTORISEES
        return nouveau_statut in TRANSITIONS_AUTORISEES.get(self.statut, [])


class CandidatureProjet(models.Model):
    projet = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="candidatures", verbose_name="Projet",
    )
    partenaire = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="candidatures_projets", verbose_name="Partenaire",
    )
    montant_propose = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Montant proposé")
    modalite = models.CharField(max_length=20, choices=MODALITES_CHOICES, default='unique', verbose_name="Modalité")
    message = models.TextField(blank=True, verbose_name="Message")
    statut = models.CharField(
        max_length=30, choices=STATUTS_CANDIDATURE_CHOICES,
        default='en_attente_reponse', verbose_name="Statut",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Candidature le")

    class Meta:
        verbose_name = "Candidature"
        verbose_name_plural = "Candidatures"
        unique_together = ("projet", "partenaire")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.partenaire.full_name} -> {self.projet.code}"


class ProjetHistory(models.Model):
    projet = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="historique", verbose_name="Projet",
    )
    type_evenement = models.CharField(max_length=30, choices=TYPES_EVENEMENTS_CHOICES, verbose_name="Type d'événement")
    statut_avant = models.CharField(max_length=30, blank=True, verbose_name="Statut avant")
    statut_apres = models.CharField(max_length=30, blank=True, verbose_name="Statut après")
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="actions_projets", verbose_name="Auteur",
    )
    description = models.TextField(blank=True, verbose_name="Description")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="Métadonnées")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")

    class Meta:
        verbose_name = "Événement de projet"
        verbose_name_plural = "Événements de projet"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.type_evenement} — {self.projet.code}"
