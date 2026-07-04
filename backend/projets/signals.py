from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Project
from .views import _creer_evenement


@receiver(post_save, sender=Project)
def projet_post_save(sender, instance, created, **kwargs):
    if created:
        _creer_evenement(
            instance, 'projet_cree',
            auteur=instance.createur,
            statut_apres=instance.statut,
            description=f"Projet créé par {instance.createur.full_name}",
        )
