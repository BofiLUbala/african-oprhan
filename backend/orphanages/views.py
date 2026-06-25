from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Orphanage
from .serializers import OrphanageSerializer


def _can_validate(user):
    return user.is_superuser or user.role in ("ambassador", "federation", "supermaster")


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
        queryset = Orphanage.objects.select_related("director", "ambassador").all().order_by("-created_at")
    elif user.role == "director":
        queryset = Orphanage.objects.filter(director=user).select_related("director", "ambassador")
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
    role = request.user.role
    note = request.data.get("validation_note", "")
    update_fields = ["validation_note", "updated_at"]

    if role == "federation":
        if action == "accept":
            orphanage.status = "active"
        elif action == "reject":
            orphanage.status = "rejected"
        else:
            return Response({"error": "Action invalide. Utilisez 'accept' ou 'reject'."}, status=status.HTTP_400_BAD_REQUEST)
        orphanage.validated_at = timezone.now()
        orphanage.validation_note = note
        update_fields += ["status", "validated_at"]

    elif role == "ambassador":
        if orphanage.ambassador != request.user:
            return Response({"error": "Cet orphelinat ne vous est pas assigné."}, status=status.HTTP_403_FORBIDDEN)
        if action == "approve":
            orphanage.status = "approved"
            orphanage.validated_at = timezone.now()
            update_fields += ["status", "validated_at"]
        elif action == "reject":
            orphanage.status = "rejected"
            orphanage.validated_at = timezone.now()
            update_fields += ["status", "validated_at"]
        elif action == "request_changes":
            orphanage.status = "changes_requested"
            orphanage.feedback = note
            update_fields += ["status", "feedback"]
        else:
            return Response({"error": "Action invalide. Utilisez 'approve', 'reject' ou 'request_changes'."}, status=status.HTTP_400_BAD_REQUEST)

    else:
        if action == "approve":
            orphanage.status = "approved"
            orphanage.validated_at = timezone.now()
            update_fields += ["status", "validated_at"]
        elif action == "reject":
            orphanage.status = "rejected"
            orphanage.validated_at = timezone.now()
            update_fields += ["status", "validated_at"]
        else:
            return Response({"error": "Action invalide."}, status=status.HTTP_400_BAD_REQUEST)

    orphanage.validation_note = note
    orphanage.save(update_fields=update_fields)
    return Response(OrphanageSerializer(orphanage).data)


@api_view(["POST"])
def assign_ambassador(request, orphanage_id):
    user = request.user
    if user.role not in ("federation", "supermaster"):
        return Response({"error": "Seul un administrateur federation peut assigner un ambassadeur."}, status=status.HTTP_403_FORBIDDEN)

    try:
        orphanage = Orphanage.objects.get(pk=orphanage_id)
    except Orphanage.DoesNotExist:
        return Response({"error": "Orphelinat introuvable."}, status=status.HTTP_404_NOT_FOUND)

    ambassador_id = request.data.get("ambassador_id")
    if not ambassador_id:
        return Response({"error": "ID de l'ambassadeur requis."}, status=status.HTTP_400_BAD_REQUEST)

    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        ambassador = User.objects.get(pk=ambassador_id, role="ambassador")
    except User.DoesNotExist:
        return Response({"error": "Ambassadeur introuvable."}, status=status.HTTP_404_NOT_FOUND)

    orphanage.ambassador = ambassador
    orphanage.status = "under_review"
    orphanage.save(update_fields=["ambassador", "status", "updated_at"])
    return Response(OrphanageSerializer(orphanage).data)


@api_view(["POST"])
def orphanage_feedback(request, orphanage_id):
    try:
        orphanage = Orphanage.objects.get(pk=orphanage_id)
    except Orphanage.DoesNotExist:
        return Response({"error": "Orphelinat introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if request.user.role != "ambassador" or orphanage.ambassador != request.user:
        return Response({"error": "Seul l'ambassadeur assigné peut envoyer un feedback."}, status=status.HTTP_403_FORBIDDEN)

    message = request.data.get("message", "")
    if not message.strip():
        return Response({"error": "Le message ne peut pas être vide."}, status=status.HTTP_400_BAD_REQUEST)

    orphanage.feedback = message
    orphanage.status = "changes_requested"
    orphanage.save(update_fields=["feedback", "status", "updated_at"])
    return Response(OrphanageSerializer(orphanage).data)
