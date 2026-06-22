from rest_framework import serializers
from .models import Child


class ChildSerializer(serializers.ModelSerializer):
    class Meta:
        model = Child
        fields = [
            "id", "uid", "nom", "prenom", "sexe", "date_naissance",
            "nationalite", "photo", "adresse", "extra_data",
            "created_by", "created_at", "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]
        extra_kwargs = {
            "uid": {"required": False, "read_only": False}
        }

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)
