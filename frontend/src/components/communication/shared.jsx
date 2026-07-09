import React from 'react'
import CIcon, { kindToIcon } from './icons'
import './communication.css'

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

export const fmtSize = (b) => !b ? '' : b < 1024 ? `${b} o` : b < 1048576 ? `${(b / 1024).toFixed(0)} Ko` : `${(b / 1048576).toFixed(1)} Mo`

export function fmtTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function dayLabel(iso) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
  const same = (a, b) => a.toDateString() === b.toDateString()
  if (same(d, today)) return "Aujourd'hui"
  if (same(d, yesterday)) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Petite icône de type de pièce jointe (SVG cohérent, plus d'emoji). */
export function KindIcon({ kind, size = 15 }) {
  return <CIcon name={kindToIcon(kind)} size={size} />
}

/** Sélecteur d'émoji façon WhatsApp (survol / clic droit / appui long). */
export function ReactionPicker({ onPick, onClose, mine }) {
  return (
    <div className="cmv2-picker" role="menu" aria-label="Réagir au message"
      onMouseLeave={onClose}>
      {REACTION_EMOJIS.map(em => (
        <button key={em} role="menuitem" aria-label={`Réagir ${em}`}
          className={`cmv2-picker-emoji${mine === em ? ' active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onPick(em) }}>
          {em}
        </button>
      ))}
    </div>
  )
}

/** Chips de réactions groupées + popover « qui a réagi ». */
export function ReactionChips({ reactions, onToggle }) {
  const [who, setWho] = React.useState(null)
  if (!reactions || reactions.length === 0) return null
  return (
    <div className="cmv2-chips">
      {reactions.map(r => (
        <span key={r.emoji} style={{ position: 'relative' }}>
          <button
            className={`cmv2-chip${r.me ? ' me' : ''}`}
            aria-label={`${r.emoji} ${r.count} — ${r.users.join(', ')}`}
            onClick={() => onToggle(r.emoji)}
            onMouseEnter={() => setWho(r.emoji)}
            onMouseLeave={() => setWho(null)}>
            {r.emoji} {r.count > 1 ? r.count : ''}
          </button>
          {who === r.emoji && (
            <span className="cmv2-who" role="tooltip">{r.users.join(', ')}</span>
          )}
        </span>
      ))}
    </div>
  )
}

/** Bloc citation d'un message répondu, style WhatsApp. */
export function ReplyQuote({ reply, compact }) {
  if (!reply) return null
  return (
    <div className={`cmv2-quote${compact ? ' compact' : ''}`}>
      <span className="cmv2-quote-author">{reply.sender_name}</span>
      <span className="cmv2-quote-text">
        {reply.kind && reply.kind !== 'text' && <KindIcon kind={reply.kind} size={13} />}
        {reply.content
          ? reply.content
          : (reply.kind && reply.kind !== 'text' ? (reply.attachment_name || reply.kind) : 'Message')}
      </span>
    </div>
  )
}

/** Rendu des pièces jointes : images en grille, vidéo/audio natifs, fichiers en carte. */
export function AttachmentList({ attachments, mediaUrl }) {
  if (!attachments || attachments.length === 0) return null
  const images = attachments.filter(a => a.kind === 'image')
  const others = attachments.filter(a => a.kind !== 'image')
  return (
    <div className="cmv2-atts">
      {images.length > 0 && (
        <div className={`cmv2-att-grid n${Math.min(images.length, 4)}`}>
          {images.map(a => (
            <a key={a.id} href={mediaUrl(a.url)} target="_blank" rel="noreferrer" className="cmv2-att-img-link">
              <img src={mediaUrl(a.url)} alt={a.name} loading="lazy" />
            </a>
          ))}
        </div>
      )}
      {others.map(a => {
        const url = mediaUrl(a.url)
        if (a.kind === 'video') return <video key={a.id} src={url} controls preload="metadata" className="cmv2-att-video" />
        if (a.kind === 'audio') return <audio key={a.id} src={url} controls preload="metadata" className="cmv2-att-audio" />
        return (
          <a key={a.id} href={url} target="_blank" rel="noreferrer" download className="cmv2-att-file">
            <span className="cmv2-att-file-icon"><KindIcon kind={a.kind} size={20} /></span>
            <span className="cmv2-att-file-body">
              <span className="cmv2-att-file-name">{a.name}</span>
              <span className="cmv2-att-file-meta">{(a.kind || 'fichier').toUpperCase()}{a.size ? ` · ${fmtSize(a.size)}` : ''}</span>
            </span>
            <CIcon name="download" size={16} />
          </a>
        )
      })}
    </div>
  )
}

/** Aperçu des fichiers en attente dans un composeur. */
export function PendingFiles({ files, onRemove }) {
  if (!files || files.length === 0) return null
  return (
    <div className="cmv2-pending">
      {files.map((f, i) => {
        const k = f.type?.startsWith('image') ? 'image' : f.type?.startsWith('audio') ? 'audio' : f.type?.startsWith('video') ? 'video' : 'file'
        return (
          <span key={i} className="cmv2-pending-chip">
            <KindIcon kind={k} size={14} />
            <span className="cmv2-pending-name">{f.name}</span>
            <span className="cmv2-pending-size">{fmtSize(f.size)}</span>
            <button onClick={() => onRemove(i)} aria-label={`Retirer ${f.name}`} className="cmv2-pending-x"><CIcon name="x" size={13} /></button>
          </span>
        )
      })}
    </div>
  )
}

/** Bandeau « réponse en cours » au-dessus du composeur. */
export function ReplyBanner({ replyTo, onCancel }) {
  if (!replyTo) return null
  return (
    <div className="cmv2-replybar" role="status">
      <div className="cmv2-replybar-body">
        <span className="cmv2-replybar-label">Répondre à {replyTo.sender_name}</span>
        <span className="cmv2-replybar-text">
          {replyTo.content?.slice(0, 90) || (replyTo.attachment_name || 'Pièce jointe')}
        </span>
      </div>
      <button onClick={onCancel} aria-label="Annuler la réponse" className="cmv2-replybar-x"><CIcon name="x" size={15} /></button>
    </div>
  )
}
