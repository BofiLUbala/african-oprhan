from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
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
