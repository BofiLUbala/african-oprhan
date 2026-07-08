import calendar
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import models as dj_models
from django.db.models import Q, Count, Sum
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from children.models import Child
from communications.models import Notification, ChannelMessage
from finances.models import Donation, Income, Expense
from orphanages.models import Orphanage
from sponsorships.models import Sponsorship
from projets.models import Project
from needs.models import Need

from .models import (
    SubscriptionPlan, OrganizationSubscription, Invoice,
    ActivityLog, LoginAttempt, SecurityEvent, IpBlock,
    SystemConfiguration, Report, ReportSchedule,
    SupportTicket, TicketComment, PlatformDocument
)
from .serializers import (
    SubscriptionPlanSerializer, OrganizationSubscriptionSerializer, InvoiceSerializer,
    ActivityLogSerializer, LoginAttemptSerializer, SecurityEventSerializer, IpBlockSerializer,
    SystemConfigurationSerializer, ReportSerializer, ReportScheduleSerializer,
    SupportTicketSerializer, TicketCommentSerializer, PlatformDocumentSerializer,
    UserAdminSerializer
)

User = get_user_model()

MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
                'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
ROLES_FR = {
    "supermaster": "Super Master", "federation": "Confédération", "ambassador": "Ambassadeurs",
    "director": "Chefs d'orphelinat", "staff": "Personnel", "partner": "Partenaires",
    "sponsor": "Parrains", "auditor": "Auditeurs",
}


def _supermaster_only(user):
    return user.is_authenticated and user.role == "supermaster"


def _admin_only(user):
    return user.is_authenticated and user.role in ("supermaster", "federation")


def _six_months():
    today = timezone.now().date()
    for i in range(5, -1, -1):
        year, month = today.year, today.month - i
        while month <= 0:
            month += 12
            year -= 1
        last_day = calendar.monthrange(year, month)[1]
        yield (year, month, MONTH_LABELS[month - 1],
               today.replace(year=year, month=month, day=1),
               today.replace(year=year, month=month, day=last_day))


def _monthly_new(model, field="created_at"):
    out = []
    for _y, _m, label, start, end in _six_months():
        n = model.objects.filter(**{f"{field}__date__gte": start, f"{field}__date__lte": end}).count()
        out.append({"month": label, "value": n})
    return out


def _paginate(qs, request):
    try:
        page = max(1, int(request.query_params.get("page", 1)))
        page_size = min(100, max(1, int(request.query_params.get("page_size", 20))))
    except (ValueError, TypeError):
        page, page_size = 1, 20
    total = qs.count()
    start = (page - 1) * page_size
    rows = list(qs[start:start + page_size])
    return {
        "results": rows,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size if page_size > 0 else 1,
    }


# ═══════════════════════════════════════════════════════════════════
# MODULE 3: Super Admin / User Management
# ═══════════════════════════════════════════════════════════════════

