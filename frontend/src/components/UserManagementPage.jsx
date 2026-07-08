import React, { useState, useEffect, useCallback } from 'react'

const API = 'http://localhost:8000/api'

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('access_token')
  const headers = { ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(url, { ...options, headers })
}

const ROLES = [
  { value: 'supermaster', label: 'Super Master', color: '#ef4444' },
  { value: 'federation', label: 'Fédération', color: '#a855f7' },
  { value: 'ambassador', label: 'Ambassadeur', color: '#3b82f6' },
  { value: 'director', label: "Chef d'orphelinat", color: '#f59e0b' },
  { value: 'staff', label: 'Personnel', color: '#64748b' },
  { value: 'partner', label: 'Partenaire', color: '#22c55e' },
  { value: 'sponsor', label: 'Parrain', color: '#ec4899' },
  { value: 'auditor', label: 'Auditeur', color: '#14b8a6' },
]

const AFRICAN_COUNTRIES = [
  { code: "CD", name: "République démocratique du Congo" },
  { code: "CM", name: "Cameroun" }, { code: "CI", name: "Côte d'Ivoire" },
  { code: "SN", name: "Sénégal" }, { code: "KE", name: "Kenya" },
  { code: "NG", name: "Nigeria" }, { code: "ZA", name: "Afrique du Sud" },
  { code: "MA", name: "Maroc" }, { code: "TN", name: "Tunisie" },
  { code: "DZ", name: "Algérie" }, { code: "EG", name: "Égypte" },
  { code: "ET", name: "Éthiopie" }, { code: "GH", name: "Ghana" },
  { code: "RW", name: "Rwanda" }, { code: "UG", name: "Ouganda" },
  { code: "TZ", name: "Tanzanie" }, { code: "MG", name: "Madagascar" },
  { code: "AO", name: "Angola" }, { code: "MZ", name: "Mozambique" },
  { code: "ZM", name: "Zambie" }, { code: "ZW", name: "Zimbabwe" },
]

