import React, { useState, useEffect, useCallback } from 'react'

const API = 'http://localhost:8000/api'

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('access_token')
  const headers = { ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(url, { ...options, headers })
}

const ICONS = {
  dollar: '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>',
  gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7" rx="2"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
  child: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  chart: '<rect width="4" height="12" x="4" y="10"/><rect width="4" height="16" x="10" y="6"/><rect width="4" height="8" x="16" y="14"/>',
  clipboard: '<rect width="14" height="18" x="5" y="3" rx="2"/><path d="M9 3h6"/><path d="M9 12h6"/><path d="M9 16h6"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/>',
  fileText: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/>',
  fileSheet: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M8 13h8M8 17h8M11 11v8"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
}

function Icon({ name, size = 18, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
      dangerouslySetInnerHTML={{ __html: ICONS[name] || ICONS.file }} />
  )
}

const REPORT_TYPES = [
  { value: 'financial', label: 'Financier', icon: 'dollar' },
  { value: 'donations', label: 'Dons', icon: 'gift' },
  { value: 'children', label: 'Enfants', icon: 'child' },
  { value: 'users', label: 'Utilisateurs', icon: 'users' },
  { value: 'sponsorships', label: 'Parrainages', icon: 'heart' },
  { value: 'activities', label: 'Activités', icon: 'chart' },
  { value: 'custom', label: 'Personnalisé', icon: 'clipboard' },
]

const FORMATS = [
  { value: 'pdf', label: 'PDF', icon: 'file' },
  { value: 'csv', label: 'CSV', icon: 'fileText' },
  { value: 'xlsx', label: 'Excel', icon: 'fileSheet' },
  { value: 'html', label: 'HTML', icon: 'globe' },
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
              <Icon name={t.icon} size={16} /> {t.label}
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
              <span className="rp-card-type"><Icon name={REPORT_TYPES.find(t => t.value === r.report_type)?.icon || 'file'} size={20} /></span>
              <span className="rp-card-format"><Icon name={FORMATS.find(f => f.value === r.format)?.icon || 'file'} size={20} /></span>
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
                <button className="rp-action rp-action-danger" title="Supprimer" onClick={() => handleDelete(r.id)}><Icon name="trash" /></button>
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
          <span className="dash-toast-icon">{toast.type === 'success' ? <Icon name="check" /> : <Icon name="x" />}</span>
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
          <button className="modal-close" onClick={onClose}><Icon name="x" /></button>
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
                {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="us-form-group">
              <label>Format</label>
              <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })}>
                {FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
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
