from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from orphanages.models import Orphanage
from .models import Donation, Income, Expense


class FinancesApiTests(TestCase):
    def setUp(self):
        self.director = User.objects.create(
            email="dir@test.com", first_name="D", last_name="Test", country="CD", role="director",
        )
        self.other_director = User.objects.create(
            email="dir2@test.com", first_name="D2", last_name="Test", country="CD", role="director",
        )
        self.federation = User.objects.create(
            email="fed@test.com", first_name="F", last_name="Test", country="CD", role="federation",
        )
        self.auditor = User.objects.create(
            email="aud@test.com", first_name="A", last_name="Test", country="CD", role="auditor",
        )
        self.sponsor = User.objects.create(
            email="sp@test.com", first_name="S", last_name="Test", country="CD", role="sponsor",
        )
        self.orphanage = Orphanage.objects.create(name="Orphelinat A", director=self.director)
        self.director.orphanage = self.orphanage
        self.director.save()
        self.other_orphanage = Orphanage.objects.create(name="Orphelinat B", director=self.other_director)
        self.other_director.orphanage = self.other_orphanage
        self.other_director.save()
        self.client = APIClient()

    def test_any_authenticated_user_can_create_donation(self):
        self.client.force_authenticate(user=self.sponsor)
        response = self.client.post("/api/dons/", {
            "donation_type": "financier", "amount": "50.00", "currency": "USD",
            "orphanage": self.orphanage.id,
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "completed")
        self.assertEqual(Donation.objects.get(pk=response.data["id"]).donator, self.sponsor)

    def test_donor_sees_only_their_own_donations_by_default(self):
        Donation.objects.create(donator=self.sponsor, donation_type="financier", amount=10, orphanage=self.orphanage)
        Donation.objects.create(donator=self.federation, donation_type="financier", amount=20, orphanage=self.orphanage)
        self.client.force_authenticate(user=self.sponsor)
        response = self.client.get("/api/dons/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["amount"], "10.00")

    def test_director_sees_only_own_orphanage_donations(self):
        Donation.objects.create(donator=self.sponsor, donation_type="financier", amount=10, orphanage=self.orphanage)
        Donation.objects.create(donator=self.sponsor, donation_type="financier", amount=20, orphanage=self.other_orphanage)
        self.client.force_authenticate(user=self.director)
        response = self.client.get("/api/dons/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["amount"], "10.00")

    def test_federation_sees_all_donations(self):
        Donation.objects.create(donator=self.sponsor, donation_type="financier", amount=10, orphanage=self.orphanage)
        Donation.objects.create(donator=self.sponsor, donation_type="financier", amount=20, orphanage=self.other_orphanage)
        self.client.force_authenticate(user=self.federation)
        response = self.client.get("/api/dons/")
        self.assertEqual(len(response.data), 2)

    def test_auditor_can_list_but_not_create_income(self):
        self.client.force_authenticate(user=self.auditor)
        response = self.client.get("/api/revenus/")
        self.assertEqual(response.status_code, 200)
        response = self.client.post("/api/revenus/", {"source": "Don", "amount": "100", "orphanage": self.orphanage.id}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_director_can_create_expense_for_own_orphanage(self):
        self.client.force_authenticate(user=self.director)
        response = self.client.post("/api/depenses/", {
            "category": "Alimentation", "amount": "30.00", "orphanage": self.orphanage.id,
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Expense.objects.count(), 1)

    def test_sponsor_cannot_list_expenses(self):
        self.client.force_authenticate(user=self.sponsor)
        response = self.client.get("/api/depenses/")
        self.assertEqual(response.status_code, 403)
