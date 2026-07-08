from django.contrib import admin
from .models import Opportunity


@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    list_display = ["title", "type", "status", "priority", "funding_goal", "current_funding", "created_at"]
    list_filter = ["type", "status", "priority"]
    search_fields = ["title", "description", "location"]
    readonly_fields = ["created_at", "updated_at"]
