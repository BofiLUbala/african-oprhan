# Phase 2 — Money Features UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the React frontend to the finances and sponsorships APIs built in Phase 1, so donations, income/expenses, and sponsorships are real API-driven screens instead of static placeholder cards.

**Architecture:** All changes go in `frontend/src/App.jsx` (8683 lines, single-file monolith). Follow the existing pattern: `useState` hooks for data, a single `useEffect` at ~line 1664 keyed on `[activeKey, role]` for fetching, and new `activeKey ===` ternary branches in the render chain starting ~line 2371.

**Tech Stack:** React 18, Vite, native `fetch()`, Bearer token auth from `localStorage.getItem('access_token')`, CSS classes from `App.css`.

## Global Constraints

- `const API = 'http://localhost:8000/api'` (line 5 of App.jsx) — use this constant for all API calls.
- Auth header: `Authorization: \`Bearer ${localStorage.getItem('access_token')}\`` — same pattern as every other fetch in the file.
- Never add a new file. All changes go in `frontend/src/App.jsx` only (except CSS additions to `App.css` if needed for new layout classes).
- Reuse existing CSS classes: `dash-section`, `dash-section-header`, `dash-card`, `dash-card-title`, `dash-card-desc`, `btn`, `btn-primary`, `btn-sm`, `dash-form`, `dash-input`, `dash-table`, `dash-empty`, etc.
- Role identifiers: `'director'`, `'ambassador'`, `'federation'`, `'supermaster'`, `'partner'`, `'sponsor'`, `'auditor'`.
- Every `fetch` must include `Authorization: Bearer ${token}` and handle 401 by calling `logout()`.
- French labels everywhere — no English labels in the UI.
- No TypeScript, no new dependencies.

---

### Task 1: Donations screen (`activeKey === 'dons'`)

**Files:**
- Modify: `frontend/src/App.jsx`
  - Add `dons` nav item for `sponsor`, `partner`, `director` roles in `ROLE_NAV` (~line 449)
  - Add `dons` page metadata to `ROLE_PAGES` for those roles (~line 525)
  - Add state hooks for donations data (~line 1496)
  - Add donations fetch inside the `useEffect` at ~line 1664
  - Add `activeKey === 'dons'` rendering branch in the ternary chain (~line 2371)

**Interfaces:**
- Consumes: `GET /api/dons/` (list, scoped by backend per role), `POST /api/dons/` (create)
- Response shape for GET: array of `{ id, donator, donator_name, donation_type, donation_type_label, amount, currency, description, transaction_id, status, status_label, orphanage, orphanage_name, date }`
- POST body: `{ donation_type, amount, currency, orphanage }` — backend sets `donator = request.user` and `status = "completed"` automatically

- [ ] **Step 1: Add `dons` nav entry for sponsor, partner, director**

In `ROLE_NAV` (~line 449 of App.jsx), find each role's nav array and add `{ label: 'Dons', key: 'dons' }`:
- For `sponsor` role: add after the existing last item
- For `partner` role: add after the existing last item  
- For `director` role: add after `'demandes'` entry

In `ROLE_PAGES` (~line 525), add a `dons` entry for each newly-added role:
```javascript
dons: { title: 'Dons', subtitle: 'Suivi des contributions.', categories: [] }
```

- [ ] **Step 2: Add state hooks for donations**

Near the existing state declarations (~line 1496), add:
```javascript
const [donations, setDonations] = useState([])
const [donationsLoading, setDonationsLoading] = useState(false)
const [donationForm, setDonationForm] = useState({ donation_type: 'financier', amount: '', currency: 'USD', orphanage: '' })
const [donationFormError, setDonationFormError] = useState('')
const [donationFormSuccess, setDonationFormSuccess] = useState('')
```

- [ ] **Step 3: Add donations fetch to the existing useEffect**

Inside the `useEffect` at ~line 1664 (the one that depends on `[activeKey, role, subKey, orphanageName]`), add:

```javascript
if (activeKey === 'dons') {
  const token = localStorage.getItem('access_token')
  setDonationsLoading(true)
  fetch(`${API}/dons/`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => { if (r.status === 401) { logout(); return [] } return r.json() })
    .then(data => { setDonations(Array.isArray(data) ? data : []); setDonationsLoading(false) })
    .catch(() => setDonationsLoading(false))
}
```

- [ ] **Step 4: Add `activeKey === 'dons'` rendering branch**

