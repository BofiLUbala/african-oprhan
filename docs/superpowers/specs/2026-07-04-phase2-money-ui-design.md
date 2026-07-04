# Phase 2 — Money Features UI

Part of a 7-phase roadmap. Phase 1 built the backend APIs for finances and sponsorships.
Phase 2 wires those APIs to the React web frontend (`frontend/src/App.jsx`).

## Context

`App.jsx` is an 8683-line monolith with no router. Navigation is state-based: `activeKey`
determines which screen to render in a long ternary chain inside `DashboardShell` (~line 2371).
Data is fetched in a single `useEffect` keyed on `[activeKey, role, subKey, orphanageName]`
(~line 1664). Auth tokens come from `localStorage.getItem('access_token')`. All API calls use
native `fetch()` with `Authorization: Bearer ${token}`.

## Three screens to build

### 1. Donations screen (`activeKey === 'dons'`)

**Who sees it:** ambassador (already in nav), sponsor, partner, director — add the missing roles.

**Content by role:**
- **Sponsor / partner**: their own donations list + form to submit a new donation (POST /api/dons/)
- **Ambassador**: list of all donations (GET /api/dons/) with type/amount columns, read-only
- **Director**: donations received by their orphanage (GET /api/dons/ — backend already scopes by orphanage for director)

**API endpoints:** `GET /api/dons/`, `POST /api/dons/`

### 2. Finances screen (`activeKey === 'finances'`) — NEW nav item

**Who sees it:** director, federation, supermaster, auditor

**Content:** Tabbed view — "Revenus" tab + "Dépenses" tab.
- Each tab: list of records + (for director/federation/supermaster) an "Ajouter" form
- Auditor: read-only, no add form

**API endpoints:** `GET/POST /api/revenus/`, `GET/POST /api/depenses/`

### 3. Sponsorships screen (`activeKey === 'parrainages'`)

**Who sees it:** partner (already in nav), sponsor — add sponsor to nav.
**Secondary view:** director sees their orphanage's sponsorships (list only, link from their existing nav).

**Content by role:**
- **Sponsor / partner**: two sub-tabs — "Enfants disponibles" (browse + sponsor button) and
  "Mes parrainages" (list own sponsorships + payment history)
- **Director / federation / supermaster**: list of all sponsorships scoped to their orphanage(s)

**API endpoints:** `GET /api/parrainages/enfants-disponibles/`, `GET/POST /api/parrainages/`,
`PATCH /api/parrainages/<id>/`, `GET /api/parrainages/<id>/paiements/`

## Implementation approach

Follow the existing App.jsx patterns exactly:
- State declarations near line 1496 (add new `useState` hooks)
- Data fetching inside the existing `useEffect` at ~line 1664 (add new `if (activeKey === '...')` branches)
- New rendering branches inserted in the ternary chain before the generic fallback
- CSS reuses existing classes (`dash-section`, `dash-card`, `btn`, `btn-primary`, etc.)
- No new files — everything goes into App.jsx

## Out of scope for Phase 2

- Dashboard stat cards (replace hardcoded "45 dons", "3 filleuls" counts) — Phase 4
- Payment gateway integration — requires user-supplied credentials
- Real-time notifications for new donations — Phase 3
- Mobile app parity — Phase 6
