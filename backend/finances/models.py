from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
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
    child = models.ForeignKey(
        "children.Child",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="donations",
        verbose_name="Enfant bénéficiaire"
    )
    project = models.ForeignKey(
        "projets.Project",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="donations",
        verbose_name="Projet bénéficiaire"
    )
    linked_transaction = models.ForeignKey(
        "Transaction",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="donations",
        verbose_name="Transaction liée"
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


class PaymentProvider(models.Model):
    PROVIDER_CHOICES = [
        ("visa", "Visa"),
        ("mastercard", "Mastercard"),
        ("mpesa", "M-Pesa"),
        ("airtel_money", "Airtel Money"),
        ("orange_money", "Orange Money"),
        ("mtn_money", "MTN Mobile Money"),
    ]

    name = models.CharField(max_length=50, choices=PROVIDER_CHOICES, unique=True, verbose_name="Provider")
    display_name = models.CharField(max_length=100, verbose_name="Nom affiché")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    config = models.JSONField(default=dict, blank=True, verbose_name="Configuration")
    sort_order = models.IntegerField(default=0, verbose_name="Ordre")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Fournisseur de paiement"
        verbose_name_plural = "Fournisseurs de paiement"
        ordering = ["sort_order"]

    def __str__(self):
        return self.get_name_display()


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ("donation", "Don"),
        ("sponsorship", "Parrainage"),
        ("project_financing", "Financement de projet"),
        ("healthcare", "Santé"),
        ("education", "Éducation"),
    ]

    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("processing", "En cours"),
        ("completed", "Complété"),
        ("failed", "Échoué"),
        ("refunded", "Remboursé"),
    ]

    PAYMENT_METHOD_CHOICES = [
        ("card", "Carte bancaire"),
        ("mobile_money", "Mobile Money"),
        ("bank_transfer", "Virement bancaire"),
    ]

    payer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="transactions",
        verbose_name="Payeur",
    )

    transaction_type = models.CharField(
        max_length=30, choices=TRANSACTION_TYPES, verbose_name="Type de transaction"
    )

    beneficiary_content_type = models.ForeignKey(
        ContentType, on_delete=models.SET_NULL, null=True, blank=True
    )
    beneficiary_object_id = models.PositiveIntegerField(null=True, blank=True)
    beneficiary = GenericForeignKey("beneficiary_content_type", "beneficiary_object_id")

    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Montant")
    currency = models.CharField(max_length=10, default="USD", verbose_name="Devise")

    payment_method = models.CharField(
        max_length=20, choices=PAYMENT_METHOD_CHOICES, verbose_name="Méthode de paiement"
    )
    payment_provider = models.ForeignKey(
        PaymentProvider, on_delete=models.SET_NULL, null=True, verbose_name="Provider"
    )

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pending", verbose_name="Statut"
    )

    reference_number = models.CharField(
        max_length=255, unique=True, verbose_name="Numéro de référence"
    )
    provider_reference = models.CharField(
        max_length=255, blank=True, verbose_name="Référence fournisseur"
    )

    description = models.TextField(blank=True, verbose_name="Description")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="Métadonnées")

    orphanage = models.ForeignKey(
        "orphanages.Orphanage",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
        verbose_name="Orphelinat",
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="Complété le")

    class Meta:
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["payer", "-created_at"]),
            models.Index(fields=["transaction_type", "status"]),
            models.Index(fields=["reference_number"]),
            models.Index(fields=["beneficiary_content_type", "beneficiary_object_id"]),
        ]

    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.amount} {self.currency} ({self.reference_number})"
