from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from children.models import Child, ChildHistory
from orphanages.models import Orphanage


class TestPermissionsAPI(TestCase):
    def setUp(self):
        self.partner = User.objects.create(
            email="partner@test.com", first_name="Partner", last_name="Test",
            country="CD", role="partner",
        )
        self.directeur = User.objects.create(
            email="director@test.com", first_name="Dir", last_name="Test",
            country="CD", role="director",
        )
        self.orphelinat = Orphanage.objects.create(
            name="Orphelinat Test", director=self.directeur,
        )
        self.enfant = Child.objects.create(
            uid="PERM12345678", nom="Perm", prenom="Test",
            created_by=self.directeur, orphanage=self.orphelinat,
        )
        ChildHistory.objects.create(
            child=self.enfant, event_type="health_update",
            title="Test santé", description="Détail médical",
            category="health", priority="high", source_module="health",
            performed_by=self.directeur, event_date=timezone.now(),
            niveau_sensibilite='CONFIDENTIEL',
        )
        ChildHistory.objects.create(
            child=self.enfant, event_type="vaccination_added",
            title="Vaccin", category="health", priority="normal",
            source_module="health", performed_by=self.directeur,
            event_date=timezone.now(), niveau_sensibilite='RESTREINT',
        )
        ChildHistory.objects.create(
            child=self.enfant, event_type="grade_added",
            title="Note scolaire", category="education", priority="normal",
            source_module="education", performed_by=self.directeur,
            event_date=timezone.now(), niveau_sensibilite='PUBLIC',
        )

        self.client = APIClient()

    def test_partner_ne_voit_pas_sante(self):
        self.client.force_authenticate(user=self.partner)
        response = self.client.get(f"/api/enfants/{self.enfant.id}/history/")
        self.assertEqual(response.status_code, 200)
        for r in response.data.get("results", []):
            self.assertNotIn(r.get("category"), ["health", "family"])

    def test_partner_ne_voit_pas_confidentiel(self):
        self.client.force_authenticate(user=self.partner)
        response = self.client.get(f"/api/enfants/{self.enfant.id}/history/")
        self.assertEqual(response.status_code, 200)
        for r in response.data.get("results", []):
            self.assertNotEqual(r.get("niveau_sensibilite"), "CONFIDENTIEL")

    def test_directeur_voit_tout(self):
        self.client.force_authenticate(user=self.directeur)
        response = self.client.get(f"/api/enfants/{self.enfant.id}/history/")
        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.data.get("results", [])), 0)


