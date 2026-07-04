from django.contrib import admin
from .models import ChildHistory, ConsultationHistorique, FichierJoint


@admin.register(ChildHistory)
class ChildHistoryAdmin(admin.ModelAdmin):
    list_display = ("title", "child", "event_type", "priority", "statut_validation",
                    "niveau_sensibilite", "performed_by", "event_date")
    list_filter = ("event_type", "category", "priority", "statut_validation",
                   "niveau_sensibilite", "source_module")
    search_fields = ("title", "description", "reason", "child__nom", "child__prenom")
    readonly_fields = ("hash_precedent", "hash_courant", "created_at")

    def has_delete_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        return False


@admin.register(ConsultationHistorique)
class ConsultationHistoriqueAdmin(admin.ModelAdmin):
    list_display = ("utilisateur", "enfant", "horodatage")
    list_filter = ("horodatage",)
    search_fields = ("utilisateur__email", "enfant__nom", "enfant__prenom")
    readonly_fields = ("utilisateur", "enfant", "horodatage", "filtre_applique")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


@admin.register(FichierJoint)
class FichierJointAdmin(admin.ModelAdmin):
    list_display = ("nom", "taille", "type_mime", "uploaded_by", "uploaded_at")
    search_fields = ("nom",)
