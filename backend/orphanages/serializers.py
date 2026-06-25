from rest_framework import serializers

from .models import Orphanage


class OrphanageSerializer(serializers.ModelSerializer):
    director_name = serializers.SerializerMethodField()
    ambassador_name = serializers.SerializerMethodField()

    class Meta:
        model = Orphanage
        fields = [
            "id", "name", "address", "capacity", "status", "latitude", "longitude",
            "document_details", "validation_note", "validated_at", "director",
            "director_name", "ambassador", "ambassador_name", "feedback",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "status", "validation_note", "validated_at", "director", "director_name",
            "ambassador_name", "feedback", "created_at", "updated_at",
        ]

    def get_director_name(self, obj):
        return obj.director.full_name if obj.director else ""

    def get_ambassador_name(self, obj):
        return obj.ambassador.full_name if obj.ambassador else ""

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["director"] = request.user
        validated_data["status"] = "pending"
        return super().create(validated_data)
