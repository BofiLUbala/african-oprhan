from django.contrib import admin

from .models import Donation, Income, Expense, PaymentProvider, Transaction


@admin.register(PaymentProvider)
class PaymentProviderAdmin(admin.ModelAdmin):
    list_display = ["name", "display_name", "is_active", "sort_order"]
    list_editable = ["is_active", "sort_order"]


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ["reference_number", "payer", "transaction_type", "amount", "currency", "status", "created_at"]
    list_filter = ["transaction_type", "status", "payment_method"]
    search_fields = ["reference_number", "payer__email", "provider_reference"]


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ["donator", "donation_type", "amount", "currency", "status", "orphanage", "date"]
    list_filter = ["donation_type", "status"]


admin.site.register(Income)
admin.site.register(Expense)
