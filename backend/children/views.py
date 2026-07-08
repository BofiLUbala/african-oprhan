import string
import random
from datetime import datetime

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

import hashlib
import json
from collections import defaultdict

from django.http import HttpResponse
from django.template.loader import render_to_string

from .models import Child, ChildUpdate, ChildHistory, ChildAssignment, ConsultationHistorique, FichierJoint
from .serializers import (
    ChildSerializer,
    ChildPublicSerializer,
    ChildUpdateSerializer,
    ChildHistorySerializer,
    ChildHistoryCreateSerializer,
    CorrectionSerializer,
    ValidationSerializer,
    ConsultationHistoriqueSerializer,
    ChildAssignmentSerializer,
)
from .permissions import (
    filtrer_historique_par_role,
    PeutCreerHistoriqueManuel,
    PeutValiderHistorique,
    PeutVoirConsultations,
)
from .filters import ChildHistoryFilter
from .constants import CLASSIFICATION_EVENEMENTS, EVENEMENTS_VALIDATION_REQUISE


def _gen_uid():
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=12))


# ── Child CRUD ──

@api_view(["GET", "POST"])
def child_list(request):
    if request.method == "GET":
        user = request.user
        if user.role in ("federation", "supermaster"):
            enfants = Child.objects.select_related("orphanage").all().order_by("-created_at")
            orphanage_id = request.query_params.get("orphanage_id")
            if orphanage_id:
                enfants = enfants.filter(
                    Q(orphanage_id=orphanage_id) |
                    Q(created_by__managed_orphanage__id=orphanage_id)
                )
        elif user.role == "ambassador":
            enfants = Child.objects.filter(
                assignments__ambassador=user
            ).select_related("orphanage").order_by("-created_at")
        else:
            enfants = Child.objects.filter(created_by=user).order_by("-created_at")
        search = request.query_params.get('search', '').strip()
        if search:
            enfants = enfants.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(uid__icontains=search)
            )
        serializer = ChildSerializer(enfants, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        uid = request.data.get("uid", "")
        if not uid or len(uid) < 8:
            uid = _gen_uid()
        for _ in range(10):
            if not Child.objects.filter(uid=uid).exists():
                break
            uid = _gen_uid()
        for attempt in range(10):
            data = request.data.dict() if hasattr(request.data, 'dict') else {**request.data}
            data["uid"] = uid
            if not data.get("orphanage") and request.user.role == "director":
                try:
                    if request.user.managed_orphanage:
                        data["orphanage"] = request.user.managed_orphanage.id
                except Exception:
                    pass
            serializer = ChildSerializer(data=data, context={"request": request})
            if serializer.is_valid():
                try:
                    enfant = serializer.save()
                    return Response(ChildSerializer(enfant).data, status=status.HTTP_201_CREATED)
                except IntegrityError:
                    uid = _gen_uid()
                    continue
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {"error": "Impossible de générer un UID unique"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    return Response({"error": "Méthode non autorisée"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(["GET"])
@permission_classes([AllowAny])
def child_public_list(request):
    enfants = Child.objects.all().order_by("?")[:30]
    serializer = ChildPublicSerializer(enfants, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET", "PUT", "DELETE"])
def child_detail(request, child_id):
    try:
        enfant = Child.objects.get(pk=child_id, created_by=request.user)
    except Child.DoesNotExist:
        return Response(
            {"error": "Enfant introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        serializer = ChildSerializer(enfant)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = ChildSerializer(
            enfant, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            enfant = serializer.save()
            return Response(ChildSerializer(enfant).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        from children.signals import _creer_evenement
        _creer_evenement(
            child=enfant,
            event_type='child_archived',
            title="Enfant supprimé",
            description=f"Profil de {enfant.prenom} {enfant.nom} ({enfant.uid}) supprimé du système",
            source_module='system',
        )
        enfant.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Child Updates ──

@api_view(["GET", "POST"])
def child_update_list(request, child_id):
    try:
        enfant = Child.objects.get(pk=child_id)
    except Child.DoesNotExist:
        return Response(
            {"error": "Enfant introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        category = request.query_params.get("category", "")
        update_type = request.query_params.get("update_type", "")
        search = request.query_params.get("search", "")
        sort = request.query_params.get("sort", "-created_at")
        updates = ChildUpdate.objects.filter(child=enfant)
        if category:
            updates = updates.filter(category=category)
        if update_type:
            updates = updates.filter(update_type=update_type)
        if search:
            updates = updates.filter(
                Q(title__icontains=search) | Q(description__icontains=search) | Q(reason__icontains=search)
            )
        updates = updates.order_by(sort)
        serializer = ChildUpdateSerializer(updates, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = ChildUpdateSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            update = serializer.save(child=enfant)
            return Response(ChildUpdateSerializer(update).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def child_history_list(request, child_id):
    try:
        enfant = Child.objects.get(pk=child_id)
    except Child.DoesNotExist:
        return Response({"error": "Enfant introuvable."}, status=status.HTTP_404_NOT_FOUND)

    events = ChildHistory.objects.filter(child=enfant)

    events = filtrer_historique_par_role(events, request.user, enfant.id)

    f = ChildHistoryFilter(request.query_params, queryset=events)
    events = f.qs

    sort = request.query_params.get("sort", "-event_date")
    events = events.order_by(sort)

    page = int(request.query_params.get("page", 1))
    page_size = int(request.query_params.get("page_size", 50))
    offset = (page - 1) * page_size
    total = events.count()
    page_events = events[offset:offset + page_size]

    ConsultationHistorique.objects.create(
        utilisateur=request.user,
        enfant=enfant,
        filtre_applique=dict(request.query_params),
    )

    stats = {
        "total": total,
        "status_changes": events.filter(event_type="status_change").count(),
        "health_events": events.filter(category="health").count(),
        "education_events": events.filter(category="education").count(),
        "family_events": events.filter(category="family").count(),
        "document_events": events.filter(category="documents").count(),
        "alert_events": events.filter(Q(category="alert") | Q(category="protection") | Q(priority="critical")).count(),
    }

    group_by = request.query_params.get("group_by", "")
    if group_by:
        grouped = defaultdict(list)
        for ev in page_events:
            if group_by == "day":
                key = ev.event_date.strftime("%Y-%m-%d")
            elif group_by == "week":
                key = ev.event_date.strftime("%Y-W%W")
            elif group_by == "month":
                key = ev.event_date.strftime("%Y-%m")
            elif group_by == "year":
                key = ev.event_date.strftime("%Y")
            elif group_by == "category":
                key = ev.category
            else:
                key = ev.event_date.strftime("%Y-%m-%d")
            grouped[key].append(ChildHistorySerializer(ev).data)
        return Response({"grouped": dict(grouped), "stats": stats, "total": total})

    serializer = ChildHistorySerializer(page_events, many=True)
    return Response({
        "results": serializer.data,
        "stats": stats,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    })


@api_view(["POST"])
def child_history_create(request, child_id):
    if not request.user.is_authenticated:
        return Response({"error": "Authentification requise."}, status=status.HTTP_401_UNAUTHORIZED)
    try:
        enfant = Child.objects.get(pk=child_id)
    except Child.DoesNotExist:
        return Response({"error": "Enfant introuvable."}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if user.role not in ('director', 'federation', 'supermaster', 'ambassador'):
        return Response({"error": "Vous n'avez pas la permission de créer un événement."},
                        status=status.HTTP_403_FORBIDDEN)
    if user.role == 'director':
        if enfant.orphanage and enfant.orphanage.director != user:
            return Response({"error": "Vous ne pouvez modifier que les enfants de votre orphelinat."},
                            status=status.HTTP_403_FORBIDDEN)
    if user.role == 'ambassador':
        if not ChildAssignment.objects.filter(child=enfant, ambassador=user).exists():
            return Response({"error": "Vous n'êtes pas assigné à cet enfant."},
                            status=status.HTTP_403_FORBIDDEN)

    serializer = ChildHistoryCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    classification = CLASSIFICATION_EVENEMENTS.get(serializer.validated_data['event_type'], {})
    mapping_cat = {'SANTE': 'health', 'SCOLARITE': 'education', 'FAMILLE': 'family',
                   'DOCUMENTS': 'documents', 'SOCIAL': 'social', 'SYSTEME': 'system'}
    mapping_prio = {'INFO': 'low', 'IMPORTANT': 'high', 'CRITIQUE': 'critical'}

    obj = ChildHistory.objects.create(
        child=enfant,
        performed_by=request.user,
        performed_role=request.user.role,
        event_date=timezone.now(),
        niveau_sensibilite='PUBLIC',
        statut_validation='EN_ATTENTE' if serializer.validated_data['event_type'] in EVENEMENTS_VALIDATION_REQUISE else 'AUTO_VALIDE',
        category=mapping_cat.get(classification.get('categorie', 'SYSTEME'), 'general'),
        priority=mapping_prio.get(classification.get('priorite', 'INFO'), 'normal'),
        source_module=classification.get('module', 'update_center'),
        **serializer.validated_data,
    )
    return Response(ChildHistorySerializer(obj).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def child_bulk_history(request):
    """Create multiple history events at once (for batch operations)."""
    if not isinstance(request.data, list):
        return Response(
            {"error": "Les données doivent être une liste"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    results = []
    errors = []
    for i, item in enumerate(request.data):
        child_id = item.get("child_id")
        try:
            enfant = Child.objects.get(pk=child_id)
        except Child.DoesNotExist:
            errors.append({"index": i, "error": "Enfant introuvable"})
            continue
        serializer = ChildHistorySerializer(
            data={**item, "child": enfant.id}, context={"request": request}
        )
        if serializer.is_valid():
            obj = serializer.save(
                performed_by=request.user if request.user.is_authenticated else None,
                performed_role=(
                    request.user.role if hasattr(request.user, "role") else ""
                ),
                event_date=item.get("event_date") or timezone.now(),
            )
            results.append(ChildHistorySerializer(obj).data)
        else:
            errors.append({"index": i, "errors": serializer.errors})
    return Response({"results": results, "errors": errors})


@api_view(["GET"])
def child_history_stats(request, child_id):
    """Return aggregate stats for the child's history."""
    try:
        enfant = Child.objects.get(pk=child_id)
    except Child.DoesNotExist:
        return Response(
            {"error": "Enfant introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    events = ChildHistory.objects.filter(child=enfant)
    by_category = (
        events.values("category")
        .annotate(count=Count("id"))
        .order_by("-count")
    )
    by_priority = (
        events.values("priority")
        .annotate(count=Count("id"))
        .order_by("-count")
    )
    by_month = (
        events.extra({"month": "strftime('%%Y-%%m', event_date)"})
        .values("month")
        .annotate(count=Count("id"))
        .order_by("month")
    )

    return Response({
        "total": events.count(),
        "by_category": list(by_category),
        "by_priority": list(by_priority),
        "by_month": list(by_month),
        "last_event": (
            ChildHistorySerializer(events.first()).data if events.exists() else None
        ),
    })


@api_view(["GET"])
def all_children_history(request):
    """Aggregate history across all children (staff dashboard)."""
    category = request.query_params.get("category", "")
    priority = request.query_params.get("priority", "")
    date_from = request.query_params.get("date_from", "")
    date_to = request.query_params.get("date_to", "")
    limit = int(request.query_params.get("limit", 50))

    events = ChildHistory.objects.all()
    if category:
        events = events.filter(category=category)
    if priority:
        events = events.filter(priority=priority)
    if date_from:
        events = events.filter(event_date__gte=date_from)
    if date_to:
        events = events.filter(event_date__lte=date_to)

    events = events.select_related("child", "performed_by").order_by("-event_date")[:limit]
    serializer = ChildHistorySerializer(events, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def child_calendar_events(request, child_id):
    """Return history events formatted for calendar view."""
    try:
        enfant = Child.objects.get(pk=child_id)
    except Child.DoesNotExist:
        return Response(
            {"error": "Enfant introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    year = request.query_params.get("year", "")
    month = request.query_params.get("month", "")
    events = ChildHistory.objects.filter(child=enfant)
    if year:
        events = events.filter(event_date__year=year)
    if month:
        events = events.filter(event_date__month=month)

    calendar_data = []
    for ev in events:
        calendar_data.append({
            "id": ev.id,
            "title": ev.title,
            "date": ev.event_date.strftime("%Y-%m-%d"),
            "time": ev.event_date.strftime("%H:%M"),
            "category": ev.category,
            "event_type": ev.event_type,
            "priority": ev.priority,
            "icon": ev.event_type,
            "child_name": f"{ev.child.prenom} {ev.child.nom}",
        })

    return Response(calendar_data)


# ── Child Assignment (Federation → Ambassador) ──


@api_view(["GET", "POST"])
def child_assignment_list(request):
    user = request.user

    if request.method == "GET":
        if user.role == "ambassador":
            qs = ChildAssignment.objects.filter(ambassador=user).select_related(
                "child__orphanage", "ambassador", "assigned_by"
            ).order_by("-assigned_at")
        elif user.role in ("federation", "supermaster"):
            qs = ChildAssignment.objects.select_related(
                "child__orphanage", "ambassador", "assigned_by"
            ).all().order_by("-assigned_at")
            orphanage_id = request.query_params.get("orphanage_id")
            if orphanage_id:
                qs = qs.filter(child__orphanage_id=orphanage_id)
        else:
            qs = ChildAssignment.objects.none()
        return Response(ChildAssignmentSerializer(qs, many=True).data)

    elif request.method == "POST":
        if user.role not in ("federation", "supermaster"):
            return Response({"error": "Seul un administrateur federation peut assigner des enfants."}, status=status.HTTP_403_FORBIDDEN)

        child_id = request.data.get("child_id")
        ambassador_id = request.data.get("ambassador_id")
        note = request.data.get("note", "")

        if not child_id or not ambassador_id:
            return Response({"error": "child_id et ambassador_id sont requis."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            child = Child.objects.get(pk=child_id)
        except Child.DoesNotExist:
            return Response({"error": "Enfant introuvable."}, status=status.HTTP_404_NOT_FOUND)

        User = get_user_model()
        try:
            ambassador = User.objects.get(pk=ambassador_id, role="ambassador")
        except User.DoesNotExist:
            return Response({"error": "Ambassadeur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        assignment, created = ChildAssignment.objects.update_or_create(
            child=child,
            ambassador=ambassador,
            defaults={"note": note, "assigned_by": user},
        )

        serializer = ChildAssignmentSerializer(assignment)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        msg = "Enfant assigné avec succès." if created else "Assignation mise à jour."
        return Response({"message": msg, "data": serializer.data}, status=status_code)


@api_view(["POST"])
def child_assignment_bulk(request):
    user = request.user
    if user.role not in ("federation", "supermaster"):
        return Response({"error": "Seul un administrateur federation peut assigner des enfants."}, status=status.HTTP_403_FORBIDDEN)

    child_ids = request.data.get("child_ids", [])
    ambassador_id = request.data.get("ambassador_id")
    note = request.data.get("note", "")

    if not child_ids or not ambassador_id:
        return Response({"error": "child_ids et ambassador_id sont requis."}, status=status.HTTP_400_BAD_REQUEST)

    User = get_user_model()
    try:
        ambassador = User.objects.get(pk=ambassador_id, role="ambassador")
    except User.DoesNotExist:
        return Response({"error": "Ambassadeur introuvable."}, status=status.HTTP_404_NOT_FOUND)

    results = []
    errors = []
    for cid in child_ids:
        try:
            child = Child.objects.get(pk=cid)
            assignment, created = ChildAssignment.objects.update_or_create(
                child=child,
                ambassador=ambassador,
                defaults={"note": note, "assigned_by": user},
            )
            results.append({
                "child_id": cid,
                "status": "assigned" if created else "updated",
                "data": ChildAssignmentSerializer(assignment).data,
            })
        except Child.DoesNotExist:
            errors.append({"child_id": cid, "error": "Enfant introuvable"})

    return Response({"results": results, "errors": errors})


@api_view(["DELETE"])
def child_assignment_delete(request, assignment_id):
    user = request.user
    if user.role not in ("federation", "supermaster"):
        return Response({"error": "Seul un administrateur federation peut supprimer des assignations."}, status=status.HTTP_403_FORBIDDEN)

    try:
        assignment = ChildAssignment.objects.get(pk=assignment_id)
    except ChildAssignment.DoesNotExist:
        return Response({"error": "Assignation introuvable."}, status=status.HTTP_404_NOT_FOUND)

    assignment.delete()
    return Response({"message": "Assignation supprimée."}, status=status.HTTP_200_OK)


@api_view(["GET"])
def child_assignments_by_orphanage(request):
    user = request.user
    if user.role != "ambassador":
        return Response({"error": "Accès réservé aux ambassadeurs."}, status=status.HTTP_403_FORBIDDEN)

    assignments = ChildAssignment.objects.filter(ambassador=user).select_related(
        "child__orphanage", "ambassador", "assigned_by"
    ).order_by("-assigned_at")

    grouped = {}
    for a in assignments:
        orp_name = a.child.orphanage.name if a.child.orphanage else "Sans orphelinat"
        if orp_name not in grouped:
            grouped[orp_name] = []
        grouped[orp_name].append(ChildAssignmentSerializer(a).data)

    return Response(grouped)


# ═══════════════════════════════════════════════
# Nouveaux endpoints Historique
# ═══════════════════════════════════════════════

@api_view(["POST"])
def child_history_correct(request, history_id):
    """Crée un événement de correction lié à un événement erroné."""
    try:
        original = ChildHistory.objects.get(pk=history_id)
    except ChildHistory.DoesNotExist:
        return Response({"error": "Événement introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if request.user.role not in ('director', 'federation', 'supermaster'):
        return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)
    if request.user.role == 'director' and original.performed_by != request.user:
        return Response({"error": "Vous ne pouvez corriger que vos propres événements."},
                        status=status.HTTP_403_FORBIDDEN)

    serializer = CorrectionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    correction = ChildHistory.objects.create(
        child=original.child,
        event_type=original.event_type,
        category=original.category,
        title=f"Correction : {original.title}",
        description=serializer.validated_data.get('raison', ''),
        new_value=serializer.validated_data.get('nouvelle_valeur', ''),
        old_value=original.new_value,
        reason=serializer.validated_data['raison'],
        priority=original.priority,
        source_module=original.source_module,
        performed_by=request.user,
        performed_role=request.user.role,
        niveau_sensibilite=original.niveau_sensibilite,
        statut_validation='AUTO_VALIDE',
        evenement_parent=original,
        event_date=timezone.now(),
    )
    return Response(ChildHistorySerializer(correction).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def child_history_validate(request, history_id):
    if not PeutValiderHistorique().has_permission(request, None):
        return Response({"error": "Seule la Fédération peut valider des événements."},
                        status=status.HTTP_403_FORBIDDEN)
    try:
        event = ChildHistory.objects.get(pk=history_id)
    except ChildHistory.DoesNotExist:
        return Response({"error": "Événement introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if event.statut_validation != 'EN_ATTENTE':
        return Response({"error": "Cet événement n'est pas en attente de validation."},
                        status=status.HTTP_400_BAD_REQUEST)

    serializer = ValidationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    action = serializer.validated_data['action']
    event.statut_validation = 'VALIDE' if action == 'valider' else 'REJETE'
    event.note = (event.note or '') + f"\n[Validation {action} par {request.user.full_name}: {serializer.validated_data.get('commentaire', '')}]"
    event.save(_force=True)

    from .signals import _creer_evenement
    _creer_evenement(
        child=event.child,
        event_type='record_approved' if action == 'valider' else 'record_rejected',
        performed_by=request.user,
        title=f"Événement {action}",
        description=f"L'événement « {event.title} » a été {action} par {request.user.full_name}",
    )

    return Response(ChildHistorySerializer(event).data)


@api_view(["GET"])
def child_history_integrity(request, child_id):
    """Vérifie la chaîne de hash pour un enfant."""
    try:
        enfant = Child.objects.get(pk=child_id)
    except Child.DoesNotExist:
        return Response({"error": "Enfant introuvable."}, status=status.HTTP_404_NOT_FOUND)

    events = ChildHistory.objects.filter(child=enfant).order_by('event_date', 'id')
    chaine_valide = True
    precedent_hash = None
    verification = []

    for ev in events:
        attendu = ev.calculate_hash()
        ok = attendu == ev.hash_courant
        if not ok:
            chaine_valide = False
        verification.append({
            'id': ev.id,
            'title': ev.title,
            'event_date': ev.event_date,
            'hash_courant': ev.hash_courant,
            'hash_calcule': attendu,
            'hash_precedent': ev.hash_precedent,
            'hash_precedent_attendu': precedent_hash,
            'valide': ok,
        })
        precedent_hash = ev.hash_courant

    return Response({
        'enfant_id': enfant.id,
        'total': len(verification),
        'chaine_valide': chaine_valide,
        'evenements': verification,
    })


@api_view(["GET"])
def child_history_export(request, child_id):
    try:
        enfant = Child.objects.get(pk=child_id)
    except Child.DoesNotExist:
        return Response({"error": "Enfant introuvable."}, status=status.HTTP_404_NOT_FOUND)

    events = ChildHistory.objects.filter(child=enfant).order_by('-event_date')
    events = filtrer_historique_par_role(events, request.user, enfant.id)

    import csv
    from io import StringIO

    buf = StringIO()
    writer = csv.writer(buf)
    writer.writerow(['Date', 'Type', 'Catégorie', 'Titre', 'Description',
                     'Ancienne valeur', 'Nouvelle valeur', 'Raison',
                     'Priorité', 'Auteur', 'Rôle', 'Statut validation'])
    for ev in events:
        writer.writerow([
            ev.event_date.strftime('%Y-%m-%d %H:%M'),
            ev.event_type, ev.category, ev.title, ev.description,
            ev.old_value, ev.new_value, ev.reason,
            ev.priority,
            ev.performed_by.full_name if ev.performed_by else '',
            ev.performed_role, ev.statut_validation,
        ])

    response = HttpResponse(buf.getvalue(), content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="historique_{enfant.uid}.csv"'
    return response


@api_view(["GET"])
def child_history_consultations(request, child_id):
    if not PeutVoirConsultations().has_permission(request, None):
        return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
    try:
        enfant = Child.objects.get(pk=child_id)
    except Child.DoesNotExist:
        return Response({"error": "Enfant introuvable."}, status=status.HTTP_404_NOT_FOUND)

    consultations = ConsultationHistorique.objects.filter(enfant=enfant).order_by('-horodatage')
    page = int(request.query_params.get("page", 1))
    page_size = int(request.query_params.get("page_size", 20))
    offset = (page - 1) * page_size
    total = consultations.count()
    page_data = consultations[offset:offset + page_size]

    serializer = ConsultationHistoriqueSerializer(page_data, many=True)
    return Response({
        "results": serializer.data,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    })
