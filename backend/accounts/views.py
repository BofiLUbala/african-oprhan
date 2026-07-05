import calendar
import threading
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import models as dj_models
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from children.models import Child
from finances.models import Donation, Income, Expense
from finances.views import _visible_orphanage_ids
from orphanages.models import Orphanage
from sponsorships.models import Sponsorship

from .serializers import SignupSerializer
from .utils import send_activation_email, is_token_valid

User = get_user_model()

MONTH_LABELS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
                   'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']


def _donations_monthly(orphanage_ids):
    """Last 6 calendar months of donation totals."""
    today = timezone.now().date()
    result = []
    for i in range(5, -1, -1):
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1
        last_day = calendar.monthrange(year, month)[1]
        start = today.replace(year=year, month=month, day=1)
        end = today.replace(year=year, month=month, day=last_day)
        qs = Donation.objects.filter(date__date__gte=start, date__date__lte=end)
        if orphanage_ids is not None:
            qs = qs.filter(orphanage_id__in=orphanage_ids)
        total = float(qs.aggregate(t=dj_models.Sum('amount'))['t'] or 0)
        result.append({'month': MONTH_LABELS_FR[month - 1], 'total': total})
    return result


def _children_gender(orphanage_ids):
    qs = Child.objects.all()
    if orphanage_ids is not None:
        qs = qs.filter(orphanage_id__in=orphanage_ids)
    m = qs.filter(sexe='M').count()
    f = qs.filter(sexe='F').count()
    return {'M': m, 'F': f}


