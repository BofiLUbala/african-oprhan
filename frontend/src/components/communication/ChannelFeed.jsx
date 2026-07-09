import React from 'react'
import {
  ReactionPicker, ReactionChips, ReplyQuote, AttachmentList,
  PendingFiles, ReplyBanner, fmtTime, dayLabel,
} from './shared'
import CIcon, { channelIcon } from './icons'
import ComposerTools from './ComposerTools'

/**
 * Vue « Canaux » façon groupes Facebook : bannière du canal, composeur en
 * carte, fil de publications (cartes) du plus récent au plus ancien, avec
 * réactions WhatsApp, réponses citées et médias riches.
 *
 * Composant de présentation : l'état serveur (messages, envoi, réaction,
 * édition, suppression) reste dans EclatSocialApp et arrive via props.
 */
export default function ChannelFeed({
  channel, messages, user,
  onSend, onReact, onEdit, onDelete,
  mediaUrl, roleLabel, timeAgo, avatarUrl,
}) {
  const [input, setInput] = React.useState('')
  const [files, setFiles] = React.useState([])
  const [replyTo, setReplyTo] = React.useState(null)
  const [sending, setSending] = React.useState(false)
  const [pickerFor, setPickerFor] = React.useState(null)
  const [editing, setEditing] = React.useState(null) // {id, content}
  const composerRef = React.useRef(null)

  // reset composer local quand on change de canal
  React.useEffect(() => {
    setInput(''); setFiles([]); setReplyTo(null); setEditing(null); setPickerFor(null)
  }, [channel?.slug])

  const addFiles = (picked) => setFiles(prev => [...prev, ...picked])

  const send = async () => {
    if (sending || (!input.trim() && files.length === 0)) return
    setSending(true)
    const ok = await onSend({ content: input.trim(), files, replyTo: replyTo?.id || null })
    setSending(false)
    if (ok) { setInput(''); setFiles([]); setReplyTo(null) }
  }

  const startReply = (m) => {
    setReplyTo({
      id: m.id, sender_name: m.sender_name, content: m.content,
      kind: m.attachments?.[0]?.kind || 'text',
      attachment_name: m.attachments?.[0]?.name || '',
    })
    composerRef.current?.focus()
  }

  const feed = [...messages].reverse() // plus récent en premier, façon fil FB
  const canPost = channel.can_post

  return (
    <div className="cmv2-feed-wrap">
      {/* ── Bannière du canal ── */}
      <div className="cmv2-banner">
        <div className="cmv2-banner-icon" aria-hidden="true"><CIcon name={channelIcon(channel)} size={28} /></div>
        <div className="cmv2-banner-body">
          <h2 className="cmv2-banner-name">
            {channel.name}
            {channel.restricted && <span className="cmv2-badge-lock" title="Canal à visibilité restreinte"><CIcon name="lock" size={11} /> Réservé</span>}
          </h2>
          <p className="cmv2-banner-desc">{channel.description}</p>
          <div className="cmv2-banner-meta">
            <span>{messages.length} publication{messages.length > 1 ? 's' : ''}</span>
            {channel.restricted && !channel.sees_all && (
              <span className="cmv2-privacy-hint" role="note">
                <CIcon name="eye" size={13} /> Vous ne voyez que vos propres publications dans ce canal
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Composeur en carte ── */}
      {canPost ? (
        <div className="cmv2-composer-card">
          <ReplyBanner replyTo={replyTo} onCancel={() => setReplyTo(null)} />
          <div className="cmv2-composer-row">
            <img className="cmv2-ava" src={avatarUrl} alt="" aria-hidden="true" />
            <textarea
              ref={composerRef}
              className="cmv2-composer-input"
              value={input}
              rows={input.includes('\n') || input.length > 80 ? 3 : 1}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={`Exprimez-vous dans ${channel.name}…`}
              aria-label={`Écrire dans ${channel.name}`}
            />
          </div>
          <PendingFiles files={files} onRemove={(i) => setFiles(prev => prev.filter((_, j) => j !== i))} />
          <div className="cmv2-composer-actions">
            <ComposerTools onFiles={addFiles} />
            <span style={{ flex: 1 }} />
            <button className="cmv2-send" onClick={send}
              disabled={sending || (!input.trim() && files.length === 0)}
              aria-label="Publier">
              {sending ? 'Envoi…' : 'Publier'}
            </button>
          </div>
        </div>
      ) : (
        <div className="cmv2-readonly" role="note"><CIcon name="file" size={15} /> Lecture seule — votre rôle ne peut pas publier dans ce canal.</div>
      )}

      {/* ── Fil de publications ── */}
      <div className="cmv2-feed" role="feed" aria-label={`Publications de ${channel.name}`}>
        {feed.length === 0 && (
          <div className="cmv2-empty">
            <div className="cmv2-empty-icon" aria-hidden="true"><CIcon name={channelIcon(channel)} size={30} /></div>
            <div className="cmv2-empty-title">Bienvenue dans {channel.name}</div>
            <div className="cmv2-empty-sub">{channel.description || 'Soyez le premier à publier ici.'}</div>
          </div>
        )}
        {feed.map((m, i) => {
          const isMine = m.sender === user?.id
          const isEditing = editing?.id === m.id
          const prevDay = i > 0 ? dayLabel(feed[i - 1].created_at) : null
          const thisDay = dayLabel(m.created_at)
          return (
            <React.Fragment key={m.id}>
              {thisDay !== prevDay && <div className="cmv2-day" role="separator">{thisDay}</div>}
              <article className="cmv2-card" aria-label={`Publication de ${m.sender_name}`}
                onMouseLeave={() => setPickerFor(p => p === m.id ? null : p)}>
                <header className="cmv2-card-head">
                  <span className="cmv2-card-ava" style={{ background: `hsl(${m.sender_hue},55%,50%)` }} aria-hidden="true">{m.sender_initials}</span>
                  <div className="cmv2-card-who">
                    <span className="cmv2-card-name">{m.sender_name}{isMine ? ' (vous)' : ''}</span>
                    <span className="cmv2-card-sub">{roleLabel(m.sender_role)} · <time title={new Date(m.created_at).toLocaleString('fr-FR')}>{timeAgo(m.created_at)}</time>{m.edited ? ' · modifié' : ''}</span>
                  </div>
                  {isMine && !isEditing && (
                    <span className="cmv2-card-own-actions">
                      <button onClick={() => setEditing({ id: m.id, content: m.content })} aria-label="Modifier" title="Modifier"><CIcon name="pencil" size={16} /></button>
                      <button onClick={() => onDelete(m.id)} aria-label="Supprimer" title="Supprimer"><CIcon name="trash" size={16} /></button>
                    </span>
                  )}
                </header>

                <ReplyQuote reply={m.reply_to} />

                {isEditing ? (
                  <div className="cmv2-edit">
                    <textarea autoFocus rows={3} value={editing.content}
                      onChange={e => setEditing(v => ({ ...v, content: e.target.value }))}
                      onKeyDown={async e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          if (await onEdit(m.id, editing.content)) setEditing(null)
                        }
                        if (e.key === 'Escape') setEditing(null)
                      }} />
                    <div className="cmv2-edit-actions">
                      <button className="cmv2-send" onClick={async () => { if (await onEdit(m.id, editing.content)) setEditing(null) }}>Enregistrer</button>
                      <button className="cmv2-cancel" onClick={() => setEditing(null)}>Annuler</button>
                    </div>
                  </div>
                ) : (
                  m.content && <div className="cmv2-card-content">{m.content}</div>
                )}

                <AttachmentList attachments={m.attachments} mediaUrl={mediaUrl} />
                <ReactionChips reactions={m.reactions} onToggle={(em) => onReact(m.id, em)} />

                <footer className="cmv2-card-foot">
                  <div style={{ position: 'relative' }}>
                    <button className="cmv2-foot-btn"
                      onClick={() => setPickerFor(p => p === m.id ? null : m.id)}
                      onContextMenu={(e) => { e.preventDefault(); setPickerFor(m.id) }}
                      aria-haspopup="menu" aria-expanded={pickerFor === m.id}
                      aria-label="Réagir">
                      <CIcon name="smile" size={17} /> Réagir
                    </button>
                    {pickerFor === m.id && (
                      <ReactionPicker
                        mine={m.reactions?.find(r => r.me)?.emoji}
                        onPick={(em) => { onReact(m.id, em); setPickerFor(null) }}
                        onClose={() => setPickerFor(null)} />
                    )}
                  </div>
                  <button className="cmv2-foot-btn" onClick={() => startReply(m)} aria-label={`Répondre à ${m.sender_name}`}><CIcon name="reply" size={17} /> Répondre</button>
                  <span className="cmv2-foot-time">{fmtTime(m.created_at)}</span>
                </footer>
              </article>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
