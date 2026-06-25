from django.conf import settings
from django.db import models

class Need(models.Model):
    CATEGORY_CHOICES = [
        ("alimentation", "Alimentation"),
        ("sante", "Santé"),
        ("education", "Éducation"),
        ("infrastructures", "Infrastructures"),
        ("energie", "Énergie"),
        ("eau", "Eau"),
    ]
    PRIORITY_CHOICES = [
        ("critique", "Urgence critique"),
        ("haute", "Haute priorité"),
        ("moyenne", "Priorité moyenne"),
        ("faible", "Faible priorité"),
    ]
    STATUS_CHOICES = [
        ("open", "Ouvert"),
        ("fulfilled", "Comblé"),
    ]

    orphanage = models.ForeignKey(
        "orphanages.Orphanage",
        on_delete=models.CASCADE,
        related_name="needs",
        verbose_name="Orphelinat"
    )
    title = models.CharField(max_length=255, verbose_name="Titre du besoin")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, verbose_name="Catégorie")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, verbose_name="Priorité")
    description = models.TextField(verbose_name="Description", blank=True)
    quantity = models.CharField(max_length=100, blank=True, verbose_name="Quantité (ex: 50 kg, 2 boîtes)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open", verbose_name="Statut")
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Créé par"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Besoin"
        verbose_name_plural = "Besoins"

    def __str__(self):
        return f"[{self.get_category_display()}] {self.title}"
