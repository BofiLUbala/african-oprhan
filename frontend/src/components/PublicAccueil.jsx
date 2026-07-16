import React from 'react'
import ProjectMetaBar from './communication/ProjectMetaBar'

/**
 * Communication → Accueil en lecture seule pour les visiteurs non connectés.
 *
 * Réutilise l'API existante GET /api/posts/ (le backend limite déjà les
 * anonymes aux publications « public » approuvées via visible_post_filter).
 * Toute tentative d'interaction (aimer, commenter, partager, postuler)
 * déclenche onRequireAuth() : invite à créer un compte ou se connecter.
 *
 * Quand focusChildId est fourni (clic sur une photo du carrousel de la page
 * d'accueil), la vue se verrouille sur les publications de cet enfant
 * uniquement — pas de pagination, pas de fil complet — et invite à créer un
 * compte après un court délai de lecture.
 */
const PROJECT_TYPE_LABELS = { enfant: 'Projet Enfant', orphelinat: 'Projet Orphelinat', federation: 'Projet Fédération' }
const PAGE = 15

// Convertit le JSON brut d'une mise à jour enfant en texte lisible — même
// logique que esReadableUpdate côté Communication, dupliquée ici car ce
// composant est monté hors de EclatSocialApp (visiteur non authentifié).
const FIELD_LABELS = {
  hospital: 'Hôpital', admit_date: "Date d'admission", discharge_date: 'Date de sortie',
  ward: 'Service', doctor: 'Médecin', reason: 'Motif', outcome: 'Résultat', notes: 'Notes',
  school: 'École', school_name: 'École', level: 'Niveau', grade: 'Classe',
  date: 'Date', description: 'Description', status: 'Statut', amount: 'Montant',
}
function readableContent(text) {
  if (!text) return ''
  const t = String(text).trim()
  const jsonToLines = (raw) => {
    const obj = JSON.parse(raw)
    if (Array.isArray(obj)) return obj.map(o => jsonToLines(JSON.stringify(o))).join('\n\n')
    return Object.entries(obj)
      .filter(([, v]) => v !== null && v !== '' && typeof v !== 'object')
      .map(([k, v]) => `${FIELD_LABELS[k] || k.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())} : ${v}`)
      .join('\n')
  }
  if (t.startsWith('{') || t.startsWith('[')) {
    try { return jsonToLines(t) } catch { return t }
  }
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return (t.slice(0, start).trimEnd() + '\n\n' + jsonToLines(t.slice(start, end + 1)) + t.slice(end + 1)).trim() } catch { /* pas du JSON valide */ }
  }
  return t
}

