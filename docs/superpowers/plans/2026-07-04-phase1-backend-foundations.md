# Phase 1 Backend Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the two committed-credential/CORS security issues in `config/settings.py`, add three missing role types (`auditor`, `sponsor`, `staff`) to the user model and the permission matrices that key off role, and build the entirely-missing REST API for the `finances` and `sponsorships` Django apps (both currently have models but empty `views.py` stubs and no `urls.py`).

**Architecture:** Follow the codebase's existing pattern exactly — function-based DRF views with `@api_view`/`@permission_classes`, plain-dict role checks (no generic RBAC engine), `SerializerMethodField` for human-readable labels, one `urls.py` per app included from `config/urls.py` under the `api/` prefix. No new architectural patterns introduced.

**Tech Stack:** Django 4.2+, Django REST Framework, `rest_framework_simplejwt`, SQLite (dev) / PostgreSQL (prod, via `DB_ENGINE` env var), `python-dotenv` (already wired in `manage.py`/`config/wsgi.py`).

## Global Constraints

- Every endpoint requires `IsAuthenticated` at minimum — no anonymous access anywhere in this codebase's API.
- Role identifiers already in use: `ambassador`, `federation`, `supermaster`, `partner`, `director` (defined in `accounts/models.py` `ROLES`). This plan adds `auditor`, `sponsor`, `staff` — additive only, never rename or remove an existing role value (it would break existing users' `role` column values).
- All French verbose names / labels in new models and serializers follow the existing French-first convention seen in every model in this codebase (e.g. `verbose_name="Montant"`).
- Migrations must be additive (no destructive column changes) since `db.sqlite3` has existing data.
- Run tests with: `cd backend && python manage.py test <app_label> -v 2`

---

### Task 1: Remove hardcoded credentials, fix CORS, add `.env.example`

**Files:**
- Modify: `backend/config/settings.py:7` (SECRET_KEY), `backend/config/settings.py:125-130` (CORS), `backend/config/settings.py:133-140` (email)
- Create: `backend/.env.example`
- Test: `backend/config/tests.py` (new file)

**Interfaces:**
- Produces: no code interface — this task changes runtime configuration only. Later tasks are unaffected by it.

- [ ] **Step 1: Write the failing test for CORS/email config**

Create `backend/config/tests.py`:

```python
import importlib
import os

from django.test import TestCase, override_settings


class SettingsSecurityTests(TestCase):
    def test_cors_allow_all_disabled_when_debug_false(self):
        with override_settings(DEBUG=False):
            from django.conf import settings
            # CORS_ALLOW_ALL_ORIGINS must never be True outside DEBUG mode.
            self.assertFalse(
                getattr(settings, "CORS_ALLOW_ALL_ORIGINS", False) and not settings.DEBUG,
                "CORS_ALLOW_ALL_ORIGINS must be False when DEBUG is False",
            )

    def test_email_credentials_have_no_hardcoded_fallback(self):
        settings_path = os.path.join(os.path.dirname(__file__), "settings.py")
        with open(settings_path, encoding="utf-8") as f:
            source = f.read()
        self.assertNotIn("efandjaprince@gmail.com", source)
        self.assertNotIn("jcwvjeanvfrapadc", source)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python manage.py test config -v 2`
Expected: FAIL — `test_email_credentials_have_no_hardcoded_fallback` fails because the literal strings are still in `settings.py`; `test_cors_allow_all_disabled_when_debug_false` fails because `CORS_ALLOW_ALL_ORIGINS = True` is unconditional.

- [ ] **Step 3: Fix `config/settings.py`**

Replace lines 7 (`SECRET_KEY = ...`) with:

```python
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "django-insecure-change-me-in-production")
```

(unchanged — the insecure fallback is fine in DEBUG mode; the real fix is making production refuse to run on it, added below after `DEBUG` is defined).

After the `DEBUG = ...` line (line 9), add:

```python
if not DEBUG and SECRET_KEY == "django-insecure-change-me-in-production":
    raise RuntimeError(
        "DJANGO_SECRET_KEY environment variable must be set to a real secret "
        "when DJANGO_DEBUG is False."
    )
```

Replace the CORS block (lines 124-130):

```python
# ── CORS ───────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:3000",
).split(",")
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_CREDENTIALS = True
```

Replace the email block (lines 132-140):

```python
# ── Email (SMTP) ───────────────────────────────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_TIMEOUT = 5
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && python manage.py test config -v 2`
Expected: PASS (2 tests)

- [ ] **Step 5: Create `.env.example`**

Create `backend/.env.example`:

```
DJANGO_SECRET_KEY=change-me-to-a-random-50-char-string
DJANGO_DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=sqlite3
DB_NAME=cdo
DB_USER=postgres
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-app-email@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
DEFAULT_FROM_EMAIL=your-app-email@gmail.com

FRONTEND_URL=http://localhost:5173
```

- [ ] **Step 6: Commit**

```bash
git add backend/config/settings.py backend/config/tests.py backend/.env.example
git commit -m "fix: remove hardcoded email credentials, fix CORS/SECRET_KEY prod safety"
```

---

### Task 2: Add `auditor`, `sponsor`, `staff` roles and update permission matrices

**Files:**
- Modify: `backend/accounts/models.py:21-27` (`ROLES`)
- Create: `backend/accounts/migrations/0005_alter_user_role_add_roles.py`
- Modify: `backend/children/permissions.py:3-41` (`MATRICE_VISIBILITE`, `ROLES_VOIR_CONFIDENTIEL`, `ROLES_VOIR_CONSULTATIONS`, `PeutCreerHistoriqueManuel`)
- Modify: `backend/orphanages/views.py:12-13` (`_can_validate` — read-only extension for auditor, done via a separate read helper so auditor never gets validate rights)
- Modify: `backend/orphanages/views.py:190-198` (`orphanage_list` GET branch)
- Test: `backend/accounts/tests.py` (new file), `backend/children/tests/test_permissions.py` (new file)

**Interfaces:**
- Produces: `accounts.models.ROLES` includes `("auditor", "Auditeur")`, `("sponsor", "Parrain/Marraine")`, `("staff", "Personnel Orphelinat")`. `children.permissions.filtrer_historique_par_role(queryset, user, enfant_id=None)` signature unchanged. `orphanages.views._can_view_orphanages(user)` is a new helper (read-only check) used alongside the existing `_can_validate(user)` (write/validate check) — Task 3/4 do not depend on these, but later phases reuse `_can_view_orphanages`.

- [ ] **Step 1: Write the failing test for role choices**

Create `backend/accounts/tests.py`:

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python manage.py test accounts -v 2`
Expected: FAIL — `auditor`/`sponsor`/`staff` not in `ROLES` yet.

- [ ] **Step 3: Update `ROLES` and generate migration**

In `backend/accounts/models.py`, replace the `ROLES` list (lines 21-27):

```python
ROLES = [
    ("ambassador", "Ambassadeur"),
    ("federation", "Administrateur Federation"),
    ("supermaster", "Super Master"),
    ("partner", "Partenaire"),
    ("director", "Chef d'orphelinat"),
    ("auditor", "Auditeur"),
    ("sponsor", "Parrain/Marraine"),
    ("staff", "Personnel Orphelinat"),
]
```

Run: `cd backend && python manage.py makemigrations accounts`
Expected output: `Migrations for 'accounts': accounts/migrations/0005_alter_user_role.py` (or similar auto-generated name — rename the file to `0005_alter_user_role_add_roles.py` for clarity if Django doesn't pick that name itself; the content is what matters, not the filename).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && python manage.py test accounts -v 2`
Expected: PASS (3 tests)

- [ ] **Step 5: Write the failing test for permission matrix defaults**

Create `backend/children/tests/test_permissions.py`:

```python
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
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd backend && python manage.py test children.tests.test_permissions -v 2`
Expected: FAIL — `"auditor"`/`"staff"`/`"sponsor"` keys don't exist in `MATRICE_VISIBILITE` yet, `PeutCreerHistoriqueManuel` only allows `'director'`.

- [ ] **Step 7: Update `children/permissions.py`**

Replace the top of the file (lines 3-41) with:

```python
MATRICE_VISIBILITE = {
    'director': {
        'categories': {'SANTE': 'complet', 'SCOLARITE': 'complet', 'FAMILLE': 'complet',
                       'DOCUMENTS': 'complet', 'SOCIAL': 'complet', 'SYSTEME': 'complet'},
        'orphelinat': 'propre',
    },
    'staff': {
        'categories': {'SANTE': 'complet', 'SCOLARITE': 'complet', 'FAMILLE': 'complet',
                       'DOCUMENTS': 'complet', 'SOCIAL': 'complet', 'SYSTEME': 'complet'},
        'orphelinat': 'propre',
    },
    'ambassador': {
        'categories': {'SANTE': 'lecture', 'SCOLARITE': 'lecture', 'FAMILLE': 'limite',
                       'DOCUMENTS': 'lecture', 'SOCIAL': 'lecture', 'SYSTEME': 'lecture'},
        'orphelinat': 'assigne',
    },
    'federation': {
        'categories': {'SANTE': 'complet', 'SCOLARITE': 'complet', 'FAMILLE': 'complet',
                       'DOCUMENTS': 'complet', 'SOCIAL': 'complet', 'SYSTEME': 'complet'},
        'orphelinat': 'tous',
    },
    'supermaster': {
        'categories': {'SANTE': 'complet', 'SCOLARITE': 'complet', 'FAMILLE': 'complet',
                       'DOCUMENTS': 'complet', 'SOCIAL': 'complet', 'SYSTEME': 'complet'},
        'orphelinat': 'tous',
    },
    'auditor': {
        'categories': {'SANTE': 'lecture', 'SCOLARITE': 'lecture', 'FAMILLE': 'lecture',
                       'DOCUMENTS': 'lecture', 'SOCIAL': 'lecture', 'SYSTEME': 'lecture'},
        'orphelinat': 'tous',
    },
    'partner': {
        'categories': {'SANTE': 'non_visible', 'SCOLARITE': 'resume', 'FAMILLE': 'non_visible',
                       'DOCUMENTS': 'non_visible', 'SOCIAL': 'non_visible', 'SYSTEME': 'non_visible'},
        'orphelinat': 'aucun',
    },
    'sponsor': {
        'categories': {'SANTE': 'non_visible', 'SCOLARITE': 'resume', 'FAMILLE': 'non_visible',
                       'DOCUMENTS': 'non_visible', 'SOCIAL': 'non_visible', 'SYSTEME': 'non_visible'},
        'orphelinat': 'aucun',
    },
}

MAPPING_CATEGORIE = {
    'health': 'SANTE', 'education': 'SCOLARITE', 'family': 'FAMILLE',
    'documents': 'DOCUMENTS', 'social': 'SOCIAL',
    'general': 'SYSTEME', 'registration': 'SYSTEME', 'identity': 'SYSTEME',
    'status': 'SYSTEME', 'protection': 'SOCIAL', 'alert': 'SYSTEME',
    'system': 'SYSTEME', 'follow_up': 'SYSTEME',
}

ROLES_VALIDATION = {'federation', 'supermaster'}
ROLES_VOIR_CONFIDENTIEL = {'federation', 'supermaster', 'director', 'auditor'}
ROLES_VOIR_CONSULTATIONS = {'federation', 'supermaster', 'auditor'}
```

Update `PeutCreerHistoriqueManuel` (was line 87-89):

```python
class PeutCreerHistoriqueManuel(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('director', 'staff')
```

Update `filtrer_historique_par_role` — the `role == 'director'` org-scoping branch (was lines 72-73) must also cover `staff`:

```python
    if role in ('director', 'staff'):
        queryset = queryset.filter(child__orphanage__director=user)
    elif role == 'ambassador':
        queryset = queryset.filter(
            child__assignments__ambassador=user,
        )
```

(Note: `staff` filtering by `child__orphanage__director=user` is a known simplification — staff aren't necessarily the `director` FK on `Orphanage`. This is acceptable for Phase 1 since no staff-to-orphanage assignment model exists yet; revisit when building staff-specific UI in a later phase.)

- [ ] **Step 8: Run test to verify it passes**

Run: `cd backend && python manage.py test children.tests.test_permissions -v 2`
Expected: PASS (5 tests)

- [ ] **Step 9: Add read-only auditor visibility to orphanages list**

In `backend/orphanages/views.py`, add a new helper right after `_can_validate` (after line 13):

```python
def _can_view_orphanages(user):
    return _can_validate(user) or user.role == "auditor"
```

Update `orphanage_list`'s GET branch (was lines 191-198):

```python
    if _can_view_orphanages(user):
        queryset = Orphanage.objects.select_related("director").all().order_by("-created_at")
    elif user.role == "director":
        queryset = Orphanage.objects.filter(director=user).select_related("director")
    else:
        queryset = Orphanage.objects.none()
```

- [ ] **Step 10: Write and run a quick regression test for auditor orphanage visibility**

Add to `backend/orphanages/tests.py` (create if it doesn't exist — check first with `cat backend/orphanages/tests.py`; if it has a `# Create your tests here.` stub, replace the whole file):

```python
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
```

Run: `cd backend && python manage.py test orphanages -v 2`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add backend/accounts/models.py backend/accounts/migrations backend/accounts/tests.py backend/children/permissions.py backend/children/tests/test_permissions.py backend/orphanages/views.py backend/orphanages/tests.py
git commit -m "feat: add auditor/sponsor/staff roles with permission matrix defaults"
```

---

### Task 3: Build the `finances` API (donations, income, expenses)

**Files:**
- Modify: `backend/finances/models.py` (add `status` field to `Donation`)
- Create: `backend/finances/migrations/0002_donation_status.py`
- Create: `backend/finances/serializers.py`
- Modify: `backend/finances/views.py` (replace stub)
- Create: `backend/finances/urls.py`
- Modify: `backend/config/urls.py` (register finances urls)
- Modify: `backend/finances/tests.py` (replace stub)

**Interfaces:**
- Consumes: `accounts.models.User` (role field, added `auditor`/`sponsor`/`staff` from Task 2), `orphanages.models.Orphanage`.
- Produces: `finances.serializers.DonationSerializer`, `IncomeSerializer`, `ExpenseSerializer` (used as-is, no other task depends on their internals). Endpoints: `GET/POST /api/dons/`, `GET/POST /api/revenus/`, `GET/POST /api/depenses/`.

- [ ] **Step 1: Write the failing test for the full finances API**

Replace `backend/finances/tests.py`:

```python
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
        self.other_orphanage = Orphanage.objects.create(name="Orphelinat B", director=self.other_director)
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python manage.py test finances -v 2`
Expected: FAIL — no URLs registered yet (404s), `Donation` has no `status` field.

- [ ] **Step 3: Add `status` field to `Donation`**

In `backend/finances/models.py`, update the `Donation` class:

```python
from django.conf import settings
from django.db import models

class Donation(models.Model):
    DONATION_TYPES = [
        ("financier", "Financier"),
        ("materiel", "Matériel"),
        ("service", "Service"),
    ]
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("completed", "Complété"),
        ("failed", "Échoué"),
    ]

    donator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="donations",
        verbose_name="Donateur"
    )
    donation_type = models.CharField(max_length=20, choices=DONATION_TYPES, verbose_name="Type de don")
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Montant")
    currency = models.CharField(max_length=10, default="USD", verbose_name="Devise")
    description = models.TextField(blank=True, verbose_name="Description (matériel/service)")
    transaction_id = models.CharField(max_length=255, blank=True, verbose_name="Numéro de transaction")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="completed", verbose_name="Statut")
    orphanage = models.ForeignKey(
        "orphanages.Orphanage",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="donations_received",
        verbose_name="Orphelinat bénéficiaire"
    )
    date = models.DateTimeField(auto_now_add=True, verbose_name="Date")

    class Meta:
        verbose_name = "Don"
        verbose_name_plural = "Dons"

    def __str__(self):
        return f"{self.donation_type} - {self.amount} {self.currency}"

