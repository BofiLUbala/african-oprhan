import string
import random
from datetime import datetime

from django.db import IntegrityError
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Child, ChildUpdate, ChildHistory
from .serializers import (
    ChildSerializer,
    ChildUpdateSerializer,
    ChildHistorySerializer,
)


def _gen_uid():
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=12))


def _auto_create_history(child, event_type, category, title, description="", old_value="", new_value="",
                          performed_by=None, reason="", priority="normal",
                          source_module="system", status_before="", status_after="",
                          note="", attachments=None, metadata=None, linked_update=None):
    """Helper to auto-create history events from any part of the system."""
    from .models import ChildHistory
    user_role = ""
    if performed_by and hasattr(performed_by, 'role'):
        user_role = getattr(performed_by, 'role', "")
    history = ChildHistory.objects.create(
        child=child,
        event_type=event_type,
        category=category,
        title=title,
        description=description,
        old_value=old_value,
        new_value=new_value,
        status_before=status_before,
        status_after=status_after,
        reason=reason,
        note=note,
        priority=priority,
        source_module=source_module,
        performed_by=performed_by,
        performed_role=user_role,
        department="",
        event_date=timezone.now(),
        attachments=attachments or [],
        metadata=metadata or {},
        linked_update=linked_update,
    )
    return history


# ── Child CRUD ──

@api_view(["GET", "POST"])
def child_list(request):
    if request.method == "GET":
        enfants = Child.objects.filter(created_by=request.user).order_by("-created_at")
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
            data = {**request.data, "uid": uid}
            serializer = ChildSerializer(data=data, context={"request": request})
            if serializer.is_valid():
                try:
                    enfant = serializer.save()
                    _auto_create_history(
                        child=enfant, event_type="created", category="registration",
                        title="Enfant enregistré",
                        new_value=f"UID: {enfant.uid} — {enfant.prenom} {enfant.nom}",
                        performed_by=request.user,
                        source_module="registration",
                        priority="normal",
                    )
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
        old_status = enfant.status
        old_data = ChildSerializer(enfant).data
        serializer = ChildSerializer(
            enfant, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            enfant = serializer.save()
            # Auto-create history for status changes
            if old_status != enfant.status and request.data.get("status"):
                _auto_create_history(
                    child=enfant, event_type="status_change", category="status",
                    title=f"Statut changé : {dict(Child.STATUS_CHOICES).get(old_status, old_status)} → {dict(Child.STATUS_CHOICES).get(enfant.status, enfant.status)}",
                    old_value=old_status, new_value=enfant.status,
                    status_before=old_status, status_after=enfant.status,
                    performed_by=request.user,
                    source_module="child_profile",
                    priority=(
                        "critical" if enfant.status in ("missing", "hospitalized", "deceased") else
                        "high" if enfant.status in ("at_risk", "sick", "transferred") else
                        "normal"
                    ),
                )
            # Auto-create history for profile field changes
            for field in ["nom", "prenom", "sexe", "nationalite", "date_naissance"]:
                if field in request.data and str(old_data.get(field, "")) != str(request.data[field]):
                    _auto_create_history(
                        child=enfant, event_type="updated", category="identity",
                        title=f"{dict(Child._meta.get_field(field).choices if hasattr(Child._meta.get_field(field), 'choices') and Child._meta.get_field(field).choices else {}).get(request.data[field], field)} mis à jour",
                        old_value=str(old_data.get(field, "")),
                        new_value=str(request.data[field]),
                        performed_by=request.user,
                        source_module="child_profile",
                        priority="normal",
                    )
            return Response(ChildSerializer(enfant).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
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
            # Auto-create history event
            priority = request.data.get("priority", "normal")
            _auto_create_history(
                child=enfant,
                event_type=request.data.get("event_type", "update_added"),
                category=update.category,
                title=update.title,
                description=update.description,
                old_value=update.previous_value,
                new_value=update.new_value,
                reason=update.reason,
                priority=priority,
                source_module="update_center",
                performed_by=request.user,
                attachments=update.attachments,
                metadata={"update_type": update.update_type},
                linked_update=update,
            )
            return Response(ChildUpdateSerializer(update).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def child_history_list(request, child_id):
    try:
        enfant = Child.objects.get(pk=child_id)
    except Child.DoesNotExist:
        return Response(
            {"error": "Enfant introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Filters
    category = request.query_params.get("category", "")
    event_type = request.query_params.get("event_type", "")
    priority = request.query_params.get("priority", "")
    source_module = request.query_params.get("source_module", "")
    search = request.query_params.get("search", "")
    date_from = request.query_params.get("date_from", "")
    date_to = request.query_params.get("date_to", "")
    performed_by_id = request.query_params.get("performed_by", "")
    department = request.query_params.get("department", "")
    status_change_only = request.query_params.get("status_change_only", "")
    group_by = request.query_params.get("group_by", "")
    density = request.query_params.get("density", "comfortable")
    sort = request.query_params.get("sort", "-event_date")

    events = ChildHistory.objects.filter(child=enfant)

    if category:
        events = events.filter(category=category)
    if event_type:
        events = events.filter(event_type=event_type)
    if priority:
        events = events.filter(priority=priority)
    if source_module:
        events = events.filter(source_module=source_module)
    if performed_by_id:
        events = events.filter(performed_by_id=performed_by_id)
    if department:
        events = events.filter(department__icontains=department)
    if status_change_only == "true":
        events = events.filter(event_type="status_change")
    if date_from:
        events = events.filter(event_date__gte=date_from)
    if date_to:
        events = events.filter(event_date__lte=date_to)
    if search:
        events = events.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search) |
            Q(reason__icontains=search) |
            Q(old_value__icontains=search) |
            Q(new_value__icontains=search) |
            Q(performed_role__icontains=search)
        )

    events = events.order_by(sort)

    # Stats
    total = events.count()
    stats = {
        "total": total,
        "status_changes": events.filter(event_type="status_change").count(),
        "health_events": events.filter(category="health").count(),
        "education_events": events.filter(category="education").count(),
        "family_events": events.filter(category="family").count(),
        "document_events": events.filter(category="documents").count(),
        "alert_events": events.filter(
            Q(category="alert") | Q(category="protection") | Q(priority="critical")
        ).count(),
    }

    # Grouped response
    if group_by:
        from collections import defaultdict
        grouped = defaultdict(list)
        for ev in events:
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
        return Response({
            "grouped": dict(grouped),
            "stats": stats,
            "total": total,
        })

    serializer = ChildHistorySerializer(events, many=True)
    return Response({
        "results": serializer.data,
        "stats": stats,
        "total": total,
    })


@api_view(["POST"])
def child_history_create(request, child_id):
    """Manual history event creation (for system events, alerts, etc.)."""
    try:
        enfant = Child.objects.get(pk=child_id)
    except Child.DoesNotExist:
        return Response(
            {"error": "Enfant introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    data = request.data.copy()
    data["child"] = enfant.id
    serializer = ChildHistorySerializer(data=data, context={"request": request})
    if serializer.is_valid():
        serializer.save(
            performed_by=request.user if request.user.is_authenticated else None,
            performed_role=(
                request.user.role if hasattr(request.user, "role") else ""
            ),
            event_date=timezone.now(),
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
