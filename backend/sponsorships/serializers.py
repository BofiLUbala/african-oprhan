from rest_framework import serializers
from .models import Sponsorship, SponsorshipPayment


class SponsorshipPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SponsorshipPayment
        fields = ["id", "sponsorship", "amount", "date", "transaction_id"]
        read_only_fields = ["sponsorship", "date"]


class SponsorshipSerializer(serializers.ModelSerializer):
    sponsorship_type_label = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()
    sponsor_name = serializers.SerializerMethodField()
    child_name = serializers.SerializerMethodField()
    payments = SponsorshipPaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Sponsorship
        fields = [
            "id", "sponsor", "sponsor_name", "child", "child_name",
            "sponsorship_type", "sponsorship_type_label", "amount", "status",
            "status_label", "start_date", "end_date", "payments",
        ]
        read_only_fields = ["sponsor", "start_date"]

    def get_sponsorship_type_label(self, obj):
        return dict(Sponsorship.SPONSORSHIP_TYPES).get(obj.sponsorship_type, obj.sponsorship_type)

    def get_status_label(self, obj):
        return dict(Sponsorship.STATUS_CHOICES).get(obj.status, obj.status)

    def get_sponsor_name(self, obj):
        return obj.sponsor.full_name

    def get_child_name(self, obj):
        return f"{obj.child.prenom} {obj.child.nom}"
