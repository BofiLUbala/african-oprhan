from rest_framework import serializers
from .models import Donation, Income, Expense


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
            "status_label", "orphanage", "orphanage_name", "date",
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