class Income(models.Model):
    source = models.CharField(max_length=255, verbose_name="Source (Dons, Subventions...)")
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Montant")
    date = models.DateField(auto_now_add=True)
    orphanage = models.ForeignKey("orphanages.Orphanage", on_delete=models.SET_NULL, null=True, blank=True)

class Expense(models.Model):
    category = models.CharField(max_length=100, verbose_name="Catégorie (Alimentation, Santé...)")
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Montant")
    description = models.TextField(blank=True)
    date = models.DateField(auto_now_add=True)
    orphanage = models.ForeignKey("orphanages.Orphanage", on_delete=models.SET_NULL, null=True, blank=True)
```

Run: `cd backend && python manage.py makemigrations finances`
Expected output: `Migrations for 'finances': finances/migrations/0002_donation_status.py`

- [ ] **Step 4: Create `finances/serializers.py`**

```python
from rest_framework import serializers
from .models import Donation, Income, Expense


class DonationSerializer(serializers.ModelSerializer):
    donation_type_label = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()
    donator_name = serializers.SerializerMethodField()
    orphanage_name = serializers.SerializerMethodField()

    class Meta:
        model = Donation
        fields = [
            "id", "donator", "donator_name", "donation_type", "donation_type_label",
            "amount", "currency", "description", "transaction_id", "status",
            "status_label", "orphanage", "orphanage_name", "date",
        ]
        read_only_fields = ["donator", "status", "date"]

    def get_donation_type_label(self, obj):
        return dict(Donation.DONATION_TYPES).get(obj.donation_type, obj.donation_type)

    def get_status_label(self, obj):
        return dict(Donation.STATUS_CHOICES).get(obj.status, obj.status)

    def get_donator_name(self, obj):
        return obj.donator.full_name if obj.donator else ""

    def get_orphanage_name(self, obj):
        return obj.orphanage.name if obj.orphanage else ""


