from django.db import migrations


# Canaux à rôle : listés pour tous, publication ouverte, mais seuls les
# détenteurs du rôle (et supermaster) voient tous les messages — les autres
# ne voient que leurs propres publications.
ROLE_FILTERED_SLUGS = [
    "ambassadeurs",
    "chefs-orphelinat",
    "confederation",
    "administration",
    "orphanage",
]


def apply_role_filtered(apps, schema_editor):
    Channel = apps.get_model("communications", "Channel")
    Channel.objects.filter(slug__in=ROLE_FILTERED_SLUGS).update(visibility_mode="role_filtered")
    # les canaux sans restriction restent "open" (défaut du champ)


def revert_role_filtered(apps, schema_editor):
    Channel = apps.get_model("communications", "Channel")
    # retour au comportement historique : canaux à rôle entièrement privés
    Channel.objects.filter(slug__in=ROLE_FILTERED_SLUGS).update(visibility_mode="private")


class Migration(migrations.Migration):

    dependencies = [
        ("communications", "0006_channel_visibility_mode"),
    ]

    operations = [
        migrations.RunPython(apply_role_filtered, revert_role_filtered),
    ]
