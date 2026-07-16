from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from communications.models import Notification
from .models import DocumentType, Orphanage, OrphanageDocument
from .serializers import DocumentTypeSerializer, OrphanageDocumentSerializer, OrphanageSerializer


def _can_validate(user):
    return user.is_superuser or user.role in ("federation", "supermaster")

def _can_view_orphanages(user):
    return _can_validate(user) or user.role == "auditor"

def _notify_federation(title, content, link=""):
    User = get_user_model()
    federation_users = User.objects.filter(role="federation", is_active=True)
    for u in federation_users:
        Notification.objects.create(user=u, title=title, content=content, link=link)


# ── Document Types (managed by federation) ──

@api_view(["GET", "POST"])
def document_type_list(request):
    if request.method == "POST":
        if not _can_validate(request.user):
            return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)
        serializer = DocumentTypeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    queryset = DocumentType.objects.all()
    return Response(DocumentTypeSerializer(queryset, many=True).data)


@api_view(["PUT", "DELETE"])
def document_type_detail(request, dt_id):
    if not _can_validate(request.user):
        return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)
    try:
        dt = DocumentType.objects.get(pk=dt_id)
    except DocumentType.DoesNotExist:
        return Response({"error": "Type de document introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        dt.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = DocumentTypeSerializer(dt, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


# ── Orphanage Documents (uploaded by director, reviewed by federation) ──

@api_view(["GET", "POST"])
def orphanage_document_list(request, orphanage_id):
    try:
        orphanage = Orphanage.objects.get(pk=orphanage_id)
    except Orphanage.DoesNotExist:
        return Response({"error": "Orphelinat introuvable."}, status=status.HTTP_404_NOT_FOUND)

    user = request.user

    if request.method == "POST":
        if user.role != "director" or orphanage.director != user:
            return Response({"error": "Seul le directeur de cet orphelinat peut téléverser des documents."}, status=status.HTTP_403_FORBIDDEN)
        serializer = OrphanageDocumentSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(orphanage=orphanage)
        _notify_federation(
            title=f"Nouveau document soumis par {user.full_name}",
            content=f"Le document « {instance.document_type.label} » a été soumis pour l'orphelinat « {orphanage.name} ».",
            link="",
        )
        return Response(OrphanageDocumentSerializer(instance, context={"request": request}).data, status=status.HTTP_201_CREATED)

    if _can_validate(user) or (user.role == "director" and orphanage.director == user):
        docs = OrphanageDocument.objects.filter(orphanage=orphanage).select_related("document_type")
        return Response(OrphanageDocumentSerializer(docs, many=True, context={"request": request}).data)

    return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)


@api_view(["POST"])
def orphanage_document_review(request, orphanage_id, doc_id):
    if not _can_validate(request.user):
        return Response({"error": "Vous n'avez pas le droit de valider ces documents."}, status=status.HTTP_403_FORBIDDEN)

    try:
        orphanage = Orphanage.objects.get(pk=orphanage_id)
        doc = OrphanageDocument.objects.get(pk=doc_id, orphanage=orphanage)
    except (Orphanage.DoesNotExist, OrphanageDocument.DoesNotExist):
        return Response({"error": "Document introuvable."}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get("action")
    feedback = request.data.get("feedback", "")
    points_to_update = request.data.get("points_to_update", "")

    if action == "accept":
        doc.status = "accepted"
    elif action == "request_changes":
        doc.status = "changes_requested"
    elif action == "reject":
        doc.status = "rejected"
    else:
        return Response({"error": "Action invalide. Utilisez 'accept', 'request_changes' ou 'reject'."}, status=status.HTTP_400_BAD_REQUEST)

    doc.feedback = feedback
    doc.points_to_update = points_to_update if action in ("request_changes", "reject") else ""
    doc.reviewed_by = request.user
    doc.reviewed_at = timezone.now()
    doc.save(update_fields=["status", "feedback", "points_to_update", "reviewed_by", "reviewed_at"])

    if action in ("accept", "request_changes", "reject") and orphanage.director:
        labels = {"accept": "Accepté", "request_changes": "Modifications demandées", "reject": "Refusé"}
        title = f"Document {labels.get(action, action)}"
        content_parts = [f"Le document « {doc.document_type.label} » a été {labels.get(action, action).lower()}."]
        if feedback:
            content_parts.append(f"Retour: {feedback}")
        if points_to_update:
            content_parts.append(f"Points à corriger: {points_to_update}")
        Notification.objects.create(
            user=orphanage.director,
            title=title,
            content="\n".join(content_parts),
            link=f"/documents",
        )

    return Response(OrphanageDocumentSerializer(doc, context={"request": request}).data)


@api_view(["DELETE"])
def orphanage_document_detail(request, orphanage_id, doc_id):
    try:
        orphanage = Orphanage.objects.get(pk=orphanage_id)
        doc = OrphanageDocument.objects.get(pk=doc_id, orphanage=orphanage)
    except (Orphanage.DoesNotExist, OrphanageDocument.DoesNotExist):
        return Response({"error": "Document introuvable."}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    is_director = user.role == "director" and orphanage.director == user
    is_federation = _can_validate(user)

    if not (is_director or is_federation):
        return Response({"error": "Vous n'avez pas le droit de supprimer ce document."}, status=status.HTTP_403_FORBIDDEN)

    if is_director and (timezone.now() - doc.uploaded_at).days >= 2:
        return Response(
            {"error": "Délai de suppression expiré. Seul la fédération peut supprimer ce document après 2 jours."},
            status=status.HTTP_403_FORBIDDEN,
        )

    doc_label = doc.document_type.label
    orp_name = orphanage.name
    doc.delete()

    if is_director:
        _notify_federation(
            title=f"Document supprimé par {user.full_name}",
            content=f"Le document « {doc_label} » de l'orphelinat « {orp_name} » a été supprimé par le directeur.",
            link="",
        )

    return Response({"status": "supprimé"}, status=status.HTTP_200_OK)


@api_view(["GET", "POST"])
def orphanage_list(request):
    user = request.user

    if request.method == "POST":
        if user.role != "director":
            return Response({"error": "Seul un chef d'orphelinat peut soumettre un orphelinat."}, status=status.HTTP_403_FORBIDDEN)
        existing = Orphanage.objects.filter(director=user).first()
        if existing:
            serializer = OrphanageSerializer(existing, data=request.data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            orphanage = serializer.save()
            return Response(OrphanageSerializer(orphanage).data)
        serializer = OrphanageSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        orphanage = serializer.save()
        user.orphanage = orphanage
        user.save(update_fields=["orphanage"])
        return Response(OrphanageSerializer(orphanage).data, status=status.HTTP_201_CREATED)

    if _can_view_orphanages(user):
        queryset = Orphanage.objects.select_related("director").all().order_by("-created_at")
    elif user.role == "director":
        queryset = Orphanage.objects.filter(director=user).select_related("director")
    elif user.role == "ambassador":
        # Un ambassadeur ne doit voir/choisir que les orphelinats des enfants
        # qui lui sont assignés (Gestion multi-orphelinats) — jamais la liste
        # complète, réservée à la fédération/au super master.
        queryset = Orphanage.objects.filter(
            children__assignments__ambassador=user,
        ).select_related("director").distinct()
    else:
        queryset = Orphanage.objects.none()

    return Response(OrphanageSerializer(queryset, many=True).data)


@api_view(["POST"])
def orphanage_validate(request, orphanage_id):
    if not _can_validate(request.user):
        return Response({"error": "Vous n'avez pas le droit de valider ces donnees."}, status=status.HTTP_403_FORBIDDEN)

    try:
        orphanage = Orphanage.objects.get(pk=orphanage_id)
    except Orphanage.DoesNotExist:
        return Response({"error": "Orphelinat introuvable."}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get("action")
    note = request.data.get("validation_note", "")
    update_fields = ["validation_note", "updated_at"]

    if action == "approve":
        orphanage.status = "approved"
        orphanage.validated_at = timezone.now()
        update_fields += ["status", "validated_at"]
    elif action == "reject":
        orphanage.status = "rejected"
        orphanage.validated_at = timezone.now()
        update_fields += ["status", "validated_at"]
    else:
        return Response({"error": "Action invalide. Utilisez 'approve' ou 'reject'."}, status=status.HTTP_400_BAD_REQUEST)

    orphanage.validation_note = note
    orphanage.save(update_fields=update_fields)
    return Response(OrphanageSerializer(orphanage).data)


# ═══════════ SUPER MASTER — ORGANIZATION MANAGEMENT (Module 2) ═══════════
from django.db.models import Q, Count
from children.models import Child
from finances.models import Donation


def _admin_orphanage_payload(o):
    """Organization row with live counts — all real."""
    return {
        "id": o.pk,
        "name": o.name,
        "address": o.address,
        "capacity": o.capacity,
        "status": o.status,
        "director_id": o.director_id,
        "director_name": o.director.full_name if o.director else None,
        "director_email": o.director.email if o.director else None,
        "users_count": get_user_model().objects.filter(orphanage_id=o.pk).count(),
        "children_count": Child.objects.filter(orphanage_id=o.pk).count(),
        "donations_count": Donation.objects.filter(orphanage_id=o.pk).count(),
        "latitude": float(o.latitude) if o.latitude is not None else None,
        "longitude": float(o.longitude) if o.longitude is not None else None,
        "created_at": o.created_at.isoformat(),
        "updated_at": o.updated_at.isoformat(),
    }


@api_view(["GET", "POST"])
def org_admin_list(request):
    """Paginated, searchable, filterable organization list for the Super Master."""
    if not _can_validate(request.user):
        return Response({"error": "Accès réservé à la Super Direction."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "POST":
        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "Le nom est requis."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            capacity = int(request.data.get("capacity") or 0)
        except (ValueError, TypeError):
            capacity = 0
        o = Orphanage.objects.create(
            name=name, address=(request.data.get("address") or ""),
            capacity=capacity, status=request.data.get("status") or "approved",
        )
        return Response(_admin_orphanage_payload(o), status=status.HTTP_201_CREATED)

    qs = Orphanage.objects.select_related("director").all().order_by("-created_at")
    search = request.query_params.get("search", "").strip()
    if search:
        qs = qs.filter(Q(name__icontains=search) | Q(address__icontains=search) |
                       Q(director__first_name__icontains=search) | Q(director__last_name__icontains=search))
    status_f = request.query_params.get("status", "").strip()
    if status_f and status_f != "all":
        qs = qs.filter(status=status_f)

    total = qs.count()
    try:
        page = max(1, int(request.query_params.get("page", 1)))
        page_size = min(50, max(1, int(request.query_params.get("page_size", 10))))
    except ValueError:
        page, page_size = 1, 10
    start = (page - 1) * page_size
    rows = [_admin_orphanage_payload(o) for o in qs[start:start + page_size]]

    counts_by_status = {r["status"]: r["n"] for r in Orphanage.objects.values("status").annotate(n=Count("id"))}
    return Response({
        "results": rows,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
        "status_counts": counts_by_status,
    })


@api_view(["GET", "PATCH", "DELETE"])
def org_admin_detail(request, orphanage_id):
    if not _can_validate(request.user):
        return Response({"error": "Accès réservé à la Super Direction."}, status=status.HTTP_403_FORBIDDEN)
    try:
        o = Orphanage.objects.select_related("director").get(pk=orphanage_id)
    except Orphanage.DoesNotExist:
        return Response({"error": "Organisation introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        o.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    if request.method == "PATCH":
        for field in ("name", "address"):
            if field in request.data:
                setattr(o, field, request.data[field])
        if "capacity" in request.data:
            try:
                o.capacity = int(request.data["capacity"])
            except (ValueError, TypeError):
                return Response({"error": "Capacité invalide."}, status=status.HTTP_400_BAD_REQUEST)
        o.save()
    return Response(_admin_orphanage_payload(o))


@api_view(["POST"])
def org_admin_status(request, orphanage_id):
    """Lifecycle actions: approve / reject / suspend / reactivate / archive."""
    if not _can_validate(request.user):
        return Response({"error": "Accès réservé à la Super Direction."}, status=status.HTTP_403_FORBIDDEN)
    try:
        o = Orphanage.objects.get(pk=orphanage_id)
    except Orphanage.DoesNotExist:
        return Response({"error": "Organisation introuvable."}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get("action")
    mapping = {"approve": "approved", "reject": "rejected", "suspend": "suspended",
               "reactivate": "approved", "archive": "archived"}
    if action not in mapping:
        return Response({"error": "Action invalide."}, status=status.HTTP_400_BAD_REQUEST)
    o.status = mapping[action]
    if action in ("approve", "reactivate"):
        o.validated_at = timezone.now()
    note = request.data.get("note", "")
    if note:
        o.validation_note = note
    o.save()
    return Response(_admin_orphanage_payload(o))
