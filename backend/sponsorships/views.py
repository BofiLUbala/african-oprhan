from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from children.models import Child
from children.serializers import ChildSerializer
from .models import Sponsorship, SponsorshipPayment
from .serializers import SponsorshipSerializer, SponsorshipPaymentSerializer

SPONSOR_ROLES = ("sponsor", "partner")
ORG_VIEW_ROLES = ("director", "federation", "supermaster", "auditor")
PAYMENT_WRITER_ROLES = ("director", "federation", "supermaster")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sponsorable_children_list(request):
    sponsored_ids = Sponsorship.objects.filter(status="active").values_list("child_id", flat=True)
    qs = Child.objects.exclude(id__in=sponsored_ids)
    return Response(ChildSerializer(qs, many=True).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def sponsorship_list(request):
    user = request.user

    if request.method == "POST":
        if user.role not in SPONSOR_ROLES:
            return Response({"error": "Seul un parrain peut créer un parrainage."}, status=status.HTTP_403_FORBIDDEN)
        serializer = SponsorshipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(sponsor=user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    if user.role in SPONSOR_ROLES:
        qs = Sponsorship.objects.filter(sponsor=user)
    elif user.role in ORG_VIEW_ROLES:
        qs = Sponsorship.objects.all()
        if user.role in ("director", "staff") and user.orphanage_id:
            qs = qs.filter(child__orphanage_id=user.orphanage_id)
    else:
        qs = Sponsorship.objects.none()
    return Response(SponsorshipSerializer(qs.select_related("sponsor", "child"), many=True).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def sponsorship_detail(request, sponsorship_id):
    user = request.user
    try:
        sponsorship = Sponsorship.objects.get(pk=sponsorship_id)
    except Sponsorship.DoesNotExist:
        return Response({"error": "Parrainage introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if not (sponsorship.sponsor_id == user.id or user.role in ("federation", "supermaster")):
        return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

    new_status = request.data.get("status")
    if new_status not in dict(Sponsorship.STATUS_CHOICES):
        return Response({"error": "Statut invalide."}, status=status.HTTP_400_BAD_REQUEST)
    sponsorship.status = new_status
    sponsorship.save(update_fields=["status"])
    return Response(SponsorshipSerializer(sponsorship).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def sponsorship_payment_list(request, sponsorship_id):
    user = request.user
    try:
        sponsorship = Sponsorship.objects.get(pk=sponsorship_id)
    except Sponsorship.DoesNotExist:
        return Response({"error": "Parrainage introuvable."}, status=status.HTTP_404_NOT_FOUND)

    can_view = sponsorship.sponsor_id == user.id or user.role in ORG_VIEW_ROLES
    if not can_view:
        return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "POST":
        if user.role not in PAYMENT_WRITER_ROLES:
            return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)
        serializer = SponsorshipPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(sponsorship=sponsorship)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    qs = sponsorship.payments.all()
    return Response(SponsorshipPaymentSerializer(qs, many=True).data)
