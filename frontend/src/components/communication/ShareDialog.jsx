import React from 'react'
import CIcon from './icons'

/**
 * Dialogue de partage complet : l'utilisateur choisit une DESTINATION
 * (utilisateurs internes / canaux / conversations) ET une MÉTHODE
 * (copier le lien, interne, e-mail, WhatsApp, Telegram, Facebook, LinkedIn, X).
 * Chaque partage est enregistré côté serveur (analytics + compteur temps réel).
 */

const METHODS = [
  { key: 'copy', label: 'Copier le lien', icon: 'link' },
  { key: 'internal', label: 'Partage interne', icon: 'send' },
  { key: 'email', label: 'E-mail', icon: 'inbox' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'message' },
  { key: 'telegram', label: 'Telegram', icon: 'send' },
  { key: 'facebook', label: 'Facebook', icon: 'share' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'building' },
  { key: 'x', label: 'X (Twitter)', icon: 'hash' },
]

// méthodes n'exigeant pas de cible interne
const EXTERNAL = new Set(['copy', 'email', 'whatsapp', 'telegram', 'facebook', 'linkedin', 'x'])

function externalUrl(method, shareUrl, text) {
  const u = encodeURIComponent(shareUrl)
  const t = encodeURIComponent(text || 'Publication')
  switch (method) {
    case 'whatsapp': return `https://wa.me/?text=${t}%20${u}`
    case 'telegram': return `https://t.me/share/url?url=${u}&text=${t}`
    case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${u}`
    case 'linkedin': return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`
    case 'x': return `https://twitter.com/intent/tweet?url=${u}&text=${t}`
    case 'email': return `mailto:?subject=${t}&body=${u}`
    default: return null
  }
}

export default function ShareDialog({
  post, shareUrl, channels = [], conversations = [], users = [],
  onClose, onShare, roleLabel, avatarUrl, currentUserId,
}) {
  const [method, setMethod] = React.useState('copy')
  const [destTab, setDestTab] = React.useState('users') // users | channels | conversations
  const [dest, setDest] = React.useState(null) // {type, id, label}
  const [query, setQuery] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const panelRef = React.useRef(null)

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const needsInternalDest = method === 'internal'
  const ql = query.trim().toLowerCase()

  const destItems = destTab === 'channels'
    ? channels.filter(c => c.name.toLowerCase().includes(ql))
    : destTab === 'conversations'
      ? conversations.map(c => {
          const o = c.participants?.find(p => p.id !== currentUserId) || c.participants?.[0]
          return { id: c.id, name: o ? `${o.first_name || ''} ${o.last_name || ''}`.trim() || o.email : `Conversation #${c.id}`, _conv: c }
        }).filter(c => c.name.toLowerCase().includes(ql))
      : users.filter(u => u.id !== currentUserId && (u.full_name || `${u.first_name} ${u.last_name}`).toLowerCase().includes(ql))

  const confirm = async () => {
    if (busy) return
    if (needsInternalDest && !dest) return
    setBusy(true)

    // effet côté client selon la méthode
    if (method === 'copy') {
      try { await navigator.clipboard.writeText(shareUrl) } catch {}
      setCopied(true)
    } else if (EXTERNAL.has(method)) {
      const url = externalUrl(method, shareUrl, post.content)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
    }

    // enregistrement analytics (compteur temps réel via onShare)
    await onShare({ method, destination: dest ? `${dest.type}:${dest.id}` : '' })
    setBusy(false)
    if (method !== 'copy') onClose()
  }

  return (
    <div className="cmv2-sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Partager la publication">
      <div className="share-panel" ref={panelRef} tabIndex={-1} onClick={e => e.stopPropagation()}>
        <header className="share-head">
          <h3 className="share-title">Partager</h3>
          <button className="share-close" onClick={onClose} aria-label="Fermer"><CIcon name="x" size={18} /></button>
        </header>

        {/* Étape 1 — méthode */}
        <div className="share-section">
          <div className="share-section-label">Méthode de partage</div>
          <div className="share-methods">
            {METHODS.map(m => (
              <button key={m.key} className={`share-method${method === m.key ? ' active' : ''}`}
                onClick={() => { setMethod(m.key); setCopied(false); if (m.key !== 'internal') setDest(null) }}
                aria-pressed={method === m.key}>
                <span className="share-method-icon"><CIcon name={m.icon} size={20} /></span>
                <span className="share-method-label">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Étape 2 — destination (partage interne uniquement) */}
        {needsInternalDest && (
          <div className="share-section">
            <div className="share-section-label">Destination</div>
            <div className="share-tabs" role="tablist">
              {[['users', 'Agents'], ['channels', 'Canaux'], ['conversations', 'Conversations']].map(([k, label]) => (
                <button key={k} role="tab" aria-selected={destTab === k}
                  className={`share-tab${destTab === k ? ' active' : ''}`}
                  onClick={() => { setDestTab(k); setDest(null) }}>{label}</button>
              ))}
            </div>
            <input className="share-search" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher une destination…" aria-label="Rechercher une destination" />
            <div className="share-dest-list">
              {destItems.length === 0 && <div className="cmt-empty">Aucune destination.</div>}
              {destItems.map(item => {
                const selected = dest?.type === destTab && dest?.id === (item.slug || item.id)
                const label = item.name || item.full_name || `${item.first_name || ''} ${item.last_name || ''}`.trim()
                return (
                  <button key={item.slug || item.id} className={`share-dest${selected ? ' active' : ''}`}
                    onClick={() => setDest({ type: destTab, id: item.slug || item.id, label })}>
                    <span className="share-dest-icon"><CIcon name={destTab === 'channels' ? 'hash' : destTab === 'conversations' ? 'message' : 'user'} size={17} /></span>
                    <span className="share-dest-name">{label}</span>
                    {selected && <CIcon name="check" size={16} />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <footer className="share-foot">
          {copied && <span className="share-copied" role="status"><CIcon name="check" size={15} /> Lien copié</span>}
          <span style={{ flex: 1 }} />
          <button className="cmv2-cancel" onClick={onClose}>Fermer</button>
          <button className="cmv2-send" onClick={confirm}
            disabled={busy || (needsInternalDest && !dest)}
            aria-label="Confirmer le partage">
            {busy ? 'Partage…' : method === 'copy' ? 'Copier le lien' : 'Partager'}
          </button>
        </footer>
      </div>
    </div>
  )
}
