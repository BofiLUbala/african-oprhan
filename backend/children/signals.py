import json

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

from .constants import CLASSIFICATION_EVENEMENTS, EVENEMENTS_VALIDATION_REQUISE
from .current_user import get_current_user
from .models import Child, ChildHistory, ChildUpdate


def _resoudre_auteur(instance, auteur=None):
    if auteur:
        return auteur
    user = get_current_user()
    if user and user.is_authenticated:
        return user
    if hasattr(instance, 'created_by') and instance.created_by:
        return instance.created_by
    return None


def _creer_evenement(child, event_type, performed_by=None, old_value="", new_value="",
                     title="", description="", reason="", status_before="",
                     status_after="", note="", source_module="", metadata=None,
                     linked_update=None, force_category=None, subcategory=""):
    classification = CLASSIFICATION_EVENEMENTS.get(event_type, {})
    categorie = force_category or classification.get('categorie', 'SYSTEME')
    priorite = classification.get('priorite', 'INFO')
    module = classification.get('module', source_module or 'system')

    auteur = _resoudre_auteur(child, performed_by)

    sensibilite = 'CONFIDENTIEL' if categorie in ('FAMILLE',) and event_type in (
        'adoption_progress', 'foster_placement', 'family_reunified'
    ) else 'RESTREINT' if categorie == 'SANTE' else 'PUBLIC'

    statut = 'EN_ATTENTE' if event_type in EVENEMENTS_VALIDATION_REQUISE else 'AUTO_VALIDE'

    mapping_categorie = {
        'SANTE': 'health', 'SCOLARITE': 'education', 'FAMILLE': 'family',
        'DOCUMENTS': 'documents', 'SOCIAL': 'social', 'SYSTEME': 'system',
        'HEALTH': 'health', 'EDUCATION': 'education', 'FAMILY': 'family',
        'DOCUMENTS': 'documents', 'SOCIAL': 'social',
    }
    mapping_priorite = {'INFO': 'low', 'IMPORTANT': 'high', 'CRITIQUE': 'critical'}

    ChildHistory.objects.create(
        child=child,
        event_type=event_type,
        category=mapping_categorie.get(categorie, 'general'),
        subcategory=subcategory,
        title=title or classification.get('module', 'Événement'),
        description=description or "",
        old_value=str(old_value) if old_value else "",
        new_value=str(new_value) if new_value else "",
        status_before=status_before or "",
        status_after=status_after or "",
        reason=reason or "",
        note=note or "",
        priority=mapping_priorite.get(priorite, 'normal'),
        source_module=module,
        performed_by=auteur,
        performed_role=auteur.role if auteur else "",
        niveau_sensibilite=sensibilite,
        statut_validation=statut,
        metadata=metadata or {},
        linked_update=linked_update,
        event_date=timezone.now(),
    )


@receiver(post_save, sender=Child)
def child_post_save(sender, instance, created, raw, **kwargs):
    if raw:
        return
    if created:
        _creer_evenement(
            child=instance,
            event_type='created',
            title='Enfant créé',
            description=f"Profil de {instance.prenom} {instance.nom} créé",
            new_value=instance.status,
        )


