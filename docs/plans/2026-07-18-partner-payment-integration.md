# Partner Payment Integration Implementation Plan

> **For implementers:** Use ring:executing-plans (rolling wave: dispatch each
> wave — a phase or one epic, your choice — as a workflow → review → user
> checkpoint → detail the next phase against the real code → repeat),
> ring:dispatching-workflows to run each phase as a reviewed multi-agent
> workflow (review + contrarian baked in), or ring:running-dev-cycle for the
> full subagent-orchestrated workflow.
> This document is the living source of truth — task elaboration for later
> phases is written back into it during execution.

**Goal:** Let a partner pay for their accepted project candidature via Visa (Stripe) or DRC mobile
money (CinetPay: Orange Money / Airtel Money), and let Chef de Fédération + Supermaster see every
transaction including real failure reasons — all inside the existing Django + React app, matching
its current UI conventions exactly, with no mock data and no new visual system.

**Architecture:** A new `payments` Django app owns the Stripe/CinetPay gateway wrappers and the
checkout/webhook/status endpoints, linking to a new `Transaction.candidature` FK on the existing
`finances.Transaction` model (reusing `finances.Transaction`/`PaymentProvider` rather than
duplicating them, following the same cross-app FK precedent `finances.Donation.project` already
uses). Card payments use Stripe **PaymentIntents + Stripe.js Elements embedded in the existing
in-app modal** — not a hosted Checkout Session redirect — because the confirmed UX requires
staying on the same modal and retrying immediately after a decline. Mobile money uses CinetPay's
direct-charge API plus a short-poll status endpoint, since operator confirmation is asynchronous
(the payer approves via USSD/SMS on their phone). The frontend adds a single "Payer" action to the
existing `PartnerResponseBoard` accepted-candidature card and reuses the existing `es-modal-*`
CSS/JSX pattern, the existing `EsIcon`/`CIcon` icon systems, and the existing exported `apiFetch`
helper — no new component library, no new design tokens.

**Tech Stack:** Django 4.2 / DRF (new `payments` app), `stripe` Python SDK, CinetPay REST API via
`requests` (no official Python SDK exists), Stripe.js (loaded client-side) for Elements, React 18
(`frontend/src/App.jsx`, `frontend/src/components/PaymentManagementPage.jsx`).

## Phase Overview

| Phase | Milestone | Epics | Status |
|-------|-----------|-------|--------|
| 1 | Backend payment processing works end-to-end against mocked gateway calls: checkout initiation, Stripe PaymentIntents + webhook, CinetPay charge + check-then-trust webhook, status polling | 1.1, 1.2, 1.3, 1.4 | Detailed |
| 2 | Partner can pay an accepted candidature from the real Réponses board UI, with real success/failure driven by the Phase 1 endpoints | 2.1, 2.2 | Epic-level |
| 3 | Chef de Fédération and Supermaster see every transaction, including real failure reasons; orphanage director still has no access | 3.1 | Epic-level |

---

## Phase 1: Backend payment processing

### Epic 1.1: `payments` app skeleton, shared exception, env vars, dependencies

**Goal:** The `payments` Django app exists, is registered and migrated, exposes the
`Transaction.candidature` FK other epics depend on, and has its config/dependencies in place.
**Scope:** `backend/payments/` (new), `backend/config/settings.py`, `backend/config/urls.py`,
`backend/requirements.txt`, `backend/.env.example`, `backend/finances/models.py`
**Dependencies:** none
**Done when:** `python manage.py check` and `python manage.py migrate` both succeed; the new env
vars and dependency lines are present in the expected files.
**Status:** Pending

#### Task 1.1.1: Create the `payments` app skeleton and register it

- [ ] Done

**Context:** `INSTALLED_APPS` (`backend/config/settings.py:19-42`) lists local apps in a fixed
order ending in `..., "sponsorships", "management", "opportunities"` under a `# Local` comment.
`backend/config/urls.py` mounts every app flatly under `api/` — one line per app, e.g.
`path("api/", include("finances.urls"))` — with no per-app namespace, so new URL segments defined
inside `payments/urls.py` must not collide with any existing app's paths (they won't: this plan
only introduces `payments/candidatures/<id>/checkout/`, `payments/webhooks/stripe/`,
`payments/webhooks/cinetpay/`, `payments/transactions/<ref>/status/`).

