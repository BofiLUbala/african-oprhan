from rest_framework import serializers

from .models import DocumentType, Orphanage, OrphanageDocument


class DocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentType
        fields = "__all__"


class OrphanageDocumentSerializer(serializers.ModelSerializer):
    document_type_name = serializers.SerializerMethodField()
    document_type_required = serializers.SerializerMethodField()

    class Meta:
        model = OrphanageDocument
        fields = [
            "id", "orphanage", "document_type", "document_type_name",
            "document_type_required", "file", "status", "feedback",
            "points_to_update", "reviewed_by", "reviewed_at", "uploaded_at",
        ]
        read_only_fields = [
            "orphanage", "status", "feedback", "points_to_update",
            "reviewed_by", "reviewed_at", "uploaded_at",
        ]

    def get_document_type_name(self, obj):
        return obj.document_type.label

    def get_document_type_required(self, obj):
        return obj.document_type.required


class OrphanageSerializer(serializers.ModelSerializer):
    director_name = serializers.SerializerMethodField()

    class Meta:
        model = Orphanage
        fields = [
            "id", "name", "address", "capacity", "status", "latitude", "longitude",
            "document_details", "validation_note", "validated_at", "director",
            "director_name",
            "registration_cert", "operating_license", "director_id_doc", "tax_doc",
            "child_protection", "annual_report", "ngo_accreditation", "partnership_certs",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "status", "validation_note", "validated_at", "director", "director_name",
            "created_at", "updated_at",
        ]

    def get_director_name(self, obj):
        return obj.director.full_name if obj.director else ""

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["director"] = request.user
        validated_data["status"] = "pending"
        return super().create(validated_data)