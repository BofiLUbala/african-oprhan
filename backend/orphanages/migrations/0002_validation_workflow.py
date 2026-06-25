from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orphanages", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="orphanage",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "En attente de validation"),
                    ("approved", "Valide"),
                    ("rejected", "Rejete"),
                    ("active", "Actif"),
                ],
                default="pending",
                max_length=50,
                verbose_name="Statut",
            ),
        ),
        migrations.AddField(
            model_name="orphanage",
            name="document_details",
            field=models.TextField(blank=True, verbose_name="Details du document"),
        ),
        migrations.AddField(
            model_name="orphanage",
            name="validation_note",
            field=models.TextField(blank=True, verbose_name="Note de validation"),
        ),
        migrations.AddField(
            model_name="orphanage",
            name="validated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