def _sponsorship_status(orphanage_ids):
    qs = Sponsorship.objects.all()
    if orphanage_ids is not None:
        qs = qs.filter(child__orphanage_id__in=orphanage_ids)
    return {
        'active': qs.filter(status='active').count(),
        'paused': qs.filter(status='paused').count(),
        'cancelled': qs.filter(status='cancelled').count(),
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    role = user.role
    orp_ids = _visible_orphanage_ids(user)  # None = all, list = restricted

    charts = {
        'donations_monthly': _donations_monthly(orp_ids),
        'children_gender': _children_gender(orp_ids),
        'sponsorships_status': _sponsorship_status(orp_ids),
    }

    if role == 'director':
        if orp_ids is not None:
            children_count = Child.objects.filter(orphanage_id__in=orp_ids).count()
            donations_count = Donation.objects.filter(orphanage_id__in=orp_ids).count()
            sponsorships_count = Sponsorship.objects.filter(
                child__orphanage_id__in=orp_ids, status='active'
            ).count()
            incomes_count = Income.objects.filter(orphanage_id__in=orp_ids).count()
        else:
            children_count = Child.objects.count()
            donations_count = Donation.objects.count()
            sponsorships_count = Sponsorship.objects.filter(status='active').count()
            incomes_count = Income.objects.count()
        kpis = [
            {'label': 'ENFANTS', 'value': children_count, 'sub': 'enregistrés', 'color': '#f59e0b'},
            {'label': 'DONS', 'value': donations_count, 'sub': 'reçus', 'color': '#3b82f6'},
            {'label': 'PARRAINAGES', 'value': sponsorships_count, 'sub': 'actifs', 'color': '#22c55e'},
            {'label': 'REVENUS', 'value': incomes_count, 'sub': 'enregistrés', 'color': '#a855f7'},
        ]

    elif role in ('supermaster', 'federation', 'ambassador'):
        orphanages_count = Orphanage.objects.count()
        users_count = User.objects.filter(is_active=True).count()
        donations_count = Donation.objects.count()
        sponsorships_count = Sponsorship.objects.filter(status='active').count()
        kpis = [
            {'label': 'UTILISATEURS', 'value': users_count, 'sub': 'actifs', 'color': '#3b82f6'},
            {'label': 'ORPHELINATS', 'value': orphanages_count, 'sub': 'supervisés', 'color': '#f59e0b'},
            {'label': 'DONS', 'value': donations_count, 'sub': 'total', 'color': '#22c55e'},
            {'label': 'PARRAINAGES', 'value': sponsorships_count, 'sub': 'actifs', 'color': '#a855f7'},
        ]

    elif role in ('partner', 'sponsor'):
        donations_count = Donation.objects.filter(donator=user).count()
        sponsorships_count = Sponsorship.objects.filter(sponsor=user, status='active').count()
        total_donated = int(
            Donation.objects.filter(donator=user).aggregate(t=dj_models.Sum('amount'))['t'] or 0
        )
        children_helped = Sponsorship.objects.filter(sponsor=user).values('child').distinct().count()
        kpis = [
            {'label': 'DONS', 'value': donations_count, 'sub': 'effectués', 'color': '#f59e0b'},
            {'label': 'PARRAINAGES', 'value': sponsorships_count, 'sub': 'actifs', 'color': '#3b82f6'},
            {'label': 'TOTAL VERSÉ', 'value': total_donated, 'sub': 'USD', 'color': '#22c55e'},
            {'label': 'ENFANTS AIDÉS', 'value': children_helped, 'sub': 'bénéficiaires', 'color': '#a855f7'},
        ]

    elif role == 'auditor':
        kpis = [
            {'label': 'DONS', 'value': Donation.objects.count(), 'sub': 'total', 'color': '#f59e0b'},
            {'label': 'REVENUS', 'value': Income.objects.count(), 'sub': 'enregistrés', 'color': '#3b82f6'},
            {'label': 'DÉPENSES', 'value': Expense.objects.count(), 'sub': 'enregistrées', 'color': '#ef4444'},
            {'label': 'PARRAINAGES', 'value': Sponsorship.objects.count(), 'sub': 'total', 'color': '#22c55e'},
        ]

    else:
        kpis = [
            {'label': 'DONS', 'value': Donation.objects.filter(donator=user).count(), 'sub': 'effectués', 'color': '#f59e0b'},
            {'label': 'PARRAINAGES', 'value': Sponsorship.objects.filter(sponsor=user).count(), 'sub': 'total', 'color': '#3b82f6'},
            {'label': 'ENFANTS', 'value': Child.objects.count(), 'sub': 'total', 'color': '#22c55e'},
            {'label': 'ORPHELINATS', 'value': Orphanage.objects.count(), 'sub': 'total', 'color': '#a855f7'},
        ]

    return Response({'kpis': kpis, 'charts': charts})


@api_view(["GET"])
def user_list(request):
    user = request.user
    if not user.is_authenticated or user.role not in ("federation", "supermaster"):
        return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
    role_filter = request.query_params.get("role")
    qs = User.objects.all()
    if role_filter:
        qs = qs.filter(role=role_filter)
    return Response([
        {
            "id": u.pk,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "full_name": u.full_name,
            "country": u.country,
            "role": u.role,
            "is_active": u.is_active,
        }
        for u in qs
    ])


@api_view(["GET"])
@permission_classes([AllowAny])
def me(request):
    user = request.user
    if user.is_anonymous:
        return Response({"error": "Non authentifié."}, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        "id": user.pk,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "country": user.country,
        "role": user.role,
        "is_active": user.is_active,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()

    try:
        t = threading.Thread(target=send_activation_email, args=(user, request), daemon=True)
        t.start()
    except Exception:
        pass

    return Response(
        {
            "message": (
                "Inscription réussie. Un email d'activation vous a été envoyé. "
                "Veuillez vérifier votre boîte de réception."
            )
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_email(request):
    token = request.data.get("token")
    uid = request.data.get("uid")

    if not token or not uid:
        return Response(
            {"error": "Token et identifiant utilisateur requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(pk=uid, email_verification_token=token)
    except User.DoesNotExist:
        try:
            user = User.objects.get(pk=uid)
            if user.is_active:
                return Response(
                    {"message": "Ce compte est déjà activé."},
                    status=status.HTTP_200_OK,
                )
        except User.DoesNotExist:
            pass
        return Response(
            {"error": "Lien d'activation invalide ou déjà utilisé."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if user.is_active:
        return Response(
            {"message": "Ce compte est déjà activé."},
            status=status.HTTP_200_OK,
        )

    if not is_token_valid(user):
        return Response(
            {"error": "Le lien d'activation a expiré (valable 2 heures). Veuillez vous réinscrire."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.is_active = True
    user.email_verified_at = timezone.now()
    user.email_verification_token = None
    user.verification_sent_at = None
    user.save(update_fields=["is_active", "email_verified_at", "email_verification_token", "verification_sent_at"])

    return Response(
        {"message": "Votre compte a été activé avec succès !"},
        status=status.HTTP_200_OK,
    )
