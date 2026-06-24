import base64
import uuid
from django.core.files.base import ContentFile
from rest_framework import serializers
from .models import Child


class Base64ImageField(serializers.ImageField):
    def to_internal_value(self, data):
        if isinstance(data, str) and data.startswith("data:image"):
            fmt, imgstr = data.split(";base64,")
            ext = fmt.split("/")[-1] if "/" in fmt else "jpg"
            data = ContentFile(base64.b64decode(imgstr), name=f"{uuid.uuid4().hex}.{ext}")
        return super().to_internal_value(data)


class ChildSerializer(serializers.ModelSerializer):
    photo = Base64ImageField(required=False, allow_null=True)

    class Meta:
        model = Child
        fields = [
            "id", "uid", "nom", "prenom", "sexe", "date_naissance",
            "nationalite", "photo", "adresse", "extra_data",
            "created_by", "created_at", "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]
        extra_kwargs = {
            "uid": {"required": False, "read_only": False},
            "sexe": {"allow_blank": True, "required": False},
            "nom": {"allow_blank": True, "required": False},
            "prenom": {"allow_blank": True, "required": False},
            "nationalite": {"allow_blank": True, "required": False},
            "adresse": {"allow_blank": True, "required": False},
        }

    def validate_sexe(self, value):
        if value in (None, "", "null"):
            return ""
        if isinstance(value, (list, tuple)):
            value = value[0] if value else ""
        if value in ("M", "F"):
            return value
        if isinstance(value, str) and len(value) == 1:
            return value
        return ""

    def validate_date_naissance(self, value):
        if value in (None, "", "null", "None"):
            return None
        return value

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)