@receiver(pre_save, sender=Child)
def child_pre_save(sender, instance, **kwargs):
    if instance.pk is None:
        return
    try:
        old = Child.objects.get(pk=instance.pk)
    except Child.DoesNotExist:
        return

    if old.status != instance.status:
        priorites = {'critical': ['hospitalized', 'missing', 'deceased'],
                     'high': ['at_risk', 'sick', 'transferred']}
        prio_map = {'critical': 'critical', 'high': 'high'}
        prio = 'normal'
        for p, statuses in priorites.items():
            if instance.status in statuses:
                prio = prio_map[p]
                break
        status_labels = dict(Child.STATUS_CHOICES)
        _creer_evenement(
            child=instance,
            event_type='status_change',
            old_value=old.status,
            new_value=instance.status,
            status_before=old.status,
            status_after=instance.status,
            title=f"Statut changé : {status_labels.get(old.status, old.status)} vers {status_labels.get(instance.status, instance.status)}",
            description=f"Statut passé de « {old.status} » à « {instance.status} »",
            source_module='status',
            metadata={'priorite_calculee': prio},
        )

    tracked_fields = ['nom', 'prenom', 'sexe', 'nationalite', 'date_naissance',
                      'adresse', 'orphanage']
    for field in tracked_fields:
        old_val = getattr(old, field, "")
        new_val = getattr(instance, field, "")
        old_str = str(old_val) if old_val is not None else ""
        new_str = str(new_val) if new_val is not None else ""
        if old_str != new_str:
            field_label = field.replace('_', ' ').title()
            if field == 'orphanage':
                old_val = old_val.name if old_val else ""
                new_val = new_val.name if new_val else ""
                field_label = "Orphelinat"
            _creer_evenement(
                child=instance,
                event_type='updated',
                title=f"{field_label} modifié",
                description=f"Champ « {field_label} » modifié",
                old_value=str(old_val) if old_val else "",
                new_value=str(new_val) if new_val else "",
                source_module='child_profile',
            )

    if old.extra_data != instance.extra_data:
        _creer_evenement(
            child=instance,
            event_type='updated',
            title="Données supplémentaires modifiées",
            description="Les données supplémentaires (extra_data) ont été modifiées",
            source_module='child_profile',
            metadata={
                'champs_ajoutes': [k for k in (instance.extra_data or {}) if k not in (old.extra_data or {})],
                'champs_retires': [k for k in (old.extra_data or {}) if k not in (instance.extra_data or {})],
            },
        )

    if old.photo != instance.photo:
        old_photo_name = old.photo.name if old.photo else ""
        new_photo_name = instance.photo.name if instance.photo else ""
        _creer_evenement(
            child=instance,
            event_type='updated',
            title="Photo modifiée",
            description="La photo de profil a été modifiée",
            old_value=old_photo_name,
            new_value=new_photo_name,
            source_module='child_profile',
        )


@receiver(post_save, sender=ChildUpdate)
def child_update_post_save(sender, instance, created, **kwargs):
    if not created:
        return

    # Parse new_value as JSON to get per-field data
    try:
        fields_data = json.loads(instance.new_value) if instance.new_value else {}
    except (json.JSONDecodeError, TypeError):
        fields_data = {}

    try:
        prev_data = json.loads(instance.previous_value) if instance.previous_value else {}
    except (json.JSONDecodeError, TypeError):
        prev_data = {}

    if fields_data and isinstance(fields_data, dict):
        # Create one immutable history record per changed field
        for field_key, new_val in fields_data.items():
            old_val = prev_data.get(field_key, '')
            field_label = field_key.replace('_', ' ').title()
            _creer_evenement(
                child=instance.child,
                event_type='update_added',
                performed_by=instance.created_by,
                title=field_label,
                description=f"{instance.update_type}: {field_label}",
                old_value=str(old_val) if old_val else "",
                new_value=str(new_val) if new_val else "",
                reason=instance.reason or "",
                source_module='update_center',
                force_category=instance.category.upper(),
                subcategory=instance.update_type,
                metadata={
                    'categorie_update': instance.category,
                    'type_update': instance.update_type,
                    'field_key': field_key,
                },
                linked_update=instance,
            )
    else:
        # Fallback: single record per update (backward compat for non-JSON data)
        _creer_evenement(
            child=instance.child,
            event_type='update_added',
            performed_by=instance.created_by,
            title=instance.title,
            description=instance.description or "",
            old_value=instance.previous_value or "",
            new_value=instance.new_value or "",
            reason=instance.reason or "",
            source_module='update_center',
            force_category=instance.category.upper(),
            subcategory=instance.update_type,
            metadata={'categorie_update': instance.category,
                      'type_update': instance.update_type},
            linked_update=instance,
        )



