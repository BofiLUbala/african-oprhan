from django.conf import settings
from django.db import models

class Sponsorship(models.Model):
    SPONSORSHIP_TYPES = [
        ("monthly", "Mensuel"),
        ("annual", "Annuel"),
    ]
    STATUS_CHOICES = [
        ("active", "Actif"),
        ("paused", "En pause"),
        ("cancelled", "Annulé"),
    ]

    sponsor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sponsorships",
        verbose_name="Parrain/Marraine"
    )
    child = models.ForeignKey(
        "children.Child",
        on_delete=models.CASCADE,
        related_name="sponsorships",
        verbose_name="Enfant parrainé"
    )
    sponsorship_type = models.CharField(max_length=20, choices=SPONSORSHIP_TYPES, default="monthly", verbose_name="Type")
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Montant")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active", verbose_name="Statut")
    start_date = models.DateField(auto_now_add=True, verbose_name="Date de début")
    end_date = models.DateField(null=True, blank=True, verbose_name="Date de fin")

    class Meta:
        verbose_name = "Parrainage"
        verbose_name_plural = "Parrainages"
        unique_together = ("sponsor", "child")

    def __str__(self):
        return f"{self.sponsor.full_name} parraine {self.child.prenom} {self.child.nom}"

class SponsorshipPayment(models.Model):
    sponsorship = models.ForeignKey(
        Sponsorship,
        on_delete=models.CASCADE,
        related_name="payments",
        verbose_name="Parrainage"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Montant")
    date = models.DateTimeField(auto_now_add=True, verbose_name="Date du paiement")
    transaction_id = models.CharField(max_length=255, blank=True, verbose_name="Numéro de transaction")

    class Meta:
        verbose_name = "Paiement de parrainage"
        verbose_name_plural = "Paiements de parrainage"
        ordering = ["-date"]

    def __str__(self):
        return f"Paiement de {self.amount} pour {self.sponsorship}"
