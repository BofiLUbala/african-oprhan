from django.conf import settings
from django.db import models


class DocumentType(models.Model):
    key = models.CharField(max_length=50, unique=True, verbose_name="Clé")
    label = models.CharField(max_length=255, verbose_name="Libellé")
    required = models.BooleanField(default=True, verbose_name="REQUIS")
    order = models.IntegerField(default=0, verbose_name="Ordre")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "key"]
        verbose_name = "Type de document"
        verbose_name_plural = "Types de documents"

    def __str__(self):
        return self.label


class OrphanageDocument(models.Model):
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("accepted", "Accepté"),
        ("changes_requested", "Modifications demandées"),
        ("rejected", "Refusé"),
    ]

    orphanage = models.ForeignKey("Orphanage", on_delete=models.CASCADE, related_name="submitted_documents")
    document_type = models.ForeignKey(DocumentType, on_delete=models.CASCADE, verbose_name="Type de document")
    file = models.FileField(upload_to="orphanage_docs/", verbose_name="Fichier")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="pending", verbose_name="Statut")
    feedback = models.TextField(blank=True, verbose_name="Retour")
    points_to_update = models.TextField(blank=True, verbose_name="Points à corriger")
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        verbose_name="Révisé par",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name="Révisé le")
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="Téléversé le")

    class Meta:
        ordering = ["-uploaded_at"]
        verbose_name = "Document d'orphelinat"
        verbose_name_plural = "Documents d'orphelinat"

    def __str__(self):
        return f"{self.document_type.label} - {self.orphanage.name}"


class Orphanage(models.Model):
    STATUS_CHOICES = [
        ("pending", "En attente de validation"),
        ("approved", "Validé"),
        ("rejected", "Rejeté"),
    ]

    name = models.CharField(max_length=255, verbose_name="Nom de l'orphelinat")
    address = models.TextField(verbose_name="Adresse", blank=True)
    capacity = models.IntegerField(default=0, verbose_name="Capacité d'accueil")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="pending", verbose_name="Statut")
    document_details = models.TextField(blank=True, verbose_name="Details du document")
    validation_note = models.TextField(blank=True, verbose_name="Note de validation")
    validated_at = models.DateTimeField(null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, verbose_name="Latitude")
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, verbose_name="Longitude")

    registration_cert = models.FileField(upload_to="orphanage_docs/", blank=True, null=True)
    operating_license = models.FileField(upload_to="orphanage_docs/", blank=True, null=True)
    director_id_doc = models.FileField(upload_to="orphanage_docs/", blank=True, null=True, verbose_name="Director ID document")
    tax_doc = models.FileField(upload_to="orphanage_docs/", blank=True, null=True)
    child_protection = models.FileField(upload_to="orphanage_docs/", blank=True, null=True)
    annual_report = models.FileField(upload_to="orphanage_docs/", blank=True, null=True)
    ngo_accreditation = models.FileField(upload_to="orphanage_docs/", blank=True, null=True)
    partnership_certs = models.FileField(upload_to="orphanage_docs/", blank=True, null=True)
    
    director = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="managed_orphanage",
        verbose_name="Directeur"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Orphelinat"
        verbose_name_plural = "Orphelinats"

    def __str__(self):
        return self.name
