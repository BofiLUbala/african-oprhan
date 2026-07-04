from django.conf import settings
from django.db import models

class Donation(models.Model):
    DONATION_TYPES = [
        ("financier", "Financier"),
        ("materiel", "Matériel"),
        ("service", "Service"),
    ]
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("completed", "Complété"),
        ("failed", "Échoué"),
    ]

    donator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="donations",
        verbose_name="Donateur"
    )
    donation_type = models.CharField(max_length=20, choices=DONATION_TYPES, verbose_name="Type de don")
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Montant")
    currency = models.CharField(max_length=10, default="USD", verbose_name="Devise")
    description = models.TextField(blank=True, verbose_name="Description (matériel/service)")
    transaction_id = models.CharField(max_length=255, blank=True, verbose_name="Numéro de transaction")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="completed", verbose_name="Statut")
    orphanage = models.ForeignKey(
        "orphanages.Orphanage",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="donations_received",
        verbose_name="Orphelinat bénéficiaire"
    )
    date = models.DateTimeField(auto_now_add=True, verbose_name="Date")

    class Meta:
        verbose_name = "Don"
        verbose_name_plural = "Dons"

    def __str__(self):
        return f"{self.donation_type} - {self.amount} {self.currency}"

class Income(models.Model):
    source = models.CharField(max_length=255, verbose_name="Source (Dons, Subventions...)")
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Montant")
    date = models.DateField(auto_now_add=True)
    orphanage = models.ForeignKey("orphanages.Orphanage", on_delete=models.SET_NULL, null=True, blank=True)

class Expense(models.Model):
    category = models.CharField(max_length=100, verbose_name="Catégorie (Alimentation, Santé...)")
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Montant")
    description = models.TextField(blank=True)
    date = models.DateField(auto_now_add=True)
    orphanage = models.ForeignKey("orphanages.Orphanage", on_delete=models.SET_NULL, null=True, blank=True)
