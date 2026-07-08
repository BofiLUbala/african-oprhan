from rest_framework import serializers
from .models import Donation, Income, Expense, PaymentProvider, Transaction


class PaymentProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentProvider
        fields = ["id", "name", "display_name", "is_active", "sort_order"]


class TransactionSerializer(serializers.ModelSerializer):
    payer_name = serializers.SerializerMethodField()
    transaction_type_label = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()
    payment_method_label = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            "id", "payer", "payer_name",
            "transaction_type", "transaction_type_label",
            "beneficiary_content_type", "beneficiary_object_id",
            "amount", "currency",
            "payment_method", "payment_method_label",
            "payment_provider",
            "status", "status_label",
            "reference_number", "provider_reference",
            "description", "metadata",
            "orphanage", "created_at", "completed_at",
        ]
        read_only_fields = ["reference_number", "created_at", "completed_at"]

    def get_payer_name(self, obj):
        return obj.payer.full_name if obj.payer else ""

    def get_transaction_type_label(self, obj):
        return dict(Transaction.TRANSACTION_TYPES).get(obj.transaction_type, obj.transaction_type)

    def get_status_label(self, obj):
        return dict(Transaction.STATUS_CHOICES).get(obj.status, obj.status)

    def get_payment_method_label(self, obj):
        return dict(Transaction.PAYMENT_METHOD_CHOICES).get(obj.payment_method, obj.payment_method)


class DonationSerializer(serializers.ModelSerializer):
    donation_type_label = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()
    donator_name = serializers.SerializerMethodField()
    orphanage_name = serializers.SerializerMethodField()

    class Meta:
        model = Donation
        fields = [
            "id", "donator", "donator_name", "donation_type", "donation_type_label",
            "amount", "currency", "description", "transaction_id", "status",
            "status_label", "orphanage", "orphanage_name",
            "child", "project", "linked_transaction", "date",
        ]
        read_only_fields = ["donator", "status", "date"]

    def get_donation_type_label(self, obj):
        return dict(Donation.DONATION_TYPES).get(obj.donation_type, obj.donation_type)

    def get_status_label(self, obj):
        return dict(Donation.STATUS_CHOICES).get(obj.status, obj.status)

    def get_donator_name(self, obj):
        return obj.donator.full_name if obj.donator else ""

    def get_orphanage_name(self, obj):
        return obj.orphanage.name if obj.orphanage else ""


class IncomeSerializer(serializers.ModelSerializer):
    orphanage_name = serializers.SerializerMethodField()

    class Meta:
        model = Income
        fields = ["id", "source", "amount", "date", "orphanage", "orphanage_name"]
        read_only_fields = ["date"]

    def get_orphanage_name(self, obj):
        return obj.orphanage.name if obj.orphanage else ""


class ExpenseSerializer(serializers.ModelSerializer):
    orphanage_name = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = ["id", "category", "amount", "description", "date", "orphanage", "orphanage_name"]
        read_only_fields = ["date"]

    def get_orphanage_name(self, obj):
        return obj.orphanage.name if obj.orphanage else ""