export default function UserManagementPage({ onLogout }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [roleCounts, setRoleCounts] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [toast, setToast] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, page_size: 20 })
    if (search) params.set('search', search)
    if (roleFilter) params.set('role', roleFilter)
    if (statusFilter) params.set('is_active', statusFilter)
    apiFetch(`${API}/admin/users/?${params}`, {}, onLogout)
      .then(r => r && r.ok ? r.json() : null)
      .then(data => {
        if (data) { setUsers(data.results); setTotal(data.total); setPages(data.pages); setRoleCounts(data.role_counts || {}) }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [onLogout, page, search, roleFilter, statusFilter])

  useEffect(() => { load() }, [load])

  const handleDelete = async (userId, email) => {
    if (!window.confirm(`Supprimer l'utilisateur ${email} ?`)) return
    const res = await apiFetch(`${API}/admin/users/${userId}/`, { method: 'DELETE' })
    if (res && res.ok) { setToast({ type: 'success', message: 'Utilisateur supprimé' }); load() }
    else setToast({ type: 'error', message: 'Erreur lors de la suppression' })
    setTimeout(() => setToast(null), 3000)
  }

  const handleToggleActive = async (userId) => {
    const res = await apiFetch(`${API}/admin/users/${userId}/toggle-active/`, { method: 'POST' })
    if (res && res.ok) { load(); setToast({ type: 'success', message: 'Statut mis à jour' }) }
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async (formData) => {
    const isEdit = !!editUser
    const url = isEdit ? `${API}/admin/users/${editUser.id}/` : `${API}/admin/users/`
    const method = isEdit ? 'PATCH' : 'POST'
    const res = await apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (res && (res.ok || res.status === 201)) {
      setShowModal(false); setEditUser(null); load()
      setToast({ type: 'success', message: isEdit ? 'Utilisateur mis à jour' : 'Utilisateur créé' })
    } else {
      const err = await res.json().catch(() => ({}))
      setToast({ type: 'error', message: Object.values(err).flat().join(', ') || 'Erreur' })
    }
    setTimeout(() => setToast(null), 3000)
  }

  const roleColor = (role) => ROLES.find(r => r.value === role)?.color || '#64748b'
  const roleLabel = (role) => ROLES.find(r => r.value === role)?.label || role

  if (loading && users.length === 0) return (
    <div className="exec">
      <div className="exec-head"><h1 className="exec-title">Gestion des utilisateurs</h1><p className="exec-sub">Chargement…</p></div>
      <div className="us-table"><div className="exec-skeleton" style={{ height: 400 }} /></div>
    </div>
  )

  return (
    <div className="exec us-page">
      <div className="exec-head">
        <div>
          <h1 className="exec-title">Gestion des utilisateurs</h1>
          <p className="exec-sub">{total} utilisateurs · {Object.keys(roleCounts).length} rôles</p>
        </div>
        <div className="exec-head-actions">
          <button className="exec-refresh" onClick={load}><span style={{fontSize:16}}>↻</span> Actualiser</button>
          <button className="exec-btn-primary" onClick={() => { setEditUser(null); setShowModal(true) }}>+ Nouvel utilisateur</button>
        </div>
      </div>

      <div className="us-role-summary">
        {Object.entries(roleCounts).map(([role, count]) => (
          <div key={role} className="us-role-chip" style={{ borderColor: roleColor(role) }}
            onClick={() => setRoleFilter(roleFilter === role ? '' : role)}>
            <span className="us-role-dot" style={{ background: roleColor(role) }} />
            <span className="us-role-label">{roleLabel(role)}</span>
            <span className="us-role-count" style={{ color: roleColor(role) }}>{count}</span>
          </div>
        ))}
      </div>

      <div className="us-toolbar">
        <input className="us-search" type="text" placeholder="Rechercher par nom, email…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }} />
        <select className="us-filter" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">Tous les statuts</option>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
        </select>
      </div>

      <div className="us-table-wrap">
        <table className="us-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Pays</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={6} className="us-empty">Aucun utilisateur trouvé.</td></tr>
            ) : users.map(u => (
              <tr key={u.id}>
                <td className="us-cell-user">
                  <div className="us-avatar" style={{ background: roleColor(u.role) }}>
                    {u.first_name?.[0]}{u.last_name?.[0]}
                  </div>
                  <span>{u.first_name} {u.last_name}</span>
                </td>
                <td className="us-cell-email">{u.email}</td>
                <td><span className="us-role-badge" style={{ background: `${roleColor(u.role)}20`, color: roleColor(u.role) }}>{roleLabel(u.role)}</span></td>
                <td>{u.country || '—'}</td>
                <td><span className={`us-status ${u.is_active ? 'active' : 'inactive'}`}>{u.is_active ? 'Actif' : 'Inactif'}</span></td>
                <td className="us-cell-actions">
                  <button className="us-action-btn" title="Modifier" onClick={() => { setEditUser(u); setShowModal(true) }}>✏️</button>
                  <button className="us-action-btn" title={u.is_active ? 'Désactiver' : 'Activer'} onClick={() => handleToggleActive(u.id)}>
                    {u.is_active ? '⛔' : '✅'}
                  </button>
                  <button className="us-action-btn us-action-danger" title="Supprimer" onClick={() => handleDelete(u.id, u.email)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="us-pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
          <span>Page {page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Suivant →</button>
        </div>
      )}

      {showModal && (
        <UserFormModal user={editUser} onSave={handleSave} onClose={() => { setShowModal(false); setEditUser(null) }} />
      )}

      {toast && (
        <div className={`dash-toast dash-toast-${toast.type}`} onClick={() => setToast(null)}>
          <span className="dash-toast-icon">{toast.type === 'success' ? '✓' : '✗'}</span>
          <span className="dash-toast-msg">{toast.message}</span>
        </div>
      )}
    </div>
  )
}

function UserFormModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    role: user?.role || 'staff',
    country: user?.country || 'CD',
    is_active: user?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.first_name || !form.last_name || !form.email) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content us-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{user ? 'Modifier' : 'Créer'} un utilisateur</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="us-form">
          <div className="us-form-row">
            <div className="us-form-group">
              <label>Prénom</label>
              <input type="text" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
            </div>
            <div className="us-form-group">
              <label>Nom</label>
              <input type="text" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
            </div>
          </div>
          <div className="us-form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required={!user} disabled={!!user} />
          </div>
          <div className="us-form-row">
            <div className="us-form-group">
              <label>Rôle</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="us-form-group">
              <label>Pays</label>
              <select value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}>
                {AFRICAN_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="us-form-group">
            <label className="us-checkbox-label">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              Compte actif
            </label>
          </div>
          <div className="us-form-actions">
            <button type="button" className="us-btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="us-btn-submit" disabled={saving}>
              {saving ? '…' : user ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
