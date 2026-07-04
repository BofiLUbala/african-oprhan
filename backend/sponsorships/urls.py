from django.urls import path
from . import views

urlpatterns = [
    path("parrainages/enfants-disponibles/", views.sponsorable_children_list, name="sponsorable-children"),
    path("parrainages/", views.sponsorship_list, name="sponsorship-list"),
    path("parrainages/<int:sponsorship_id>/", views.sponsorship_detail, name="sponsorship-detail"),
    path("parrainages/<int:sponsorship_id>/paiements/", views.sponsorship_payment_list, name="sponsorship-payment-list"),
]
