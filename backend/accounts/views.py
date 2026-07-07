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
from needs.models import Need

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


def _avatar_url(request, u):
    if u.avatar:
        try:
            return request.build_absolute_uri(u.avatar.url)
        except Exception:
            return u.avatar.url
    return None


def _six_months():
    """Yield (year, month, label, start_date, end_date) for the last 6 months."""
    today = timezone.now().date()
    for i in range(5, -1, -1):
        year, month = today.year, today.month - i
        while month <= 0:
            month += 12
            year -= 1
        last_day = calendar.monthrange(year, month)[1]
        yield (
            year, month, MONTH_LABELS_FR[month - 1],
            today.replace(year=year, month=month, day=1),
            today.replace(year=year, month=month, day=last_day),
        )


def _monthly_new(model, field="created_at"):
    """Last 6 months of new-record counts for a model with a date/datetime field."""
    out = []
    for _y, _m, label, start, end in _six_months():
        n = model.objects.filter(**{f"{field}__date__gte": start, f"{field}__date__lte": end}).count()
        out.append({"month": label, "value": n})
    return out


def _revenue_monthly():
    """Last 6 months of real revenue = donations + recorded income."""
    out = []
    for _y, _m, label, start, end in _six_months():
        don = float(Donation.objects.filter(date__date__gte=start, date__date__lte=end)
                    .aggregate(t=dj_models.Sum("amount"))["t"] or 0)
        inc = float(Income.objects.filter(date__gte=start, date__lte=end)
                    .aggregate(t=dj_models.Sum("amount"))["t"] or 0)
        out.append({"month": label, "total": round(don + inc, 2)})
    return out


