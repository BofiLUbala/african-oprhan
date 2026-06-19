from django.contrib import admin
from .models import Child


@admin.register(Child)
class ChildAdmin(admin.ModelAdmin):
    list_display = ["uid", "prenom", "nom", "sexe", "date_naissance", "nationalite", "created_by", "created_at"]
    list_filter = ["sexe", "nationalite", "created_at"]
    search_fields = ["uid", "nom", "prenom", "nationalite"]
    readonly_fields = ["uid", "created_by", "created_at", "updated_at"]
