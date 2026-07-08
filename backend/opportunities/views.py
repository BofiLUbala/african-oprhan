from datetime import date

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q, F
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from children.models import Child
from projets.models import Project
from finances.models import Donation

from .models import Opportunity
from .serializers import OpportunitySerializer

User = get_user_model()


@api_view(["GET", "POST"])
def opportunity_list(request):
    if request.method == "GET":
        opps = Opportunity.objects.select_related("orphanage").all()

        type_filter = request.query_params.get("type", "")
        if type_filter:
            opps = opps.filter(type=type_filter)

        status_filter = request.query_params.get("status", "")
        if status_filter:
            opps = opps.filter(status=status_filter)

        priority_filter = request.query_params.get("priority", "")
        if priority_filter:
            opps = opps.filter(priority=priority_filter)

        search = request.query_params.get("search", "").strip()
        if search:
            opps = opps.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(location__icontains=search)
            )

        urgent = request.query_params.get("urgent", "")
        if urgent.lower() in ("1", "true"):
            opps = opps.filter(priority__in=["urgent", "critical"])

        funding = request.query_params.get("funding", "")
        if funding == "open":
            opps = opps.filter(
                Q(funding_goal__gt=0),
                Q(current_funding__lt=F("funding_goal")),
            )
        elif funding == "fully_funded":
            opps = opps.filter(
                Q(funding_goal__gt=0),
                Q(current_funding__gte=F("funding_goal")),
            )

        ordering = request.query_params.get("ordering", "-created_at")
        opps = opps.order_by(ordering)

        serializer = OpportunitySerializer(opps, many=True, context={"request": request})
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = OpportunitySerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH", "DELETE"])
def opportunity_detail(request, pk):
    try:
        opp = Opportunity.objects.select_related("orphanage").get(pk=pk)
    except Opportunity.DoesNotExist:
        return Response({"error": "Opportunité introuvable"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = OpportunitySerializer(opp, context={"request": request})
        return Response(serializer.data)

    elif request.method == "PATCH":
        serializer = OpportunitySerializer(opp, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        opp.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def partner_impact_stats(request):
    user = request.user

    total_children = Child.objects.count()
    total_projects = Project.objects.count()
    total_donations = Donation.objects.filter(status="completed").count()
    donation_sum = Donation.objects.filter(status="completed").aggregate(s=Sum("amount"))["s"] or 0

    project_funded = Project.objects.filter(
        Q(statut="approuve") | Q(statut="funded") | Q(statut="en_cours")
    ).count()

    active_opportunities = Opportunity.objects.filter(
        status__in=["published", "funding", "in_progress"]
    ).count()

    urgent_opportunities = Opportunity.objects.filter(
        status__in=["published", "funding"],
        priority__in=["urgent", "critical"],
    ).count()

    children_by_country = Child.objects.values("nationalite").annotate(
        count=Count("id")
    ).order_by("-count")

    opportunities_by_type = Opportunity.objects.values("type").annotate(
        count=Count("id")
    ).order_by("-count")

    recent_opportunities = Opportunity.objects.select_related("orphanage").order_by("-created_at")[:5]
    recent_serializer = OpportunitySerializer(
        recent_opportunities, many=True, context={"request": request}
    )

    return Response({
        "total_children": total_children,
        "total_projects": total_projects,
        "total_donations": total_donations,
        "donation_sum": donation_sum,
        "project_funded": project_funded,
        "active_opportunities": active_opportunities,
        "urgent_opportunities": urgent_opportunities,
        "children_by_country": list(children_by_country),
        "opportunities_by_type": list(opportunities_by_type),
        "recent_opportunities": recent_serializer.data,
    })


@api_view(["GET"])
def partner_child_list(request):
    children = Child.objects.select_related("orphanage").all().order_by("-created_at")

    search = request.query_params.get("search", "").strip()
    if search:
        children = children.filter(
            Q(nom__icontains=search) |
            Q(prenom__icontains=search) |
            Q(uid__icontains=search)
        )

    country = request.query_params.get("country", "")
    if country:
        children = children.filter(nationalite__icontains=country)

    sexe = request.query_params.get("sexe", "")
    if sexe:
        children = children.filter(sexe=sexe)

    age_min = request.query_params.get("age_min")
    age_max = request.query_params.get("age_max")
    if age_min or age_max:
        from datetime import date
        today = date.today()
        if age_min:
            max_birth = today.replace(year=today.year - int(age_min))
            children = children.filter(date_naissance__lte=max_birth)
        if age_max:
            min_birth = today.replace(year=today.year - int(age_max) - 1)
            children = children.filter(date_naissance__gte=min_birth)

    from children.serializers import ChildPublicSerializer
    serializer = ChildPublicSerializer(children, many=True, context={"request": request})
    return Response(serializer.data)
