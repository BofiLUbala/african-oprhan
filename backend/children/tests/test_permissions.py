from django.test import TestCase

from accounts.models import User
from children.permissions import (
    MATRICE_VISIBILITE,
    ROLES_VOIR_CONFIDENTIEL,
    ROLES_VOIR_CONSULTATIONS,
    PeutCreerHistoriqueManuel,
)


class NewRolePermissionTests(TestCase):
    def test_auditor_is_read_only_everywhere(self):
        self.assertIn("auditor", MATRICE_VISIBILITE)
        self.assertIn("auditor", ROLES_VOIR_CONFIDENTIEL)
        self.assertIn("auditor", ROLES_VOIR_CONSULTATIONS)

    def test_staff_mirrors_director_categories(self):
        self.assertEqual(
            MATRICE_VISIBILITE["staff"]["categories"],
            MATRICE_VISIBILITE["director"]["categories"],
        )
        self.assertEqual(MATRICE_VISIBILITE["staff"]["orphelinat"], "propre")

    def test_sponsor_has_no_history_visibility_by_default(self):
        self.assertIn("sponsor", MATRICE_VISIBILITE)
        self.assertEqual(MATRICE_VISIBILITE["sponsor"]["orphelinat"], "aucun")

    def test_auditor_cannot_create_manual_history(self):
        user = User(role="auditor", is_active=True)
        request = type("Req", (), {"user": user})()
        self.assertFalse(PeutCreerHistoriqueManuel().has_permission(request, None))

    def test_staff_can_create_manual_history(self):
        user = User(role="staff", is_active=True)
        request = type("Req", (), {"user": user})()
        self.assertTrue(PeutCreerHistoriqueManuel().has_permission(request, None))
