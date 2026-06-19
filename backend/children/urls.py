from django.urls import path
from . import views

urlpatterns = [
    path("enfants/", views.child_list, name="child-list"),
    path("enfants/<int:child_id>/", views.child_detail, name="child-detail"),
]
