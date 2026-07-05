from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from children.models import Child
from finances.models import Donation
from orphanages.models import Orphanage

from .models import ROLES


class RoleChoicesTests(TestCase):
    def test_new_roles_are_valid_choices(self):
        role_values = [value for value, _label in ROLES]
        self.assertIn("auditor", role_values)
        self.assertIn("sponsor", role_values)
        self.assertIn("staff", role_values)

    def test_existing_roles_unchanged(self):
        role_values = [value for value, _label in ROLES]
        for existing in ("ambassador", "federation", "supermaster", "partner", "director"):
            self.assertIn(existing, role_values)

    def test_user_can_be_created_with_new_role(self):
        user = User.objects.create(
            email="auditor@test.com", first_name="A", last_name="Uditor",
            country="CD", role="auditor",
        )
        self.assertEqual(user.role, "auditor")


def make_user_stats(email, role, **kwargs):
    u = User.objects.create_user(
        email=email, password='pass', first_name='Test', last_name='User',
        role=role, country='SN',
    )
    u.is_active = True
    u.save()
    for k, v in kwargs.items():
        setattr(u, k, v)
        u.save(update_fields=[k])
    return u


class StatsAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_stats_requires_auth(self):
        r = self.client.get('/api/auth/stats/')
        self.assertEqual(r.status_code, 401)

    def test_director_stats_returns_kpis_and_charts(self):
        director = make_user_stats('dir@x.com', 'director')
        self.client.force_authenticate(user=director)
        r = self.client.get('/api/auth/stats/')
        self.assertEqual(r.status_code, 200)
        self.assertIn('kpis', r.data)
        self.assertIn('charts', r.data)
        self.assertEqual(len(r.data['kpis']), 4)
        self.assertIn('donations_monthly', r.data['charts'])
        self.assertEqual(len(r.data['charts']['donations_monthly']), 6)
        self.assertIn('children_gender', r.data['charts'])
        self.assertIn('sponsorships_status', r.data['charts'])

    def test_supermaster_stats_returns_kpis(self):
        sm = make_user_stats('sm@x.com', 'supermaster')
        self.client.force_authenticate(user=sm)
        r = self.client.get('/api/auth/stats/')
        self.assertEqual(r.status_code, 200)
        self.assertIn('kpis', r.data)
        self.assertEqual(len(r.data['kpis']), 4)

    def test_kpi_values_are_integers(self):
        director = make_user_stats('dir2@x.com', 'director')
        self.client.force_authenticate(user=director)
        r = self.client.get('/api/auth/stats/')
        for kpi in r.data['kpis']:
            self.assertIsInstance(kpi['value'], int)
