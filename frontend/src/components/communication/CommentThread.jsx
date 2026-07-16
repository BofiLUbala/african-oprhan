import React from 'react'
import { AttachmentList, PendingFiles, fmtTime, dayLabel } from './shared'
import CIcon from './icons'
import ComposerTools from './ComposerTools'

/**
 * Fil de commentaires INLINE (façon LinkedIn/Facebook) : s'ouvre en douceur
 * sous la publication — pas de modale séparée. Composeur riche (texte +
 * pièces jointes / audio / vidéo via ComposerTools), liste avec avatar / nom /
 * rôle / date+heure, édition et suppression de ses propres commentaires
 * (les modérateurs peuvent supprimer n'importe lequel). Mise à jour temps réel
 * sans rechargement ; région aria-live pour l'accessibilité.
 */
export default function CommentThread({
  post, user, comments, loading, error, canModerate,
  onSubmit, onEdit, onDelete, onRetry,
  mediaUrl, roleLabel, avatarUrl, onClose,
}) {
  const [input, setInput] = React.useState('')
  const [files, setFiles] = React.useState([])
  const [sending, setSending] = React.useState(false)
  const [editing, setEditing] = React.useState(null) // {id, content}
  const [confirmDel, setConfirmDel] = React.useState(null)
  const inputRef = React.useRef(null)

  React.useEffect(() => { inputRef.current?.focus() }, [])

  const addFiles = (picked) => setFiles(prev => [...prev, ...picked])

  const submit = async () => {
    if (sending || (!input.trim() && files.length === 0)) return
    setSending(true)
    const ok = await onSubmit({ content: input.trim(), files })
    setSending(false)
    if (ok) { setInput(''); setFiles([]); inputRef.current?.focus() }
  }

  // Annuler ferme tout le panneau de commentaires (pas seulement le texte) —
  // même geste que fermer via le bouton « Commenter » qui l'a ouvert.
  const cancelCompose = () => { setInput(''); setFiles([]); onClose?.() }

  const saveEdit = async () => {
    if (!editing?.content.trim()) return
    if (await onEdit(editing.id, editing.content.trim())) setEditing(null)
  }

  const meId = user?.id
  const initials = ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase() || '?'

  return (
    <section className="cmt-thread" aria-label={`Commentaires de la publication de ${post.author_name}`}>
      {/* ── Composeur ── */}
      <div className="cmt-composer">
        <img className="cmt-avatar" src={avatarUrl} alt="" aria-hidden="true" />
        <div className="cmt-composer-body">
          <div className="cmt-input-wrap">
            <textarea
              ref={inputRef}
              className="cmt-input"
              value={input}
              rows={input.includes('\n') || input.length > 60 ? 3 : 1}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
              placeholder="Écrire un commentaire…"
              aria-label="Écrire un commentaire"
              maxLength={2000}
            />
          </div>
          <PendingFiles files={files} onRemove={(i) => setFiles(prev => prev.filter((_, j) => j !== i))} />
          <div className="cmt-composer-actions">
            <ComposerTools onFiles={addFiles} />
            <span className="cmt-count" aria-hidden="true">{input.length > 1600 ? `${input.length}/2000` : ''}</span>
            <span style={{ flex: 1 }} />
            <button type="button" className="cmt-cancel" onClick={cancelCompose} disabled={sending || (!input.trim() && files.length === 0)} aria-label="Annuler le commentaire">
              Annuler
            </button>
            <button className="cmt-send sm" onClick={submit}
              disabled={sending || (!input.trim() && files.length === 0)}
              aria-label="Publier le commentaire">
              {sending ? <span className="cmt-spinner" aria-hidden="true" /> : <><CIcon name="send" size={16} /> Publier</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Liste ── */}
      <div className="cmt-list" aria-live="polite">
        {loading && (
          <div className="cmt-loading" role="status">
            <span className="cmt-spinner dark" aria-hidden="true" /> Chargement des commentaires…
          </div>
        )}
        {error && !loading && (
          <div className="cmt-error" role="alert">
            Impossible de charger les commentaires.
            <button className="cmt-retry" onClick={onRetry}>Réessayer</button>
          </div>
        )}
        {!loading && !error && comments.length === 0 && (
          <div className="cmt-empty">Aucun commentaire pour l'instant. Soyez le premier à réagir.</div>
        )}
        {comments.map(c => {
          const isMine = c.author === meId
          const canDelete = isMine || canModerate
          const isEditing = editing?.id === c.id
          return (
            <article key={c.id} className="cmt-item">
              <span className="cmt-avatar sm" style={{ background: `hsl(${c.author_avatar?.hue ?? 210},55%,50%)` }} aria-hidden="true">
                {c.author_avatar?.initials || '?'}
              </span>
              <div className="cmt-item-body">
                <div className="cmt-bubble">
                  <div className="cmt-item-head">
                    <span className="cmt-item-name">{isMine ? 'Vous' : c.author_name}</span>
                    {c.author_role && <span className="cmt-item-role">{roleLabel(c.author_role)}</span>}
                  </div>
                  {isEditing ? (
                    <div className="cmt-edit">
                      <textarea autoFocus rows={2} value={editing.content}
                        onChange={e => setEditing(v => ({ ...v, content: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() }
                          if (e.key === 'Escape') setEditing(null)
                        }} />
                      <div className="cmt-edit-actions">
                        <button className="cmt-send sm" onClick={saveEdit}>Enregistrer</button>
                        <button className="cmt-cancel" onClick={() => setEditing(null)}>Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {c.content && <p className="cmt-item-text">{c.content}</p>}
                      <AttachmentList attachments={c.attachments} mediaUrl={mediaUrl} />
                    </>
                  )}
                </div>
                <div className="cmt-item-foot">
                  <time title={new Date(c.created_at).toLocaleString('fr-FR')}>
                    {dayLabel(c.created_at)} · {fmtTime(c.created_at)}
                  </time>
                  {c.edited && <span className="cmt-edited">modifié</span>}
                  {isMine && !isEditing && (
                    <button className="cmt-link" onClick={() => setEditing({ id: c.id, content: c.content })}>Modifier</button>
                  )}
                  {canDelete && !isEditing && (
                    <button className="cmt-link danger" onClick={() => setConfirmDel(c.id)}>Supprimer</button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* ── Confirmation suppression ── */}
      {confirmDel != null && (
        <div className="cmv2-sheet-backdrop" onClick={() => setConfirmDel(null)} role="dialog" aria-modal="true" aria-label="Supprimer le commentaire">
          <div className="cmv2-confirm" onClick={e => e.stopPropagation()}>
            <h3 className="cmv2-confirm-title">Supprimer ce commentaire ?</h3>
            <div className="cmv2-confirm-actions">
              <button className="cmv2-confirm-btn danger" onClick={() => { onDelete(confirmDel); setConfirmDel(null) }}>Supprimer</button>
              <button className="cmv2-confirm-btn ghost" onClick={() => setConfirmDel(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
