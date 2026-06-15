from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "full_name", "country", "role", "is_active", "created_at")
    list_filter = ("role", "country", "is_active")
    search_fields = ("email", "first_name", "last_name")
    ordering = ("-created_at",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Informations personnelles", {"fields": ("first_name", "last_name", "country", "role")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Vérification email", {"fields": ("email_verification_token", "verification_sent_at", "email_verified_at")}),
        ("Dates", {"fields": ("created_at", "updated_at")}),
    )

    readonly_fields = ("email_verification_token", "verification_sent_at", "email_verified_at", "created_at", "updated_at")

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "first_name", "last_name", "country", "role", "password1", "password2"),
            },
        ),
    )
