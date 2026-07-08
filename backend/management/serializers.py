from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import (
    SubscriptionPlan, OrganizationSubscription, Invoice,
    ActivityLog, LoginAttempt, SecurityEvent, IpBlock,
    SystemConfiguration, Report, ReportSchedule,
    SupportTicket, TicketComment, PlatformDocument
)

User = get_user_model()


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = "__all__"


class OrganizationSubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source="plan.name", read_only=True)
    orphanage_name = serializers.CharField(source="orphanage.name", read_only=True)

    class Meta:
        model = OrganizationSubscription
        fields = "__all__"


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = "__all__"


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = "__all__"

    def get_user_name(self, obj):
        return obj.user.full_name if obj.user else "Système"


class LoginAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginAttempt
        fields = "__all__"


class SecurityEventSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = SecurityEvent
        fields = "__all__"

    def get_user_name(self, obj):
        return obj.user.full_name if obj.user else None


class IpBlockSerializer(serializers.ModelSerializer):
    blocked_by_name = serializers.SerializerMethodField()

    class Meta:
        model = IpBlock
        fields = "__all__"

    def get_blocked_by_name(self, obj):
        return obj.blocked_by.full_name if obj.blocked_by else None


class SystemConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemConfiguration
        fields = "__all__"


class ReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = "__all__"

    def get_generated_by_name(self, obj):
        return obj.generated_by.full_name if obj.generated_by else None


class ReportScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportSchedule
        fields = "__all__"


class SupportTicketSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = "__all__"

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else None

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.full_name if obj.assigned_to else None

    def get_comment_count(self, obj):
        return obj.comments.count()


class TicketCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketComment
        fields = "__all__"
        read_only_fields = ["author"]

    def get_author_name(self, obj):
        return obj.author.full_name if obj.author else None

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)


class PlatformDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PlatformDocument
        fields = "__all__"
        read_only_fields = ["uploaded_by", "file_size", "mime_type"]

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.full_name if obj.uploaded_by else None

    def create(self, validated_data):
        request = self.context.get("request")
        if request:
            validated_data["uploaded_by"] = request.user
        return super().create(validated_data)


class UserAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "country", "role",
                   "is_active", "is_staff", "orphanage_id", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at", "email"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user
