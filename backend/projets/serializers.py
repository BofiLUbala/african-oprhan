from rest_framework import serializers
from .models import Project, ProjectApplication


class ProjectListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id", "code", "type", "title", "summary", "description",
            "pdf_url", "status", "amount", "raised", "beneficiaries",
            "start_date", "end_date", "created_at",
        ]


class ProjectCreateSerializer(serializers.ModelSerializer):
    pdf_file = serializers.FileField(required=False, write_only=True)

    class Meta:
        model = Project
        fields = [
            "type", "title", "summary", "description",
            "pdf_url", "pdf_file", "start_date", "end_date",
        ]

    def create(self, validated_data):
        validated_data.pop("pdf_file", None)
        validated_data["created_by"] = self.context["request"].user
        import string, random
        chars = string.ascii_uppercase + string.digits
        code = "".join(random.choices(chars, k=8))
        # ensure uniqueness
        from .models import Project as P
        for _ in range(10):
            if not P.objects.filter(code=code).exists():
                break
            code = "".join(random.choices(chars, k=8))
        validated_data["code"] = code
        if not validated_data.get("summary") and validated_data.get("description"):
            validated_data["summary"] = validated_data["description"][:80]
        return super().create(validated_data)


class ProjectApplicationSerializer(serializers.ModelSerializer):
    applicant_name = serializers.SerializerMethodField()

    class Meta:
        model = ProjectApplication
        fields = ["id", "project", "applicant", "applicant_name", "message", "created_at"]
        read_only_fields = ["applicant", "project"]

    def get_applicant_name(self, obj):
        return obj.applicant.full_name
