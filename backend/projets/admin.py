from django.contrib import admin

from .models import Project, CandidatureProjet, ProjetHistory


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("code", "titre", "type", "statut", "createur", "budget_total", "montant_collecte", "created_at")
    list_filter = ("statut", "type", "createur_role")
    search_fields = ("titre", "description", "createur__email")
    readonly_fields = ("createur", "createur_role", "montant_collecte")


@admin.register(CandidatureProjet)
class CandidatureProjetAdmin(admin.ModelAdmin):
    list_display = ("projet", "partenaire", "montant_propose", "statut", "created_at")
    list_filter = ("statut", "modalite")
    search_fields = ("partenaire__email", "projet__titre")


@admin.register(ProjetHistory)
class ProjetHistoryAdmin(admin.ModelAdmin):
    list_display = ("projet", "type_evenement", "statut_avant", "statut_apres", "auteur", "created_at")
    list_filter = ("type_evenement", "created_at")
    search_fields = ("projet__titre", "description")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
