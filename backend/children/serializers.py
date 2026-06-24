import base64
import uuid
from django.core.files.base import ContentFile
from rest_framework import serializers
from .models import Child, ChildUpdate, ChildHistory


class Base64ImageField(serializers.ImageField):
    def to_internal_value(self, data):
        if isinstance(data, str) and data.startswith("data:image"):
            fmt, imgstr = data.split(";base64,")
            ext = fmt.split("/")[-1] if "/" in fmt else "jpg"
            data = ContentFile(base64.b64decode(imgstr), name=f"{uuid.uuid4().hex}.{ext}")
        return super().to_internal_value(data)


class LenientChoiceField(serializers.ChoiceField):
    def to_internal_value(self, data):
        if isinstance(data, (list, tuple)):
            data = data[0] if data else ""
        return super().to_internal_value(data)


class ChildSerializer(serializers.ModelSerializer):
    photo = Base64ImageField(required=False, allow_null=True)
    sexe = LenientChoiceField(choices=Child.SEXE_CHOICES, allow_blank=True, required=False)
    status_label = serializers.SerializerMethodField()
    child_name = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()

    class Meta:
        model = Child
        fields = [
            "id", "uid", "nom", "prenom", "sexe", "date_naissance",
            "nationalite", "photo", "adresse", "status", "extra_data",
            "created_by", "created_at", "updated_at",
            "status_label", "child_name", "age",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]
        extra_kwargs = {
            "uid": {"required": False, "read_only": False},
            "nom": {"allow_blank": True, "required": False},
            "prenom": {"allow_blank": True, "required": False},
            "nationalite": {"allow_blank": True, "required": False},
            "adresse": {"allow_blank": True, "required": False},
        }

    def get_status_label(self, obj):
        return dict(Child.STATUS_CHOICES).get(obj.status, obj.status)

    def get_child_name(self, obj):
        return f"{obj.prenom} {obj.nom}".strip()

    def get_age(self, obj):
        if not obj.date_naissance:
            return None
        from datetime import date
        today = date.today()
        return today.year - obj.date_naissance.year - (
            (today.month, today.day) < (obj.date_naissance.month, obj.date_naissance.day)
        )

    def validate_date_naissance(self, value):
        if value in (None, "", "null", "None"):
            return None
        return value

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class ChildUpdateSerializer(serializers.ModelSerializer):
    child_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ChildUpdate
        fields = [
            "id", "child", "child_name", "category", "update_type",
            "title", "description", "previous_value", "new_value",
            "reason", "attachments", "created_by", "created_by_name",
            "created_at",
        ]
        read_only_fields = ["child", "created_by", "created_at"]

    def get_child_name(self, obj):
        return f"{obj.child.prenom} {obj.child.nom}".strip()

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        return ""

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class ChildHistorySerializer(serializers.ModelSerializer):
    child_name = serializers.SerializerMethodField()
    performed_by_name = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()
    priority_label = serializers.SerializerMethodField()
    category_label = serializers.SerializerMethodField()
    event_type_label = serializers.SerializerMethodField()
    source_module_label = serializers.SerializerMethodField()

    class Meta:
        model = ChildHistory
        fields = [
            "id", "child", "child_name", "event_type", "event_type_label",
            "category", "category_label", "subcategory",
            "title", "description", "old_value", "new_value",
            "status_before", "status_after", "reason", "note",
            "priority", "priority_label", "source_module", "source_module_label",
            "status_label",
            "performed_by", "performed_by_name", "performed_role", "department",
            "attachments", "metadata", "linked_update", "event_date", "created_at",
        ]

    def get_child_name(self, obj):
        return f"{obj.child.prenom} {obj.child.nom}".strip()

    def get_performed_by_name(self, obj):
        if obj.performed_by:
            return f"{obj.performed_by.first_name} {obj.performed_by.last_name}".strip()
        return ""

    def get_status_label(self, obj):
        return dict(Child.STATUS_CHOICES).get(obj.status_after or obj.status_before, "")

    def get_priority_label(self, obj):
        return dict(ChildHistory.PRIORITY_CHOICES).get(obj.priority, obj.priority)

    def get_category_label(self, obj):
        return dict(ChildHistory.CATEGORY_CHOICES).get(obj.category, obj.category)

    def get_event_type_label(self, obj):
        return dict(ChildHistory.EVENT_TYPE_CHOICES).get(obj.event_type, obj.event_type)

    def get_source_module_label(self, obj):
        return dict(ChildHistory.SOURCE_MODULE_CHOICES).get(obj.source_module, obj.source_module)
