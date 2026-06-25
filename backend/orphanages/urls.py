from django.urls import path

from . import views

urlpatterns = [
    path("orphanages/", views.orphanage_list, name="orphanage-list"),
    path("orphanages/<int:orphanage_id>/validate/", views.orphanage_validate, name="orphanage-validate"),
]
