from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from .models import Opportunity


def create_opportunity_for_object(instance, opp_type, title=None, description=None, **extra):
    if not title:
        title = str(instance)

    existing = Opportunity.objects.filter(
        related_object_type=ContentType.objects.get_for_model(instance),
        related_object_id=instance.pk,
    ).first()
    if existing:
        return existing

    orphanage = getattr(instance, "orphanage", None) or getattr(instance, "orphelinat", None)
    location = getattr(instance, "orphanage__address", "") or ""
    if orphanage and hasattr(orphanage, "address"):
        location = orphanage.address or ""
    elif orphanage and hasattr(orphanage, "location"):
        location = orphanage.location or ""

    opp = Opportunity.objects.create(
        type=opp_type,
        title=title[:255],
        description=(description or "")[:2000],
        summary=title[:255],
        status="published",
        priority=extra.pop("priority", "normal"),
        funding_goal=extra.pop("funding_goal", 0),
        current_funding=extra.pop("current_funding", 0),
        beneficiary_count=extra.pop("beneficiary_count", 0),
        location=location,
        deadline=extra.pop("deadline", None),
        orphanage=orphanage,
        related_object=instance,
        **extra,
    )
    return opp


# Auto-create opportunity when a Child is created
def create_child_opportunity(sender, instance, created, **kwargs):
    if not created:
        return
    create_opportunity_for_object(
        instance,
        "child",
        title=f"{instance.prenom} {instance.nom} — {instance.uid}",
        description=f"Profil de {instance.prenom} {instance.nom}, âgé de {instance.age if hasattr(instance, 'age') else '?'} ans, enregistré à l'orphelinat.",
        beneficiary_count=1,
        priority="normal",
    )


# Auto-create opportunity when a Project is approved
def create_project_opportunity(sender, instance, created, **kwargs):
    approved_statuses = ["approuve", "approved", "finance", "funded", "en_cours", "in_progress"]
    if instance.statut in approved_statuses:
        create_opportunity_for_object(
            instance,
            "project",
            title=instance.titre,
            description=instance.description,
            funding_goal=float(instance.budget_total or 0),
            current_funding=float(instance.montant_collecte or 0),
            beneficiary_count=instance.beneficiaires or 0,
            deadline=instance.date_fin,
            priority="normal",
        )


# Auto-create opportunity when a Post is published
def create_post_opportunity(sender, instance, created, **kwargs):
    if instance.status == "approved":
        create_opportunity_for_object(
            instance,
            "campaign",
            title=instance.content[:255] if instance.content else "Publication",
            description=instance.content or "",
            priority="normal",
        )
