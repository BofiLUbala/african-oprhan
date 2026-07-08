from rest_framework import serializers
from .models import Opportunity


class OpportunitySerializer(serializers.ModelSerializer):
    type_label = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()
    priority_label = serializers.SerializerMethodField()
    funding_percentage = serializers.SerializerMethodField()
    is_urgent = serializers.SerializerMethodField()
    orphanage_name = serializers.SerializerMethodField()
    related_object_url = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = Opportunity
        fields = [
            "id", "type", "type_label", "title", "description", "summary",
            "image", "images", "videos",
            "status", "status_label", "priority", "priority_label",
            "funding_goal", "current_funding", "funding_percentage",
            "beneficiary_count", "location", "deadline", "tags",
            "orphanage", "orphanage_name",
            "related_object_type", "related_object_id",
            "related_object_url",
            "created_by", "created_at", "updated_at",
            "is_urgent", "days_remaining", "time_ago",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]

    def get_type_label(self, obj):
        return dict(Opportunity.OPPORTUNITY_TYPES).get(obj.type, obj.type)

    def get_status_label(self, obj):
        return dict(Opportunity.STATUS_CHOICES).get(obj.status, obj.status)

    def get_priority_label(self, obj):
        return dict(Opportunity.PRIORITY_CHOICES).get(obj.priority, obj.priority)

    def get_funding_percentage(self, obj):
        return obj.funding_percentage

    def get_is_urgent(self, obj):
        return obj.is_urgent

    def get_orphanage_name(self, obj):
        return obj.orphanage.name if obj.orphanage else ""

    def get_related_object_url(self, obj):
        if not obj.related_object:
            return None
        content_type = obj.related_object_type.model if obj.related_object_type else ""
        obj_id = obj.related_object_id
        return f"/api/{content_type}s/{obj_id}/"

    def get_days_remaining(self, obj):
        if not obj.deadline:
            return None
        from datetime import date
        delta = obj.deadline - date.today()
        return delta.days

    def get_time_ago(self, obj):
        from django.utils import timezone
        delta = timezone.now() - obj.created_at
        if delta.days > 0:
            return f"il y a {delta.days}j"
        if delta.seconds >= 3600:
            return f"il y a {delta.seconds // 3600}h"
        if delta.seconds >= 60:
            return f"il y a {delta.seconds // 60}min"
        return "à l'instant"

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)
