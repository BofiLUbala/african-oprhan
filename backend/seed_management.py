import os, django
from dotenv import load_dotenv
load_dotenv()
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from management.models import SystemConfiguration, SubscriptionPlan

defaults = [
    ("platform_name", "Plateforme Orphenlina", "Orphenlina", "string", "general", "Nom de la plateforme", 1),
    ("platform_tagline", "Tagline", "Ensemble, protégeons les orphelins", "string", "general", "Slogan de la plateforme", 2),
    ("maintenance_mode", "Mode maintenance", "false", "boolean", "general", "Activer/désactiver le mode maintenance", 3),
    ("max_orphanages_per_user", "Max orphelinats par utilisateur", "1", "number", "limits", "Nombre max d'orphelinats qu'un utilisateur peut gérer", 1),
    ("max_children_per_orphanage", "Max enfants par orphelinat", "100", "number", "limits", "Nombre max d'enfants par orphelinat", 2),
    ("allow_public_registration", "Inscription publique", "true", "boolean", "features", "Autoriser les inscriptions publiques", 1),
    ("allow_donations", "Dons autorisés", "true", "boolean", "features", "Autoriser les dons sur la plateforme", 2),
    ("allow_sponsorships", "Parrainages autorisés", "true", "boolean", "features", "Autoriser les parrainages", 3),
    ("session_timeout_minutes", "Timeout session (minutes)", "60", "number", "security", "Durée de validité d'une session", 1),
    ("max_login_attempts", "Tentatives de connexion max", "5", "number", "security", "Nombre max de tentatives avant blocage", 2),
    ("password_min_length", "Longueur min mot de passe", "8", "number", "security", "Longueur minimale du mot de passe", 3),
    ("smtp_host", "Serveur SMTP", "smtp.gmail.com", "string", "email", "Hôte du serveur SMTP", 1),
    ("smtp_port", "Port SMTP", "587", "number", "email", "Port du serveur SMTP", 2),
    ("smtp_use_tls", "SMTP TLS", "true", "boolean", "email", "Utiliser TLS pour SMTP", 3),
    ("default_from_email", "Email expéditeur", "noreply@orphenlina.org", "string", "email", "Adresse email par défaut", 4),
    ("enable_api_logging", "Journalisation API", "true", "boolean", "features", "Activer la journalisation des appels API", 4),
    ("enable_audit_trail", "Piste d'audit", "true", "boolean", "features", "Activer la piste d'audit complète", 5),
    ("default_currency", "Devise par défaut", "USD", "string", "general", "Devise utilisée par défaut", 4),
    ("timezone", "Fuseau horaire", "Africa/Kinshasa", "string", "general", "Fuseau horaire par défaut", 5),
    ("platform_language", "Langue par défaut", "fr", "string", "general", "Langue par défaut de la plateforme", 6),
]

for key, label, value, value_type, category, description, sort_order in defaults:
    SystemConfiguration.objects.get_or_create(
        key=key,
        defaults={
            "label": label,
            "value": value,
            "value_type": value_type,
            "category": category,
            "description": description,
            "sort_order": sort_order,
        }
    )
print(f"Seeded {SystemConfiguration.objects.count()} system configurations")

plans = [
    ("Gratuit", "free", "Plan de découverte gratuit", 0, "monthly", 1, 20, 5, {"storage_mb": 100, "support": "email"}),
    ("Essentiel", "essential", "Pour les petits orphelinats", 29, "monthly", 3, 50, 15, {"storage_mb": 500, "support": "email", "reports": True}),
    ("Professionnel", "professional", "Pour les orphelinats en croissance", 79, "monthly", 10, 200, 50, {"storage_mb": 2000, "support": "priority", "reports": True, "api_access": True}),
    ("Enterprise", "enterprise", "Solution complète pour grandes organisations", 199, "monthly", 0, 0, 0, {"storage_mb": 10000, "support": "dedicated", "reports": True, "api_access": True, "white_label": True, "custom_integrations": True}),
]

for i, (name, slug, description, price, interval, max_orphanages, max_children, max_users, features) in enumerate(plans):
    SubscriptionPlan.objects.get_or_create(
        slug=slug,
        defaults={
            "name": name,
            "description": description,
            "price": price,
            "interval": interval,
            "max_orphanages": max_orphanages,
            "max_children": max_children,
            "max_users": max_users,
            "features": features,
            "is_active": True,
            "sort_order": i,
        }
    )
print(f"Seeded {SubscriptionPlan.objects.count()} subscription plans")
