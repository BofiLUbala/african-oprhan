from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from communications.models import Notification
from .models import DocumentType, Orphanage, OrphanageDocument
from .serializers import DocumentTypeSerializer, OrphanageDocumentSerializer, OrphanageSerializer


def _can_validate(user):
    return user.is_superuser or user.role in ("federation", "supermaster")


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
        serializer.save(orphanage=orphanage)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

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

    if action in ("request_changes", "reject") and orphanage.director:
        labels = {"request_changes": "Modifications demandées", "reject": "Refusé"}
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

    if _can_validate(user):
        queryset = Orphanage.objects.select_related("director").all().order_by("-created_at")
    elif user.role == "director":
        queryset = Orphanage.objects.filter(director=user).select_related("director")
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
