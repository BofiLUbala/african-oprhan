from django.urls import path
from . import views

urlpatterns = [
    path("besoins/", views.need_list, name="need-list"),
]