@api_view(["GET"])
def executive_stats(request):
    """Global executive metrics for the Super Master — 100% real DB aggregates."""
    user = request.user
    if not user.is_authenticated or user.role not in ("supermaster", "federation"):
        return Response({"error": "Accès réservé à la Super Direction."}, status=status.HTTP_403_FORBIDDEN)

    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    d30 = now - timedelta(days=30)

    role_counts = {r["role"]: r["n"] for r in User.objects.values("role").annotate(n=dj_models.Count("id"))}
    rc = lambda *roles: sum(role_counts.get(r, 0) for r in roles)

    users_total = User.objects.count()
    users_active = User.objects.filter(is_active=True).count()
    users_new = User.objects.filter(created_at__gte=month_start).count()
    recent_logins = User.objects.filter(last_login__gte=d30).count()

    donations_total = Donation.objects.count()
    donations_sum = float(Donation.objects.aggregate(t=dj_models.Sum("amount"))["t"] or 0)
    income_sum = float(Income.objects.aggregate(t=dj_models.Sum("amount"))["t"] or 0)
    expense_sum = float(Expense.objects.aggregate(t=dj_models.Sum("amount"))["t"] or 0)
    revenue_total = round(donations_sum + income_sum, 2)
    revenue_month = round(
        float(Donation.objects.filter(date__gte=month_start).aggregate(t=dj_models.Sum("amount"))["t"] or 0)
        + float(Income.objects.filter(date__gte=month_start.date()).aggregate(t=dj_models.Sum("amount"))["t"] or 0), 2)

    orgs_total = Orphanage.objects.count()
    children_total = Child.objects.count()
    sponsorships_active = Sponsorship.objects.filter(status="active").count()
    pending_needs = Need.objects.filter(status="open").count()

    kpis = [
        {"label": "Organisations", "value": orgs_total, "sub": "orphelinats", "color": "#6366f1", "icon": "building"},
        {"label": "Enfants", "value": children_total, "sub": "enregistrés", "color": "#f59e0b", "icon": "child"},
        {"label": "Utilisateurs", "value": users_total, "sub": f"{users_active} actifs", "color": "#3b82f6", "icon": "users"},
        {"label": "Revenus totaux", "value": revenue_total, "sub": "USD", "color": "#22c55e", "icon": "revenue", "money": True},
        {"label": "Revenus du mois", "value": revenue_month, "sub": "USD", "color": "#10b981", "icon": "trend", "money": True},
        {"label": "Dons", "value": donations_total, "sub": f"{int(donations_sum)} USD", "color": "#ec4899", "icon": "gift"},
        {"label": "Parrainages actifs", "value": sponsorships_active, "sub": "en cours", "color": "#a855f7", "icon": "heart"},
        {"label": "Nouveaux (mois)", "value": users_new, "sub": "inscriptions", "color": "#0ea5e9", "icon": "sparkle"},
        {"label": "Demandes en attente", "value": pending_needs, "sub": "besoins ouverts", "color": "#ef4444", "icon": "alert"},
    ]

    roles_fr = {
        "supermaster": "Super Master", "federation": "Confédération", "ambassador": "Ambassadeurs",
        "director": "Chefs d'orphelinat", "staff": "Personnel", "partner": "Partenaires",
        "sponsor": "Parrains", "auditor": "Auditeurs",
    }
    role_distribution = [
        {"name": roles_fr.get(r, r), "value": n}
        for r, n in sorted(role_counts.items(), key=lambda kv: -kv[1]) if n > 0
    ]

    # Real-time activity feed — most recent real records across the platform
    activities = []
    for c in Child.objects.order_by("-created_at")[:4]:
        activities.append({"type": "child", "text": f"Nouvel enfant enregistré : {c.prenom} {c.nom}".strip(), "at": c.created_at})
    for o in Orphanage.objects.order_by("-created_at")[:2]:
        activities.append({"type": "org", "text": f"Nouvel orphelinat : {o.name}", "at": o.created_at})
    for u in User.objects.order_by("-created_at")[:3]:
        activities.append({"type": "user", "text": f"Nouvel utilisateur : {u.full_name} ({roles_fr.get(u.role, u.role)})", "at": u.created_at})
    for d in Donation.objects.order_by("-date")[:3]:
        activities.append({"type": "donation", "text": f"Don reçu : {int(d.amount)} {d.currency}", "at": d.date})
    activities.sort(key=lambda a: a["at"], reverse=True)
    activities = [{"type": a["type"], "text": a["text"], "at": a["at"].isoformat()} for a in activities[:8]]

    health = {
        "database": "operational",
        "api": "operational",
        "active_sessions": recent_logins,
        "pending_requests": pending_needs,
    }

    return Response({
        "kpis": kpis,
        "charts": {
            "revenue_monthly": _revenue_monthly(),
            "users_monthly": _monthly_new(User),
            "children_monthly": _monthly_new(Child),
            "orgs_monthly": _monthly_new(Orphanage),
            "donations_monthly": _donations_monthly(None),
            "role_distribution": role_distribution,
        },
        "activities": activities,
        "health": health,
        "finance": {
            "donations_sum": round(donations_sum, 2),
            "income_sum": round(income_sum, 2),
            "expense_sum": round(expense_sum, 2),
            "net": round(donations_sum + income_sum - expense_sum, 2),
        },
    })


@api_view(["GET"])
def user_list(request):
    """Annuaire des agents — accessible à tout utilisateur authentifié pour la
    messagerie (chacun peut voir et écrire à n'importe quel agent enregistré)."""
    user = request.user
    if not user.is_authenticated:
        return Response({"error": "Non authentifié."}, status=status.HTTP_401_UNAUTHORIZED)
    role_filter = request.query_params.get("role")
    qs = User.objects.all().order_by("first_name", "last_name")
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
            "avatar": _avatar_url(request, u),
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
        "avatar": _avatar_url(request, user),
    })


@api_view(["POST"])
def update_avatar(request):
    """Téléverser/mettre à jour sa photo de profil (synchronisée partout)."""
    user = request.user
    if user.is_anonymous:
        return Response({"error": "Non authentifié."}, status=status.HTTP_401_UNAUTHORIZED)
    f = request.FILES.get("avatar")
    if not f:
        return Response({"error": "Aucune image fournie."}, status=status.HTTP_400_BAD_REQUEST)
    if f.size > 5 * 1024 * 1024:
        return Response({"error": "Image trop volumineuse (max 5 Mo)."}, status=status.HTTP_400_BAD_REQUEST)
    user.avatar = f
    user.save(update_fields=["avatar"])
    return Response({"avatar": _avatar_url(request, user)})


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
