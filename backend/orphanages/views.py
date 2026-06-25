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
    if action not in ("approve", "reject"):
        return Response({"error": "Action invalide."}, status=status.HTTP_400_BAD_REQUEST)

    orphanage.status = "approved" if action == "approve" else "rejected"
    orphanage.validation_note = request.data.get("validation_note", "")
    orphanage.validated_at = timezone.now()
    if request.user.role == "ambassador":
        orphanage.ambassador = request.user
    orphanage.save(update_fields=["status", "validation_note", "validated_at", "ambassador", "updated_at"])
    return Response(OrphanageSerializer(orphanage).data)