class TestValidationWorkflow(TestCase):
    def setUp(self):
        self.directeur = User.objects.create(
            email="dir@test.com", first_name="Dir", last_name="Test",
            country="CD", role="director",
        )
        self.federation = User.objects.create(
            email="fed@test.com", first_name="Fed", last_name="Test",
            country="CD", role="federation",
        )
        self.enfant = Child.objects.create(
            uid="VALI12345678", nom="Vali", prenom="Test",
            created_by=self.directeur,
        )
        self.client = APIClient()

    def test_evenement_famille_en_attente(self):
        self.client.force_authenticate(user=self.directeur)
        response = self.client.post(
            f"/api/enfants/{self.enfant.id}/history/create/",
            {"event_type": "adoption_progress", "title": "Adoption en cours",
             "description": "Procédure démarrée", "reason": "Nouveau dossier"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        event_id = response.data["id"]
        event = ChildHistory.objects.get(pk=event_id)
        self.assertEqual(event.statut_validation, "EN_ATTENTE")

    def test_federation_peut_valider(self):
        event = ChildHistory.objects.create(
            child=self.enfant, event_type="adoption_progress",
            title="Adoption", category="family", priority="critical",
            source_module="family", performed_by=self.directeur,
            event_date=timezone.now(), statut_validation="EN_ATTENTE",
        )
        self.client.force_authenticate(user=self.federation)
        response = self.client.post(
            f"/api/historique/{event.id}/valider/",
            {"action": "valider", "commentaire": "Dossier complet"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        event.refresh_from_db()
        self.assertEqual(event.statut_validation, "VALIDE")

    def test_directeur_ne_peut_pas_valider(self):
        event = ChildHistory.objects.create(
            child=self.enfant, event_type="adoption_progress",
            title="Adoption", category="family", priority="critical",
            source_module="family", performed_by=self.directeur,
            event_date=timezone.now(), statut_validation="EN_ATTENTE",
        )
        self.client.force_authenticate(user=self.directeur)
        response = self.client.post(
            f"/api/historique/{event.id}/valider/",
            {"action": "valider"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)


class TestHistoryFromUpdates(TestCase):
    def setUp(self):
        self.directeur = User.objects.create(
            email="dir2@test.com", first_name="Dir2", last_name="Test",
            country="CD", role="director",
        )
        self.orphelinat = Orphanage.objects.create(
            name="Orphelinat Update Test", director=self.directeur,
        )
        self.client = APIClient()

    def test_creation_genere_un_event(self):
        self.client.force_authenticate(user=self.directeur)
        resp = self.client.post("/api/enfants/", {
            "nom": "Création", "prenom": "Test", "sexe": "M",
            "nationalite": "Test", "orphanage": self.orphelinat.id,
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        child_id = resp.data["id"]
        events = ChildHistory.objects.filter(child_id=child_id).order_by("event_date")
        self.assertEqual(events.count(), 1)
        self.assertEqual(events[0].event_type, "created")
        self.assertEqual(events[0].performed_by, self.directeur)

    def test_update_statut_genere_status_change(self):
        self.client.force_authenticate(user=self.directeur)
        resp = self.client.post("/api/enfants/", {
            "nom": "Statut", "prenom": "Test", "orphanage": self.orphelinat.id,
        }, format="json")
        child_id = resp.data["id"]
        ChildHistory.objects.filter(child_id=child_id).delete()  # clear creation event

        resp = self.client.put(f"/api/enfants/{child_id}/", {"status": "sick", "nom": "Statut", "prenom": "Test"}, format="json")
        self.assertEqual(resp.status_code, 200)
        events = ChildHistory.objects.filter(child_id=child_id, event_type="status_change")
        self.assertEqual(events.count(), 1)
        self.assertEqual(events[0].old_value, "active")
        self.assertEqual(events[0].new_value, "sick")
        self.assertEqual(events[0].status_before, "active")
        self.assertEqual(events[0].status_after, "sick")
        self.assertEqual(events[0].performed_by, self.directeur)

    def test_update_champs_multipes_genere_plusieurs_events(self):
        self.client.force_authenticate(user=self.directeur)
        resp = self.client.post("/api/enfants/", {
            "nom": "Multi", "prenom": "Test", "orphanage": self.orphelinat.id,
        }, format="json")
        child_id = resp.data["id"]
        ChildHistory.objects.filter(child_id=child_id).delete()

        resp = self.client.put(f"/api/enfants/{child_id}/", {
            "nom": "Multi2", "prenom": "Test2",
            "adresse": "Nouvelle adresse",
            "nationalite": "Nouvelle",
        }, format="json")
        self.assertEqual(resp.status_code, 200)
        events = ChildHistory.objects.filter(child_id=child_id, event_type="updated").order_by("event_date")
        self.assertGreaterEqual(events.count(), 3)
        titres = [e.title for e in events]
        self.assertIn("Nom modifié", titres)
        self.assertIn("Prenom modifié", titres)
        self.assertIn("Adresse modifié", titres)
        for e in events:
            self.assertEqual(e.performed_by, self.directeur)

    def test_update_sans_changement_ne_genere_pas_devent(self):
        self.client.force_authenticate(user=self.directeur)
        resp = self.client.post("/api/enfants/", {
            "nom": "NoChange", "prenom": "Test", "orphanage": self.orphelinat.id,
        }, format="json")
        child_id = resp.data["id"]
        ChildHistory.objects.filter(child_id=child_id).delete()

        resp = self.client.put(f"/api/enfants/{child_id}/", {"nom": "NoChange"}, format="json")
        self.assertEqual(resp.status_code, 200)
        events = ChildHistory.objects.filter(child_id=child_id)
        self.assertEqual(events.count(), 0)

    def test_suppression_conserve_historique(self):
        self.client.force_authenticate(user=self.directeur)
        resp = self.client.post("/api/enfants/", {
            "nom": "Delete", "prenom": "Test", "orphanage": self.orphelinat.id,
        }, format="json")
        child_id = resp.data["id"]
        creation_events = ChildHistory.objects.filter(child_id=child_id).count()
        self.assertEqual(creation_events, 1)

        resp = self.client.delete(f"/api/enfants/{child_id}/")
        self.assertEqual(resp.status_code, 204)

        remaining = ChildHistory.objects.filter(child_id=child_id).count()
        self.assertEqual(remaining, 0, "L'enfant supprimé n'a plus de FK directe")
        archive = ChildHistory.objects.filter(event_type="child_archived", description__contains="Delete").count()
        # L'événement d'archivage a child=NULL après la suppression
        orphaned = ChildHistory.objects.filter(child__isnull=True, event_type="child_archived").count()
        self.assertGreaterEqual(orphaned, 1)

    def test_create_manual_event_any_type(self):
        self.client.force_authenticate(user=self.directeur)
        resp = self.client.post("/api/enfants/", {
            "nom": "Manual", "prenom": "Test", "orphanage": self.orphelinat.id,
        }, format="json")
        child_id = resp.data["id"]

        resp = self.client.post(f"/api/enfants/{child_id}/history/create/", {
            "event_type": "vaccination_added", "title": "BCG",
            "description": "Vaccin administré",
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["event_type"], "vaccination_added")
        self.assertEqual(resp.data["priority"], "high")  # from CLASSIFICATION
