import React, { useState, useEffect, useCallback } from 'react'

const API = 'http://localhost:8000/api'

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('access_token')
  const headers = { ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { ...options, headers })
  if (res.status === 401) {
    const refresh = localStorage.getItem('refresh_token')
    if (refresh) {
      const refRes = await fetch(`${API}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      if (refRes.ok) {
        const tokens = await refRes.json()
        localStorage.setItem('access_token', tokens.access)
        headers['Authorization'] = `Bearer ${tokens.access}`
        return fetch(url, { ...options, headers })
      }
    }
  }
  return res
}

export default function PaymentManagementPage({ onLogout, role }) {
  const isSupermaster = role === 'supermaster'

  const [activeTab, setActiveTab] = useState(isSupermaster ? 'providers' : 'transactions')
  const [providers, setProviders] = useState([])
  const [transactions, setTransactions] = useState([])
  const [transactionsMeta, setTransactionsMeta] = useState({ total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [txPage, setTxPage] = useState(1)
  const [txStatusF, setTxStatusF] = useState('')
  const [txTypeF, setTxTypeF] = useState('')
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  /* ── Provider modal ── */
  const [provModal, setProvModal] = useState(null) // null | {mode:'create'|'edit', provider?}
  const [provForm, setProvForm] = useState({ name: 'visa', display_name: '', sort_order: 0, is_active: true })

  const PROVIDER_OPTIONS = [
    { value: 'visa', label: 'Visa' },
    { value: 'mastercard', label: 'Mastercard' },
    { value: 'mpesa', label: 'M-Pesa' },
    { value: 'airtel_money', label: 'Airtel Money' },
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'mtn_money', label: 'MTN Mobile Money' },
  ]

  const loadProviders = useCallback(async () => {
    const url = isSupermaster
      ? `${API}/admin/providers/`
      : `${API}/providers/`
    const res = await apiFetch(url, {}, onLogout)
    if (res && res.ok) {
      const data = await res.json()
      setProviders(Array.isArray(data) ? data : [])
    }
  }, [isSupermaster, onLogout])

  const loadTransactions = useCallback(async (page = 1) => {
    setLoading(true)
    const q = new URLSearchParams({ page: String(page), page_size: '20' })
    if (txStatusF) q.append('status', txStatusF)
    if (txTypeF) q.append('type', txTypeF)
    const url = isSupermaster
      ? `${API}/admin/transactions/?${q}`
      : `${API}/transactions/?${q}`
    const res = await apiFetch(url, {}, onLogout)
    if (res && res.ok) {
      const data = await res.json()
      if (isSupermaster) {
        setTransactions(data.results || [])
        setTransactionsMeta({ total: data.total, page: data.page, pages: data.pages })
      } else {
        setTransactions(Array.isArray(data) ? data : [])
      }
    }
    setLoading(false)
  }, [isSupermaster, onLogout, txStatusF, txTypeF])

  useEffect(() => {
    loadProviders()
  }, [loadProviders])

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions(txPage)
    }
  }, [activeTab, txPage, txStatusF, txTypeF, loadTransactions])

  const openCreateProvider = () => {
    setProvForm({ name: 'visa', display_name: '', sort_order: providers.length, is_active: true })
    setProvModal({ mode: 'create' })
  }

  const openEditProvider = (p) => {
    setProvForm({ name: p.name, display_name: p.display_name, sort_order: p.sort_order, is_active: p.is_active })
    setProvModal({ mode: 'edit', provider: p })
  }

  const saveProvider = async () => {
    if (!provForm.display_name.trim()) { showToast('Le nom affiché est requis', 'error'); return }
    const isEdit = provModal.mode === 'edit'
    const url = isEdit
      ? `${API}/admin/providers/${provModal.provider.id}/update/`
      : `${API}/admin/providers/create/`
    const res = await apiFetch(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(provForm),
    }, onLogout)
    if (res && res.ok) {
      showToast(isEdit ? 'Fournisseur mis à jour' : 'Fournisseur créé')
      setProvModal(null)
      loadProviders()
    } else {
      const err = await res.json().catch(() => ({ error: 'Erreur' }))
      showToast(err.error || 'Enregistrement impossible', 'error')
    }
  }

  const toggleProvider = async (p) => {
    const res = await apiFetch(`${API}/admin/providers/${p.id}/toggle/`, { method: 'POST' }, onLogout)
    if (res && res.ok) {
      showToast(p.is_active ? 'Fournisseur désactivé' : 'Fournisseur activé')
      loadProviders()
    } else {
      showToast('Action impossible', 'error')
    }
  }

  const statusLabel = (s) => ({
    pending: 'En attente', processing: 'En cours', completed: 'Complété', failed: 'Échoué', refunded: 'Remboursé',
  })[s] || s

  const statusColor = (s) => ({
    pending: '#f59e0b', processing: '#3b82f6', completed: '#22c55e', failed: '#ef4444', refunded: '#94a3b8',
  })[s] || '#94a3b8'

  const typeLabel = (t) => ({
    donation: 'Don', sponsorship: 'Parrainage', project_financing: 'Financement projet',
    healthcare: 'Santé', education: 'Éducation',
  })[t] || t

  const providerName = (n) => {
    const found = PROVIDER_OPTIONS.find(o => o.value === n)
    return found ? found.label : n
  }

  const fmtDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const fmtAmount = (v, c) => {
    const n = Number(v) || 0
    return `${n.toLocaleString('fr-FR')} ${c || 'USD'}`
  }

  return (
    <div className="pay-mgmt">
      {toast && <div className={`pay-toast${toast.type === 'error' ? ' err' : ' ok'}`}>{toast.msg}</div>}

      <div className="pay-head">
        <div>
          <h1 className="pay-title">{isSupermaster ? 'Gestion des paiements' : 'Transactions financières'}</h1>
          <p className="pay-sub">
            {isSupermaster
              ? 'Superviser les fournisseurs de paiement et toutes les transactions'
              : 'Consulter l\'ensemble des transactions financières'}
          </p>
        </div>
      </div>

      {isSupermaster && (
        <div className="pay-tabs">
          <button className={`pay-tab${activeTab === 'providers' ? ' active' : ''}`} onClick={() => setActiveTab('providers')}>
            Fournisseurs
          </button>
          <button className={`pay-tab${activeTab === 'transactions' ? ' active' : ''}`} onClick={() => { setActiveTab('transactions'); setTxPage(1) }}>
            Transactions
          </button>
        </div>
      )}

      {/* ── PROVIDERS TAB (Super Master only) ── */}
      {activeTab === 'providers' && isSupermaster && (
        <div className="pay-card">
          <div className="pay-card-head">
            <h3>Fournisseurs de paiement</h3>
            <button className="pay-btn-primary" onClick={openCreateProvider}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Ajouter
            </button>
          </div>
          <table className="pay-table">
            <thead>
              <tr>
                <th>Fournisseur</th>
                <th>Nom affiché</th>
                <th>Ordre</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {providers.length === 0 ? (
                <tr><td colSpan={5} className="pay-empty">Aucun fournisseur configuré.</td></tr>
              ) : providers.map(p => (
                <tr key={p.id}>
                  <td><span className="pay-prov-badge">{providerName(p.name)}</span></td>
                  <td>{p.display_name}</td>
                  <td>{p.sort_order}</td>
                  <td>
                    <span className="pay-status-pill" style={{
                      color: p.is_active ? '#22c55e' : '#94a3b8',
                      background: p.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.15)',
                    }}>
                      {p.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <div className="pay-actions">
                      <button title="Modifier" onClick={() => openEditProvider(p)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button title={p.is_active ? 'Désactiver' : 'Activer'} onClick={() => toggleProvider(p)} style={{ color: p.is_active ? '#f97316' : '#22c55e' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {p.is_active
                            ? <><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93 19.07 19.07"/></>
                            : <><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></>}
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TRANSACTIONS TAB ── */}
      {activeTab === 'transactions' && (
        <div className="pay-card">
          <div className="pay-card-head">
            <h3>Transactions {isSupermaster && `(${transactionsMeta.total})`}</h3>
            <div className="pay-filters">
              <select value={txStatusF} onChange={e => { setTxStatusF(e.target.value); setTxPage(1) }}>
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="processing">En cours</option>
                <option value="completed">Complété</option>
                <option value="failed">Échoué</option>
                <option value="refunded">Remboursé</option>
              </select>
              <select value={txTypeF} onChange={e => { setTxTypeF(e.target.value); setTxPage(1) }}>
                <option value="">Tous les types</option>
                <option value="donation">Don</option>
                <option value="sponsorship">Parrainage</option>
                <option value="project_financing">Financement projet</option>
                <option value="healthcare">Santé</option>
                <option value="education">Éducation</option>
              </select>
            </div>
          </div>
          <table className="pay-table">
            <thead>
              <tr>
                {isSupermaster && <th>Payeur</th>}
                <th>Type</th>
                <th>Montant</th>
                <th>Méthode</th>
                <th>Référence</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={isSupermaster ? 7 : 6}><div className="pay-skeleton" style={{ height: 24, margin: '4px 0' }} /></td></tr>
              )) : transactions.length === 0 ? (
                <tr><td colSpan={isSupermaster ? 7 : 6} className="pay-empty">Aucune transaction trouvée.</td></tr>
              ) : transactions.map(tx => (
                <tr key={tx.id}>
                  {isSupermaster && <td className="pay-payer">{tx.payer_name || '—'}</td>}
                  <td><span className="pay-type-badge">{typeLabel(tx.transaction_type)}</span></td>
                  <td className="pay-amount">{fmtAmount(tx.amount, tx.currency)}</td>
                  <td>{tx.payment_method_label || tx.payment_method || '—'}</td>
                  <td className="pay-ref">{tx.reference_number}</td>
                  <td>
                    <span className="pay-status-pill" style={{
                      color: statusColor(tx.status),
                      background: `${statusColor(tx.status)}1a`,
                    }}>
                      {statusLabel(tx.status)}
                    </span>
                  </td>
                  <td className="pay-date">{fmtDate(tx.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {isSupermaster && transactionsMeta.pages > 1 && (
            <div className="pay-pagination">
              <button disabled={transactionsMeta.page <= 1} onClick={() => setTxPage(p => p - 1)}>Précédent</button>
              <span>Page {transactionsMeta.page} / {transactionsMeta.pages}</span>
              <button disabled={transactionsMeta.page >= transactionsMeta.pages} onClick={() => setTxPage(p => p + 1)}>Suivant</button>
            </div>
          )}
        </div>
      )}

      {/* ── PROVIDER MODAL ── */}
      {provModal && (
        <div className="pay-modal-overlay" onClick={() => setProvModal(null)}>
          <div className="pay-modal" onClick={e => e.stopPropagation()}>
            <h3>{provModal.mode === 'edit' ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}</h3>
            <label className="pay-field">
              <span>Fournisseur *</span>
              <select value={provForm.name} onChange={e => setProvForm(f => ({ ...f, name: e.target.value }))}>
                {PROVIDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="pay-field">
              <span>Nom affiché *</span>
              <input value={provForm.display_name} onChange={e => setProvForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Ex: Visa International" autoFocus />
            </label>
            <label className="pay-field">
              <span>Ordre d'affichage</span>
              <input type="number" value={provForm.sort_order} onChange={e => setProvForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
            </label>
            <div className="pay-modal-actions">
              <button className="pay-btn-ghost" onClick={() => setProvModal(null)}>Annuler</button>
              <button className="pay-btn-primary" onClick={saveProvider}>
                {provModal.mode === 'edit' ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .pay-mgmt { padding: 24px; max-width: 1200px; margin: 0 auto; }
        .pay-toast { position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; z-index: 9999; animation: slideIn 0.25s ease; }
        .pay-toast.ok { background: #065f46; color: #6ee7b7; }
        .pay-toast.err { background: #7f1d1d; color: #fca5a5; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .pay-head { margin-bottom: 24px; }
        .pay-title { font-size: 24px; font-weight: 700; margin: 0 0 4px; color: var(--text-primary, #f1f5f9); }
        .pay-sub { font-size: 13px; color: var(--text-muted, #64748b); margin: 0; }
        .pay-tabs { display: flex; gap: 4px; margin-bottom: 20px; background: var(--bg-card, #1e293b); border-radius: 10px; padding: 4px; width: fit-content; }
        .pay-tab { padding: 8px 20px; border: none; background: transparent; color: var(--text-muted, #64748b); font-size: 13px; font-weight: 500; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
        .pay-tab.active { background: var(--bg-active, #334155); color: var(--text-primary, #f1f5f9); }
        .pay-card { background: var(--bg-card, #1e293b); border-radius: 12px; border: 1px solid var(--border-card, #334155); overflow: hidden; }
        .pay-card-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-card, #334155); flex-wrap: wrap; gap: 12px; }
        .pay-card-head h3 { margin: 0; font-size: 15px; font-weight: 600; color: var(--text-primary, #f1f5f9); }
        .pay-filters { display: flex; gap: 8px; }
        .pay-filters select { padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-card, #334155); background: var(--bg-input, #0f172a); color: var(--text-primary, #f1f5f9); font-size: 12px; cursor: pointer; }
        .pay-table { width: 100%; border-collapse: collapse; }
        .pay-table th { text-align: left; padding: 10px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted, #64748b); border-bottom: 1px solid var(--border-card, #334155); }
        .pay-table td { padding: 12px 16px; font-size: 13px; color: var(--text-primary, #f1f5f9); border-bottom: 1px solid var(--border-card, #334155); }
        .pay-empty { text-align: center; color: var(--text-muted, #64748b); padding: 40px 16px !important; font-size: 13px; }
        .pay-payer { font-weight: 500; }
        .pay-amount { font-weight: 600; color: #22c55e; }
        .pay-ref { font-family: monospace; font-size: 12px; color: var(--text-muted, #94a3b8); }
        .pay-date { font-size: 12px; color: var(--text-muted, #94a3b8); white-space: nowrap; }
        .pay-prov-badge { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 12px; font-weight: 500; background: rgba(99,102,241,0.12); color: #818cf8; }
        .pay-type-badge { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 500; background: rgba(59,130,246,0.12); color: #60a5fa; }
        .pay-status-pill { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 500; }
        .pay-actions { display: flex; gap: 6px; }
        .pay-actions button { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; color: var(--text-muted, #64748b); transition: all 0.15s; display: flex; align-items: center; }
        .pay-actions button:hover { background: rgba(255,255,255,0.05); color: var(--text-primary, #f1f5f9); }
        .pay-btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border: none; border-radius: 8px; background: #6366f1; color: #fff; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .pay-btn-primary:hover { background: #4f46e5; }
        .pay-btn-ghost { padding: 8px 16px; border: 1px solid var(--border-card, #334155); border-radius: 8px; background: transparent; color: var(--text-muted, #64748b); font-size: 13px; cursor: pointer; }
        .pay-pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; }
        .pay-pagination button { padding: 6px 14px; border: 1px solid var(--border-card, #334155); border-radius: 6px; background: transparent; color: var(--text-primary, #f1f5f9); font-size: 12px; cursor: pointer; }
        .pay-pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
        .pay-pagination span { font-size: 12px; color: var(--text-muted, #64748b); }
        .pay-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .pay-modal { background: var(--bg-card, #1e293b); border-radius: 12px; padding: 24px; width: 420px; max-width: 90vw; border: 1px solid var(--border-card, #334155); }
        .pay-modal h3 { margin: 0 0 20px; font-size: 16px; font-weight: 600; color: var(--text-primary, #f1f5f9); }
        .pay-field { display: block; margin-bottom: 16px; }
        .pay-field span { display: block; font-size: 12px; font-weight: 500; color: var(--text-muted, #64748b); margin-bottom: 4px; }
        .pay-field input, .pay-field select { width: 100%; padding: 8px 12px; border: 1px solid var(--border-card, #334155); border-radius: 6px; background: var(--bg-input, #0f172a); color: var(--text-primary, #f1f5f9); font-size: 13px; box-sizing: border-box; }
        .pay-field input:focus, .pay-field select:focus { outline: none; border-color: #6366f1; }
        .pay-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
        .pay-skeleton { background: rgba(148,163,184,0.08); border-radius: 4px; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
      `}</style>
    </div>
  )
}
