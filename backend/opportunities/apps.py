from django.apps import AppConfig


class OpportunitiesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "opportunities"
    verbose_name = "Opportunités Partenaires"

    def ready(self):
        import opportunities.signals