**Implementation vision:** Create the app with Django's standard `startapp` layout
(`apps.py`, `migrations/__init__.py`) plus the extra files this plan needs. This app defines no
Django models of its own (it only references `finances.Transaction` and
`projets.CandidatureProjet`), so `models.py` can stay the default empty file `startapp` generates.
Add `"payments"` to `INSTALLED_APPS` immediately after `"finances"`. Add
`path("api/", include("payments.urls"))` as the last line of `urlpatterns` in
`backend/config/urls.py`. Create `backend/payments/exceptions.py` with a single class:
`class PaymentGatewayNotConfigured(Exception): pass` — this is the shared contract Epics 1.2, 1.3,
and 1.4 all import from one place (not redefined per-gateway). Create an initially-empty
`backend/payments/urls.py` (`urlpatterns = []`) to be populated by later tasks.

**Files:**
- Create: `backend/payments/__init__.py`, `backend/payments/apps.py`,
  `backend/payments/migrations/__init__.py`, `backend/payments/urls.py`,
  `backend/payments/views.py`, `backend/payments/permissions.py`,
  `backend/payments/exceptions.py`, `backend/payments/gateways/__init__.py`
- Modify: `backend/config/settings.py:42` (INSTALLED_APPS), `backend/config/urls.py` (add include)

**Verification:** `python manage.py check` (run from `backend/`) exits 0 with no errors or warnings
about the new app.

**Done when:** Django recognizes `payments` as an installed app with a working (empty) URL include
and `from payments.exceptions import PaymentGatewayNotConfigured` succeeds.

---

#### Task 1.1.2: Add `Transaction.candidature` FK

- [ ] Done

**Context:** `finances.Transaction` (`backend/finances/models.py:114-203`) has no way today to
reference the `CandidatureProjet` that triggered a payment. The codebase already has a precedent
for a cross-app FK from `finances` into `projets` (`Donation.project`, `on_delete=SET_NULL`, using
a string reference to avoid a circular import since `projets` does not import `finances`).

**Implementation vision:** Add to `Transaction`:
`candidature = models.ForeignKey("projets.CandidatureProjet", null=True, blank=True, on_delete=models.SET_NULL, related_name="transactions")`.
Generate and apply the migration. This field is the public contract every later epic in this plan
relies on to connect a payment back to its candidature (and from there, `candidature.projet` for
`montant_collecte`/`budget_total`/`date_fin`).

**Files:**
- Modify: `backend/finances/models.py`
- Create: `backend/finances/migrations/0004_transaction_candidature.py` (or next available number —
  check the current highest migration number in `backend/finances/migrations/` before naming)

**Verification:** `python manage.py makemigrations finances --check --dry-run` reports no pending
changes after the migration is created; `python manage.py migrate` applies it cleanly against the
dev SQLite DB.

**Done when:** `Transaction.objects.filter(candidature=some_candidature_instance)` is a valid,
working queryset.

---

#### Task 1.1.3: Add Stripe/CinetPay env vars and dependencies

- [ ] Done

**Context:** `backend/.env.example` uses a flat `KEY=value` style, grouped by blank lines, all
uppercase, no quoting (e.g. the `EMAIL_*` block). `backend/requirements.txt` lists one unpinned
minimum-version dependency per line with no comments (`django>=4.2`, `python-dotenv>=1.0`, etc.).
Env vars are read in application code via plain `os.environ.get("NAME", "")` — there is no
django-environ/python-decouple layer to configure.

**Implementation vision:** Append a new group to `.env.example` (all left empty — these are
placeholders; the user supplies real values later and no code changes will be needed at that
point):
```
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

CINETPAY_API_KEY=
CINETPAY_SITE_ID=
CINETPAY_SECRET_KEY=
```
Append two lines to `requirements.txt`: `stripe>=7.0` and `requests>=2.31` (CinetPay has no
official Python SDK; it's called via plain HTTP — `requests` isn't currently a direct dependency
even though DRF pulls it in transitively, so list it explicitly since this app calls it directly).

**Files:**
- Modify: `backend/.env.example`, `backend/requirements.txt`

