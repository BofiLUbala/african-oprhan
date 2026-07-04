from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from children.models import Child
from orphanages.models import Orphanage
from .models import Sponsorship, SponsorshipPayment


class SponsorshipsApiTests(TestCase):
    def setUp(self):
        self.director = User.objects.create(
            email="dir@test.com", first_name="D", last_name="Test", country="CD", role="director",
        )
        self.sponsor = User.objects.create(
            email="sp@test.com", first_name="S", last_name="Test", country="CD", role="sponsor",
        )
        self.other_sponsor = User.objects.create(
            email="sp2@test.com", first_name="S2", last_name="Test", country="CD", role="sponsor",
        )
        self.federation = User.objects.create(
            email="fed@test.com", first_name="F", last_name="Test", country="CD", role="federation",
        )
        self.orphanage = Orphanage.objects.create(name="Orphelinat A", director=self.director)
        self.child = Child.objects.create(
            uid="TESTCHILD0001", nom="Doe", prenom="Jane",
            created_by=self.director, orphanage=self.orphanage,
        )
        self.sponsored_child = Child.objects.create(
            uid="TESTCHILD0002", nom="Doe", prenom="John",
            created_by=self.director, orphanage=self.orphanage,
        )
        Sponsorship.objects.create(
            sponsor=self.other_sponsor, child=self.sponsored_child,
            sponsorship_type="monthly", amount=50, status="active",
        )
        self.client = APIClient()

    def test_sponsorable_children_excludes_actively_sponsored(self):
        self.client.force_authenticate(user=self.sponsor)
        response = self.client.get("/api/parrainages/enfants-disponibles/")
        self.assertEqual(response.status_code, 200)
        uids = [c["uid"] for c in response.data]
        self.assertIn("TESTCHILD0001", uids)
        self.assertNotIn("TESTCHILD0002", uids)

    def test_sponsor_can_create_sponsorship(self):
        self.client.force_authenticate(user=self.sponsor)
        response = self.client.post("/api/parrainages/", {
            "child": self.child.id, "sponsorship_type": "monthly", "amount": "40.00",
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Sponsorship.objects.get(pk=response.data["id"]).sponsor, self.sponsor)

    def test_director_cannot_create_sponsorship(self):
        self.client.force_authenticate(user=self.director)
        response = self.client.post("/api/parrainages/", {
            "child": self.child.id, "sponsorship_type": "monthly", "amount": "40.00",
        }, format="json")
        self.assertEqual(response.status_code, 403)

    def test_sponsor_sees_only_own_sponsorships(self):
        self.client.force_authenticate(user=self.sponsor)
        response = self.client.get("/api/parrainages/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)

    def test_federation_sees_all_sponsorships(self):
        self.client.force_authenticate(user=self.federation)
        response = self.client.get("/api/parrainages/")
        self.assertEqual(len(response.data), 1)

    def test_sponsor_can_pause_own_sponsorship(self):
        sponsorship = Sponsorship.objects.create(
            sponsor=self.sponsor, child=self.child, sponsorship_type="monthly", amount=40,
        )
        self.client.force_authenticate(user=self.sponsor)
        response = self.client.patch(f"/api/parrainages/{sponsorship.id}/", {"status": "paused"}, format="json")
        self.assertEqual(response.status_code, 200)
        sponsorship.refresh_from_db()
        self.assertEqual(sponsorship.status, "paused")

    def test_other_sponsor_cannot_modify_sponsorship(self):
        sponsorship = Sponsorship.objects.create(
            sponsor=self.sponsor, child=self.child, sponsorship_type="monthly", amount=40,
        )
        self.client.force_authenticate(user=self.other_sponsor)
        response = self.client.patch(f"/api/parrainages/{sponsorship.id}/", {"status": "cancelled"}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_director_can_record_payment(self):
        sponsorship = Sponsorship.objects.create(
            sponsor=self.sponsor, child=self.child, sponsorship_type="monthly", amount=40,
        )
        self.client.force_authenticate(user=self.director)
        response = self.client.post(f"/api/parrainages/{sponsorship.id}/paiements/", {"amount": "40.00"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(SponsorshipPayment.objects.count(), 1)

    def test_sponsor_can_view_own_payment_history(self):
        sponsorship = Sponsorship.objects.create(
            sponsor=self.sponsor, child=self.child, sponsorship_type="monthly", amount=40,
        )
        SponsorshipPayment.objects.create(sponsorship=sponsorship, amount=40)
        self.client.force_authenticate(user=self.sponsor)
        response = self.client.get(f"/api/parrainages/{sponsorship.id}/paiements/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