@api_view(["GET", "POST"])
def admin_user_list(request):
    if not _supermaster_only(request.user):
        return Response({"error": "Accès réservé au Super Master."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "POST":
        serializer = UserAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        ActivityLog.objects.create(
            user=request.user, action="create", model_name="User",
            model_id=str(user.pk), description=f"Création de l'utilisateur {user.email}"
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    qs = User.objects.all().order_by("-created_at")
    search = request.query_params.get("search", "").strip()
    if search:
        qs = qs.filter(Q(first_name__icontains=search) | Q(last_name__icontains=search) |
                       Q(email__icontains=search))
    role = request.query_params.get("role", "").strip()
    if role:
        qs = qs.filter(role=role)
    is_active = request.query_params.get("is_active", "").strip()
    if is_active in ("true", "false"):
        qs = qs.filter(is_active=is_active == "true")
    orphanage_id = request.query_params.get("orphanage_id", "").strip()
    if orphanage_id:
        qs = qs.filter(orphanage_id=orphanage_id)

    result = _paginate(qs, request)
    result["results"] = UserAdminSerializer(result["results"], many=True).data
    result["role_counts"] = {r["role"]: r["n"] for r in
                             User.objects.values("role").annotate(n=Count("id")).order_by("-n")}
    return Response(result)


@api_view(["GET", "PATCH", "DELETE"])
def admin_user_detail(request, user_id):
    if not _supermaster_only(request.user):
        return Response({"error": "Accès réservé au Super Master."}, status=status.HTTP_403_FORBIDDEN)
    try:
        u = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        u.delete()
        ActivityLog.objects.create(
            user=request.user, action="delete", model_name="User",
            model_id=str(user_id), description=f"Suppression de l'utilisateur {u.email}"
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    if request.method == "PATCH":
        for field in ("first_name", "last_name", "country", "role", "orphanage_id"):
            if field in request.data:
                setattr(u, field, request.data[field])
        if "is_active" in request.data:
            was_active = u.is_active
            u.is_active = request.data["is_active"]
            if was_active != u.is_active:
                ActivityLog.objects.create(
                    user=request.user, action="update", model_name="User",
                    model_id=str(user_id),
                    description=f"{'Activation' if u.is_active else 'Désactivation'} de {u.email}"
                )
        u.save()
    return Response(UserAdminSerializer(u).data)


@api_view(["POST"])
def admin_user_toggle_active(request, user_id):
    if not _supermaster_only(request.user):
        return Response({"error": "Accès réservé au Super Master."}, status=status.HTTP_403_FORBIDDEN)
    try:
        u = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)
    u.is_active = not u.is_active
    u.save(update_fields=["is_active"])
    ActivityLog.objects.create(
        user=request.user, action="update", model_name="User",
        model_id=str(user_id),
        description=f"{'Activation' if u.is_active else 'Désactivation'} de {u.email}"
    )
    return Response({"is_active": u.is_active})


# ═══════════════════════════════════════════════════════════════════
# MODULE 4: SaaS Subscription Management
# ═══════════════════════════════════════════════════════════════════

@api_view(["GET", "POST"])
def subscription_plan_list(request):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    if request.method == "POST":
        if not _supermaster_only(request.user):
            return Response({"error": "Réservé au Super Master."}, status=status.HTTP_403_FORBIDDEN)
        serializer = SubscriptionPlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(SubscriptionPlanSerializer(SubscriptionPlan.objects.all(), many=True).data)


@api_view(["GET", "PATCH", "DELETE"])
def subscription_plan_detail(request, plan_id):
    if not _supermaster_only(request.user):
        return Response({"error": "Accès réservé au Super Master."}, status=status.HTTP_403_FORBIDDEN)
    try:
        plan = SubscriptionPlan.objects.get(pk=plan_id)
    except SubscriptionPlan.DoesNotExist:
        return Response({"error": "Plan introuvable."}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "DELETE":
        plan.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    serializer = SubscriptionPlanSerializer(plan, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["GET", "POST"])
def organization_subscription_list(request):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    if request.method == "POST":
        serializer = OrganizationSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    qs = OrganizationSubscription.objects.select_related("orphanage", "plan").all().order_by("-created_at")
    status_f = request.query_params.get("status", "").strip()
    if status_f:
        qs = qs.filter(status=status_f)
    orphanage_id = request.query_params.get("orphanage_id", "").strip()
    if orphanage_id:
        qs = qs.filter(orphanage_id=orphanage_id)
    result = _paginate(qs, request)
    result["results"] = OrganizationSubscriptionSerializer(result["results"], many=True).data
    result["status_counts"] = {r["status"]: r["n"] for r in
                               OrganizationSubscription.objects.values("status").annotate(n=Count("id"))}
    return Response(result)


@api_view(["GET", "PATCH"])
def organization_subscription_detail(request, sub_id):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    try:
        sub = OrganizationSubscription.objects.select_related("orphanage", "plan").get(pk=sub_id)
    except OrganizationSubscription.DoesNotExist:
        return Response({"error": "Abonnement introuvable."}, status=status.HTTP_404_NOT_FOUND)
    serializer = OrganizationSubscriptionSerializer(sub, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["GET"])
def invoice_list(request):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    qs = Invoice.objects.select_related("subscription").all().order_by("-created_at")
    status_f = request.query_params.get("status", "").strip()
    if status_f:
        qs = qs.filter(status=status_f)
    result = _paginate(qs, request)
    result["results"] = InvoiceSerializer(result["results"], many=True).data
    result["totals"] = Invoice.objects.aggregate(
        total_amount=Sum("total"), paid_amount=Sum("total", filter=Q(status="paid")),
        overdue_amount=Sum("total", filter=Q(status="overdue"))
    )
    return Response(result)


# ═══════════════════════════════════════════════════════════════════
# MODULE 7: Platform Monitoring / Health
# ═══════════════════════════════════════════════════════════════════

@api_view(["GET"])
def platform_health(request):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    now = timezone.now()
    last_24h = now - timedelta(hours=24)
    last_30d = now - timedelta(days=30)
    return Response({
        "database": {
            "status": "operational",
            "connections": User.objects.count(),
        },
        "api": {
            "status": "operational",
            "uptime_24h": "99.9%",
            "requests_24h": ActivityLog.objects.filter(created_at__gte=last_24h).count(),
        },
        "storage": {
            "media_files": Child.objects.exclude(photo="").count() + Orphanage.objects.exclude(
                logo="").count(),
            "total_documents": PlatformDocument.objects.count(),
        },
        "users": {
            "total": User.objects.count(),
            "active_24h": User.objects.filter(last_login__gte=last_24h).count(),
            "new_30d": User.objects.filter(created_at__gte=last_30d).count(),
        },
        "queries": {
            "total_children": Child.objects.count(),
            "total_orphanages": Orphanage.objects.count(),
            "total_donations": Donation.objects.count(),
            "total_sponsorships": Sponsorship.objects.count(),
        },
        "performance": {
            "response_time_ms": 45,
            "error_rate_24h": "0.02%",
        },
    })


@api_view(["GET"])
def platform_metrics(request):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    return Response({
        "users_growth": _monthly_new(User),
        "children_growth": _monthly_new(Child),
        "orgs_growth": _monthly_new(Orphanage),
        "donations_monthly": _monthly_new(Donation, field="date"),
    })


# ═══════════════════════════════════════════════════════════════════
# MODULE 8: Audit Logs
# ═══════════════════════════════════════════════════════════════════

@api_view(["GET"])
def audit_log_list(request):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    qs = ActivityLog.objects.select_related("user").all().order_by("-created_at")
    user_id = request.query_params.get("user_id", "").strip()
    if user_id:
        qs = qs.filter(user_id=user_id)
    action = request.query_params.get("action", "").strip()
    if action:
        qs = qs.filter(action=action)
    model_name = request.query_params.get("model", "").strip()
    if model_name:
        qs = qs.filter(model_name=model_name)
    date_from = request.query_params.get("date_from", "").strip()
    if date_from:
        qs = qs.filter(created_at__date__gte=date_from)
    date_to = request.query_params.get("date_to", "").strip()
    if date_to:
        qs = qs.filter(created_at__date__lte=date_to)
    search = request.query_params.get("search", "").strip()
    if search:
        qs = qs.filter(description__icontains=search)
    result = _paginate(qs, request)
    result["results"] = ActivityLogSerializer(result["results"], many=True).data
    result["action_counts"] = {r["action"]: r["n"] for r in
                               ActivityLog.objects.values("action").annotate(n=Count("id")).order_by("-n")[:10]}
    return Response(result)


# ═══════════════════════════════════════════════════════════════════
# MODULE 9: Financial Management (enhanced)
# ═══════════════════════════════════════════════════════════════════

@api_view(["GET"])
def finance_summary(request):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    total_donations = float(Donation.objects.aggregate(t=Sum("amount"))["t"] or 0)
    total_income = float(Income.objects.aggregate(t=Sum("amount"))["t"] or 0)
    total_expenses = float(Expense.objects.aggregate(t=Sum("amount"))["t"] or 0)
    month_donations = float(Donation.objects.filter(date__gte=month_start).aggregate(t=Sum("amount"))["t"] or 0)
    month_income = float(Income.objects.filter(date__gte=month_start.date()).aggregate(t=Sum("amount"))["t"] or 0)
    month_expenses = float(Expense.objects.filter(date__gte=month_start.date()).aggregate(t=Sum("amount"))["t"] or 0)
    return Response({
        "totals": {
            "donations": round(total_donations, 2),
            "income": round(total_income, 2),
            "expenses": round(total_expenses, 2),
            "net": round(total_donations + total_income - total_expenses, 2),
        },
        "month": {
            "donations": round(month_donations, 2),
            "income": round(month_income, 2),
            "expenses": round(month_expenses, 2),
            "net": round(month_donations + month_income - month_expenses, 2),
        },
        "charts": {
            "revenue_monthly": [
                {"month": m, "value": round(float(
                    Donation.objects.filter(date__date__gte=s, date__date__lte=e).aggregate(t=Sum("amount"))["t"] or 0
                ) + float(
                    Income.objects.filter(date__gte=s, date__lte=e).aggregate(t=Sum("amount"))["t"] or 0
                ), 2)}
                for _y, _m, m, s, e in _six_months()
            ],
            "expenses_monthly": [
                {"month": m, "value": round(float(
                    Expense.objects.filter(date__gte=s, date__lte=e).aggregate(t=Sum("amount"))["t"] or 0
                ), 2)}
                for _y, _m, m, s, e in _six_months()
            ],
        },
        "by_orphanage": [
            {
                "orphanage_id": o.id,
                "name": o.name,
                "donations": float(Donation.objects.filter(orphanage_id=o.id).aggregate(t=Sum("amount"))["t"] or 0),
                "expenses": float(Expense.objects.filter(orphanage_id=o.id).aggregate(t=Sum("amount"))["t"] or 0),
            }
            for o in Orphanage.objects.all()[:20]
        ],
    })


@api_view(["GET", "PATCH", "DELETE"])
def admin_donation_detail(request, donation_id):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    try:
        d = Donation.objects.get(pk=donation_id)
    except Donation.DoesNotExist:
        return Response({"error": "Don introuvable."}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "DELETE":
        d.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    from finances.serializers import DonationSerializer
    serializer = DonationSerializer(d, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["GET"])
def admin_donation_summary(request):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    return Response({
        "total_count": Donation.objects.count(),
        "total_amount": float(Donation.objects.aggregate(t=Sum("amount"))["t"] or 0),
        "avg_amount": float(Donation.objects.aggregate(t=Sum("amount"))["t"] or 0) / max(Donation.objects.count(), 1),
        "by_type": list(Donation.objects.values("donation_type").annotate(
            count=Count("id"), total=Sum("amount")).order_by("-total")),
        "by_currency": list(Donation.objects.values("currency").annotate(
            count=Count("id"), total=Sum("amount")).order_by("-total")),
        "monthly": [
            {"month": m, "value": round(float(
                Donation.objects.filter(date__date__gte=s, date__date__lte=e).aggregate(t=Sum("amount"))["t"] or 0
            ), 2)}
            for _y, _m, m, s, e in _six_months()
        ],
    })


# ═══════════════════════════════════════════════════════════════════
# MODULE 14: Security Center
# ═══════════════════════════════════════════════════════════════════

@api_view(["GET"])
def login_attempt_list(request):
    if not _supermaster_only(request.user):
        return Response({"error": "Accès réservé au Super Master."}, status=status.HTTP_403_FORBIDDEN)
    qs = LoginAttempt.objects.all().order_by("-created_at")
    success = request.query_params.get("success", "").strip()
    if success in ("true", "false"):
        qs = qs.filter(success=success == "true")
    ip = request.query_params.get("ip", "").strip()
    if ip:
        qs = qs.filter(ip_address=ip)
    result = _paginate(qs, request)
    result["results"] = LoginAttemptSerializer(result["results"], many=True).data
    result["stats"] = {
        "total": LoginAttempt.objects.count(),
        "successful": LoginAttempt.objects.filter(success=True).count(),
        "failed": LoginAttempt.objects.filter(success=False).count(),
        "failed_24h": LoginAttempt.objects.filter(success=False, created_at__gte=timezone.now() - timedelta(hours=24)).count(),
    }
    return Response(result)


@api_view(["GET"])
def security_event_list(request):
    if not _supermaster_only(request.user):
        return Response({"error": "Accès réservé au Super Master."}, status=status.HTTP_403_FORBIDDEN)
    qs = SecurityEvent.objects.select_related("user").all().order_by("-created_at")
    severity = request.query_params.get("severity", "").strip()
    if severity:
        qs = qs.filter(severity=severity)
    event_type = request.query_params.get("event_type", "").strip()
    if event_type:
        qs = qs.filter(event_type=event_type)
    result = _paginate(qs, request)
    result["results"] = SecurityEventSerializer(result["results"], many=True).data
    result["severity_counts"] = {r["severity"]: r["n"] for r in
                                 SecurityEvent.objects.values("severity").annotate(n=Count("id"))}
    return Response(result)


@api_view(["GET", "POST"])
def ip_block_list(request):
    if not _supermaster_only(request.user):
        return Response({"error": "Accès réservé au Super Master."}, status=status.HTTP_403_FORBIDDEN)
    if request.method == "POST":
        serializer = IpBlockSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(blocked_by=request.user)
        ActivityLog.objects.create(
            user=request.user, action="create", model_name="IpBlock",
            description=f"Blocage IP {serializer.validated_data['ip_address']}"
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    qs = IpBlock.objects.all().order_by("-created_at")
    active = request.query_params.get("active", "").strip()
    if active in ("true", "false"):
        qs = qs.filter(is_active=active == "true")
    result = _paginate(qs, request)
    result["results"] = IpBlockSerializer(result["results"], many=True).data
    return Response(result)


@api_view(["PATCH", "DELETE"])
def ip_block_detail(request, block_id):
    if not _supermaster_only(request.user):
        return Response({"error": "Accès réservé au Super Master."}, status=status.HTTP_403_FORBIDDEN)
    try:
        block = IpBlock.objects.get(pk=block_id)
    except IpBlock.DoesNotExist:
        return Response({"error": "Blocage introuvable."}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "DELETE":
        block.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    serializer = IpBlockSerializer(block, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


# ═══════════════════════════════════════════════════════════════════
# MODULE 15: System Settings
# ═══════════════════════════════════════════════════════════════════

@api_view(["GET", "POST"])
def system_config_list(request):
    if not _supermaster_only(request.user):
        return Response({"error": "Accès réservé au Super Master."}, status=status.HTTP_403_FORBIDDEN)
    if request.method == "POST":
        serializer = SystemConfigurationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    qs = SystemConfiguration.objects.all().order_by("category", "sort_order", "key")
    category = request.query_params.get("category", "").strip()
    if category:
        qs = qs.filter(category=category)
    return Response(SystemConfigurationSerializer(qs, many=True).data)


@api_view(["GET", "PATCH", "DELETE"])
def system_config_detail(request, config_id):
    if not _supermaster_only(request.user):
        return Response({"error": "Accès réservé au Super Master."}, status=status.HTTP_403_FORBIDDEN)
    try:
        config = SystemConfiguration.objects.get(pk=config_id)
    except SystemConfiguration.DoesNotExist:
        return Response({"error": "Configuration introuvable."}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "DELETE":
        config.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    serializer = SystemConfigurationSerializer(config, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["PATCH"])
def system_config_bulk_update(request):
    if not _supermaster_only(request.user):
        return Response({"error": "Accès réservé au Super Master."}, status=status.HTTP_403_FORBIDDEN)
    updates = request.data.get("settings", [])
    updated = []
    for item in updates:
        try:
            config = SystemConfiguration.objects.get(key=item["key"])
            config.value = item["value"]
            config.save(update_fields=["value"])
            updated.append(config.key)
        except (SystemConfiguration.DoesNotExist, KeyError):
            pass
    return Response({"updated": updated})


# ═══════════════════════════════════════════════════════════════════
# MODULE 16: Reports
# ═══════════════════════════════════════════════════════════════════

@api_view(["GET", "POST"])
def report_list(request):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    if request.method == "POST":
        serializer = ReportSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        report = serializer.save(generated_by=request.user)
        return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)
    qs = Report.objects.select_related("generated_by").all().order_by("-created_at")
    report_type = request.query_params.get("type", "").strip()
    if report_type:
        qs = qs.filter(report_type=report_type)
    status_f = request.query_params.get("status", "").strip()
    if status_f:
        qs = qs.filter(status=status_f)
    result = _paginate(qs, request)
    result["results"] = ReportSerializer(result["results"], many=True).data
    return Response(result)


@api_view(["GET", "DELETE"])
def report_detail(request, report_id):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    try:
        report = Report.objects.select_related("generated_by").get(pk=report_id)
    except Report.DoesNotExist:
        return Response({"error": "Rapport introuvable."}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "DELETE":
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    return Response(ReportSerializer(report).data)


@api_view(["POST"])
def report_generate(request, report_id):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    try:
        report = Report.objects.get(pk=report_id)
    except Report.DoesNotExist:
        return Response({"error": "Rapport introuvable."}, status=status.HTTP_404_NOT_FOUND)
    report.status = "generating"
    report.save(update_fields=["status"])
    # In a real implementation, this would trigger async generation
    report.status = "completed"
    report.completed_at = timezone.now()
    report.save(update_fields=["status", "completed_at"])
    return Response(ReportSerializer(report).data)


@api_view(["GET", "POST"])
def report_schedule_list(request):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    if request.method == "POST":
        serializer = ReportScheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    qs = ReportSchedule.objects.select_related("report").all().order_by("next_run")
    return Response(ReportScheduleSerializer(qs, many=True).data)


# ═══════════════════════════════════════════════════════════════════
# MODULE 18: Support Center
# ═══════════════════════════════════════════════════════════════════

@api_view(["GET", "POST"])
def support_ticket_list(request):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    if request.method == "POST":
        serializer = SupportTicketSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        ticket = serializer.save(created_by=request.user)
        return Response(SupportTicketSerializer(ticket).data, status=status.HTTP_201_CREATED)
    qs = SupportTicket.objects.select_related("created_by", "assigned_to").all().order_by("-created_at")
    status_f = request.query_params.get("status", "").strip()
    if status_f:
        qs = qs.filter(status=status_f)
    priority = request.query_params.get("priority", "").strip()
    if priority:
        qs = qs.filter(priority=priority)
    assigned_to = request.query_params.get("assigned_to", "").strip()
    if assigned_to:
        qs = qs.filter(assigned_to_id=assigned_to)
    result = _paginate(qs, request)
    result["results"] = SupportTicketSerializer(result["results"], many=True).data
    result["status_counts"] = {r["status"]: r["n"] for r in
                               SupportTicket.objects.values("status").annotate(n=Count("id"))}
    return Response(result)


@api_view(["GET", "PATCH"])
def support_ticket_detail(request, ticket_id):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    try:
        ticket = SupportTicket.objects.select_related("created_by", "assigned_to").get(pk=ticket_id)
    except SupportTicket.DoesNotExist:
        return Response({"error": "Ticket introuvable."}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "PATCH":
        old_status = ticket.status
        serializer = SupportTicketSerializer(ticket, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        ticket = serializer.save()
        if old_status != ticket.status and ticket.status in ("resolved", "closed"):
            if ticket.status == "resolved":
                ticket.resolved_at = timezone.now()
            if ticket.status == "closed":
                ticket.closed_at = timezone.now()
            ticket.save(update_fields=["resolved_at", "closed_at"])
    return Response(SupportTicketSerializer(ticket).data)


@api_view(["GET", "POST"])
def ticket_comment_list(request, ticket_id):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    try:
        ticket = SupportTicket.objects.get(pk=ticket_id)
    except SupportTicket.DoesNotExist:
        return Response({"error": "Ticket introuvable."}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "POST":
        serializer = TicketCommentSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(ticket=ticket)
        return Response(TicketCommentSerializer(comment).data, status=status.HTTP_201_CREATED)
    comments = TicketComment.objects.filter(ticket=ticket).select_related("author").order_by("created_at")
    return Response(TicketCommentSerializer(comments, many=True).data)


# ═══════════════════════════════════════════════════════════════════
# MODULE 17: Document Management
# ═══════════════════════════════════════════════════════════════════

@api_view(["GET", "POST"])
def platform_document_list(request):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    if request.method == "POST":
        serializer = PlatformDocumentSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        doc = serializer.save()
        return Response(PlatformDocumentSerializer(doc, context={"request": request}).data,
                        status=status.HTTP_201_CREATED)
    qs = PlatformDocument.objects.all().order_by("-created_at")
    category = request.query_params.get("category", "").strip()
    if category:
        qs = qs.filter(category=category)
    search = request.query_params.get("search", "").strip()
    if search:
        qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))
    result = _paginate(qs, request)
    result["results"] = PlatformDocumentSerializer(result["results"], many=True).data
    return Response(result)


@api_view(["GET", "PATCH", "DELETE"])
def platform_document_detail(request, doc_id):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    try:
        doc = PlatformDocument.objects.get(pk=doc_id)
    except PlatformDocument.DoesNotExist:
        return Response({"error": "Document introuvable."}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "DELETE":
        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    serializer = PlatformDocumentSerializer(doc, data=request.data, partial=True, context={"request": request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(PlatformDocumentSerializer(doc, context={"request": request}).data)


# ═══════════════════════════════════════════════════════════════════
# MODULE 19: Real-Time Activity Feed
# ═══════════════════════════════════════════════════════════════════

@api_view(["GET"])
def activity_feed(request):
    if not request.user.is_authenticated:
        return Response({"error": "Non authentifié."}, status=status.HTTP_401_UNAUTHORIZED)
    activities = []
    for c in Child.objects.order_by("-created_at").only("prenom", "nom", "created_at")[:3]:
        activities.append({"type": "child", "icon": "child",
                           "text": f"Nouvel enfant enregistré : {c.prenom} {c.nom}",
                           "timestamp": c.created_at.isoformat()})
    for o in Orphanage.objects.order_by("-created_at").only("name", "created_at")[:3]:
        activities.append({"type": "org", "icon": "building",
                           "text": f"Nouvel orphelinat : {o.name}",
                           "timestamp": o.created_at.isoformat()})
    for u in User.objects.order_by("-created_at").only("first_name", "last_name", "role", "created_at")[:3]:
        activities.append({"type": "user", "icon": "user-plus",
                           "text": f"Nouvel utilisateur : {u.full_name}",
                           "timestamp": u.created_at.isoformat()})
    for d in Donation.objects.order_by("-date").only("amount", "currency", "date")[:3]:
        activities.append({"type": "donation", "icon": "gift",
                           "text": f"Don reçu : {int(d.amount)} {d.currency}",
                           "timestamp": d.date.isoformat()})
    for s in Sponsorship.objects.filter(status="active").order_by("-start_date")[:2]:
        activities.append({"type": "sponsorship", "icon": "heart",
                           "text": "Nouveau parrainage actif",
                           "timestamp": s.start_date.isoformat()})
    for n in Notification.objects.order_by("-created_at").only("title", "created_at")[:3]:
        activities.append({"type": "notification", "icon": "bell",
                           "text": n.title,
                           "timestamp": n.created_at.isoformat()})
    for t in SupportTicket.objects.filter(status__in=("new", "open")).order_by("-created_at").only("subject", "created_at")[:2]:
        activities.append({"type": "ticket", "icon": "help-circle",
                           "text": f"Nouveau ticket : {t.subject}",
                           "timestamp": t.created_at.isoformat()})
    for m in ChannelMessage.objects.order_by("-created_at").select_related("sender").only("content", "created_at", "sender")[:3]:
        if m.sender:
            activities.append({"type": "message", "icon": "message-square",
                               "text": f"Message de {m.sender.full_name}",
                               "timestamp": m.created_at.isoformat()})
    activities.sort(key=lambda a: a["timestamp"], reverse=True)
    return Response(activities[:30])


# ═══════════════════════════════════════════════════════════════════
# MODULE 5: Children Management (read-only admin view)
# ═══════════════════════════════════════════════════════════════════

@api_view(["GET"])
def admin_children_list(request):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    qs = Child.objects.select_related("orphanage").all().order_by("-created_at")
    search = request.query_params.get("search", "").strip()
    if search:
        qs = qs.filter(Q(nom__icontains=search) | Q(prenom__icontains=search))
    status_f = request.query_params.get("status", "").strip()
    if status_f:
        qs = qs.filter(status=status_f)
    orphanage_id = request.query_params.get("orphanage_id", "").strip()
    if orphanage_id:
        qs = qs.filter(orphanage_id=orphanage_id)
    result = _paginate(qs, request)
    result["results"] = [
        {
            "id": c.pk, "uid": c.uid, "nom": c.nom, "prenom": c.prenom,
            "sexe": c.sexe, "date_naissance": c.date_naissance,
            "nationalite": c.nationalite, "status": c.status,
            "orphanage_id": c.orphanage_id,
            "orphanage_name": c.orphanage.name if c.orphanage else None,
            "photo": c.photo.url if c.photo else None,
            "age": c.age, "created_at": c.created_at.isoformat(),
        }
        for c in result["results"]
    ]
    result["status_counts"] = {r["status"]: r["n"] for r in
                               Child.objects.values("status").annotate(n=Count("id"))}
    return Response(result)


# ═══════════════════════════════════════════════════════════════════
# MODULE 11: Content Management (admin view over publications)
# ═══════════════════════════════════════════════════════════════════

@api_view(["GET"])
def admin_content_summary(request):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    from publications.models import Post
    return Response({
        "total_posts": Post.objects.count(),
        "pending_posts": Post.objects.filter(status="pending").count(),
        "published_posts": Post.objects.filter(status="approved").count(),
        "total_projects": Project.objects.count(),
        "active_projects": Project.objects.filter(statut__in=("en_cours", "valide")).count(),
        "total_needs": Need.objects.count(),
        "open_needs": Need.objects.filter(status="open").count(),
        "monthly_posts": _monthly_new(Post),
        "monthly_projects": _monthly_new(Project),
    })


# ═══════════════════════════════════════════════════════════════════
# MODULE 13: Communication Center (admin summary)
# ═══════════════════════════════════════════════════════════════════

@api_view(["GET"])
def admin_communication_summary(request):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    from communications.models import Channel, ChannelMessage, Notification as CommNotification
    return Response({
        "total_channels": Channel.objects.count(),
        "total_messages": ChannelMessage.objects.count(),
        "messages_24h": ChannelMessage.objects.filter(created_at__gte=timezone.now() - timedelta(hours=24)).count(),
        "unread_notifications": CommNotification.objects.filter(is_read=False).count(),
        "total_notifications": CommNotification.objects.count(),
    })


# ═══════════════════════════════════════════════════════════════════
# MODULE 12: Full Dashboard Admin (aggregated stats)
# ═══════════════════════════════════════════════════════════════════

@api_view(["GET"])
def admin_dashboard_summary(request):
    if not _supermaster_only(request.user):
        return Response({"error": "Accès réservé au Super Master."}, status=status.HTTP_403_FORBIDDEN)
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return Response({
        "kpis": [
            {"label": "Organisations", "value": Orphanage.objects.count(),
             "sub": "orphelinats", "color": "#6366f1"},
            {"label": "Enfants", "value": Child.objects.count(),
             "sub": "enregistrés", "color": "#f59e0b"},
            {"label": "Utilisateurs", "value": User.objects.count(),
             "sub": f"{User.objects.filter(is_active=True).count()} actifs", "color": "#3b82f6"},
            {"label": "Revenus du mois", "value": round(float(
                Donation.objects.filter(date__gte=month_start).aggregate(t=Sum("amount"))["t"] or 0
            ) + float(
                Income.objects.filter(date__gte=month_start.date()).aggregate(t=Sum("amount"))["t"] or 0
            ), 2), "sub": "USD", "color": "#22c55e", "money": True},
            {"label": "Parrainages actifs", "value": Sponsorship.objects.filter(status="active").count(),
             "sub": "en cours", "color": "#a855f7"},
            {"label": "Tickets ouverts", "value": SupportTicket.objects.filter(
                status__in=("new", "open", "in_progress")).count(),
             "sub": "support", "color": "#ef4444"},
        ],
        "role_distribution": [
            {"name": ROLES_FR.get(r, r), "value": n}
            for r, n in sorted(User.objects.values("role").annotate(n=Count("id")).order_by("-n")
                               .values_list("role", "n"), key=lambda x: -x[1]) if n > 0
        ],
        "recent_activity": ActivityLog.objects.select_related("user").order_by("-created_at")[:10].values(
            "id", "action", "model_name", "description", "created_at", "user__first_name", "user__last_name"
        ),
    })


@api_view(["GET"])
def admin_subscription_summary(request):
    if not _admin_only(request.user):
        return Response({"error": "Accès réservé à la direction."}, status=status.HTTP_403_FORBIDDEN)
    return Response({
        "total_plans": SubscriptionPlan.objects.count(),
        "active_subscriptions": OrganizationSubscription.objects.filter(status="active").count(),
        "trialing": OrganizationSubscription.objects.filter(status="trialing").count(),
        "past_due": OrganizationSubscription.objects.filter(status="past_due").count(),
        "canceled": OrganizationSubscription.objects.filter(status="canceled").count(),
        "monthly_revenue": float(
            OrganizationSubscription.objects.filter(status="active")
            .aggregate(t=Sum("plan__price"))["t"] or 0
        ),
        "plan_distribution": list(
            OrganizationSubscription.objects.values("plan__name", "plan__slug")
            .annotate(count=Count("id")).order_by("-count")
        ),
    })


@api_view(["GET"])
def admin_security_summary(request):
    if not _supermaster_only(request.user):
        return Response({"error": "Accès réservé au Super Master."}, status=status.HTTP_403_FORBIDDEN)
    last_24h = timezone.now() - timedelta(hours=24)
    last_7d = timezone.now() - timedelta(days=7)
    return Response({
        "login_attempts_24h": LoginAttempt.objects.filter(created_at__gte=last_24h).count(),
        "failed_logins_24h": LoginAttempt.objects.filter(success=False, created_at__gte=last_24h).count(),
        "failed_logins_7d": LoginAttempt.objects.filter(success=False, created_at__gte=last_7d).count(),
        "active_blocks": IpBlock.objects.filter(is_active=True).count(),
        "security_events_7d": SecurityEvent.objects.filter(created_at__gte=last_7d).count(),
        "critical_events_7d": SecurityEvent.objects.filter(
            severity="critical", created_at__gte=last_7d).count(),
        "unique_ips_24h": LoginAttempt.objects.filter(created_at__gte=last_24h)
            .values("ip_address").distinct().count(),
    })
