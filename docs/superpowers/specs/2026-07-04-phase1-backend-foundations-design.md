# Phase 1 — Backend Foundations

Part of a 7-phase roadmap to bring the Orphenlina platform (Django + React/Vite web +
Expo mobile + Electron desktop) to production quality against the spec in
`Plateforme de Gestion des Orphelinats (1).pdf`. This phase fixes security issues and
wires up the two backend apps (`finances`, `sponsorships`) that currently have models
but no API surface at all, since every later feature (donations, sponsorship UI,
financial dashboards) depends on them.

## Scope

1. **Security fixes** (`config/settings.py`)
   - Remove the hardcoded Gmail credential fallback; require `EMAIL_HOST_USER` /
     `EMAIL_HOST_PASSWORD` from environment, add `.env.example` documenting all
     required env vars (already-used ones: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`,
     `ALLOWED_HOSTS`, `DB_ENGINE`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`/`DB_HOST`/`DB_PORT`,
     `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, plus the new email vars).
   - Fix the contradictory CORS config: `CORS_ALLOW_ALL_ORIGINS` should only be `True`
     when `DEBUG` is `True`; otherwise fall back to the explicit `CORS_ALLOWED_ORIGINS`
     list.
   - `SECRET_KEY`: keep the env var read, but stop silently falling back to a
     known-insecure string when `DEBUG` is `False` (raise at startup instead, so a
     misconfigured production deploy fails loudly rather than running insecurely).
   - Load `.env` via `python-dotenv` if not already wired (check first).

2. **Role model expansion** (`accounts/models.py`)
   - Add three role values to `ROLES`: `auditor` ("Auditeur"), `sponsor` ("Parrain/Marraine"),
     `staff` ("Personnel Orphelinat"). Existing roles (`ambassador`, `federation`,
     `supermaster`, `partner`, `director`) are unchanged — this is additive, via a new
     migration.
   - Update the shared permission matrices in `children/permissions.py` and
     `projets/permissions.py` (and any other role-keyed dict) to include sane defaults
     for the three new roles: `auditor` gets read-only visibility everywhere (maps to
     the existing `ROLES_VOIR_CONFIDENTIEL`/read-only patterns, never write); `sponsor`
     gets visibility scoped to children they sponsor only; `staff` mirrors `director`
     minus validation/approval rights.
   - Frontend role dictionaries (`ROLE_MENUS`, `ROLE_NAV`, etc. in the three clients)
     are **out of scope for this phase** — they'll get proper menus when each new
     role's feature set is built (sponsor UI in Phase 2, auditor dashboard in Phase 4).
     For now the goal is just that the backend accepts and enforces these roles
     correctly.

3. **`finances` app — build the missing API**
   - `serializers.py`: `DonationSerializer`, `IncomeSerializer`, `ExpenseSerializer`
     (following the existing `NeedSerializer` pattern — label fields for choices).
   - Add a `status` field to `Donation` (`pending` / `completed` / `failed`, default
     `completed`) since there's no real payment gateway integrated yet — donations are
     recorded directly. This is a deliberate, explicit stand-in: the design leaves a
     clear seam (`Donation.status` + `transaction_id`) for wiring a real payment
     provider (Stripe / Flutterwave / mobile money) in a later phase once the user
     supplies provider credentials. Not building a fake payment UI beyond this.
   - `views.py`: DRF `ModelViewSet`s for all three models, function-based endpoint or
     ViewSet action for "my donations" (donor sees own) vs org-scoped list (director
     sees own orphanage, federation/supermaster see all).
   - `urls.py` + register under `api/` in `config/urls.py`.
   - Permissions: any authenticated user can create a `Donation` (donor = request.user);
     only `director`/`federation`/`supermaster`/`auditor` can list `Income`/`Expense`
     for orphanages they have access to.

4. **`sponsorships` app — build the missing API**
   - `serializers.py`: `SponsorshipSerializer`, `SponsorshipPaymentSerializer`.
   - `views.py`: endpoint to list sponsorable children (children not already
     fully sponsored — reuse existing `Child` queryset), `SponsorshipViewSet`
     (create/list/cancel, scoped to `request.user` for sponsors, org-scoped for
     directors/federation), `SponsorshipPaymentViewSet` (record + list payment
     history per sponsorship).
   - `urls.py` + register in `config/urls.py`.
   - Permissions: sponsor role (and `partner`, kept for backward compat since the
     current frontend uses `partner` for this) can create sponsorships and see their
     own; director/federation/supermaster/auditor can view sponsorships for their
     orphanage(s).

## Explicitly out of scope for Phase 1

- Real messaging/conversation endpoints (Phase 3).
- Frontend UI for any of this (Phase 2 wires the actual Needs/Donations/Sponsorship/
  Financial screens to these new endpoints).
- Real payment gateway integration (needs user-supplied provider credentials first).
- 2FA/MFA (Phase 7).

## Testing

- Django `tests.py` per app covering: serializer validation, permission enforcement
  per role (including the 3 new roles), and the sponsorable-children / my-donations /
  my-sponsorships scoped endpoints.
- Manual smoke test via `manage.py check` + running the dev server and hitting each
  new endpoint with `curl`/DRF browsable API.