class IncomeSerializer(serializers.ModelSerializer):
    orphanage_name = serializers.SerializerMethodField()

    class Meta:
        model = Income
        fields = ["id", "source", "amount", "date", "orphanage", "orphanage_name"]
        read_only_fields = ["date"]

    def get_orphanage_name(self, obj):
        return obj.orphanage.name if obj.orphanage else ""


class ExpenseSerializer(serializers.ModelSerializer):
    orphanage_name = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = ["id", "category", "amount", "description", "date", "orphanage", "orphanage_name"]
        read_only_fields = ["date"]

    def get_orphanage_name(self, obj):
        return obj.orphanage.name if obj.orphanage else ""
```

- [ ] **Step 5: Replace `finances/views.py`**

```python
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Donation, Income, Expense
from .serializers import DonationSerializer, IncomeSerializer, ExpenseSerializer

FINANCE_MANAGER_ROLES = ("director", "federation", "supermaster", "auditor")
FINANCE_WRITER_ROLES = ("director", "federation", "supermaster")


def _visible_orphanage_ids(user):
    """Returns None for 'see all orphanages', or a list of orphanage ids to filter by."""
    if user.role in ("federation", "supermaster", "auditor"):
        return None
    if user.role in ("director", "staff") and user.orphanage_id:
        return [user.orphanage_id]
    return []


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def donation_list(request):
    user = request.user

    if request.method == "POST":
        serializer = DonationSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(donator=user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    if request.query_params.get("mine"):
        qs = Donation.objects.filter(donator=user).order_by("-date")
    elif user.role in FINANCE_MANAGER_ROLES:
        ids = _visible_orphanage_ids(user)
        qs = Donation.objects.all().order_by("-date")
        if ids is not None:
            qs = qs.filter(orphanage_id__in=ids)
    else:
        qs = Donation.objects.filter(donator=user).order_by("-date")
    return Response(DonationSerializer(qs, many=True).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def income_list(request):
    user = request.user
    if user.role not in FINANCE_MANAGER_ROLES:
        return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "POST":
        if user.role not in FINANCE_WRITER_ROLES:
            return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)
        serializer = IncomeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    ids = _visible_orphanage_ids(user)
    qs = Income.objects.all().order_by("-date")
    if ids is not None:
        qs = qs.filter(orphanage_id__in=ids)
    return Response(IncomeSerializer(qs, many=True).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def expense_list(request):
    user = request.user
    if user.role not in FINANCE_MANAGER_ROLES:
        return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "POST":
        if user.role not in FINANCE_WRITER_ROLES:
            return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)
        serializer = ExpenseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    ids = _visible_orphanage_ids(user)
    qs = Expense.objects.all().order_by("-date")
    if ids is not None:
        qs = qs.filter(orphanage_id__in=ids)
    return Response(ExpenseSerializer(qs, many=True).data)
```

- [ ] **Step 6: Create `finances/urls.py`**

```python
from django.urls import path
from . import views

urlpatterns = [
    path("dons/", views.donation_list, name="donation-list"),
    path("revenus/", views.income_list, name="income-list"),
    path("depenses/", views.expense_list, name="expense-list"),
]
```

- [ ] **Step 7: Register finances urls in `config/urls.py`**

Add `path("api/", include("finances.urls")),` after the `needs.urls` include line (line 16):

```python
    path("api/", include("needs.urls")),
    path("api/", include("finances.urls")),
    path("api/", include("communications.urls")),
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd backend && python manage.py test finances -v 2`
Expected: PASS (7 tests)

- [ ] **Step 9: Commit**

```bash
git add backend/finances backend/config/urls.py
git commit -m "feat: wire up finances API (donations, income, expenses)"
```

---

### Task 4: Build the `sponsorships` API (browse, sponsor, payments)

**Files:**
- Create: `backend/sponsorships/serializers.py`
- Modify: `backend/sponsorships/views.py` (replace stub)
- Create: `backend/sponsorships/urls.py`
- Modify: `backend/config/urls.py` (register sponsorships urls)
- Modify: `backend/sponsorships/tests.py` (replace stub)

**Interfaces:**
- Consumes: `children.models.Child`, `children.serializers.ChildSerializer` (existing, confirmed at `children/serializers.py:27`), `sponsorships.models.Sponsorship` / `SponsorshipPayment` (existing, unchanged).
- Produces: Endpoints `GET /api/parrainages/enfants-disponibles/`, `GET/POST /api/parrainages/`, `PATCH /api/parrainages/<id>/`, `GET/POST /api/parrainages/<id>/paiements/`.
- **Product decision, stated explicitly:** "sponsorable" means the child has no `Sponsorship` row with `status="active"` from *any* sponsor — i.e. one primary sponsor at a time per child. This matches the existing `unique_together = ("sponsor", "child")` constraint's spirit (one sponsor-child pair) and is the simplest correct v1 behavior; revisit only if the user later asks for multi-sponsor crowd-funding per child.

- [ ] **Step 1: Write the failing test for the full sponsorships API**

Replace `backend/sponsorships/tests.py`:

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python manage.py test sponsorships -v 2`
Expected: FAIL — no URLs registered yet (404s).

- [ ] **Step 3: Create `sponsorships/serializers.py`**

```python
from rest_framework import serializers
from .models import Sponsorship, SponsorshipPayment


class SponsorshipPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SponsorshipPayment
        fields = ["id", "sponsorship", "amount", "date", "transaction_id"]
        read_only_fields = ["sponsorship", "date"]


class SponsorshipSerializer(serializers.ModelSerializer):
    sponsorship_type_label = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()
    sponsor_name = serializers.SerializerMethodField()
    child_name = serializers.SerializerMethodField()
    payments = SponsorshipPaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Sponsorship
        fields = [
            "id", "sponsor", "sponsor_name", "child", "child_name",
            "sponsorship_type", "sponsorship_type_label", "amount", "status",
            "status_label", "start_date", "end_date", "payments",
        ]
        read_only_fields = ["sponsor", "start_date"]

    def get_sponsorship_type_label(self, obj):
        return dict(Sponsorship.SPONSORSHIP_TYPES).get(obj.sponsorship_type, obj.sponsorship_type)

    def get_status_label(self, obj):
        return dict(Sponsorship.STATUS_CHOICES).get(obj.status, obj.status)

    def get_sponsor_name(self, obj):
        return obj.sponsor.full_name

    def get_child_name(self, obj):
        return f"{obj.child.prenom} {obj.child.nom}"
```

- [ ] **Step 4: Replace `sponsorships/views.py`**

```python
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from children.models import Child
from children.serializers import ChildSerializer
from .models import Sponsorship, SponsorshipPayment
from .serializers import SponsorshipSerializer, SponsorshipPaymentSerializer

SPONSOR_ROLES = ("sponsor", "partner")
ORG_VIEW_ROLES = ("director", "federation", "supermaster", "auditor")
PAYMENT_WRITER_ROLES = ("director", "federation", "supermaster")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sponsorable_children_list(request):
    sponsored_ids = Sponsorship.objects.filter(status="active").values_list("child_id", flat=True)
    qs = Child.objects.exclude(id__in=sponsored_ids)
    return Response(ChildSerializer(qs, many=True).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def sponsorship_list(request):
    user = request.user

    if request.method == "POST":
        if user.role not in SPONSOR_ROLES:
            return Response({"error": "Seul un parrain peut créer un parrainage."}, status=status.HTTP_403_FORBIDDEN)
        serializer = SponsorshipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(sponsor=user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    if user.role in SPONSOR_ROLES:
        qs = Sponsorship.objects.filter(sponsor=user)
    elif user.role in ORG_VIEW_ROLES:
        qs = Sponsorship.objects.all()
        if user.role in ("director", "staff") and user.orphanage_id:
            qs = qs.filter(child__orphanage_id=user.orphanage_id)
    else:
        qs = Sponsorship.objects.none()
    return Response(SponsorshipSerializer(qs.select_related("sponsor", "child"), many=True).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def sponsorship_detail(request, sponsorship_id):
    user = request.user
    try:
        sponsorship = Sponsorship.objects.get(pk=sponsorship_id)
    except Sponsorship.DoesNotExist:
        return Response({"error": "Parrainage introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if not (sponsorship.sponsor_id == user.id or user.role in ("federation", "supermaster")):
        return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

    new_status = request.data.get("status")
    if new_status not in dict(Sponsorship.STATUS_CHOICES):
        return Response({"error": "Statut invalide."}, status=status.HTTP_400_BAD_REQUEST)
    sponsorship.status = new_status
    sponsorship.save(update_fields=["status"])
    return Response(SponsorshipSerializer(sponsorship).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def sponsorship_payment_list(request, sponsorship_id):
    user = request.user
    try:
        sponsorship = Sponsorship.objects.get(pk=sponsorship_id)
    except Sponsorship.DoesNotExist:
        return Response({"error": "Parrainage introuvable."}, status=status.HTTP_404_NOT_FOUND)

    can_view = sponsorship.sponsor_id == user.id or user.role in ORG_VIEW_ROLES
    if not can_view:
        return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "POST":
        if user.role not in PAYMENT_WRITER_ROLES:
            return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)
        serializer = SponsorshipPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(sponsorship=sponsorship)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    qs = sponsorship.payments.all()
    return Response(SponsorshipPaymentSerializer(qs, many=True).data)
```

- [ ] **Step 5: Create `sponsorships/urls.py`**

```python
from django.urls import path
from . import views

urlpatterns = [
    path("parrainages/enfants-disponibles/", views.sponsorable_children_list, name="sponsorable-children"),
    path("parrainages/", views.sponsorship_list, name="sponsorship-list"),
    path("parrainages/<int:sponsorship_id>/", views.sponsorship_detail, name="sponsorship-detail"),
    path("parrainages/<int:sponsorship_id>/paiements/", views.sponsorship_payment_list, name="sponsorship-payment-list"),
]
```

- [ ] **Step 6: Register sponsorships urls in `config/urls.py`**

Add after the `finances.urls` include line:

```python
    path("api/", include("finances.urls")),
    path("api/", include("sponsorships.urls")),
    path("api/", include("communications.urls")),
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && python manage.py test sponsorships -v 2`
Expected: PASS (9 tests)

- [ ] **Step 8: Run the full backend test suite to check for regressions**

Run: `cd backend && python manage.py test`
Expected: all tests PASS (accounts, children, config, finances, orphanages, projets, sponsorships)

- [ ] **Step 9: Commit**

```bash
git add backend/sponsorships backend/config/urls.py
git commit -m "feat: wire up sponsorships API (browse, sponsor, payments)"
```