**Verification:** `pip install -r requirements.txt` succeeds in a clean virtual environment.

**Done when:** Both files contain the new entries in the existing formatting style, and `import
stripe` / `import requests` succeed in a Python shell inside the project's venv.

---

### Epic 1.2: Checkout-initiation and status-polling endpoints

**Goal:** A partner can request a checkout for their own accepted candidature; the request is
validated and routed to the correct gateway, and its resulting status can be polled.
**Scope:** `backend/payments/views.py`, `backend/payments/permissions.py`, `backend/payments/urls.py`
**Dependencies:** Epic 1.1
**Done when:** An automated test suite covers every validation branch and a mocked-gateway happy
path, with no real network call made.
**Status:** Pending

#### Task 1.2.1: `PeutPayerCandidature` permission class

- [ ] Done

**Context:** The exact `BasePermission` idiom already used in this codebase
(`backend/projets/permissions.py:31-33`, `PeutPostulerProjet`):
```python
class PeutPostulerProjet(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'partner'
```
`CandidatureProjet.partenaire` (`backend/projets/models.py:159-161`) is the FK to the applying
partner user — confirmed exact field name.

**Implementation vision:** In `backend/payments/permissions.py`, define
`PeutPayerCandidature(BasePermission)` with `has_permission` matching the pattern above exactly
(authenticated + `role == 'partner'`), plus `has_object_permission(self, request, view, obj)`
checking `obj.partenaire_id == request.user.id` (where `obj` is the `CandidatureProjet` the view
fetches). No extra abstraction — mirror the one-liner style of the referenced class.

**Files:**
- Modify: `backend/payments/permissions.py`

**Verification:** A unit test instantiating the permission class directly against mock
request/user/candidature combinations: same-partner-owns-it (allow), different-partner (deny),
non-partner role (deny at `has_permission`).

**Done when:** All three cases pass.

---

#### Task 1.2.2: `payment_checkout_initiate` view

- [ ] Done

