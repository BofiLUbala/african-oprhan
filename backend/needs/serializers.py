from rest_framework import serializers
from .models import Need


class NeedSerializer(serializers.ModelSerializer):
    category_label = serializers.SerializerMethodField()
    priority_label = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = Need
        fields = [
            "id", "orphanage", "title", "category", "category_label",
            "priority", "priority_label", "description", "quantity",
            "status", "status_label", "created_by", "created_at", "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]

    def get_category_label(self, obj):
        return dict(Need.CATEGORY_CHOICES).get(obj.category, obj.category)

    def get_priority_label(self, obj):
        return dict(Need.PRIORITY_CHOICES).get(obj.priority, obj.priority)

    def get_status_label(self, obj):
        return dict(Need.STATUS_CHOICES).get(obj.status, obj.status)
