from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from children.models import Child, ChildAssignment
from .models import Orphanage


class AuditorVisibilityTests(TestCase):
    def setUp(self):
        self.director = User.objects.create(
            email="dir@test.com", first_name="D", last_name="Test", country="CD", role="director",
        )
        self.auditor = User.objects.create(
            email="aud@test.com", first_name="A", last_name="Test", country="CD", role="auditor",
        )
        Orphanage.objects.create(name="Orphelinat A", director=self.director)
        self.client = APIClient()

    def test_auditor_sees_all_orphanages_read_only(self):
        self.client.force_authenticate(user=self.auditor)
        response = self.client.get("/api/orphanages/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)


class AmbassadorOrphanageScopingTests(TestCase):
    """Un ambassadeur ne doit choisir/voir, pour un projet orphelinat, que
    les orphelinats des enfants qui lui sont assignés — jamais la liste
    complète (réservée à la fédération)."""
    def setUp(self):
        self.director_a = User.objects.create(
            email="dir_a@test.com", first_name="DA", last_name="Test", country="CD", role="director", is_active=True,
        )
        self.director_b = User.objects.create(
            email="dir_b@test.com", first_name="DB", last_name="Test", country="CD", role="director", is_active=True,
        )
        self.ambassadeur = User.objects.create(
            email="amb_scope@test.com", first_name="Amb", last_name="Test", country="CD", role="ambassador", is_active=True,
        )
        self.federation = User.objects.create(
            email="fed_scope@test.com", first_name="Fed", last_name="Test", country="CD", role="federation", is_active=True,
        )
        self.orphelinat_assigne = Orphanage.objects.create(name="Orphelinat Assigné", director=self.director_a)
        self.orphelinat_non_assigne = Orphanage.objects.create(name="Orphelinat Non Assigné", director=self.director_b)
        self.enfant = Child.objects.create(
            uid="SCOPETEST01", nom="Test", prenom="Enfant",
            created_by=self.director_a, orphanage=self.orphelinat_assigne,
        )
        ChildAssignment.objects.create(child=self.enfant, ambassador=self.ambassadeur, assigned_by=self.federation)
        self.client = APIClient()

    def test_ambassadeur_ne_voit_que_les_orphelinats_de_ses_enfants_assignes(self):
        self.client.force_authenticate(user=self.ambassadeur)
        response = self.client.get("/api/orphanages/")
        self.assertEqual(response.status_code, 200)
        names = [o["name"] for o in response.data]
        self.assertIn("Orphelinat Assigné", names)
        self.assertNotIn("Orphelinat Non Assigné", names)

    def test_federation_voit_tous_les_orphelinats(self):
        self.client.force_authenticate(user=self.federation)
        response = self.client.get("/api/orphanages/")
        self.assertEqual(response.status_code, 200)
        names = [o["name"] for o in response.data]
        self.assertIn("Orphelinat Assigné", names)
        self.assertIn("Orphelinat Non Assigné", names)
