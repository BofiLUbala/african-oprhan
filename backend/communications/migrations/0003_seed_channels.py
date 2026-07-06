from django.db import migrations


STANDARD_CHANNELS = [
    # (slug, name, icon, description, kind, allowed_roles, post_roles, position)
    ("public", "Public", "🌍", "Espace ouvert à tous les agents de la fédération.", "public", [], [], 1),
    ("annonces", "Annonces", "📢", "Annonces officielles — lecture pour tous, publication par l'administration.", "announcement", [], ["federation", "supermaster"], 2),
    ("urgences", "Urgences", "🚨", "Canal d'urgence — signalements prioritaires.", "emergency", [], [], 3),
    ("ambassadeurs", "Ambassadeurs", "🎗️", "Réservé aux ambassadeurs.", "role", ["ambassador"], [], 4),
    ("chefs-orphelinat", "Chefs d'Orphelinat", "🏠", "Réservé aux chefs d'orphelinat.", "role", ["director"], [], 5),
    ("confederation", "Confédération", "🏛️", "Réservé aux chefs de confédération.", "role", ["federation"], [], 6),
    ("administration", "Administration", "🛡️", "Canal Super Master — administration de la plateforme.", "role", ["supermaster"], [], 7),
    ("orphanage", "Orphanage", "🤝", "Espace Ambassadeurs ↔ Chefs d'Orphelinat : communications liées aux enfants (scolarité, santé, urgences, projets, dons, activités, rapports).", "role", ["ambassador", "director"], [], 8),
]


def seed_channels(apps, schema_editor):
    Channel = apps.get_model("communications", "Channel")
    for slug, name, icon, desc, kind, allowed, post, pos in STANDARD_CHANNELS:
        Channel.objects.update_or_create(
            slug=slug,
            defaults={
                "name": name,
                "icon": icon,
                "description": desc,
                "kind": kind,
                "allowed_roles": allowed,
                "post_roles": post,
                "position": pos,
            },
        )


def unseed_channels(apps, schema_editor):
    Channel = apps.get_model("communications", "Channel")
    Channel.objects.filter(slug__in=[c[0] for c in STANDARD_CHANNELS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("communications", "0002_channel_channelmessage"),
    ]

    operations = [
        migrations.RunPython(seed_channels, unseed_channels),
    ]
