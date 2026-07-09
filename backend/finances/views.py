import uuid

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Donation, Income, Expense, PaymentProvider, Transaction
from .serializers import (
    DonationSerializer, IncomeSerializer, ExpenseSerializer,
    PaymentProviderSerializer, TransactionSerializer,
)

FINANCE_MANAGER_ROLES = ("director", "federation", "supermaster", "auditor")
FINANCE_WRITER_ROLES = ("director", "federation", "supermaster")
ADMIN_ROLES = ("federation", "supermaster")


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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def provider_list(request):
    providers = PaymentProvider.objects.filter(is_active=True)
    return Response(PaymentProviderSerializer(providers, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def payment_initiate(request):
    serializer = TransactionSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    ref = f"TXN-{uuid.uuid4().hex[:12].upper()}"
    transaction = serializer.save(
        payer=request.user,
        reference_number=ref,
        status="pending",
    )
    return Response(TransactionSerializer(transaction).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def payment_confirm(request):
    ref = request.data.get("reference_number")
    if not ref:
        return Response({"error": "Numéro de référence requis."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        if request.user.role in ADMIN_ROLES:
            transaction = Transaction.objects.get(reference_number=ref)
        else:
            transaction = Transaction.objects.get(reference_number=ref, payer=request.user)
    except Transaction.DoesNotExist:
        return Response({"error": "Transaction introuvable."}, status=status.HTTP_404_NOT_FOUND)
    if transaction.status != "pending":
        return Response({"error": "Transaction déjà traitée."}, status=status.HTTP_400_BAD_REQUEST)
    transaction.status = "completed"
    transaction.completed_at = timezone.now()
    transaction.provider_reference = request.data.get("provider_reference", "")
    transaction.save(update_fields=["status", "completed_at", "provider_reference"])
    Donation.objects.create(
        donator=request.user,
        donation_type="financier",
        amount=transaction.amount,
        currency=transaction.currency,
        status="completed",
        orphanage=transaction.orphanage,
        linked_transaction=transaction,
    )
    return Response(TransactionSerializer(transaction).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transaction_list(request):
    user = request.user
    if user.role in ADMIN_ROLES:
        qs = Transaction.objects.select_related("payer").all().order_by("-created_at")
    else:
        qs = Transaction.objects.filter(payer=user).order_by("-created_at")
    status_f = request.query_params.get("status", "")
    if status_f:
        qs = qs.filter(status=status_f)
    type_f = request.query_params.get("type", "")
    if type_f:
        qs = qs.filter(transaction_type=type_f)
    return Response(TransactionSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transaction_detail(request, ref):
    user = request.user
    try:
        if user.role in ADMIN_ROLES:
            transaction = Transaction.objects.get(reference_number=ref)
        else:
            transaction = Transaction.objects.get(reference_number=ref, payer=user)
    except Transaction.DoesNotExist:
        return Response({"error": "Transaction introuvable."}, status=status.HTTP_404_NOT_FOUND)
    return Response(TransactionSerializer(transaction).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_provider_list(request):
    if request.user.role not in ADMIN_ROLES:
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    providers = PaymentProvider.objects.all().order_by("sort_order")
    return Response(PaymentProviderSerializer(providers, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_provider_create(request):
    if request.user.role != "supermaster":
        return Response({"error": "Réservé au Super Master."}, status=status.HTTP_403_FORBIDDEN)
    serializer = PaymentProviderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def admin_provider_update(request, provider_id):
    if request.user.role != "supermaster":
        return Response({"error": "Réservé au Super Master."}, status=status.HTTP_403_FORBIDDEN)
    try:
        provider = PaymentProvider.objects.get(pk=provider_id)
    except PaymentProvider.DoesNotExist:
        return Response({"error": "Fournisseur introuvable."}, status=status.HTTP_404_NOT_FOUND)
    serializer = PaymentProviderSerializer(provider, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_provider_toggle(request, provider_id):
    if request.user.role != "supermaster":
        return Response({"error": "Réservé au Super Master."}, status=status.HTTP_403_FORBIDDEN)
    try:
        provider = PaymentProvider.objects.get(pk=provider_id)
    except PaymentProvider.DoesNotExist:
        return Response({"error": "Fournisseur introuvable."}, status=status.HTTP_404_NOT_FOUND)
    provider.is_active = not provider.is_active
    provider.save(update_fields=["is_active"])
    return Response(PaymentProviderSerializer(provider).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_transaction_list(request):
    if request.user.role not in ADMIN_ROLES:
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    qs = Transaction.objects.select_related("payer").all().order_by("-created_at")
    status_f = request.query_params.get("status", "")
    if status_f:
        qs = qs.filter(status=status_f)
    type_f = request.query_params.get("type", "")
    if type_f:
        qs = qs.filter(transaction_type=type_f)
    payer_id = request.query_params.get("payer_id", "")
    if payer_id:
        qs = qs.filter(payer_id=payer_id)
    page = int(request.query_params.get("page", 1))
    page_size = int(request.query_params.get("page_size", 20))
    offset = (page - 1) * page_size
    total = qs.count()
    return Response({
        "results": TransactionSerializer(qs[offset:offset + page_size], many=True).data,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size if page_size > 0 else 1,
    })
