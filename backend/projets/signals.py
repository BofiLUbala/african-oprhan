from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .constants import STATUTS_PROJET
from .models import Project
from .views import _creer_evenement


@receiver(pre_save, sender=Project)
def projet_pre_save(sender, instance, **kwargs):
    """Mémorise le statut précédent pour détecter la transition vers 'publie'."""
    if instance.pk:
        try:
            instance._statut_avant = Project.objects.only('statut').get(pk=instance.pk).statut
        except Project.DoesNotExist:
            instance._statut_avant = None
    else:
        instance._statut_avant = None


@receiver(post_save, sender=Project)
def projet_post_save(sender, instance, created, **kwargs):
    if created:
        _creer_evenement(
            instance, 'projet_cree',
            auteur=instance.createur,
            statut_apres=instance.statut,
            description=f"Projet créé par {instance.createur.full_name}",
        )

    statut_avant = getattr(instance, '_statut_avant', None)
    vient_d_etre_publie = (
        instance.statut == STATUTS_PROJET['PUBLIE']
        and statut_avant != STATUTS_PROJET['PUBLIE']
    )
    if vient_d_etre_publie:
        _publier_projet(instance)


def _publier_projet(projet):
    """Pipeline de publication : Post Accueil + notifications.

    Réutilise les systèmes existants (publications.Post, communications.
    Notification) — aucune logique dupliquée. Idempotent : si un Post lié
    existe déjà (re-publication après suspension), rien n'est recréé.
    """
    from django.contrib.auth import get_user_model
    from publications.models import Post
    from communications.models import Notification

    User = get_user_model()

    post = None
    if not Post.objects.filter(project=projet).exists():
        type_label = {
            'enfant': "Projet Enfant",
            'orphelinat': "Projet Orphelinat",
            'federation': "Projet Fédération",
        }.get(projet.type, "Projet")
        post = Post.objects.create(
            author=projet.createur,
            content=f"{type_label} — {projet.titre}\n\n{projet.description or projet.resume}",
            post_type='text',
            audience='public',
            status='approved',
            child=projet.enfant,
            project=projet,
        )

    destinataires = User.objects.filter(role__in=['federation', 'supermaster'])
    if projet.createur:
        destinataires = destinataires | User.objects.filter(pk=projet.createur.pk)
    if projet.orphelinat and projet.orphelinat.director:
        destinataires = destinataires | User.objects.filter(pk=projet.orphelinat.director.pk)
    if projet.enfant:
        from children.models import ChildAssignment
        ambassadeur_ids = ChildAssignment.objects.filter(
            child=projet.enfant
        ).values_list('ambassador_id', flat=True)
        destinataires = destinataires | User.objects.filter(pk__in=ambassadeur_ids)

    link = f"/posts/{post.pk}" if post else ""
    for user in destinataires.distinct():
        Notification.objects.create(
            user=user,
            title=f"Nouveau projet publié : {projet.titre}",
            content=(
                f"Type : {projet.get_type_display()}\n"
                f"Créé par : {projet.createur.full_name} ({projet.get_createur_role_display()})\n"
                f"Budget : {projet.budget_total}"
            ),
            link=link,
        )
