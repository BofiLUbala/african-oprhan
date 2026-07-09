from django.urls import path
from . import views

urlpatterns = [
    path("dons/", views.donation_list, name="donation-list"),
    path("revenus/", views.income_list, name="income-list"),
    path("depenses/", views.expense_list, name="expense-list"),
    path("providers/", views.provider_list, name="provider-list"),
    path("payments/initiate/", views.payment_initiate, name="payment-initiate"),
    path("payments/confirm/", views.payment_confirm, name="payment-confirm"),
    path("transactions/", views.transaction_list, name="transaction-list"),
    path("transactions/<str:ref>/", views.transaction_detail, name="transaction-detail"),
    path("admin/providers/", views.admin_provider_list, name="admin-provider-list"),
    path("admin/providers/create/", views.admin_provider_create, name="admin-provider-create"),
    path("admin/providers/<int:provider_id>/update/", views.admin_provider_update, name="admin-provider-update"),
    path("admin/providers/<int:provider_id>/toggle/", views.admin_provider_toggle, name="admin-provider-toggle"),
    path("admin/transactions/", views.admin_transaction_list, name="admin-transaction-list"),
]
