from django.core.exceptions import PermissionDenied
from django.test import TestCase
from django.utils import timezone

from accounts.models import User
from children.models import Child
from children.models import ChildHistory


class TestImmuabilite(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            email="test@test.com", first_name="Test", last_name="User",
            country="CD", role="director"
        )
        self.enfant = Child.objects.create(
            uid="TEST12345678", nom="Test", prenom="Enfant",
            created_by=self.user,
        )
        self.event = ChildHistory.objects.create(
            child=self.enfant, event_type="created", title="Test",
            category="general", priority="normal", source_module="test",
            performed_by=self.user, event_date=timezone.now(),
        )

    def test_update_direct_echoue(self):
        with self.assertRaises(PermissionDenied):
            ChildHistory.objects.filter(pk=self.event.pk).update(title="Modifié")

    def test_save_existant_echoue(self):
        with self.assertRaises(PermissionDenied):
            self.event.title = "Modifié"
            self.event.save()

    def test_delete_direct_echoue(self):
        with self.assertRaises(PermissionDenied):
            self.event.delete()

    def test_correction_preserve_original(self):
        correction = ChildHistory.objects.create(
            child=self.enfant, event_type=self.event.event_type,
            title=f"Correction : {self.event.title}",
            category=self.event.category, priority=self.event.priority,
            source_module=self.event.source_module,
            performed_by=self.user, evenement_parent=self.event,
            reason="Erreur de saisie",
            event_date=timezone.now(),
        )
        self.event.refresh_from_db()
        self.assertEqual(correction.evenement_parent_id, self.event.id)
        self.assertTrue(ChildHistory.objects.filter(pk=self.event.pk).exists())


class TestHashChaine(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            email="hash@test.com", first_name="Hash", last_name="Test",
            country="CD", role="director",
        )
        self.enfant = Child.objects.create(
            uid="HASH12345678", nom="Hash", prenom="Test",
            created_by=self.user,
        )

    def test_hash_chaine_continue(self):
        e1 = ChildHistory.objects.create(
            child=self.enfant, event_type="created", title="Création",
            category="general", priority="normal", source_module="test",
            performed_by=self.user, event_date=timezone.now(),
        )
        e2 = ChildHistory.objects.create(
            child=self.enfant, event_type="updated", title="Modification",
            category="general", priority="normal", source_module="test",
            performed_by=self.user, event_date=timezone.now(),
        )
        self.assertEqual(e2.hash_precedent, e1.hash_courant)
        self.assertEqual(e1.calculate_hash(), e1.hash_courant)
        self.assertEqual(e2.calculate_hash(), e2.hash_courant)
