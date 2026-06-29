from django.conf import settings
from django.db import models

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