export default function PublicAccueil({ API, onRequireAuth, onBack, focusChildId }) {
  const [posts, setPosts] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [hasMore, setHasMore] = React.useState(false)

  const load = React.useCallback((reset = true) => {
    const offset = reset ? 0 : posts.length
    setLoading(true)
    fetch(`${API}/posts/?limit=${PAGE}&offset=${offset}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const page = Array.isArray(data) ? data : (data.results || [])
        setHasMore(page.length === PAGE)
        setPosts(prev => reset ? page : [...prev, ...page.filter(p => !prev.some(x => x.id === p.id))])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [API, posts.length])

  React.useEffect(() => { load(true) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const visiblePosts = focusChildId != null
    ? posts.filter(p => p.child_info && (p.child_info.id === focusChildId || p.child_info.uid === focusChildId))
    : posts

  // Vue verrouillée sur un enfant : après un court délai de lecture, invite
  // le visiteur anonyme à créer un compte pour aller plus loin.
  React.useEffect(() => {
    if (focusChildId == null || visiblePosts.length === 0) return
    const timer = setTimeout(() => onRequireAuth?.('signup'), 8000)
    return () => clearTimeout(timer)
  }, [focusChildId, visiblePosts.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (mins < 1) return "à l'instant"
    if (mins < 60) return `il y a ${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `il y a ${hrs}h`
    return `il y a ${Math.floor(hrs / 24)}j`
  }

  const focusChildName = focusChildId != null ? visiblePosts[0]?.child_info?.name : null

  return (
    <div className="pub-accueil">
      <header className="pub-accueil-head">
        <button className="pub-accueil-back" onClick={onBack}>{'←'} Retour au site</button>
        <h2>{focusChildName ? `Accueil — ${focusChildName}` : 'Accueil — Fil public'}</h2>
        <button className="pub-accueil-signin" onClick={() => onRequireAuth?.('login')}>Se connecter</button>
      </header>

      <div className="pub-accueil-banner">
        Vous consultez le fil public en tant que visiteur. <button onClick={() => onRequireAuth?.('signup')}>Créez un compte ou connectez-vous</button> pour interagir.
      </div>

      <div className="pub-accueil-feed">
        {loading && visiblePosts.length === 0 && <div className="pub-accueil-empty">Chargement…</div>}
        {!loading && visiblePosts.length === 0 && (
          <div className="pub-accueil-empty">
            {focusChildId != null ? 'Aucune publication pour cet enfant pour le moment.' : 'Aucune publication publique pour le moment.'}
          </div>
        )}
        {visiblePosts.map(post => {
          const av = post.author_avatar || { initials: '?', hue: 200 }
          const avatar = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" rx="20" fill="hsl(${av.hue},50%,45%)"/><text x="20" y="20" dominant-baseline="central" text-anchor="middle" fill="white" font-size="16" font-weight="700">${av.initials}</text></svg>`)}`
          const media = post.media && post.media[0]
          return (
            <article key={post.id} className="pub-post">
              <div className="pub-post-head">
                <img src={avatar} alt="" />
                <div>
                  <span className="pub-post-author">{post.author_name}</span>
                  <span className="pub-post-time">{timeAgo(post.created_at)}</span>
                </div>
              </div>
              {post.child_info && (
                <div className="pub-post-child-profile">
                  {post.child_info.photo
                    ? <img src={post.child_info.photo.startsWith('http') ? post.child_info.photo : `${API.replace(/\/api$/, '')}${post.child_info.photo}`} alt="" className="pub-post-child-photo" />
                    : <span className="pub-post-child-photo pub-post-child-photo-fallback" />}
                  <div className="pub-post-child-meta">
                    <span className="pub-post-child-name">{post.child_info.name}</span>
                    <span className="pub-post-child-sub">ID {post.child_info.uid}{post.child_info.nationalite ? ` · ${post.child_info.nationalite}` : ''}</span>
                  </div>
                </div>
              )}
              <p className="pub-post-content" style={{ whiteSpace: 'pre-line' }}>{readableContent(post.content)}</p>
              {media && media.media_type !== 'video' && <img src={media.url} alt="" className="pub-post-media" />}
              {post.project_info && (
                <>
                  <ProjectMetaBar project={post.project_info} compact />
                  <div className="pub-post-project">
                    <span>{PROJECT_TYPE_LABELS[post.project_info.type] || 'Projet'}</span>
                    <button className="pub-post-postulate" onClick={() => onRequireAuth?.('signup')}>Postuler</button>
                  </div>
                </>
              )}
              {!focusChildId && (
                <div className="pub-post-actions">
                  <button onClick={() => onRequireAuth?.('login')}>J'aime</button>
                  <button onClick={() => onRequireAuth?.('login')}>Commenter</button>
                  <button onClick={() => onRequireAuth?.('login')}>Partager</button>
                </div>
              )}
            </article>
          )
        })}
        {!focusChildId && posts.length > 0 && hasMore && (
          <button className="pub-accueil-more" onClick={() => load(false)} disabled={loading}>
            {loading ? 'Chargement…' : 'Charger plus'}
          </button>
        )}
        {focusChildId != null && visiblePosts.length > 0 && (
          <div className="pub-accueil-cta">
            <p>Envie d'en savoir plus et de suivre {focusChildName || 'cet enfant'} ?</p>
            <button className="pub-accueil-signin" onClick={() => onRequireAuth?.('signup')}>Créer un compte</button>
          </div>
        )}
      </div>
    </div>
  )
}
