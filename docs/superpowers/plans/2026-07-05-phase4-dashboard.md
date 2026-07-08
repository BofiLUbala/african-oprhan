# Phase 4 — Live Dashboard Stats & Reports Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded dashboard KPI cards with real backend counts, and build a live `rapports` screen with pure-SVG charts (no charting library) showing donations trend, children demographics, and sponsorship breakdown.

**Architecture:** New `GET /api/stats/` endpoint on the backend returns role-scoped counts and 6-month monthly chart data. Frontend fetches this on dashboard load and overlay-replaces the static `ROLE_STATS` values. The `rapports` screen becomes a full data-viz page with inline SVG bar charts and a donut chart.

**Tech Stack:** Django 4.2 / DRF, React 18, pure SVG for charts (no Recharts, Chart.js, or D3)

## Global Constraints

- No new Django apps — add a new `views.py` endpoint to an existing app; wire it in `config/urls.py`
- The stats endpoint must live at `GET /api/stats/` — no other path
- All UI changes: `frontend/src/App.jsx` and `frontend/src/App.css` only — no new files
- `const API = 'http://localhost:8000/api'` (line 5 of App.jsx) — use this constant
- Auth tokens: `localStorage.getItem('access_token')`, call `onLogout()` on 401
- No charting libraries — all charts are inline SVG elements
- The existing `ROLE_STATS` constant at line ~754 must stay as the fallback when live data hasn't loaded yet; fetched values replace `.value` fields only
- `activeKey === 'rapports'` currently renders via the default `page.categories` grid — add a new inline IIFE rendering branch BEFORE that fallback
- Not all roles have `rapports` in ROLE_NAV; only add the rapports branch for roles that do (ambassador, supermaster, federation, partner — check ROLE_NAV)

---

## Task 1: Backend Stats API

**Files:**
- Create: `backend/stats/` is NOT needed — add the view directly to `backend/children/views.py` or a new file `backend/stats_views.py` is not allowed either. Best approach: add `stats_view` to `backend/accounts/views.py` and wire it in `backend/accounts/urls.py`.
- Modify: `backend/accounts/views.py`
- Modify: `backend/accounts/urls.py`
- Test: `backend/accounts/tests.py` (create if not exists, otherwise append)

**Interfaces:**
- Produces: `GET /api/auth/stats/`
  - Response (director role):
    ```json
    {
      "kpis": [
        {"label": "ENFANTS", "value": 14, "sub": "enregistrés", "color": "#f59e0b"},
        {"label": "PROJETS", "value": 3, "sub": "actifs", "color": "#3b82f6"},
        {"label": "DONS", "value": 7, "sub": "cette année", "color": "#22c55e"},
        {"label": "PARRAINAGES", "value": 4, "sub": "actifs", "color": "#a855f7"}
      ],
      "charts": {
        "donations_monthly": [
          {"month": "Jan", "total": 0.0},
          {"month": "Fév", "total": 150.0},
          ...6 months ending this month...
        ],
        "children_gender": {"M": 9, "F": 5},
        "sponsorships_status": {"active": 3, "suspended": 1, "cancelled": 0}
      }
    }
    ```
  - Response fields vary by role (see step 3)
  - `donations_monthly`: last 6 calendar months, `total` is sum of `amount` for donations in that month scoped to the user's visible orphanages
  - `children_gender`: `M`/`F` counts scoped to user's visible orphanages
  - `sponsorships_status`: counts by status scoped to user's visible orphanages

**Helper for "visible orphanage ids":** reuse the same logic as `finances/views.py`'s `_visible_orphanage_ids(user)` — import it.

- [ ] **Step 1: Write failing tests**

```python
# backend/accounts/tests.py (append or create)
from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from children.models import Child
from finances.models import Donation
from orphanages.models import Orphanage


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
```

- [ ] **Step 2: Run to confirm they fail**

```
cd backend && python manage.py test accounts.tests -v 2 -k StatsAPITest
```

