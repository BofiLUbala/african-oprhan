# Partner/Project Sync, Approval Workflow & Dashboard Redesign

## Goal

A fully synchronized Project Management + Approval Workflow across Communication, Dashboard, Child, Orphanage, Federation, and Partner modules — one project record, routed automatically to the right ambassador for review, then to the right Partner category once validated. Enterprise-grade UI on the Partner dashboard. Reuse existing architecture; no duplicate models/APIs/workflows.

## Verified current state (read before implementing — avoids re-deriving this)

- **Project model** — `backend/projets/models.py:22-124`. Fields: `type` (enfant/orphelinat/federation), `titre`, `description`, `resume`, `orphelinat` FK, `enfant` FK, `source_update` FK (→ ChildUpdate), `createur`/`createur_role`, `ambassadeur_validateur`, `assigned_reviewer`, `statut`, `budget_total`, `montant_collecte`, `beneficiaires`, `date_debut`/`date_fin`, `documents`, `pdf_file`, `followers`. `code` is currently a **derived property** (`models.py:87-88`): `f"PRJ-{self.pk:04d}"` — not type-prefixed, not stored.
- **Category is NOT a real field today.** `source_update_category` (`backend/projets/serializers.py:15,78`) is a `SerializerMethodField` derived only from `obj.source_update.category` — a project created directly (not from a ChildUpdate) has no category at all. This is why the Partner Child page's sub-tabs (health/family/social/education/documents) are currently non-functional for directly-created projects.
- **Ambassador routing already works correctly.** `get_reviewer_for_child()` (`backend/projets/permissions.py:50-61`) resolves the ambassador via `ChildAssignment` — the same table backing the ambassador's "Gestion multi-orphelinats" page (`backend/children/views.py:575-591`, `GET /assignments/by-orphanage/`). `_send_to_reviewer()` (`backend/projets/views.py:144-202`) sets `assigned_reviewer` + `statut` + notifies. **Verified live in the DB**: project id 9 (created today by director DarloK Koz, id 3) is correctly `statut=en_attente_ambassadeur`, `assigned_reviewer_id=7` (Smarg Yaju, the child's assigned ambassador), and a notification exists. This part of the pipeline needs no fix — just UI naming/polish.
- **Ambassador review UI already exists** — `esRequests`/`esSelectedRequest` in `EclatSocialApp`, "Requêtes de validation" (`frontend/src/App.jsx:3879-4009`), backed by `GET /projets/requests/` (`backend/projets/views.py:753-766`, correctly filters `assigned_reviewer=user`). Current actions are `approve`/`reject`/`improve` (`App.jsx:3925-3971`) — needs relabeling to **Validate / Cancel / Request Improvement** and a "Cancel reason" requirement (reject already requires a comment, `App.jsx:3939`).
- **Director's Responses view already exists** (`esLoadResponses`, `GET /projets/responses/`) — needs to display Cancel/Improvement/Validated outcomes per spec (ID, title, child, ambassador, status, date/time, comment).
- **Two creation entry points, one is broken:**
  1. Communication composer (`App.jsx:3634-3730`) — correctly forces target selection, correct field names, auto-submits director child-projects for review. Works.
  2. Classic Dashboard "Projets" page (`App.jsx:9731-9918`) — **broken**: no child/orphanage target picker at all, wrong field names (`title`/`start_date`/`end_date` vs. backend's `titre`/`date_debut`/`date_fin`), and a silent local-only fake-success fallback (`App.jsx:9865-9879`) that masks real failures. This is the root cause of "projects created from the dashboard don't sync anywhere."
- **Partner pages already filter by `type`** — `PartnerChildFeature`/`PartnerOrphanageFeature`/`PartnerFederationFeature` (`App.jsx:12242-12367`) call `GET /projets/?statut=publie&type=<enfant|orphelinat|federation>`. This already routes by type automatically — the redesign/fix work is: (a) make category sub-tabs real, (b) fix the two creation forms so what reaches here is always complete, (c) visual redesign.
- **Ambassador "Gestion multi-orphelinats" already returns what's needed** — `ChildAssignmentSerializer` (`backend/children/serializers.py:283-302`) already includes `child_photo` and `orphanage_name`. The frontend just isn't using them yet (renders initials, not clickable). No backend change needed for this piece.
- **Accueil currently shows published projects as cards already** (verified live — "TEST E2E Scolarisation Marush" renders as a project card on the public landing page). Needs: a distinct "Project Card" style (vs. regular posts) + a **Postulate** button for partners.
- **No Federation model, no Partner↔target assignment model** — confirmed absent. Per earlier agreement in this session: partner visibility stays an open marketplace (any partner sees any published project of a type) — not building a new assignment system.

## Scope

### 1. Backend — `Project` model changes (`backend/projets/models.py`, `constants.py`, `serializers.py`)
- Add real `category` field (`CharField`, blank=True): choices depend on `type`.
  - `type='enfant'` → `education | health | family | social | other` (label "Other Projects" — per explicit final instruction, not "documents").
  - `type='orphelinat'` → `food | clothes | school_accessories | medicine | construction | funding | other`.
  - `type='federation'` → blank.
- Add `validate()` to `ProjetCreateSerializer`: type↔target FK consistency (enfant/orphelinat required for their type, blank otherwise) AND type↔category consistency (category must be from the matching set, blank for federation).
- Replace the `code` property with a stored, type-prefixed, year-scoped sequential code, generated once at creation and persisted (needs a migration + generation function): `CHD-2026-0001` / `ORP-2026-0001` / `FED-2026-0001`. Keep unique + queryable (add a DB index).
- Keep `source_update_category` for backward compat (existing update-derived projects), but new/direct creation always sets `category` explicitly.

### 2. Both creation entry points rebuilt identically
- Fix the legacy Dashboard "Projets" page (`App.jsx:9731-9918`): correct field names, add target picker (reusing the same children/orphanages data source as the composer), add the category-selection step, remove the fake local-success fallback (surface real errors), auto-submit-for-review when `role==='director' && type==='enfant'`.
- Communication composer: extend the existing category step (currently only reachable via "Publier une mise à jour") so a **direct** "nouveau projet" also captures `category` up front, using the same 5 (child) / 7 (orphanage) options, in the same order, in both places.
- "Rattacher un projet" (attach-existing) — already fetches `esProjExistingProjects` for the target; ensure it only ever *links* to an existing project (already does — `esProjAttachExisting`), never creates a duplicate, and surfaces category on each listed project.

### 3. Ambassador review workflow — three states only
- Relabel `approve/reject/improve` → **Validate / Cancel / Request Improvement** in the Requests UI (`App.jsx:3925-3971`) and their handler functions/notifications copy. Cancel requires a mandatory reason (mirror the existing `reject` requirement at `App.jsx:3939`).
- **On Cancel**: project must not publish, must not appear in Accueil or any Partner page (already true — stays out of `statut=publie`) — surface the outcome in the director's Responses view with reason + date/time.
- **On Request Improvement**: mandatory comment (already required), director edits and resubmits via the existing `PATCH project_modifier` endpoint (`backend/projets/views.py:407-458`), which already re-routes to the same reviewer when `statut == modification_demandee` (`views.py:427-450`). No new endpoint needed — just wire the frontend edit form to call it and confirm the same-ambassador routing holds.
- **On Validate**: project → `statut=publie` (existing transition), appears in Accueil as a **Project Card** (visually distinct from a normal post) with a **Postulate** button (opens the existing partner candidature flow, reusing `SponsorshipFormModal`/`project_candidature_create` — no new endpoint), and a Response entry is created for the director (Validated, ambassador, date/time, optional comment). Because Partner pages already filter `statut=publie`, this is the "sync to Partner category" step — no separate publish-to-partner action needed, just confirm it actually reaches `type`-filtered Partner pages end-to-end.

### 4. Ambassador "Gestion multi-orphelinats" page (frontend-only — data already available)
- Replace initials avatar with real `child_photo`.
- Make each child row clickable → detail view showing photo, name, ID, age, gender, status, `orphanage_name` (all already in the API response).

### 5. Partner dashboard — category-aware tabs + redesign
- `PartnerChildFeature` sub-tabs wired to the new real `category` field (not the currently-empty `source_update_category`).
- `PartnerOrphanageFeature` gains equivalent sub-tabs for its 7 categories.
- Visual redesign of all 4 partner pages (Child/Orphanage/Federation/Response Board): glassmorphism, soft glow accents per category, professional typography/spacing, card/loading/empty states, animations, responsiveness. Use `/21st-ui-design` and `/ui-ux-pro-max` for token decisions during implementation. New isolated CSS (doesn't touch `App.css`'s existing `opp-*` rules).
- i18n: FR/EN keys for all 4 pages (currently hardcoded literal strings).

### 6. Project code
- Every project gets a stored, unique, type-prefixed code at creation (`CHD-2026-0001` etc., see §1). Visible on every project card/detail, searchable.

## Out of scope (reaffirmed from earlier agreement)
- No new Partner↔Orphanage/Child/Federation assignment model — partner visibility stays type-filtered "browse all published" per category.
- No Federation entity.
- No changes to unrelated modules (finances, sponsorships-app, tickets, etc.)

## Testing / verification
- Backend: extend `backend/projets/tests.py` for the new `validate()` rules (type/target/category consistency) and the new code-generation function (uniqueness, prefix-by-type, year scoping).
- Browser e2e (dev server, both already running on 5173/8000): for each type, create a project from **both** entry points, confirm identical resulting data; as the assigned ambassador, Validate one (confirm Accueil card + Postulate button + Partner-page visibility), Cancel one (confirm it never appears in Accueil/Partner, confirm director sees Cancelled response), Request Improvement on one (confirm director can edit/resubmit, confirm it returns to the same ambassador). Confirm no duplicate Project rows are ever created across the two entry points or across attach-vs-create.
