from django.db import migrations, models

from projets.constants import CATEGORIES_PROJET_CHOICES


def backfill_codes(apps, schema_editor):
    """Préserve les codes existants sous l'ancien format PRJ-XXXX (déjà
    affichés/référencés) ; seuls les nouveaux projets recevront un code
    préfixé par type (CHD-/ORP-/FED-) via Project.save()."""
    Project = apps.get_model('projets', 'Project')
    for p in Project.objects.all():
        if not p.code:
            p.code = f"PRJ-{p.pk:04d}"
            p.save(update_fields=['code'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('projets', '0005_candidatureprojet_commentaire_reponse_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='code',
            field=models.CharField(blank=True, default='', max_length=20, verbose_name='Code'),
        ),
        migrations.AddField(
            model_name='project',
            name='category',
            field=models.CharField(blank=True, choices=CATEGORIES_PROJET_CHOICES, default='', max_length=30, verbose_name='Catégorie'),
        ),
        migrations.RunPython(backfill_codes, noop),
        migrations.AlterField(
            model_name='project',
            name='code',
            field=models.CharField(blank=True, db_index=True, max_length=20, unique=True, verbose_name='Code'),
        ),
    ]
