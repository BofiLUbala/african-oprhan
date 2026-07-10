import React from 'react'
import CIcon from './icons'

/**
 * Modale « Qui a aimé » : liste professionnelle des personnes ayant réagi,
 * ouverte depuis le compteur de likes. Focus piégé, fermeture Échap / clic
 * extérieur, scrim conforme (40-60%).
 */
export default function LikesPopover({ title = "J'aime", onClose, load, roleLabel, currentUserId }) {
  const [state, setState] = React.useState('loading') // loading | ready | error
  const [users, setUsers] = React.useState([])
  const panelRef = React.useRef(null)

  React.useEffect(() => {
    let cancelled = false
    load()
      .then(list => { if (!cancelled) { setUsers(list || []); setState('ready') } })
      .catch(() => { if (!cancelled) setState('error') })
    return () => { cancelled = true }
  }, [])

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="cmv2-sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="likes-panel" ref={panelRef} tabIndex={-1} onClick={e => e.stopPropagation()}>
        <header className="likes-head">
          <h3 className="likes-title">{title}{state === 'ready' ? ` · ${users.length}` : ''}</h3>
          <button className="likes-close" onClick={onClose} aria-label="Fermer"><CIcon name="x" size={18} /></button>
        </header>
        <div className="likes-body">
          {state === 'loading' && <div className="cmt-loading" role="status"><span className="cmt-spinner dark" aria-hidden="true" /> Chargement…</div>}
          {state === 'error' && <div className="cmt-error" role="alert">Impossible de charger la liste.</div>}
          {state === 'ready' && users.length === 0 && <div className="cmt-empty">Personne pour l'instant.</div>}
          {state === 'ready' && users.map(u => (
            <div key={u.id} className="likes-row">
              <span className="cmt-avatar sm" style={{ background: `hsl(${u.avatar?.hue ?? 210},55%,50%)` }} aria-hidden="true">
                {u.avatar?.initials || '?'}
              </span>
              <div className="likes-row-body">
                <span className="likes-row-name">{u.id === currentUserId ? 'Vous' : u.name}</span>
                {u.role && <span className="likes-row-role">{roleLabel(u.role)}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
