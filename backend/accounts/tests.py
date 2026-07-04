from django.test import TestCase

from .models import ROLES, User


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
