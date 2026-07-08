from django.urls import path
from . import views

urlpatterns = [
    path("opportunities/", views.opportunity_list, name="opportunity-list"),
    path("opportunities/<int:pk>/", views.opportunity_detail, name="opportunity-detail"),
    path("partner/impact/", views.partner_impact_stats, name="partner-impact"),
    path("partner/children/", views.partner_child_list, name="partner-children"),
]
