import React, { useState, useEffect, useCallback } from 'react'

const API = 'http://localhost:8000/api'

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('access_token')
  const headers = { ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(url, { ...options, headers })
}

const REPORT_TYPES = [
  { value: 'financial', label: 'Financier', icon: '💰' },
  { value: 'donations', label: 'Dons', icon: '🎁' },
  { value: 'children', label: 'Enfants', icon: '👶' },
  { value: 'users', label: 'Utilisateurs', icon: '👥' },
  { value: 'sponsorships', label: 'Parrainages', icon: '💝' },
  { value: 'activities', label: 'Activités', icon: '📊' },
  { value: 'custom', label: 'Personnalisé', icon: '📋' },
]

const FORMATS = [
  { value: 'pdf', label: 'PDF', icon: '📄' },
  { value: 'csv', label: 'CSV', icon: '📃' },
  { value: 'xlsx', label: 'Excel', icon: '📗' },
  { value: 'html', label: 'HTML', icon: '🌐' },
]

export default function ReportsPage({ onLogout }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [showNew, setShowNew] = useState(false)
  const [toast, setToast] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, page_size: 20 })
    if (typeFilter) params.set('type', typeFilter)
    if (statusFilter) params.set('status', statusFilter)
    apiFetch(`${API}/admin/reports/?${params}`, {}, onLogout)
      .then(r => r && r.ok ? r.json() : null)
      .then(data => {
        if (data) { setReports(data.results); setTotal(data.total); setPages(data.pages) }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [onLogout, page, typeFilter, statusFilter])

  useEffect(() => { load() }, [load])

  const handleGenerate = async (reportId) => {
    const res = await apiFetch(`${API}/admin/reports/${reportId}/generate/`, { method: 'POST' })
    if (res && res.ok) {
      setToast({ type: 'success', message: 'Génération lancée' })
      load()
    } else setToast({ type: 'error', message: 'Erreur de génération' })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDelete = async (reportId) => {
    if (!window.confirm('Supprimer ce rapport ?')) return
    const res = await apiFetch(`${API}/admin/reports/${reportId}/`, { method: 'DELETE' })
    if (res && res.ok) { setToast({ type: 'success', message: 'Rapport supprimé' }); load() }
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreate = async (formData) => {
    const res = await apiFetch(`${API}/admin/reports/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (res && (res.ok || res.status === 201)) {
      setShowNew(false); load()
      setToast({ type: 'success', message: 'Rapport créé' })
    } else {
      const err = await res.json().catch(() => ({}))
      setToast({ type: 'error', message: Object.values(err).flat().join(', ') || 'Erreur' })
    }
    setTimeout(() => setToast(null), 3000)
  }

  const statusBadge = (status) => {
    const styles = {
      completed: { bg: '#22c55e20', color: '#22c55e', label: 'Terminé' },
      generating: { bg: '#3b82f620', color: '#3b82f6', label: 'Génération…' },
      pending: { bg: '#f59e0b20', color: '#f59e0b', label: 'En attente' },
      failed: { bg: '#ef444420', color: '#ef4444', label: 'Échoué' },
    }
    const s = styles[status] || styles.pending
    return <span className="rp-status" style={{ background: s.bg, color: s.color }}>{s.label}</span>
  }

  if (loading && reports.length === 0) return (
    <div className="exec">
      <div className="exec-head"><h1 className="exec-title">Rapports</h1><p className="exec-sub">Chargement…</p></div>
      <div className="exec-skeleton" style={{ height: 400 }} />
    </div>
  )

  return (
    <div className="exec rp-page">
      <div className="exec-head">
        <div>
          <h1 className="exec-title">Rapports</h1>
          <p className="exec-sub">{total} rapports générés</p>
        </div>
        <div className="exec-head-actions">
          <button className="exec-refresh" onClick={load}><span style={{fontSize:16}}>↻</span> Actualiser</button>
          <button className="exec-btn-primary" onClick={() => setShowNew(true)}>+ Nouveau rapport</button>
        </div>
      </div>

      <div className="rp-toolbar">
        <div className="rp-filter-group">
          {REPORT_TYPES.map(t => (
            <button key={t.value} className={`rp-filter-btn ${typeFilter === t.value ? 'active' : ''}`}
              onClick={() => setTypeFilter(typeFilter === t.value ? '' : t.value)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <select className="rp-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">Tous les statuts</option>
          <option value="completed">Terminés</option>
          <option value="pending">En attente</option>
          <option value="failed">Échoués</option>
        </select>
      </div>

      <div className="rp-grid">
        {reports.length === 0 ? (
          <div className="rp-empty">Aucun rapport trouvé. Créez votre premier rapport.</div>
        ) : reports.map(r => (
          <div key={r.id} className="rp-card">
            <div className="rp-card-head">
              <span className="rp-card-type">{REPORT_TYPES.find(t => t.value === r.report_type)?.icon || '📄'}</span>
              <span className="rp-card-format">{(FORMATS.find(f => f.value === r.format)?.icon || '📄')}</span>
            </div>
            <h3 className="rp-card-title">{r.title}</h3>
            <div className="rp-card-meta">
              <span>{REPORT_TYPES.find(t => t.value === r.report_type)?.label || r.report_type}</span>
              <span>·</span>
              <span>{r.format?.toUpperCase()}</span>
            </div>
            <div className="rp-card-footer">
              {statusBadge(r.status)}
              <div className="rp-card-actions">
                <button className="rp-action" title="Générer" onClick={() => handleGenerate(r.id)} disabled={r.status === 'generating'}>▶</button>
                <button className="rp-action rp-action-danger" title="Supprimer" onClick={() => handleDelete(r.id)}>🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pages > 1 && (
        <div className="us-pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
          <span>Page {page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Suivant →</button>
        </div>
      )}

      {showNew && (
        <NewReportModal onSave={handleCreate} onClose={() => setShowNew(false)} />
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

function NewReportModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    title: '',
    report_type: 'financial',
    format: 'pdf',
    parameters: {},
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content rp-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nouveau rapport</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="us-form-group">
            <label>Titre du rapport</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Ex: Rapport financier mensuel" />
          </div>
          <div className="us-form-row">
            <div className="us-form-group">
              <label>Type de rapport</label>
              <select value={form.report_type} onChange={e => setForm({ ...form, report_type: e.target.value })}>
                {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            <div className="us-form-group">
              <label>Format</label>
              <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })}>
                {FORMATS.map(f => <option key={f.value} value={f.value}>{f.icon} {f.label}</option>)}
              </select>
            </div>
          </div>
          <div className="us-form-actions">
            <button type="button" className="us-btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="us-btn-submit" disabled={saving}>
              {saving ? '…' : 'Créer le rapport'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
