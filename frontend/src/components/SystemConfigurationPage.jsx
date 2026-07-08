import React, { useState, useEffect, useCallback } from 'react'

const API = 'http://localhost:8000/api'

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('access_token')
  const headers = { ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(url, { ...options, headers })
}

const CATEGORIES = [
  { key: 'general', label: 'Général', icon: '⚙️', desc: 'Paramètres généraux de la plateforme' },
  { key: 'security', label: 'Sécurité', icon: '🔒', desc: 'Politiques de sécurité et accès' },
  { key: 'email', label: 'Email', icon: '📧', desc: 'Configuration SMTP et notifications' },
  { key: 'features', label: 'Fonctionnalités', icon: '🚀', desc: 'Activation des modules' },
  { key: 'limits', label: 'Limites', icon: '📏', desc: 'Seuils et quotas' },
  { key: 'integrations', label: 'Intégrations', icon: '🔗', desc: 'API et services externes' },
  { key: 'appearance', label: 'Apparence', icon: '🎨', desc: 'Personnalisation visuelle' },
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
        <button className="exec-refresh" onClick={load}><span style={{fontSize:16}}>↻</span> Actualiser</button>
      </div>

      <div className="cfg-categories">
        {CATEGORIES.map(cat => (
          <button key={cat.key}
            className={`cfg-cat-btn ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}>
            <span className="cfg-cat-icon">{cat.icon}</span>
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
          <span className="dash-toast-icon">{toast.type === 'success' ? '✓' : '✗'}</span>
          <span className="dash-toast-msg">{toast.message}</span>
        </div>
      )}
    </div>
  )
}
