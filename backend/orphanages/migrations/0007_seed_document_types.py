from django.db import migrations


def seed_document_types(apps, schema_editor):
    DocumentType = apps.get_model("orphanages", "DocumentType")
    defaults = [
        ("registration_cert", "Certificat d'enregistrement", True, 1),
        ("operating_license", "Licence d'exploitation", True, 2),
        ("director_id", "Pièce d'identité du directeur", True, 3),
        ("tax_doc", "Document fiscal", True, 4),
        ("child_protection", "Politique de protection de l'enfant", True, 5),
        ("annual_report", "Rapport annuel", False, 6),
        ("ngo_accreditation", "Agrément ONG", False, 7),
        ("partnership_certs", "Certificats de partenariat", False, 8),
    ]
    for key, label, required, order in defaults:
        DocumentType.objects.get_or_create(
            key=key,
            defaults={"label": label, "required": required, "order": order},
        )


class Migration(migrations.Migration):

    dependencies = [
        ("orphanages", "0006_documenttype_orphanagedocument"),
    ]

    operations = [
        migrations.RunPython(seed_document_types),
    ]