In the ternary chain (~line 2371), find a good insertion point (before the generic categories fallback). Insert:

```javascript
} : activeKey === 'dons' ? (() => {
  const token = localStorage.getItem('access_token')
  const canCreate = ['sponsor', 'partner', 'ambassador'].includes(role)
  const canWrite = ['director', 'federation', 'supermaster'].includes(role)

  const submitDonation = async (e) => {
    e.preventDefault()
    setDonationFormError('')
    if (!donationForm.amount || !donationForm.orphanage) {
      setDonationFormError('Montant et orphelinat requis.')
      return
    }
    const res = await fetch(`${API}/dons/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(donationForm),
    })
    if (res.ok) {
      const created = await res.json()
      setDonations(prev => [created, ...prev])
      setDonationForm({ donation_type: 'financier', amount: '', currency: 'USD', orphanage: '' })
      setDonationFormSuccess('Don enregistré avec succès.')
      setTimeout(() => setDonationFormSuccess(''), 3000)
    } else {
      const err = await res.json().catch(() => ({}))
      setDonationFormError(err.detail || 'Erreur lors de l\'enregistrement.')
    }
  }

  return (
    <div className="dash-section">
      <div className="dash-section-header">
        <span className="dash-section-title">Dons</span>
        <span className="dash-section-sub">Suivi des contributions</span>
      </div>

      {canCreate && (
        <div className="dash-card" style={{ marginBottom: 24 }}>
          <div className="dash-card-title" style={{ marginBottom: 12 }}>Enregistrer un don</div>
          {donationFormError && <div className="dash-error">{donationFormError}</div>}
          {donationFormSuccess && <div className="dash-success">{donationFormSuccess}</div>}
          <form onSubmit={submitDonation} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <select value={donationForm.donation_type} onChange={e => setDonationForm(f => ({ ...f, donation_type: e.target.value }))} className="dash-input" style={{ flex: '1 1 140px' }}>
              <option value="financier">Financier</option>
              <option value="materiel">Matériel</option>
              <option value="service">Service</option>
            </select>
            <input type="number" min="0" step="0.01" placeholder="Montant" value={donationForm.amount} onChange={e => setDonationForm(f => ({ ...f, amount: e.target.value }))} className="dash-input" style={{ flex: '1 1 120px' }} />
            <select value={donationForm.currency} onChange={e => setDonationForm(f => ({ ...f, currency: e.target.value }))} className="dash-input" style={{ flex: '0 0 90px' }}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="CDF">CDF</option>
              <option value="XAF">XAF</option>
            </select>
            <input type="number" placeholder="ID Orphelinat" value={donationForm.orphanage} onChange={e => setDonationForm(f => ({ ...f, orphanage: e.target.value }))} className="dash-input" style={{ flex: '1 1 120px' }} />
            <button type="submit" className="btn btn-primary btn-sm">Enregistrer</button>
          </form>
        </div>
      )}

      {donationsLoading ? (
        <div className="dash-empty">Chargement...</div>
      ) : donations.length === 0 ? (
        <div className="dash-empty">Aucun don trouvé.</div>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr><th>Date</th><th>Donateur</th><th>Type</th><th>Montant</th><th>Statut</th><th>Orphelinat</th></tr>
            </thead>
            <tbody>
              {donations.map(d => (
                <tr key={d.id}>
                  <td>{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                  <td>{d.donator_name || '—'}</td>
                  <td>{d.donation_type_label}</td>
                  <td>{d.amount} {d.currency}</td>
                  <td>{d.status_label}</td>
                  <td>{d.orphanage_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
})() :
```

- [ ] **Step 5: Build and verify no compile errors**

```bash
cd frontend && npm run build 2>&1 | tail -20
```
Expected: build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: add donations screen wired to /api/dons/"
```

---

### Task 2: Finances screen (`activeKey === 'finances'` — income + expenses)

**Files:**
- Modify: `frontend/src/App.jsx`
  - Add `finances` nav item for `director`, `federation`, `supermaster`, `auditor` in `ROLE_NAV`
  - Add state hooks for income/expenses
  - Add finances fetch inside the existing `useEffect`
  - Add `activeKey === 'finances'` rendering branch

**Interfaces:**
- Consumes: `GET /api/revenus/`, `POST /api/revenus/`, `GET /api/depenses/`, `POST /api/depenses/`
- Income response shape: `{ id, source, amount, date, orphanage, orphanage_name }`
- Expense response shape: `{ id, category, amount, description, date, orphanage, orphanage_name }`
- POST income body: `{ source, amount, orphanage }`
- POST expense body: `{ category, amount, description, orphanage }`

- [ ] **Step 1: Add `finances` nav entry for relevant roles**

In `ROLE_NAV`, add `{ label: 'Finances', key: 'finances' }` to:
- `director`: after `'demandes'`
- `federation`: after `'ambassadeurs'`
- `supermaster`: after `'ambassadeurs'`
- `auditor` (if it exists, else skip — auditor may not have a nav array yet; add it):

In `ROLE_PAGES`, add:
```javascript
finances: { title: 'Finances', subtitle: 'Revenus et dépenses.', categories: [] }
```
for each of those roles.

- [ ] **Step 2: Add state hooks for income/expenses**

```javascript
const [incomes, setIncomes] = useState([])
const [expenses, setExpenses] = useState([])
const [financesLoading, setFinancesLoading] = useState(false)
const [financesTab, setFinancesTab] = useState('revenus')
const [incomeForm, setIncomeForm] = useState({ source: '', amount: '', orphanage: '' })
const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', description: '', orphanage: '' })
const [financesFormError, setFinancesFormError] = useState('')
const [financesFormSuccess, setFinancesFormSuccess] = useState('')
```

- [ ] **Step 3: Add finances fetch to the useEffect**

```javascript
if (activeKey === 'finances') {
  const token = localStorage.getItem('access_token')
  setFinancesLoading(true)
  Promise.all([
    fetch(`${API}/revenus/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
    fetch(`${API}/depenses/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
  ]).then(([rev, dep]) => {
    setIncomes(Array.isArray(rev) ? rev : [])
    setExpenses(Array.isArray(dep) ? dep : [])
    setFinancesLoading(false)
  }).catch(() => setFinancesLoading(false))
}
```

- [ ] **Step 4: Add `activeKey === 'finances'` rendering branch**

```javascript
} : activeKey === 'finances' ? (() => {
  const token = localStorage.getItem('access_token')
  const canWrite = ['director', 'federation', 'supermaster'].includes(role)

  const submitIncome = async (e) => {
    e.preventDefault()
    setFinancesFormError('')
    if (!incomeForm.source || !incomeForm.amount) { setFinancesFormError('Source et montant requis.'); return }
    const res = await fetch(`${API}/revenus/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(incomeForm),
    })
    if (res.ok) {
      const created = await res.json()
      setIncomes(prev => [created, ...prev])
      setIncomeForm({ source: '', amount: '', orphanage: '' })
      setFinancesFormSuccess('Revenu enregistré.')
      setTimeout(() => setFinancesFormSuccess(''), 3000)
    } else { setFinancesFormError('Erreur lors de l\'enregistrement.') }
  }

  const submitExpense = async (e) => {
    e.preventDefault()
    setFinancesFormError('')
    if (!expenseForm.category || !expenseForm.amount) { setFinancesFormError('Catégorie et montant requis.'); return }
    const res = await fetch(`${API}/depenses/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(expenseForm),
    })
    if (res.ok) {
      const created = await res.json()
      setExpenses(prev => [created, ...prev])
      setExpenseForm({ category: '', amount: '', description: '', orphanage: '' })
      setFinancesFormSuccess('Dépense enregistrée.')
      setTimeout(() => setFinancesFormSuccess(''), 3000)
    } else { setFinancesFormError('Erreur lors de l\'enregistrement.') }
  }

  return (
    <div className="dash-section">
      <div className="dash-section-header">
        <span className="dash-section-title">Finances</span>
        <span className="dash-section-sub">Revenus et dépenses</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['revenus', 'depenses'].map(tab => (
          <button key={tab} className={`btn btn-sm${financesTab === tab ? ' btn-primary' : ''}`} onClick={() => setFinancesTab(tab)}>
            {tab === 'revenus' ? 'Revenus' : 'Dépenses'}
          </button>
        ))}
      </div>
      {financesFormError && <div className="dash-error">{financesFormError}</div>}
      {financesFormSuccess && <div className="dash-success">{financesFormSuccess}</div>}

      {financesLoading ? <div className="dash-empty">Chargement...</div> : financesTab === 'revenus' ? (
        <>
          {canWrite && (
            <form onSubmit={submitIncome} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <input placeholder="Source (Dons, Subventions...)" value={incomeForm.source} onChange={e => setIncomeForm(f => ({ ...f, source: e.target.value }))} className="dash-input" style={{ flex: '2 1 180px' }} />
              <input type="number" min="0" step="0.01" placeholder="Montant" value={incomeForm.amount} onChange={e => setIncomeForm(f => ({ ...f, amount: e.target.value }))} className="dash-input" style={{ flex: '1 1 120px' }} />
              <input type="number" placeholder="ID Orphelinat" value={incomeForm.orphanage} onChange={e => setIncomeForm(f => ({ ...f, orphanage: e.target.value }))} className="dash-input" style={{ flex: '1 1 120px' }} />
              <button type="submit" className="btn btn-primary btn-sm">Ajouter</button>
            </form>
          )}
          {incomes.length === 0 ? <div className="dash-empty">Aucun revenu enregistré.</div> : (
            <table className="dash-table"><thead><tr><th>Date</th><th>Source</th><th>Montant</th><th>Orphelinat</th></tr></thead>
            <tbody>{incomes.map(r => <tr key={r.id}><td>{r.date}</td><td>{r.source}</td><td>{r.amount}</td><td>{r.orphanage_name || '—'}</td></tr>)}</tbody></table>
          )}
        </>
      ) : (
        <>
          {canWrite && (
            <form onSubmit={submitExpense} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <input placeholder="Catégorie (Alimentation, Santé...)" value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))} className="dash-input" style={{ flex: '2 1 180px' }} />
              <input type="number" min="0" step="0.01" placeholder="Montant" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} className="dash-input" style={{ flex: '1 1 120px' }} />
              <input placeholder="Description (optionnel)" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} className="dash-input" style={{ flex: '2 1 180px' }} />
              <input type="number" placeholder="ID Orphelinat" value={expenseForm.orphanage} onChange={e => setExpenseForm(f => ({ ...f, orphanage: e.target.value }))} className="dash-input" style={{ flex: '1 1 120px' }} />
              <button type="submit" className="btn btn-primary btn-sm">Ajouter</button>
            </form>
          )}
          {expenses.length === 0 ? <div className="dash-empty">Aucune dépense enregistrée.</div> : (
            <table className="dash-table"><thead><tr><th>Date</th><th>Catégorie</th><th>Montant</th><th>Description</th><th>Orphelinat</th></tr></thead>
            <tbody>{expenses.map(d => <tr key={d.id}><td>{d.date}</td><td>{d.category}</td><td>{d.amount}</td><td>{d.description || '—'}</td><td>{d.orphanage_name || '—'}</td></tr>)}</tbody></table>
          )}
        </>
      )}
    </div>
  )
})() :
```

- [ ] **Step 5: Build and verify**

```bash
cd frontend && npm run build 2>&1 | tail -20
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: add finances screen (income/expenses) wired to /api/revenus/ and /api/depenses/"
```

---

### Task 3: Sponsorships screen (`activeKey === 'parrainages'`)

**Files:**
- Modify: `frontend/src/App.jsx`
  - Add `parrainages` nav item for `sponsor` role (partner already has it)
  - Add `parrainages` nav item for `director` role (to view their orphanage's sponsorships)
  - Add state hooks for sponsorships data
  - Add parrainages fetch inside the existing `useEffect`
  - Add `activeKey === 'parrainages'` rendering branch

**Interfaces:**
- Consumes:
  - `GET /api/parrainages/enfants-disponibles/` → array of child objects with `{ id, uid, prenom, nom, sexe, date_naissance, ... }`
  - `GET /api/parrainages/` → array of `{ id, sponsor, sponsor_name, child, child_name, sponsorship_type, sponsorship_type_label, amount, status, status_label, start_date, end_date, payments }`
  - `POST /api/parrainages/` body: `{ child (id), sponsorship_type, amount }`
  - `PATCH /api/parrainages/<id>/` body: `{ status }` — values: `active`, `paused`, `cancelled`
  - `GET /api/parrainages/<id>/paiements/` → array of `{ id, sponsorship, amount, date, transaction_id }`

- [ ] **Step 1: Add `parrainages` nav entry for sponsor and director**

In `ROLE_NAV`, add `{ label: 'Parrainages', key: 'parrainages' }` to:
- `sponsor`: add it (role likely has no nav array yet — create one following the partner pattern)
- `director`: add after `'finances'`

Add `ROLE_PAGES` entry for `sponsor`:
```javascript
parrainages: { title: 'Parrainages', subtitle: 'Parrainer un enfant.', categories: [] }
```

- [ ] **Step 2: Add state hooks for sponsorships**

```javascript
const [sponsorableChildren, setSponsorableChildren] = useState([])
const [mySponsored, setMySponsored] = useState([])
const [parrainagesTab, setParrainagesTab] = useState('disponibles')
const [parrainagesLoading, setParrainagesLoading] = useState(false)
const [sponsorshipForm, setSponsorshipForm] = useState({ child: '', sponsorship_type: 'monthly', amount: '' })
const [sponsorshipFormError, setSponsorshipFormError] = useState('')
const [sponsorshipFormSuccess, setSponsorshipFormSuccess] = useState('')
const [selectedSponsorshipId, setSelectedSponsorshipId] = useState(null)
const [sponsorshipPayments, setSponsorshipPayments] = useState([])
```

- [ ] **Step 3: Add parrainages fetch to the useEffect**

```javascript
if (activeKey === 'parrainages') {
  const token = localStorage.getItem('access_token')
  setParrainagesLoading(true)
  const isSponsorRole = ['sponsor', 'partner'].includes(role)
  const promises = isSponsorRole
    ? [
        fetch(`${API}/parrainages/enfants-disponibles/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/parrainages/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      ]
    : [
        Promise.resolve([]),
        fetch(`${API}/parrainages/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      ]
  Promise.all(promises).then(([available, mine]) => {
    setSponsorableChildren(Array.isArray(available) ? available : [])
    setMySponsored(Array.isArray(mine) ? mine : [])
    setParrainagesLoading(false)
  }).catch(() => setParrainagesLoading(false))
}
```

- [ ] **Step 4: Add `activeKey === 'parrainages'` rendering branch**

```javascript
} : activeKey === 'parrainages' ? (() => {
  const token = localStorage.getItem('access_token')
  const isSponsorRole = ['sponsor', 'partner'].includes(role)

  const createSponsorship = async (childId) => {
    setSponsorshipFormError('')
    if (!sponsorshipForm.amount) { setSponsorshipFormError('Veuillez saisir un montant.'); return }
    const res = await fetch(`${API}/parrainages/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...sponsorshipForm, child: childId }),
    })
    if (res.ok) {
      const created = await res.json()
      setMySponsored(prev => [created, ...prev])
      setSponsorableChildren(prev => prev.filter(c => c.id !== childId))
      setSponsorshipFormSuccess('Parrainage créé avec succès.')
      setTimeout(() => setSponsorshipFormSuccess(''), 3000)
    } else {
      const err = await res.json().catch(() => ({}))
      setSponsorshipFormError(err.detail || err.error || 'Erreur lors de la création.')
    }
  }

  const loadPayments = async (sponsorshipId) => {
    const token = localStorage.getItem('access_token')
    const res = await fetch(`${API}/parrainages/${sponsorshipId}/paiements/`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) { setSponsorshipPayments(await res.json()); setSelectedSponsorshipId(sponsorshipId) }
  }

  const updateSponsorshipStatus = async (id, newStatus) => {
    const token = localStorage.getItem('access_token')
    const res = await fetch(`${API}/parrainages/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const updated = await res.json()
      setMySponsored(prev => prev.map(s => s.id === id ? { ...s, status: updated.status, status_label: updated.status_label } : s))
    }
  }

  return (
    <div className="dash-section">
      <div className="dash-section-header">
        <span className="dash-section-title">Parrainages</span>
        <span className="dash-section-sub">{isSponsorRole ? 'Parrainer un enfant à distance' : 'Parrainages de votre orphelinat'}</span>
      </div>

      {sponsorshipFormError && <div className="dash-error">{sponsorshipFormError}</div>}
      {sponsorshipFormSuccess && <div className="dash-success">{sponsorshipFormSuccess}</div>}

      {isSponsorRole && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['disponibles', 'mes-parrainages'].map(tab => (
            <button key={tab} className={`btn btn-sm${parrainagesTab === tab ? ' btn-primary' : ''}`} onClick={() => setParrainagesTab(tab)}>
              {tab === 'disponibles' ? `Enfants disponibles (${sponsorableChildren.length})` : `Mes parrainages (${mySponsored.length})`}
            </button>
          ))}
        </div>
      )}

      {parrainagesLoading ? <div className="dash-empty">Chargement...</div> : isSponsorRole && parrainagesTab === 'disponibles' ? (
        <>
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Montant mensuel :</span>
            <input type="number" min="1" step="1" placeholder="ex: 50" value={sponsorshipForm.amount} onChange={e => setSponsorshipForm(f => ({ ...f, amount: e.target.value }))} className="dash-input" style={{ width: 100 }} />
            <select value={sponsorshipForm.sponsorship_type} onChange={e => setSponsorshipForm(f => ({ ...f, sponsorship_type: e.target.value }))} className="dash-input" style={{ width: 120 }}>
              <option value="monthly">Mensuel</option>
              <option value="annual">Annuel</option>
            </select>
          </div>
          {sponsorableChildren.length === 0 ? (
            <div className="dash-empty">Aucun enfant disponible pour parrainage.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {sponsorableChildren.map(child => (
                <div key={child.id} className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontWeight: 600 }}>{child.prenom} {child.nom}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{child.uid}</div>
                  {child.date_naissance && <div style={{ fontSize: 12 }}>Né(e) le {new Date(child.date_naissance).toLocaleDateString('fr-FR')}</div>}
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 'auto' }} onClick={() => createSponsorship(child.id)} disabled={!sponsorshipForm.amount}>
                    Parrainer
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : isSponsorRole && parrainagesTab === 'mes-parrainages' ? (
        mySponsored.length === 0 ? <div className="dash-empty">Vous n'avez pas encore de filleul.</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mySponsored.map(s => (
              <div key={s.id} className="dash-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{s.child_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.sponsorship_type_label} — {s.amount} USD · {s.status_label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Depuis le {s.start_date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {s.status === 'active' && <button className="btn btn-sm" onClick={() => updateSponsorshipStatus(s.id, 'paused')}>Suspendre</button>}
                    {s.status === 'paused' && <button className="btn btn-sm btn-primary" onClick={() => updateSponsorshipStatus(s.id, 'active')}>Reprendre</button>}
                    {s.status !== 'cancelled' && <button className="btn btn-sm" style={{ color: '#ef4444' }} onClick={() => updateSponsorshipStatus(s.id, 'cancelled')}>Annuler</button>}
                    <button className="btn btn-sm" onClick={() => loadPayments(s.id)}>Historique</button>
                  </div>
                </div>
                {selectedSponsorshipId === s.id && (
                  <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Paiements</div>
                    {sponsorshipPayments.length === 0 ? <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Aucun paiement.</div> : (
                      <table className="dash-table">
                        <thead><tr><th>Date</th><th>Montant</th><th>Réf</th></tr></thead>
                        <tbody>{sponsorshipPayments.map(p => <tr key={p.id}><td>{new Date(p.date).toLocaleDateString('fr-FR')}</td><td>{p.amount}</td><td>{p.transaction_id || '—'}</td></tr>)}</tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        mySponsored.length === 0 ? <div className="dash-empty">Aucun parrainage pour cet orphelinat.</div> : (
          <table className="dash-table">
            <thead><tr><th>Enfant</th><th>Parrain</th><th>Type</th><th>Montant</th><th>Statut</th><th>Depuis</th></tr></thead>
            <tbody>{mySponsored.map(s => <tr key={s.id}><td>{s.child_name}</td><td>{s.sponsor_name}</td><td>{s.sponsorship_type_label}</td><td>{s.amount}</td><td>{s.status_label}</td><td>{s.start_date}</td></tr>)}</tbody>
          </table>
        )
      )}
    </div>
  )
})() :
```

- [ ] **Step 5: Build and verify**

```bash
cd frontend && npm run build 2>&1 | tail -20
```
Expected: build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: add sponsorships screen wired to /api/parrainages/"
```

---

## CSS additions (if needed)

If any new layout classes are missing from `App.css`, add them. Common ones needed:
- `.dash-table-wrap { overflow-x: auto; }` — for horizontal scroll on mobile
- `.dash-error { color: #ef4444; font-size: 13px; margin-bottom: 8px; padding: 8px 12px; background: rgba(239,68,68,0.1); border-radius: 6px; }`
- `.dash-success { color: #22c55e; font-size: 13px; margin-bottom: 8px; padding: 8px 12px; background: rgba(34,197,94,0.1); border-radius: 6px; }`

Check if these already exist before adding them.