Expected: all 4 fail (view doesn't exist yet)

- [ ] **Step 3: Implement stats view**

Add to `backend/accounts/views.py`:

```python
from django.utils import timezone
from datetime import timedelta
import calendar
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from children.models import Child
from finances.models import Donation, Income, Expense
from sponsorships.models import Sponsorship
from projects.models import Project   # may not exist — use try/except
from orphanages.models import Orphanage
from finances.views import _visible_orphanage_ids


MONTH_LABELS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
                    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']


def _donations_monthly(orphanage_ids):
    """Last 6 calendar months of donation totals."""
    today = timezone.now().date()
    result = []
    for i in range(5, -1, -1):
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1
        last_day = calendar.monthrange(year, month)[1]
        start = today.replace(year=year, month=month, day=1)
        end = today.replace(year=year, month=month, day=last_day)
        qs = Donation.objects.filter(created_at__date__gte=start, created_at__date__lte=end)
        if orphanage_ids is not None:
            qs = qs.filter(orphanage_id__in=orphanage_ids)
        total = float(qs.aggregate(t=models.Sum('amount'))['t'] or 0)
        result.append({'month': MONTH_LABELS_FR[month - 1], 'total': total})
    return result


def _children_gender(orphanage_ids):
    qs = Child.objects.all()
    if orphanage_ids is not None:
        qs = qs.filter(orphanage_id__in=orphanage_ids)
    m = qs.filter(gender='M').count()
    f = qs.filter(gender='F').count()
    return {'M': m, 'F': f}


def _sponsorship_status(orphanage_ids):
    from sponsorships.models import Sponsorship
    qs = Sponsorship.objects.all()
    if orphanage_ids is not None:
        qs = qs.filter(child__orphanage_id__in=orphanage_ids)
    return {
        'active': qs.filter(status='active').count(),
        'suspended': qs.filter(status='suspended').count(),
        'cancelled': qs.filter(status='cancelled').count(),
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    from django.db import models as dj_models
    user = request.user
    role = user.role
    orp_ids = _visible_orphanage_ids(user)  # None = all, list = restricted

    charts = {
        'donations_monthly': _donations_monthly(orp_ids),
        'children_gender': _children_gender(orp_ids),
        'sponsorships_status': _sponsorship_status(orp_ids),
    }

    if role == 'director':
        children_count = Child.objects.filter(orphanage_id__in=(orp_ids or [])).count() if orp_ids is not None else Child.objects.count()
        donations_count = Donation.objects.filter(orphanage_id__in=(orp_ids or [])).count() if orp_ids is not None else Donation.objects.count()
        sponsorships_count = Sponsorship.objects.filter(child__orphanage_id__in=(orp_ids or []), status='active').count() if orp_ids is not None else Sponsorship.objects.filter(status='active').count()
        kpis = [
            {'label': 'ENFANTS', 'value': children_count, 'sub': 'enregistrés', 'color': '#f59e0b'},
            {'label': 'DONS', 'value': donations_count, 'sub': 'reçus', 'color': '#3b82f6'},
            {'label': 'PARRAINAGES', 'value': sponsorships_count, 'sub': 'actifs', 'color': '#22c55e'},
            {'label': 'REVENUS', 'value': Income.objects.filter(orphanage_id__in=(orp_ids or [])).count() if orp_ids is not None else Income.objects.count(), 'sub': 'enregistrés', 'color': '#a855f7'},
        ]

    elif role in ('supermaster', 'federation', 'ambassador'):
        from accounts.models import User as UserModel
        orphanages_count = Orphanage.objects.count()
        users_count = UserModel.objects.filter(is_active=True).count()
        donations_count = Donation.objects.count()
        sponsorships_count = Sponsorship.objects.filter(status='active').count()
        kpis = [
            {'label': 'UTILISATEURS', 'value': users_count, 'sub': 'actifs', 'color': '#3b82f6'},
            {'label': 'ORPHELINATS', 'value': orphanages_count, 'sub': 'supervisés', 'color': '#f59e0b'},
            {'label': 'DONS', 'value': donations_count, 'sub': 'total', 'color': '#22c55e'},
            {'label': 'PARRAINAGES', 'value': sponsorships_count, 'sub': 'actifs', 'color': '#a855f7'},
        ]

    elif role in ('partner', 'sponsor'):
        donations_count = Donation.objects.filter(donor=user).count()
        sponsorships_count = Sponsorship.objects.filter(sponsor=user, status='active').count()
        kpis = [
            {'label': 'DONS', 'value': donations_count, 'sub': 'effectués', 'color': '#f59e0b'},
            {'label': 'PARRAINAGES', 'value': sponsorships_count, 'sub': 'actifs', 'color': '#3b82f6'},
            {'label': 'TOTAL VERSÉ', 'value': int(Donation.objects.filter(donor=user).aggregate(t=dj_models.Sum('amount'))['t'] or 0), 'sub': 'USD', 'color': '#22c55e'},
            {'label': 'ENFANTS AIDÉS', 'value': Sponsorship.objects.filter(sponsor=user).values('child').distinct().count(), 'sub': 'bénéficiaires', 'color': '#a855f7'},
        ]

    elif role == 'auditor':
        kpis = [
            {'label': 'DONS', 'value': Donation.objects.count(), 'sub': 'total', 'color': '#f59e0b'},
            {'label': 'REVENUS', 'value': Income.objects.count(), 'sub': 'enregistrés', 'color': '#3b82f6'},
            {'label': 'DÉPENSES', 'value': Expense.objects.count(), 'sub': 'enregistrées', 'color': '#ef4444'},
            {'label': 'PARRAINAGES', 'value': Sponsorship.objects.count(), 'sub': 'total', 'color': '#22c55e'},
        ]

    else:
        kpis = [
            {'label': 'DONS', 'value': Donation.objects.filter(donor=user).count(), 'sub': 'effectués', 'color': '#f59e0b'},
            {'label': 'PARRAINAGES', 'value': Sponsorship.objects.filter(sponsor=user).count(), 'sub': 'total', 'color': '#3b82f6'},
            {'label': 'ENFANTS', 'value': Child.objects.count(), 'sub': 'total', 'color': '#22c55e'},
            {'label': 'ORPHELINATS', 'value': Orphanage.objects.count(), 'sub': 'total', 'color': '#a855f7'},
        ]

    return Response({'kpis': kpis, 'charts': charts})
```

**Note:** Before writing this function, check the exact field names in the models:
- `Donation` fields: check `backend/finances/models.py` — especially the foreign key to donor (`donor`? `user`?) and orphanage (`orphanage`)
- `Sponsorship` fields: check `backend/sponsorships/models.py` — especially `sponsor`, `status`, `child`
- `Child` fields: check `backend/children/models.py` — especially `gender` field values and `orphanage` FK
- `Income`/`Expense` fields: check `backend/finances/models.py` for field name of FK to orphanage
- `_visible_orphanage_ids` import path: it's in `backend/finances/views.py`

**Adjust the view code to match actual field names.** The code above is a template — you must verify and correct field names before writing it.

- [ ] **Step 4: Add URL**

In `backend/accounts/urls.py`, add:
```python
path('stats/', views.dashboard_stats, name='dashboard-stats'),
```

- [ ] **Step 5: Run tests — 4 tests must pass**

```
cd backend && python manage.py test accounts.tests -v 2 -k StatsAPITest
```

Expected: 4/4 pass

- [ ] **Step 6: Commit**

```bash
git add backend/accounts/views.py backend/accounts/urls.py backend/accounts/tests.py
git commit -m "feat: add GET /api/auth/stats/ endpoint with role-scoped KPIs and chart data"
```

---

## Task 2: Live Dashboard KPIs + Reports Charts Screen

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/App.css`

**Interfaces:**
- Consumes: `GET /api/auth/stats/` → `{kpis: [{label, value, sub, color}], charts: {donations_monthly: [{month, total}], children_gender: {M, F}, sponsorships_status: {active, suspended, cancelled}}}`
- The existing `statCards` = `ROLE_STATS[role]` is used to render KPI cards at line ~2136. Override `.value` with live fetched data.

**State hooks to add** (after existing state declarations in `DashboardShell`):

```js
const [liveStats, setLiveStats] = useState(null)   // fetched kpis array or null
const [liveCharts, setLiveCharts] = useState(null)  // fetched charts or null
```

**useEffect fetch** (add inside the main useEffect, in the `if (activeKey === 'dashboard')` block or alongside it):

```js
// Fetch live stats when entering dashboard
if (activeKey === 'dashboard') {
  const token = localStorage.getItem('access_token')
  fetch(`${API}/auth/stats/`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => { if (r.status === 401) { onLogout(); return null } return r.ok ? r.json() : null })
    .then(d => { if (d) { setLiveStats(d.kpis); setLiveCharts(d.charts) } })
    .catch(() => {})
}
```

**KPI card change** — where `statCards.map(...)` renders at ~line 2136, replace `card.value` with:

```js
const displayValue = liveStats ? (liveStats[i]?.value ?? card.value) : card.value
const displayLabel = liveStats ? (liveStats[i]?.label ?? card.label) : card.label
const displaySub = liveStats ? (liveStats[i]?.sub ?? card.sub) : card.sub
```

Then use `displayValue`, `displayLabel`, `displaySub` in the JSX.

**Reports screen** — add `activeKey === 'rapports' ? (() => { ... })()` in the ternary chain, BEFORE the `activeKey === 'dons'` branch.

The reports IIFE renders:
```jsx
<div className="rpt-root">
  <div className="rpt-header">
    <h2>Rapports & Statistiques</h2>
    <span className="rpt-subtitle">Données en temps réel</span>
  </div>

  {!liveCharts ? (
    <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8' }}>Chargement des statistiques…</div>
  ) : (
    <div className="rpt-grid">
      {/* Chart 1: Monthly donations bar chart */}
      <div className="rpt-card">
        <div className="rpt-card-title">Dons mensuels (6 derniers mois)</div>
        <BarChart data={liveCharts.donations_monthly} valueKey="total" labelKey="month" color="#6366F1" unit="$" />
      </div>

      {/* Chart 2: Children by gender */}
      <div className="rpt-card">
        <div className="rpt-card-title">Enfants par genre</div>
        <DonutChart data={[
          { label: 'Garçons', value: liveCharts.children_gender.M, color: '#3b82f6' },
          { label: 'Filles', value: liveCharts.children_gender.F, color: '#f472b6' },
        ]} />
      </div>

      {/* Chart 3: Sponsorships by status */}
      <div className="rpt-card">
        <div className="rpt-card-title">Parrainages par statut</div>
        <BarChart data={[
          { label: 'Actifs', total: liveCharts.sponsorships_status.active },
          { label: 'Suspendus', total: liveCharts.sponsorships_status.suspended },
          { label: 'Annulés', total: liveCharts.sponsorships_status.cancelled },
        ]} valueKey="total" labelKey="label" color="#22c55e" />
      </div>

      {/* Chart 4: KPI summary cards */}
      <div className="rpt-card rpt-kpi-summary">
        <div className="rpt-card-title">Indicateurs clés</div>
        {(liveStats || statCards).map((kpi, i) => (
          <div key={i} className="rpt-kpi-row">
            <span className="rpt-kpi-label">{kpi.label}</span>
            <span className="rpt-kpi-value" style={{ color: kpi.color }}>{kpi.value}</span>
            <span className="rpt-kpi-sub">{kpi.sub}</span>
          </div>
        ))}
      </div>
    </div>
  )}
</div>
```

**SVG helper components** (define as named functions inside the IIFE, or as module-level functions before `DashboardShell`):

```jsx
function BarChart({ data, valueKey, labelKey, color, unit = '' }) {
  const values = data.map(d => d[valueKey] || 0)
  const max = Math.max(...values, 1)
  const W = 340, H = 140, BAR_W = Math.floor(W / data.length) - 6, PAD = 28
  return (
    <svg viewBox={`0 0 ${W} ${H + PAD}`} style={{ width: '100%', overflow: 'visible' }}>
      {data.map((d, i) => {
        const barH = Math.max(2, ((d[valueKey] || 0) / max) * H)
        const x = i * (W / data.length) + (W / data.length - BAR_W) / 2
        const y = H - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={BAR_W} height={barH} fill={color} rx={3} opacity={0.85} />
            <text x={x + BAR_W / 2} y={H + 14} textAnchor="middle" fontSize={10} fill="#64748B">{d[labelKey]}</text>
            {d[valueKey] > 0 && <text x={x + BAR_W / 2} y={y - 4} textAnchor="middle" fontSize={9} fill={color}>{unit}{d[valueKey]}</text>}
          </g>
        )
      })}
      <line x1={0} y1={H} x2={W} y2={H} stroke="#E2E8F0" strokeWidth={1} />
    </svg>
  )
}

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>Aucune donnée</div>
  const R = 60, CX = 80, CY = 80, STROKE = 22
  let cumAngle = -Math.PI / 2
  const arcs = data.map(d => {
    const angle = (d.value / total) * 2 * Math.PI
    const start = cumAngle
    cumAngle += angle
    return { ...d, start, angle }
  })
  const arcPath = (start, angle, r) => {
    const x1 = CX + r * Math.cos(start)
    const y1 = CY + r * Math.sin(start)
    const x2 = CX + r * Math.cos(start + angle)
    const y2 = CY + r * Math.sin(start + angle)
    const large = angle > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg viewBox="0 0 160 160" style={{ width: 120, flexShrink: 0 }}>
        {arcs.map((a, i) => (
          <path key={i} d={arcPath(a.start, a.angle, R)} fill="none" stroke={a.color} strokeWidth={STROKE} strokeLinecap="butt" />
        ))}
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fill="#0F172A">{total}</text>
      </svg>
      <div>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: '#374151' }}>{d.label}: <strong>{d.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Note:** Define `BarChart` and `DonutChart` as **module-level functions** (not inside the IIFE, not inside `DashboardShell`) so React doesn't re-create them on each render.

**CSS to add to App.css**:

```css
/* ── Reports ── */
.rpt-root { padding: 24px; }
.rpt-header { margin-bottom: 24px; }
.rpt-header h2 { margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #0F172A; }
.rpt-subtitle { font-size: 13px; color: #64748B; }
.rpt-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
@media (max-width: 900px) { .rpt-grid { grid-template-columns: 1fr; } }
.rpt-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; }
.rpt-card-title { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 16px; text-transform: uppercase; letter-spacing: .05em; }
.rpt-kpi-summary { display: flex; flex-direction: column; }
.rpt-kpi-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #F1F5F9; }
.rpt-kpi-row:last-child { border-bottom: none; }
.rpt-kpi-label { flex: 1; font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: .04em; }
.rpt-kpi-value { font-size: 20px; font-weight: 800; min-width: 48px; text-align: right; }
.rpt-kpi-sub { font-size: 11px; color: #94A3B8; min-width: 70px; }
```

- [ ] **Step 1: Add state hooks**

Add `const [liveStats, setLiveStats] = useState(null)` and `const [liveCharts, setLiveCharts] = useState(null)` after the messaging state hooks block (around line 1330).

- [ ] **Step 2: Add useEffect fetch for dashboard stats**

Inside the main `useEffect` (line 1729), add the `if (activeKey === 'dashboard')` fetch block.

- [ ] **Step 3: Patch KPI card rendering**

Find the `statCards.map(...)` block at ~line 2136, and update the `card.value`, `card.label`, `card.sub` usages to use `liveStats?.[i]?.value ?? card.value` etc.

- [ ] **Step 4: Add `BarChart` and `DonutChart` as module-level functions**

Insert them immediately before the `DashboardShell` function definition.

- [ ] **Step 5: Add rapports IIFE to rendering chain**

Add `activeKey === 'rapports' ? (() => { ... })()` before the `activeKey === 'dons'` branch.

- [ ] **Step 6: Add CSS**

Append the `.rpt-*` CSS block to `App.css`.

- [ ] **Step 7: Build**

```
cd frontend && npm run build
```

Expected: success (chunk warning only)

- [ ] **Step 8: Commit**

```bash
git add frontend/src/App.jsx frontend/src/App.css
git commit -m "feat: wire live dashboard KPI cards to /api/auth/stats/ and add SVG charts reports screen"
```
