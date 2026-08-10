import React, { useState, useEffect, useCallback } from 'react'
import { HumanizedRefreshIcon } from './HumanizedIcons'
import { API_URL as API } from '../config/api'

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('access_token')
  const headers = { ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(url, { ...options, headers })
}

const ICONS = {
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  ruler: '<path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4Z"/><path d="M14.5 11.5 12 14M11.5 14.5 9 17M17.5 8.5 15 11"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.6 1.5-1.3 0-.3-.1-.6-.3-.9a1.4 1.4 0 0 1-.2-1c.1-.5.5-1 1.2-1H15a5 5 0 0 0 5-5C20 6.5 17.5 2 12 2z"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
}

function Icon({ name, size = 18, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
      dangerouslySetInnerHTML={{ __html: ICONS[name] || ICONS.x }} />
  )
}

const CATEGORIES = [
  { key: 'general', label: 'Général', icon: 'settings', desc: 'Paramètres généraux de la plateforme' },
  { key: 'security', label: 'Sécurité', icon: 'lock', desc: 'Politiques de sécurité et accès' },
  { key: 'email', label: 'Email', icon: 'mail', desc: 'Configuration SMTP et notifications' },
  { key: 'features', label: 'Fonctionnalités', icon: 'rocket', desc: 'Activation des modules' },
  { key: 'limits', label: 'Limites', icon: 'ruler', desc: 'Seuils et quotas' },
  { key: 'integrations', label: 'Intégrations', icon: 'link', desc: 'API et services externes' },
  { key: 'appearance', label: 'Apparence', icon: 'palette', desc: 'Personnalisation visuelle' },
]

export default function SystemConfigurationPage({ onLogout }) {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('general')
  const [saving, setSaving] = useState(null)
  const [toast, setToast] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    apiFetch(`${API}/admin/settings/`, {}, onLogout)
      .then(r => r && r.ok ? r.json() : [])
      .then(data => { setSettings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [onLogout])

  useEffect(() => { load() }, [load])

  const filtered = settings.filter(s => s.category === activeCategory)

  const handleChange = (key, value) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
  }

  const handleSave = async (config) => {
    setSaving(config.key)
    try {
      const res = await apiFetch(`${API}/admin/settings/${config.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: config.value }),
      })
      if (res && res.ok) {
        setToast({ type: 'success', message: `${config.label} mis à jour` })
      } else {
        setToast({ type: 'error', message: 'Erreur lors de la sauvegarde' })
      }
    } catch { setToast({ type: 'error', message: 'Erreur réseau' }) }
    setSaving(null)
    setTimeout(() => setToast(null), 3000)
  }

  const renderValue = (config) => {
    if (config.value_type === 'boolean') {
      return (
        <label className="cfg-toggle">
          <input type="checkbox" checked={config.value === 'true'} onChange={e => handleChange(config.key, e.target.checked ? 'true' : 'false')} />
          <span className="cfg-toggle-slider" />
        </label>
      )
    }
    if (config.value_type === 'number') {
      return (
        <input className="cfg-input cfg-input-num" type="number" value={config.value}
          onChange={e => handleChange(config.key, e.target.value)} />
      )
    }
    return (
      <input className="cfg-input" type="text" value={config.value}
        onChange={e => handleChange(config.key, e.target.value)} />
    )
  }

  if (loading) return (
    <div className="exec">
      <div className="exec-head"><h1 className="exec-title">Configuration système</h1><p className="exec-sub">Chargement…</p></div>
      <div className="cfg-categories">{CATEGORIES.map(c => <div key={c.key} className="cfg-cat-skel" />)}</div>
    </div>
  )

  return (
    <div className="exec cfg-page">
      <div className="exec-head">
        <div>
          <h1 className="exec-title">Configuration système</h1>
          <p className="exec-sub">Paramétrage global de la plateforme</p>
        </div>
        <button className="exec-refresh" onClick={load}><HumanizedRefreshIcon size={16} /> Actualiser</button>
      </div>

      <div className="cfg-categories">
        {CATEGORIES.map(cat => (
          <button key={cat.key}
            className={`cfg-cat-btn ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}>
            <span className="cfg-cat-icon"><Icon name={cat.icon} /></span>
            <span className="cfg-cat-label">{cat.label}</span>
            <span className="cfg-cat-desc">{cat.desc}</span>
            <span className="cfg-cat-count">{settings.filter(s => s.category === cat.key).length}</span>
          </button>
        ))}
      </div>

      <div className="cfg-section">
        <div className="cfg-section-title">{CATEGORIES.find(c => c.key === activeCategory)?.label}</div>
        {filtered.length === 0 ? (
          <div className="exec-mini-empty">Aucun paramètre dans cette catégorie.</div>
        ) : (
          <div className="cfg-list">
            {filtered.map(config => (
              <div key={config.key} className="cfg-item">
                <div className="cfg-item-info">
                  <span className="cfg-item-label">{config.label}</span>
                  <span className="cfg-item-key">{config.key}</span>
                  {config.description && <span className="cfg-item-desc">{config.description}</span>}
                </div>
                <div className="cfg-item-control">
                  {renderValue(config)}
                  <button className="cfg-save-btn"
                    onClick={() => handleSave(config)}
                    disabled={saving === config.key}>
                    {saving === config.key ? '…' : 'Sauvegarder'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className={`dash-toast dash-toast-${toast.type}`} onClick={() => setToast(null)}>
          <span className="dash-toast-icon">{toast.type === 'success' ? <Icon name="check" /> : <Icon name="x" />}</span>
          <span className="dash-toast-msg">{toast.message}</span>
        </div>
      )}
    </div>
  )
}
