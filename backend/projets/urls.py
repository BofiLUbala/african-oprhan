from django.urls import path
from . import views

urlpatterns = [
    path("projets/", views.project_list, name="project-list"),
    path("projets/<int:project_id>/apply/", views.project_apply, name="project-apply"),
]
