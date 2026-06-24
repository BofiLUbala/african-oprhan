import uuid
from django.conf import settings
from django.db import models


class Project(models.Model):
    PROJECT_TYPES = [
        ("enfant", "Pour un enfant"),
        ("orphelinat", "Pour l'orphelinat"),
        ("federation", "Pour la fédération"),
    ]
    STATUS_CHOICES = [
        ("open", "Ouvert"),
        ("funded", "Financé"),
        ("completed", "Terminé"),
    ]

    code = models.CharField(max_length=8, unique=True, verbose_name="Code")
    type = models.CharField(max_length=20, choices=PROJECT_TYPES, verbose_name="Type")
    title = models.CharField(max_length=255, verbose_name="Titre")
    summary = models.CharField(max_length=255, blank=True, verbose_name="Résumé")
    description = models.TextField(verbose_name="Description")
    pdf_url = models.TextField(blank=True, verbose_name="PDF (base64 ou URL)")
    pdf_file = models.FileField(upload_to="projets/", blank=True, null=True, verbose_name="Fichier PDF")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open", verbose_name="Statut")
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Budget")
    raised = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Collecté")
    beneficiaries = models.IntegerField(default=0, verbose_name="Bénéficiaires")
    start_date = models.DateField(null=True, blank=True, verbose_name="Date de début")
    end_date = models.DateField(null=True, blank=True, verbose_name="Date de fin")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects",
        verbose_name="Créé par",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    class Meta:
        verbose_name = "Projet"
        verbose_name_plural = "Projets"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.code} — {self.title}"


class ProjectApplication(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="applications", verbose_name="Projet"
    )
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_applications",
        verbose_name="Candidat",
    )
    message = models.TextField(blank=True, verbose_name="Message")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Candidature le")

    class Meta:
        verbose_name = "Candidature"
        verbose_name_plural = "Candidatures"
        unique_together = ("project", "applicant")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.applicant.full_name} → {self.project.code}"
