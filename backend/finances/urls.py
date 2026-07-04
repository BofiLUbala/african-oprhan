from django.urls import path
from . import views

urlpatterns = [
    path("dons/", views.donation_list, name="donation-list"),
    path("revenus/", views.income_list, name="income-list"),
    path("depenses/", views.expense_list, name="expense-list"),
]
