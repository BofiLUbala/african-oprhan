from django.db import migrations, models


def migrate_old_audiences(apps, schema_editor):
    Post = apps.get_model("publications", "Post")
    Post.objects.filter(audience="general").update(audience="public")
    Post.objects.filter(audience="child_info").update(audience="ambassador")


class Migration(migrations.Migration):

    dependencies = [
        ("publications", "0003_post_audience_post_child_post_rejection_reason_and_more"),
    ]

    operations = [
        migrations.RunPython(migrate_old_audiences, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="post",
            name="audience",
            field=models.CharField(
                choices=[
                    ("public", "Public"),
                    ("ambassador", "Ambassadeur"),
                    ("director", "Chef d'orphelinat"),
                    ("federation", "Chef de confederation"),
                ],
                default="public",
                max_length=20,
                verbose_name="Audience",
            ),
        ),
    ]
