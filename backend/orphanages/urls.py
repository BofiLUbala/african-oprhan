from django.urls import path

from . import views

urlpatterns = [
    path("orphanages/", views.orphanage_list, name="orphanage-list"),
    path("orphanages/<int:orphanage_id>/validate/", views.orphanage_validate, name="orphanage-validate"),
    path("orphanages/<int:orphanage_id>/assign-ambassador/", views.assign_ambassador, name="orphanage-assign-ambassador"),
    path("orphanages/<int:orphanage_id>/feedback/", views.orphanage_feedback, name="orphanage-feedback"),
]