**Context:** `PaymentProvider.PROVIDER_CHOICES` (`backend/finances/models.py:87-111`) includes
`visa`, `mastercard`, `mpesa`, `airtel_money`, `orange_money`, `mtn_money` — this endpoint only
ever resolves `visa` (card method) or `orange_money`/`airtel_money` (mobile_money method); `mpesa`
and `mtn_money` are out of scope per the design spec (DRC-only mobile money) and must be rejected
explicitly if somehow requested. The existing `payment_initiate`
(`backend/finances/views.py:103-114`) shows the reference-number generator to reuse:
`f"TXN-{uuid.uuid4().hex[:12].upper()}"`. `CandidatureProjet.statut`/`.montant_propose`/`.projet`
and `Project.orphanage` are the fields this view reads (confirm the exact FK name from `Project`
to its target — some projects target a `Child` instead of an `Orphanage`; if the project's target
isn't an orphanage, leave `Transaction.orphanage` as `None` rather than guessing a relation).

**Implementation vision:** `POST /api/payments/candidatures/<int:candidature_id>/checkout/`, body
`{"method": "visa"|"mobile_money", "amount": "500.00", "operator": "orange"|"airtel", "phone_number": "+243..."}`
(`operator`/`phone_number` required only when `method == "mobile_money"`; reject any other
`operator` value with 400). Permission: `IsAuthenticated, PeutPayerCandidature` (object-level
check performed manually after fetching the candidature, per DRF's `has_object_permission`
convention). Steps, in order, each returning a clear error on failure (mirroring the plain-French
error-message style already used elsewhere, e.g. `"Numéro de référence requis."`):
1. 404 if the candidature doesn't exist.
2. Run `PeutPayerCandidature.has_object_permission` manually; 403 if it fails.
3. 400 `"Cette candidature n'est pas encore approuvée."` if `candidature.statut != "acceptee"`.
4. 400 `"Le montant ne peut pas être inférieur au montant proposé (${montant_propose})."` if
   `amount < candidature.montant_propose`.
5. Resolve the `PaymentProvider` row by name (`"visa"` for card; `"orange_money"`/`"airtel_money"`
   for mobile_money based on `operator`) — 503
   `"Ce moyen de paiement n'est pas disponible actuellement."` if missing or `is_active=False`.
6. Create the `Transaction`: `payer=request.user`, `candidature=candidature`,
   `transaction_type="project_financing"` (existing choice), `payment_method="card"` or
   `"mobile_money"`, `payment_provider=<resolved>`, `amount=amount`, `currency="USD"`,
   `orphanage=<candidature.projet's orphanage if the project targets one, else None>`,
   `status="pending"`, `reference_number=f"TXN-{uuid.uuid4().hex[:12].upper()}"`.
7. Branch on `method`: call `gateways.stripe_gateway.create_payment_intent(transaction)` (Epic 1.3)
   or `gateways.cinetpay_gateway.initiate_charge(transaction, operator, phone_number)` (Epic 1.4).
   Catch `payments.exceptions.PaymentGatewayNotConfigured` around this call and return 503 with a
   method-appropriate message ("Le paiement par carte n'est pas encore configuré." / "Le paiement
   mobile money n'est pas encore configuré.") — this is what keeps the endpoint honest before real
   credentials exist, instead of faking success.
8. Return 201 with the serialized `Transaction` (reuse the existing `TransactionSerializer` from
   `finances.serializers` — no new response serializer needed) merged with whatever the gateway
   call returned (`client_secret`/`publishable_key` for Stripe, `{"status": "pending_confirmation"}`
   for CinetPay).

**Files:**
- Modify: `backend/payments/views.py`, `backend/payments/urls.py`

**Verification:** `python manage.py test payments` — a DRF `APITestCase` covering: wrong role
(403), wrong owner (403), wrong `statut` (400), amount below minimum (400), unknown/inactive
provider (503), invalid `operator` value (400), and a happy path with the gateway call mocked via
`unittest.mock.patch`, asserting a `Transaction` row was created with `status="pending"` and the
correct `candidature`/`payment_method`/`payment_provider`.

**Done when:** All of the above test cases pass, and no test makes a real network call.

---

#### Task 1.2.3: `payment_status` polling view

- [ ] Done

**Context:** CinetPay mobile money confirmation is asynchronous — the payer approves via USSD/SMS
on their phone after the charge is initiated, so the frontend needs to poll for the final result
rather than get it back from the initiate call. `ADMIN_ROLES = ("federation", "supermaster")` is
already defined at `backend/finances/views.py:15-17` — import and reuse it rather than redefining.

**Implementation vision:** `GET /api/payments/transactions/<str:reference_number>/status/`.
Permission: authenticated, and either `transaction.payer == request.user` or
`request.user.role in ADMIN_ROLES`. Returns
`{"status": transaction.status, "failure_reason": transaction.metadata.get("failure_reason")}`.
This view makes no gateway call — it only reads the `Transaction` row, which the webhooks in
Epics 1.3/1.4 keep current.

**Files:**
- Modify: `backend/payments/views.py`, `backend/payments/urls.py`

**Verification:** Test asserting a non-owner, non-admin user gets 403; the owning partner and an
admin-role user both get 200 with the current status.

**Done when:** Both access-control cases and the happy path pass.

---

### Epic 1.3: Stripe integration (PaymentIntents, not hosted Checkout)

**Goal:** Real Stripe PaymentIntent creation and signature-verified webhook confirmation.
**Scope:** `backend/payments/gateways/stripe_gateway.py`, `backend/payments/views.py`,
`backend/payments/urls.py`
**Dependencies:** Epic 1.2
**Done when:** PaymentIntent creation and webhook handling both pass automated tests against
mocked Stripe SDK calls; a real success event completes the `Transaction` and atomically increments
`Project.montant_collecte`; a real failure event marks it failed with a stored reason; duplicate
webhook delivery is a safe no-op.
**Status:** Pending

#### Task 1.3.1: `stripe_gateway.create_payment_intent(transaction)`

- [ ] Done

**Context:** Stripe amounts are integer cents. `STRIPE_SECRET_KEY`/`STRIPE_PUBLISHABLE_KEY` are
read via `os.environ.get(...)` directly in this module (matching the codebase's plain-env-var
convention — no settings.py indirection needed for an app-local concern).
`payments.exceptions.PaymentGatewayNotConfigured` (Epic 1.1.1) is the exception to raise, not a
new one.

**Implementation vision:** If `STRIPE_SECRET_KEY` is empty, raise `PaymentGatewayNotConfigured`
before touching the `stripe` SDK. Otherwise call
`stripe.PaymentIntent.create(amount=int(transaction.amount * 100), currency="usd", metadata={"reference_number": transaction.reference_number}, description=f"Orphenlina — {transaction.candidature.projet.code}")`.
Immediately store the returned `intent.id` into `transaction.provider_reference` and save
(`update_fields=["provider_reference"]`) — this is what lets the webhook match the transaction
before confirmation completes. Return `{"client_secret": intent.client_secret, "publishable_key": os.environ.get("STRIPE_PUBLISHABLE_KEY", "")}`.

**Files:**
- Modify: `backend/payments/gateways/stripe_gateway.py`

**Verification:** Unit test mocking `stripe.PaymentIntent.create` (`unittest.mock.patch`),
asserting the returned dict shape and that `transaction.provider_reference` was set to the mocked
intent id. Separate test asserting `PaymentGatewayNotConfigured` is raised when the env var is
empty (no SDK call attempted).

**Done when:** Both tests pass with zero real network calls.

---

#### Task 1.3.2: Stripe webhook view

- [ ] Done

**Context:** Stripe's SDK provides `stripe.Webhook.construct_event(payload, sig_header, secret)`
for signature verification — use it rather than hand-rolling HMAC comparison. Stripe explicitly
warns that webhook deliveries can be duplicated, so idempotency must be handled here, not assumed
away.

**Implementation vision:** `POST /api/payments/webhooks/stripe/`, `@permission_classes([AllowAny])`
(Stripe calls this unauthenticated; security is entirely the signature check) reading the raw
request body and the `Stripe-Signature` header. Call `stripe.Webhook.construct_event(...)`; on
`ValueError` or `stripe.error.SignatureVerificationError`, return 400 immediately with no state
change. On event type `payment_intent.succeeded`: look up the `Transaction` by
`provider_reference == intent.id` (if not found, log and return 200 — an unmatched intent isn't
something to keep retrying). Guard with `if transaction.status == "pending":` before mutating
(idempotency). Inside `django.db.transaction.atomic()`: set `status="completed"`,
`completed_at=timezone.now()`; increment the linked project's collected total using
`F("montant_collecte") + transaction.amount` then `.save(update_fields=["montant_collecte"])` on
`transaction.candidature.projet` (the `F()` expression avoids a race condition against concurrent
payments landing on the same project). On `payment_intent.payment_failed`: same idempotency guard,
then `status="failed"`, `metadata["failure_reason"] = intent.last_payment_error.message if intent.last_payment_error else "Paiement refusé."`, save.

**Files:**
- Modify: `backend/payments/views.py`, `backend/payments/urls.py`

**Verification:** Tests posting a fabricated event with `stripe.Webhook.construct_event` mocked to
return a canned event object, covering: succeeded → transaction completed +
`montant_collecte` incremented by the right amount; failed → transaction failed +
`failure_reason` stored; a second, duplicate succeeded event → `montant_collecte` incremented only
once; bad signature → 400 and no state change at all.

**Done when:** All four cases pass as automated tests.

---

### Epic 1.4: CinetPay integration (Orange Money / Airtel Money, DRC only)

**Goal:** Real CinetPay charge initiation, plus a check-then-trust webhook that re-verifies status
via CinetPay's own API rather than trusting the notification body directly.
**Scope:** `backend/payments/gateways/cinetpay_gateway.py`, `backend/payments/views.py`
**Dependencies:** Epic 1.2
**Done when:** Charge initiation and the check-then-trust webhook flow both pass automated tests
against mocked HTTP responses, with success/failure updating the `Transaction` and
`montant_collecte` identically to the Stripe path (same idempotency guarantee).
**Status:** Pending

#### Task 1.4.1: `cinetpay_gateway.initiate_charge(transaction, operator, phone_number)`

- [ ] Done

**Context:** No official CinetPay Python SDK exists — call their REST API directly via `requests`.
`operator` is already constrained to `"orange"`/`"airtel"` by Epic 1.2's validation. CinetPay's
`channels` parameter expects their own operator codes (DRC-specific, e.g. an Orange-Money-DRC code
and an Airtel-Money-DRC code) — the exact literal values need confirming against CinetPay's docs
once real credentials are available, so define the `{"orange": "...", "airtel": "..."}` mapping as
a single module-level constant now (a placeholder mapping is fine; it's the one place to correct
later, not scattered through the code).

**Implementation vision:** Mirror Stripe's config-check pattern: if `CINETPAY_API_KEY` or
`CINETPAY_SITE_ID` is empty, raise `PaymentGatewayNotConfigured` before any HTTP call. Otherwise
`requests.post` CinetPay's payment endpoint with `apikey`, `site_id`,
`transaction_id=transaction.reference_number`, `amount`, `currency="USD"`,
`customer_phone_number=phone_number`, `channels=<mapped operator code>`, a `notify_url` pointing at
`/api/payments/webhooks/cinetpay/`, and a `description`. Store whatever payment token/id CinetPay
returns into `transaction.provider_reference` and save. Return `{"status": "pending_confirmation"}`
— the initiate call itself never marks the transaction completed or failed, since mobile money
confirmation is never immediate.

**Files:**
- Modify: `backend/payments/gateways/cinetpay_gateway.py`

**Verification:** Unit test mocking `requests.post`, asserting the request payload shape and that
`provider_reference` is set from the mocked response. Separate `PaymentGatewayNotConfigured` test
mirroring 1.3.1.

**Done when:** Both tests pass with zero real HTTP calls.

---

#### Task 1.4.2: CinetPay webhook with check-then-trust verification

- [ ] Done

**Context:** A blind-trust webhook (acting directly on whatever status the POST body claims) is
spoofable. CinetPay's own integration guidance is to re-query transaction status via their "Check
Payment Status" API before acting on any notification.

**Implementation vision:** `POST /api/payments/webhooks/cinetpay/`, `AllowAny` (same reasoning as
Stripe). Read `transaction_id` from the notification body, look up the local `Transaction` by
`reference_number`. Regardless of the notification body's own status claim, call a new
`cinetpay_gateway.check_status(transaction.reference_number)` (a second CinetPay API call using the
stored API key/site ID) and act only on **that** response. Guard with the same
`if transaction.status == "pending":` idempotency check as Stripe. On `ACCEPTED`: identical
completion + `F("montant_collecte")` increment as the Stripe success path. On `REFUSED`:
`status="failed"`, `metadata["failure_reason"]` set from CinetPay's returned description (e.g.
"Délai d'attente dépassé" for a timeout, matching the exact wording already used in this project's
earlier design conversation about this feature). On `PENDING`: no state change, return 200
(CinetPay may notify more than once before final settlement).

**Files:**
- Modify: `backend/payments/gateways/cinetpay_gateway.py` (add `check_status`),
  `backend/payments/views.py`, `backend/payments/urls.py`

**Verification:** Tests mocking `requests.post` for `check_status` returning each of `ACCEPTED`/
`REFUSED`/`PENDING`, asserting the same idempotent-completion and failure-reason behavior as the
Stripe webhook tests, plus a duplicate-notification-after-completion no-op test.

**Done when:** All three status cases plus the duplicate-notification case pass as automated
tests.

---

## Phase 2: Partner payment UI (epic-level — detailed by ring:executing-plans when this phase starts)

### Epic 2.1: Payment modal on the Réponses board, matching existing UI conventions

**Goal:** A partner can open a payment step from an accepted candidature card in
`PartnerResponseBoard` (`frontend/src/App.jsx:12843-12932`), choose Visa or Mobile Money, and pay —
using the existing `es-modal-*` overlay/panel pattern (`App.jsx`'s `SponsorshipFormModal`,
`App.css:4487-4554`), the existing `EsIcon`/`ES_ICON_PATHS` icon system (adding one new icon entry
for the payment action), and the existing exported `apiFetch`/`API`/`onLogout` prop-drilling
pattern already used by `PartnerResponseBoard` — no new modal library, no new icon set. Card
payment embeds Stripe.js Elements inline (loaded via the standard `<script src="https://js.stripe.com/v3/">`,
using the `publishable_key` returned by the checkout-initiation endpoint); mobile money collects an
operator + phone number and then polls `GET /api/payments/transactions/<ref>/status/` (short
interval, following the singleton `useSyncExternalStore` polling pattern already established by
`frontend/src/hooks/useNotifications.js`) until the status resolves. On failure, the error from the
real endpoint is shown inline and the same modal stays open for an immediate retry, exactly as
already confirmed. A "Payer" button is added as a new conditional block in the candidature card
JSX, alongside the existing `{c.statut === 'amelioration_demandee' && (...)}` block, active only
when `c.statut === 'acceptee'`.
**Scope:** `frontend/src/App.jsx`, `frontend/src/App.css`, `frontend/package.json` (Stripe.js
loading approach), a new polling hook mirroring `useNotifications.js`'s shape.
**Dependencies:** Phase 1
**Done when:** The full pay flow works end-to-end against the real backend from Phase 1 (using
Stripe test-mode keys, which are obtainable without a fully verified account, for manual
verification; CinetPay's sandbox may require the user's own test credentials before this can be
manually exercised end-to-end — note this dependency rather than blocking the phase on it, since
the code path itself doesn't require live credentials to be correct).
**Status:** Pending

### Epic 2.2: Reflect updated funding after payment

**Goal:** After a successful payment, the candidature/project's funded amount updates in the UI
without a manual page reload.
**Scope:** `PartnerResponseBoard`'s candidature list refresh (`App.jsx:12852`,
`GET /projets/mes-candidatures/`) and any other place `montant_collecte` is displayed.
**Dependencies:** Epic 2.1
**Done when:** A successful payment is immediately visible in the partner's own view without
requiring a refresh.
**Status:** Pending

---

## Phase 3: Federation/Supermaster transaction visibility (epic-level)

### Epic 3.1: Extend `PaymentManagementPage.jsx` access and add a failure-reason detail view

**Goal:** Chef de Fédération sees the same transaction list as Supermaster (minus provider CRUD,
which stays supermaster-only to match the backend's existing 403 enforcement), including a
failure-reason drill-down sourced from `Transaction.metadata`. Orphanage director gets no change
(already excluded at the routing layer).
**Scope:** `frontend/src/components/PaymentManagementPage.jsx` — replace the single
`const isSupermaster = role === 'supermaster'` gate (line 30) with a broader `isFinanceAdmin` check
for data-source decisions (`loadProviders`, `loadTransactions`, the admin/paginated transactions
endpoint and its extra "Payeur" column) while keeping provider-mutation actions
(`openCreateProvider`/`saveProvider`/`toggleProvider`) restricted to `role === 'supermaster'`
specifically, matching the backend's existing `admin_provider_create`/`update`/`toggle` 403
enforcement exactly. Add a failure-reason detail view reusing the file's own `pay-modal-overlay`/
`pay-modal` pattern (lines 326-352, 392-399), triggered from a click on a failed transaction row.
**Dependencies:** Phase 1 (needs `Transaction.metadata.failure_reason` to actually be populated by
the webhooks built there).
**Done when:** Federation sees the full transaction list and can drill into a failure's real
reason; Supermaster's existing capabilities are unchanged; director still has no access (unchanged
routing).
**Status:** Pending

---

## Self-Review Notes

- **Spec coverage:** every item in `docs/superpowers/specs/2026-07-18-partner-payment-integration-design.md`
  maps to an epic above — new `payments` app (1.1), checkout/status endpoints (1.2), Stripe (1.3),
  CinetPay (1.4), frontend payment modal matching existing conventions (2.1), funding reflected in
  UI (2.2), Federation/Supermaster visibility (3.1). Fund Dispatch/Follow-up and i18n are correctly
  out of scope here (separate specs/plans).
- **No mock data:** every endpoint reads/writes real `Transaction`/`CandidatureProjet`/`Project`
  rows; the only stand-in is `PaymentGatewayNotConfigured`, which fails loudly rather than faking
  success — this satisfies "no mock data" while remaining honest about missing credentials.
- **Existing UI conventions honored:** Phase 2 explicitly reuses `es-modal-*`, `EsIcon`, and the
  established prop-drilled `apiFetch`/`API`/`onLogout` pattern rather than introducing anything
  new; Phase 3 extends the existing `PaymentManagementPage.jsx` file in place rather than
  replacing it.
