from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Orphanage
from .serializers import OrphanageSerializer


def _can_validate(user):
    return user.is_superuser or user.role in ("federation", "supermaster")


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
