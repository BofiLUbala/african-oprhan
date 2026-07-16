import base64
import uuid
from django.core.files.base import ContentFile
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Child, ChildUpdate, ChildHistory, ChildAssignment, ConsultationHistorique

User = get_user_model()


def _compute_age(date_naissance):
    """Âge en années entières à partir d'une date de naissance — logique
    unique, réutilisée par ChildSerializer, ChildPublicSerializer et
    ChildAssignmentSerializer (auparavant dupliquée dans les deux premiers)."""
    if not date_naissance:
        return None
    from datetime import date
    today = date.today()
    return today.year - date_naissance.year - (
        (today.month, today.day) < (date_naissance.month, date_naissance.day)
    )


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
    orphanage_name = serializers.SerializerMethodField()

    class Meta:
        model = Child
        fields = [
            "id", "uid", "nom", "prenom", "sexe", "date_naissance",
            "nationalite", "photo", "adresse", "status", "extra_data",
            "orphanage", "orphanage_name",
            "created_by", "created_at", "updated_at",
            "status_label", "child_name", "age",
            "biography", "dream", "skills", "interests",
            "school_name", "school_level", "school_progress",
            "medical_info", "followers",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]
        extra_kwargs = {
            "uid": {"required": False, "read_only": False},
            "nom": {"allow_blank": True, "required": False},
            "prenom": {"allow_blank": True, "required": False},
            "nationalite": {"allow_blank": True, "required": False},
            "adresse": {"allow_blank": True, "required": False},
            "followers": {"read_only": True},
        }

    def get_status_label(self, obj):
        return dict(Child.STATUS_CHOICES).get(obj.status, obj.status)

    def get_child_name(self, obj):
        return f"{obj.prenom} {obj.nom}".strip()

    def get_orphanage_name(self, obj):
        return obj.orphanage.name if obj.orphanage else ""

    def get_age(self, obj):
        return _compute_age(obj.date_naissance)

    def validate_date_naissance(self, value):
        if value in (None, "", "null", "None"):
            return None
        return value

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Une mise à jour sans nouvelle image ne doit JAMAIS effacer la photo
        # existante (les formulaires renvoient souvent photo=null/'' par défaut).
        if "photo" in validated_data and not validated_data["photo"]:
            validated_data.pop("photo")
        return super().update(instance, validated_data)


class ChildPublicSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    orphanage_name = serializers.SerializerMethodField()
    sponsorship_status = serializers.SerializerMethodField()

    class Meta:
        model = Child
        fields = [
            "id", "uid", "nom", "prenom", "date_naissance", "age",
            "nationalite", "sexe", "photo_url", "orphanage_name",
            "status", "biography", "dream", "skills", "interests",
            "school_name", "school_level", "school_progress",
            "medical_info", "sponsorship_status",
        ]

    def get_sponsorship_status(self, obj):
        active = obj.sponsorships.filter(status="active").exists()
        return {"sponsored": active}

    def get_orphanage_name(self, obj):
        return obj.orphanage.name if obj.orphanage else ""

    def get_age(self, obj):
        return _compute_age(obj.date_naissance)

    IMAGE_EXTS = ('.jpg', '.jpeg', '.png', '.gif', '.webp')

    def get_photo_url(self, obj):
        if obj.photo:
            try:
                url = obj.photo.url
                request = self.context.get('request')
                return request.build_absolute_uri(url) if request else url
            except Exception:
                pass

        # No registration photo: fall back to the most recent real photo
        # uploaded through a chef d'orphelinat "update" for this child.
        for update in obj.updates.order_by('-created_at')[:20]:
            for attachment in (update.attachments or []):
                if isinstance(attachment, str) and attachment.startswith('http') \
                        and attachment.lower().endswith(self.IMAGE_EXTS):
                    return attachment
        return None


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

    sensibilite_label = serializers.SerializerMethodField()
    validation_label = serializers.SerializerMethodField()
    evenement_parent_id = serializers.IntegerField(read_only=True)
    hash_valide = serializers.SerializerMethodField()

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
            "attachments", "metadata", "linked_update",
            "niveau_sensibilite", "sensibilite_label",
            "statut_validation", "validation_label",
            "hash_precedent", "hash_courant", "hash_valide",
            "evenement_parent_id", "piece_jointe",
            "event_date", "created_at",
        ]
        read_only_fields = [
            "hash_precedent", "hash_courant",
            "niveau_sensibilite", "statut_validation",
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

    def get_sensibilite_label(self, obj):
        labels = dict(ChildHistory._meta.get_field('niveau_sensibilite').choices)
        return labels.get(obj.niveau_sensibilite, obj.niveau_sensibilite)

    def get_validation_label(self, obj):
        labels = dict(ChildHistory._meta.get_field('statut_validation').choices)
        return labels.get(obj.statut_validation, obj.statut_validation)

    def get_hash_valide(self, obj):
        if not obj.hash_courant:
            return None
        return obj.calculate_hash() == obj.hash_courant


class ChildHistoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChildHistory
        fields = [
            'event_type', 'title', 'description',
            'old_value', 'new_value', 'reason', 'note',
        ]

    def validate_event_type(self, value):
        valid = [c[0] for c in ChildHistory.EVENT_TYPE_CHOICES]
        if value not in valid:
            raise serializers.ValidationError(f"Type d'événement invalide. Choisir parmi : {', '.join(valid)}")
        return value


class CorrectionSerializer(serializers.Serializer):
    raison = serializers.CharField(required=True, min_length=10)
    nouvelle_valeur = serializers.CharField(required=False, allow_blank=True, default="")


class ValidationSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=[('valider', 'Valider'), ('rejeter', 'Rejeter')])
    commentaire = serializers.CharField(required=False, allow_blank=True, default="")


class ConsultationHistoriqueSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.SerializerMethodField()

    class Meta:
        model = ConsultationHistorique
        fields = ['id', 'utilisateur', 'utilisateur_nom', 'enfant', 'horodatage', 'filtre_applique']
        read_only_fields = ['utilisateur', 'horodatage']

    def get_utilisateur_nom(self, obj):
        return obj.utilisateur.full_name if obj.utilisateur else ""


class ChildAssignmentSerializer(serializers.ModelSerializer):
    child_name = serializers.SerializerMethodField()
    child_uid = serializers.SerializerMethodField()
    child_photo = serializers.SerializerMethodField()
    child_age = serializers.SerializerMethodField()
    child_status_label = serializers.SerializerMethodField()
    orphanage_name = serializers.SerializerMethodField()
    ambassador_name = serializers.SerializerMethodField()
    ambassador_avatar = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ChildAssignment
        fields = [
            "id", "child", "child_name", "child_uid", "child_photo",
            "child_age", "child_status_label",
            "orphanage_name",
            "ambassador", "ambassador_name", "ambassador_avatar",
            "assigned_by", "assigned_by_name",
            "note", "assigned_at", "updated_at",
        ]
        read_only_fields = ["assigned_by", "assigned_at", "updated_at"]

    def get_child_name(self, obj):
        return f"{obj.child.prenom} {obj.child.nom}".strip()

    def get_child_uid(self, obj):
        return obj.child.uid

    def get_child_photo(self, obj):
        return obj.child.photo.url if obj.child.photo else None

    def get_child_age(self, obj):
        return _compute_age(obj.child.date_naissance)

    def get_child_status_label(self, obj):
        return dict(Child.STATUS_CHOICES).get(obj.child.status, obj.child.status)

    def get_orphanage_name(self, obj):
        return obj.child.orphanage.name if obj.child.orphanage else ""

    def get_ambassador_name(self, obj):
        return obj.ambassador.full_name

    def get_ambassador_avatar(self, obj):
        return obj.ambassador.avatar.url if obj.ambassador.avatar else None

    def get_assigned_by_name(self, obj):
        return obj.assigned_by.full_name if obj.assigned_by else ""

    def create(self, validated_data):
        validated_data["assigned_by"] = self.context["request"].user
        return super().create(validated_data)
