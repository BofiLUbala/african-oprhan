from datetime import timedelta
from django.utils import timezone
from django.db.models import Q

from .models import Child, ChildHistory
from .constants import CLASSIFICATION_EVENEMENTS
from communications.models import Notification


def notifier_evenement_critique(event):
    """Notifie le Directeur et la Fédération pour tout événement CRITIQUE."""
    from django.contrib.auth import get_user_model
    User = get_user_model()

    destinataires = User.objects.filter(role__in=['director', 'federation', 'supermaster'])
    if event.child.orphanage and event.child.orphanage.director:
        destinataires = destinataires | User.objects.filter(pk=event.child.orphanage.director.pk)

    for user in destinataires.distinct():
        Notification.objects.create(
            user=user,
            title=f"Événement critique : {event.title}",
            content=(
                f"Enfant : {event.child.prenom} {event.child.nom} ({event.child.uid})\n"
                f"Type : {event.event_type}\n"
                f"Description : {event.description}\n"
                f"Date : {event.event_date.strftime('%d/%m/%Y %H:%M')}"
            ),
            link="",
        )


def verifier_inactivite_sante(mois_inactivite=3):
    """Alerte pour les enfants sans événement SANTE depuis N mois."""
    seuil = timezone.now() - timedelta(days=30 * mois_inactivite)
    enfants_inactifs = Child.objects.filter(
        status__in=['active', 'healthy', 'enrolled'],
    ).exclude(
        history__category='health',
        history__event_date__gte=seuil,
    ).distinct()

    for enfant in enfants_inactifs:
        Notification.objects.create(
            user=enfant.created_by,
            title=f"Inactivité santé : {enfant.prenom} {enfant.nom}",
            content=(
                f"Aucun événement de santé enregistré depuis {mois_inactivite} mois "
                f"pour {enfant.prenom} {enfant.nom} ({enfant.uid})."
            ),
            link="",
        )


def verifier_rappel_vaccins():
    """Vérifie les dates de prochains vaccins dans extra_data."""
    maintenant = timezone.now().date()
    dans_30_jours = maintenant + timedelta(days=30)

    for child in Child.objects.filter(extra_data__medical__vaccinations__isnull=False):
        vaccinations = child.extra_data.get('medical', {}).get('vaccinations', [])
        for vax in vaccinations:
            date_rappel = vax.get('date_rappel')
            if date_rappel:
                try:
                    from datetime import datetime as dt
                    rappel = dt.strptime(date_rappel, '%Y-%m-%d').date()
                    if maintenant <= rappel <= dans_30_jours:
                        Notification.objects.create(
                            user=child.created_by,
                            title=f"Rappel vaccin : {child.prenom} {child.nom}",
                            content=(
                                f"Le vaccin « {vax.get('nom', 'N/A')} » nécessite un rappel "
                                f"le {date_rappel} pour {child.prenom} {child.nom} ({child.uid})."
                            ),
                            link="",
                        )
                except (ValueError, TypeError):
                    pass
