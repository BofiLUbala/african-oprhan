import React from 'react'
import {
  ReactionPicker, ReactionChips, ReplyQuote, AttachmentList,
  PendingFiles, ReplyBanner, fmtTime, dayLabel,
} from './shared'
import CIcon from './icons'
import ComposerTools from './ComposerTools'

/**
 * Fil de conversation privée façon WhatsApp : bulles avec queue, groupage
 * par expéditeur, séparateurs de date, citation de réponse, accusés ✓/✓✓
 * (bleu = lu), réactions (survol / clic droit / appui long), pièces jointes,
 * chargement d'historique par le haut, glissement pour sélectionner + barre
 * d'actions contextuelle (répondre / réagir / copier / transférer / supprimer),
 * suppression pour moi et pour tout le monde.
 */
export default function ChatThread({
  conversation, other, messages, user,
  onSend, onReact, onLoadOlder, onDelete, onForward,
  mediaUrl, roleLabel, avatarUrl,
}) {
  const [input, setInput] = React.useState('')
  const [files, setFiles] = React.useState([])
  const [replyTo, setReplyTo] = React.useState(null)
  const [sending, setSending] = React.useState(false)
  const [pickerFor, setPickerFor] = React.useState(null)
  const [selected, setSelected] = React.useState(null)   // message sélectionné (barre d'action)
  const [swipeId, setSwipeId] = React.useState(null)     // bulle en cours de glissement
  const [swipeDx, setSwipeDx] = React.useState(0)
  const [deleteFor, setDeleteFor] = React.useState(null) // message ciblé par le dialogue de suppression
  const [loadingOlder, setLoadingOlder] = React.useState(false)
  const [noMore, setNoMore] = React.useState(false)
  const [hiddenIds, setHiddenIds] = React.useState(() => loadHidden(conversation?.id))
  const threadRef = React.useRef(null)
  const inputRef = React.useRef(null)
  const stickBottomRef = React.useRef(true)
  const longPressRef = React.useRef(null)
  const swipeStartRef = React.useRef(null)

  React.useEffect(() => {
    setInput(''); setFiles([]); setReplyTo(null); setPickerFor(null); setSelected(null); setNoMore(false)
    setHiddenIds(loadHidden(conversation?.id))
    stickBottomRef.current = true
  }, [conversation?.id])

  React.useEffect(() => {
    const el = threadRef.current
    if (el && stickBottomRef.current) el.scrollTop = el.scrollHeight
  }, [messages])

  const onScroll = async (e) => {
    const el = e.currentTarget
    stickBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (el.scrollTop < 40 && !loadingOlder && !noMore && messages.length >= 100) {
      setLoadingOlder(true)
      const prevHeight = el.scrollHeight
      const got = await onLoadOlder(messages[0]?.id)
      setLoadingOlder(false)
      if (!got) setNoMore(true)
      requestAnimationFrame(() => { el.scrollTop = el.scrollHeight - prevHeight })
    }
  }

  const addFiles = (picked) => setFiles(prev => [...prev, ...picked])

  const send = async () => {
    if (sending || (!input.trim() && files.length === 0)) return
    setSending(true)
    stickBottomRef.current = true
    const ok = await onSend({ content: input.trim(), files, replyTo: replyTo?.id || null })
    setSending(false)
    if (ok) { setInput(''); setFiles([]); setReplyTo(null); inputRef.current?.focus() }
  }

  const senderNameOf = (msg) => msg.sender?.full_name || `${msg.sender?.first_name || ''} ${msg.sender?.last_name || ''}`.trim() || 'Message'

  const startReply = (msg) => {
    setReplyTo({
      id: msg.id, sender_name: senderNameOf(msg), content: msg.content,
      kind: msg.attachments?.[0]?.kind || 'text',
      attachment_name: msg.attachments?.[0]?.name || '',
    })
    setSelected(null)
    inputRef.current?.focus()
  }

  const copyMsg = async (msg) => {
    try { await navigator.clipboard.writeText(msg.content || msg.attachments?.[0]?.name || '') } catch {}
    setSelected(null)
  }

  const hideForMe = (msg) => {
    const next = new Set(hiddenIds); next.add(msg.id)
    setHiddenIds(next); saveHidden(conversation?.id, next); setDeleteFor(null); setSelected(null)
  }
  const deleteForEveryone = async (msg) => {
    setDeleteFor(null); setSelected(null)
    await onDelete?.(msg.id)
  }

  // appui long (mobile) → sélection
  const touchStart = (id) => { longPressRef.current = setTimeout(() => setSelected(id), 450) }
  const clearLong = () => clearTimeout(longPressRef.current)

  // glissement horizontal → sélectionne (WhatsApp)
  const onPointerDown = (e, id) => { swipeStartRef.current = { x: e.clientX, id } }
  const onPointerMove = (e) => {
    if (!swipeStartRef.current) return
    const dx = e.clientX - swipeStartRef.current.x
    if (Math.abs(dx) > 6) { setSwipeId(swipeStartRef.current.id); setSwipeDx(Math.max(-80, Math.min(80, dx))) }
  }
  const onPointerUp = () => {
    if (swipeStartRef.current && Math.abs(swipeDx) > 48) setSelected(swipeStartRef.current.id)
    swipeStartRef.current = null; setSwipeId(null); setSwipeDx(0)
  }

  const otherName = other ? `${other.first_name || ''} ${other.last_name || ''}`.trim() || other.email : ''
  const visible = messages.filter(m => !hiddenIds.has(m.id))
  const selectedMsg = visible.find(m => m.id === selected)

  return (
    <div className="cmv2-chat">
      {/* ── En-tête / barre d'action contextuelle ── */}
      {selectedMsg ? (
        <header className="cmv2-chat-head cmv2-actionbar" role="toolbar" aria-label="Actions sur le message">
          <button className="cmv2-actionbar-btn" onClick={() => setSelected(null)} aria-label="Fermer la sélection"><CIcon name="x" size={19} /></button>
          <span className="cmv2-actionbar-count">1 sélectionné</span>
          <span style={{ flex: 1 }} />
          <button className="cmv2-actionbar-btn" onClick={() => startReply(selectedMsg)} aria-label="Répondre"><CIcon name="reply" size={19} /></button>
          <div style={{ position: 'relative' }}>
            <button className="cmv2-actionbar-btn" onClick={() => setPickerFor(p => p === selectedMsg.id ? null : selectedMsg.id)} aria-label="Réagir"><CIcon name="smile" size={19} /></button>
            {pickerFor === selectedMsg.id && (
              <ReactionPicker mine={selectedMsg.reactions?.find(r => r.me)?.emoji}
                onPick={(em) => { onReact(selectedMsg.id, em); setPickerFor(null); setSelected(null) }}
                onClose={() => setPickerFor(null)} />
            )}
          </div>
          <button className="cmv2-actionbar-btn" onClick={() => copyMsg(selectedMsg)} aria-label="Copier"><CIcon name="copy" size={19} /></button>
          <button className="cmv2-actionbar-btn" onClick={() => { onForward?.(selectedMsg); setSelected(null) }} aria-label="Transférer"><CIcon name="forward" size={19} /></button>
          <button className="cmv2-actionbar-btn danger" onClick={() => setDeleteFor(selectedMsg)} aria-label="Supprimer"><CIcon name="trash" size={19} /></button>
        </header>
      ) : (
        <header className="cmv2-chat-head">
          <img className="cmv2-ava" src={avatarUrl(other || {}, 42)} alt="" aria-hidden="true" />
          <div className="cmv2-chat-head-info">
            <span className="cmv2-chat-name">{otherName}</span>
            <span className="cmv2-chat-role">{roleLabel(other?.role)}</span>
          </div>
        </header>
      )}

      {/* ── Fil ── */}
      <div className="cmv2-thread" ref={threadRef} onScroll={onScroll}
        onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
        aria-label={`Conversation avec ${otherName}`}>
        {loadingOlder && <div className="cmv2-loading" role="status">Chargement de l'historique…</div>}
        {visible.length === 0 && <div className="cmv2-thread-empty">Aucun message. Dites bonjour 👋</div>}
        {visible.map((msg, i) => {
          const sid = msg.sender?.id ?? msg.sender
          const isMine = sid === user?.id
          const prev = visible[i - 1]
          const grouped = prev && (prev.sender?.id ?? prev.sender) === sid && dayLabel(prev.created_at) === dayLabel(msg.created_at)
          const prevDay = prev ? dayLabel(prev.created_at) : null
          const thisDay = dayLabel(msg.created_at)
          const hasReactions = msg.reactions && msg.reactions.length > 0
          const isSel = selected === msg.id
          const dx = swipeId === msg.id ? swipeDx : 0
          return (
            <React.Fragment key={msg.id || i}>
              {thisDay !== prevDay && <div className="cmv2-day" role="separator">{thisDay}</div>}
              <div className={`cmv2-brow${isMine ? ' me' : ''}${grouped ? ' grouped' : ''}${hasReactions ? ' has-reactions' : ''}${isSel ? ' selected' : ''}`}
                onMouseLeave={() => setPickerFor(p => p === msg.id ? null : p)}>
                <div className={`cmv2-bubble${isMine ? ' me' : ''}${grouped ? ' grouped' : ''}`}
                  style={dx ? { transform: `translateX(${dx}px)` } : undefined}
                  onContextMenu={(e) => { e.preventDefault(); setSelected(msg.id) }}
                  onPointerDown={(e) => onPointerDown(e, msg.id)}
                  onTouchStart={() => touchStart(msg.id)}
                  onTouchEnd={clearLong} onTouchMove={clearLong}>
                  <ReplyQuote reply={msg.reply_to} compact />
                  <AttachmentList attachments={msg.attachments} mediaUrl={mediaUrl} />
                  {msg.content && <span className="cmv2-bubble-text">{msg.content}</span>}
                  <span className="cmv2-bubble-meta">
                    <time title={new Date(msg.created_at).toLocaleString('fr-FR')}>{fmtTime(msg.created_at)}</time>
                    {isMine && (
                      <span className={`cmv2-tick${msg.is_read ? ' read' : ''}`}
                        title={msg.is_read ? `Lu${msg.read_at ? ' à ' + fmtTime(msg.read_at) : ''}` : 'Envoyé'}
                        aria-label={msg.is_read ? 'Lu' : 'Envoyé'}>
                        <CIcon name="check" size={13} style={{ marginRight: -8 }} /><CIcon name="check" size={13} />
                      </span>
                    )}
                  </span>
                  <span className={`cmv2-bubble-actions${isMine ? ' me' : ''}`}>
                    <button onClick={() => setSelected(msg.id)} aria-label="Réagir" title="Réagir"><CIcon name="smile" size={16} /></button>
                    <button onClick={() => startReply(msg)} aria-label="Répondre" title="Répondre"><CIcon name="reply" size={16} /></button>
                    <button onClick={() => setSelected(msg.id)} aria-label="Plus d'options" title="Plus"><CIcon name="more" size={16} /></button>
                  </span>
                </div>
                <div className={`cmv2-bubble-reactions${isMine ? ' me' : ''}`}>
                  <ReactionChips reactions={msg.reactions} onToggle={(em) => onReact(msg.id, em)} />
                </div>
              </div>
            </React.Fragment>
          )
        })}
      </div>

      {/* ── Composeur ── */}
      <div className="cmv2-chat-composer">
        <ReplyBanner replyTo={replyTo} onCancel={() => setReplyTo(null)} />
        <PendingFiles files={files} onRemove={(i) => setFiles(prev => prev.filter((_, j) => j !== i))} />
        <div className="cmv2-chat-composer-row">
          <ComposerTools onFiles={addFiles} />
          <input
            ref={inputRef}
            className="cmv2-chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Écrire un message…"
            aria-label="Écrire un message"
            autoFocus
          />
          <button className="cmv2-send round" onClick={send}
            disabled={sending || (!input.trim() && files.length === 0)}
            aria-label="Envoyer" title="Envoyer"><CIcon name="send" size={18} /></button>
        </div>
      </div>

      {/* ── Dialogue de suppression ── */}
      {deleteFor && (
        <div className="cmv2-sheet-backdrop" onClick={() => setDeleteFor(null)} role="dialog" aria-modal="true" aria-label="Supprimer le message">
          <div className="cmv2-confirm" onClick={e => e.stopPropagation()}>
            <h3 className="cmv2-confirm-title">Supprimer le message ?</h3>
            <div className="cmv2-confirm-actions">
              <button className="cmv2-confirm-btn" onClick={() => hideForMe(deleteFor)}>Supprimer pour moi</button>
              {(deleteFor.sender?.id ?? deleteFor.sender) === user?.id && (
                <button className="cmv2-confirm-btn danger" onClick={() => deleteForEveryone(deleteFor)}>Supprimer pour tout le monde</button>
              )}
              <button className="cmv2-confirm-btn ghost" onClick={() => setDeleteFor(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* « Supprimer pour moi » : masquage local persistant par conversation. */
function hiddenKey(convId) { return `cmv2_hidden_${convId}` }
function loadHidden(convId) {
  try { return new Set(JSON.parse(localStorage.getItem(hiddenKey(convId)) || '[]')) } catch { return new Set() }
}
function saveHidden(convId, set) {
  try { localStorage.setItem(hiddenKey(convId), JSON.stringify([...set])) } catch {}
}
