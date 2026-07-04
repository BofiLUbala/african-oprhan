from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Donation, Income, Expense
from .serializers import DonationSerializer, IncomeSerializer, ExpenseSerializer

FINANCE_MANAGER_ROLES = ("director", "federation", "supermaster", "auditor")
FINANCE_WRITER_ROLES = ("director", "federation", "supermaster")


def _visible_orphanage_ids(user):
    """Returns None for 'see all orphanages', or a list of orphanage ids to filter by."""
    if user.role in ("federation", "supermaster", "auditor"):
        return None
    if user.role in ("director", "staff") and user.orphanage_id:
        return [user.orphanage_id]
    return []


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def donation_list(request):
    user = request.user

    if request.method == "POST":
        serializer = DonationSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(donator=user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    if request.query_params.get("mine"):
        qs = Donation.objects.filter(donator=user).order_by("-date")
    elif user.role in FINANCE_MANAGER_ROLES:
        ids = _visible_orphanage_ids(user)
        qs = Donation.objects.all().order_by("-date")
        if ids is not None:
            qs = qs.filter(orphanage_id__in=ids)
    else:
        qs = Donation.objects.filter(donator=user).order_by("-date")
    return Response(DonationSerializer(qs, many=True).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def income_list(request):
    user = request.user
    if user.role not in FINANCE_MANAGER_ROLES:
        return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "POST":
        if user.role not in FINANCE_WRITER_ROLES:
            return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)
        serializer = IncomeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    ids = _visible_orphanage_ids(user)
    qs = Income.objects.all().order_by("-date")
    if ids is not None:
        qs = qs.filter(orphanage_id__in=ids)
    return Response(IncomeSerializer(qs, many=True).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def expense_list(request):
    user = request.user
    if user.role not in FINANCE_MANAGER_ROLES:
        return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "POST":
        if user.role not in FINANCE_WRITER_ROLES:
            return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)
        serializer = ExpenseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    ids = _visible_orphanage_ids(user)
    qs = Expense.objects.all().order_by("-date")
    if ids is not None:
        qs = qs.filter(orphanage_id__in=ids)
    return Response(ExpenseSerializer(qs, many=True).data)
