import React from 'react'
import {
  ReactionPicker, ReactionChips, ReplyQuote, AttachmentList,
  PendingFiles, ReplyBanner, fmtTime, dayLabel,
} from './shared'
import CIcon from './icons'
import ComposerTools from './ComposerTools'

/**
 * Fil de conversation privée façon WhatsApp.
 *
 * Interaction (identique à WhatsApp) :
 *  - un CLIC sur un message ne fait RIEN (pas de sélection, pas de carte) ;
 *  - GLISSER un message (souris ou doigt) vers la droite = RÉPONDRE (une flèche
 *    de réponse apparaît pendant le glissement, la bulle revient à sa place) ;
 *  - au SURVOL (desktop), une mini-barre flottante apparaît : réagir / répondre
 *    / plus (menu : copier, transférer, supprimer) ;
 *  - APPUI LONG (mobile) = ouvre le sélecteur de réaction.
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
  const [menuFor, setMenuFor] = React.useState(null)
  const [swipeId, setSwipeId] = React.useState(null)
  const [swipeDx, setSwipeDx] = React.useState(0)
  const [deleteFor, setDeleteFor] = React.useState(null)
  const [loadingOlder, setLoadingOlder] = React.useState(false)
  const [noMore, setNoMore] = React.useState(false)
  const [hiddenIds, setHiddenIds] = React.useState(() => loadHidden(conversation?.id))
  const threadRef = React.useRef(null)
  const inputRef = React.useRef(null)
  const stickBottomRef = React.useRef(true)
  const longPressRef = React.useRef(null)
  const swipeStartRef = React.useRef(null)
  const swipedRef = React.useRef(false)

  const SWIPE_TRIGGER = 52

  React.useEffect(() => {
    setInput(''); setFiles([]); setReplyTo(null); setPickerFor(null); setMenuFor(null); setNoMore(false)
    setHiddenIds(loadHidden(conversation?.id))
    stickBottomRef.current = true
  }, [conversation?.id])

  React.useEffect(() => {
    const el = threadRef.current
    if (el && stickBottomRef.current) el.scrollTop = el.scrollHeight
  }, [messages])

  React.useEffect(() => {
    if (menuFor == null) return
    const close = () => setMenuFor(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuFor])

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

  const senderNameOf = (msg) => {
    const sid = msg.sender?.id ?? msg.sender
    if (sid === user?.id) return 'Vous'
    return msg.sender?.full_name || `${msg.sender?.first_name || ''} ${msg.sender?.last_name || ''}`.trim() || 'Message'
  }

  const startReply = (msg) => {
    setReplyTo({
      id: msg.id, sender_name: senderNameOf(msg), content: msg.content,
      kind: msg.attachments?.[0]?.kind || 'text',
      attachment_name: msg.attachments?.[0]?.name || '',
    })
    setPickerFor(null); setMenuFor(null)
    inputRef.current?.focus()
  }

  const copyMsg = async (msg) => {
    try { await navigator.clipboard.writeText(msg.content || msg.attachments?.[0]?.name || '') } catch {}
    setMenuFor(null)
  }

  const hideForMe = (msg) => {
    const next = new Set(hiddenIds); next.add(msg.id)
    setHiddenIds(next); saveHidden(conversation?.id, next); setDeleteFor(null)
  }
  const deleteForEveryone = async (msg) => {
    setDeleteFor(null)
    await onDelete?.(msg.id)
  }

  const touchStart = (id) => { longPressRef.current = setTimeout(() => setPickerFor(id), 420) }
  const clearLong = () => clearTimeout(longPressRef.current)

  const dxRef = React.useRef(0)
  const onPointerDown = (e, id) => {
    if (e.button != null && e.button !== 0) return
    if (e.target.closest('button, a')) return
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
    swipeStartRef.current = { x: e.clientX, id }
    dxRef.current = 0
    swipedRef.current = false
  }
  const onPointerMove = (e) => {
    if (!swipeStartRef.current) return
    const dx = Math.max(0, Math.min(90, e.clientX - swipeStartRef.current.x))
    dxRef.current = dx
    if (dx > 3) { setSwipeId(swipeStartRef.current.id); setSwipeDx(dx) }
  }
  const endSwipe = () => {
    if (swipeStartRef.current && dxRef.current > SWIPE_TRIGGER) {
      const msg = messages.find(m => m.id === swipeStartRef.current.id)
      if (msg) { swipedRef.current = true; startReply(msg) }
    }
    swipeStartRef.current = null; dxRef.current = 0; setSwipeId(null); setSwipeDx(0)
  }

  const otherName = other ? `${other.first_name || ''} ${other.last_name || ''}`.trim() || other.email : ''
  const visible = messages.filter(m => !hiddenIds.has(m.id))

  return (
    <div className="cmv2-chat premium-chat-layout">
      {/* En-tête de conversation */}
      <header className="cmv2-chat-head">
        <img className="cmv2-ava" src={avatarUrl(other || {}, 42)} alt="" aria-hidden="true" />
        <div className="cmv2-chat-head-info">
          <span className="cmv2-chat-name">{otherName}</span>
          <span className="cmv2-chat-role">{roleLabel(other?.role)}</span>
        </div>
      </header>

      {/* Règle de Saisie inversée : Zone de saisie (la Box) tout en HAUT du panneau de discussion */}
      <div className="cmv2-chat-composer top-composer">
        <ReplyBanner replyTo={replyTo} onCancel={() => setReplyTo(null)} />
        <PendingFiles files={files} onRemove={(i) => setFiles(prev => prev.filter((_, j) => j !== i))} />
        <div className="cmv2-chat-composer-row">
          <input
            ref={inputRef}
            className="cmv2-chat-input full-width-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Écrire un message..."
            aria-label="Écrire un message"
            autoFocus
          />
          <button className="cmv2-send round premium-send-btn" onClick={send}
            disabled={sending || (!input.trim() && files.length === 0)}
            aria-label="Envoyer" title="Envoyer">
            <CIcon name="send" size={18} />
          </button>
        </div>
      </div>

      {/* Fil de discussion */}
      <div className="cmv2-thread" ref={threadRef} onScroll={onScroll}
        aria-label={`Conversation avec ${otherName}`}>
        {loadingOlder && <div className="cmv2-loading" role="status">Chargement de l'historique...</div>}
        {visible.length === 0 && <div className="cmv2-thread-empty">Aucun message. Commencez la discussion.</div>}
        {visible.map((msg, i) => {
          const sid = msg.sender?.id ?? msg.sender
          const isMine = sid === user?.id
          const prev = visible[i - 1]
          const grouped = prev && (prev.sender?.id ?? prev.sender) === sid && dayLabel(prev.created_at) === dayLabel(msg.created_at)
          const prevDay = prev ? dayLabel(prev.created_at) : null
          const thisDay = dayLabel(msg.created_at)
          const hasReactions = msg.reactions && msg.reactions.length > 0
          const dx = swipeId === msg.id ? swipeDx : 0
          const reached = dx > SWIPE_TRIGGER
          return (
            <React.Fragment key={msg.id || i}>
              {thisDay !== prevDay && <div className="cmv2-day" role="separator">{thisDay}</div>}
              <div className={`cmv2-brow${isMine ? ' me' : ''}${grouped ? ' grouped' : ''}${hasReactions ? ' has-reactions' : ''}`}
                onMouseLeave={() => { setPickerFor(p => p === msg.id ? null : p) }}>
                
                <span className={`cmv2-swipe-reply${reached ? ' reached' : ''}`}
                  style={{ opacity: Math.min(1, dx / SWIPE_TRIGGER) }} aria-hidden="true">
                  <CIcon name="reply" size={17} />
                </span>

                <div className={`cmv2-bubble${isMine ? ' me' : ''}${grouped ? ' grouped' : ''}`}
                  style={dx ? { transform: `translateX(${dx}px)` } : undefined}
                  onPointerDown={(e) => onPointerDown(e, msg.id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={endSwipe}
                  onPointerCancel={endSwipe}
                  onContextMenu={(e) => { e.preventDefault(); setPickerFor(msg.id) }}
                  onTouchStart={() => touchStart(msg.id)}
                  onTouchEnd={clearLong} onTouchMove={clearLong}>
                  
                  <span className="cmv2-bubble-sender-name" style={{ display: grouped ? 'none' : 'block', fontSize: '11px', fontWeight: 'bold', color: isMine ? '#8b5cf6' : '#64748b', marginBottom: '2px' }}>
                    {isMine ? 'Vous' : (msg.sender?.full_name || `${msg.sender?.first_name || ''} ${msg.sender?.last_name || ''}`.trim() || 'Agent')}
                  </span>

                  <ReplyQuote reply={msg.reply_to} compact currentUserId={user?.id} />
                  <AttachmentList attachments={msg.attachments} mediaUrl={mediaUrl} />
                  {msg.content && <span className="cmv2-bubble-text">{msg.content}</span>}
                  <span className="cmv2-bubble-meta">
                    <time title={new Date(msg.created_at).toLocaleString('fr-FR')}>{fmtTime(msg.created_at)}</time>
                    {isMine && (
                      <span className={`cmv2-tick${msg.is_read ? ' read' : ''}`}
                        title={msg.is_read ? `Lu à ${fmtTime(msg.read_at)}` : 'Envoyé'}
                        aria-label={msg.is_read ? 'Lu' : 'Envoyé'}>
                        <CIcon name="check" size={13} style={{ marginRight: -8 }} /><CIcon name="check" size={13} />
                      </span>
                    )}
                  </span>

                  {/* mini-barre au survol (desktop) */}
                  <span className={`cmv2-bubble-actions${isMine ? ' me' : ''}`}>
                    <button onClick={() => setPickerFor(p => p === msg.id ? null : msg.id)} aria-label="Réagir" title="Réagir"><CIcon name="smile" size={16} /></button>
                    <button onClick={() => startReply(msg)} aria-label="Répondre" title="Répondre"><CIcon name="reply" size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setMenuFor(m => m === msg.id ? null : msg.id) }} aria-label="Plus d'options" title="Plus"><CIcon name="more" size={16} /></button>
                  </span>

                  {/* sélecteur de réaction */}
                  {pickerFor === msg.id && (
                    <ReactionPicker mine={msg.reactions?.find(r => r.me)?.emoji}
                      onPick={(em) => { onReact(msg.id, em); setPickerFor(null) }}
                      onClose={() => setPickerFor(null)} />
                  )}

                  {/* menu « plus » */}
                  {menuFor === msg.id && (
                    <div className={`cmv2-msg-menu${isMine ? ' me' : ''}`} role="menu" onClick={e => e.stopPropagation()}>
                      <button role="menuitem" onClick={() => copyMsg(msg)}><CIcon name="copy" size={16} /> Copier</button>
                      <button role="menuitem" onClick={() => { onForward?.(msg); setMenuFor(null) }}><CIcon name="forward" size={16} /> Transférer</button>
                      <button role="menuitem" className="danger" onClick={() => { setDeleteFor(msg); setMenuFor(null) }}><CIcon name="trash" size={16} /> Supprimer</button>
                    </div>
                  )}
                </div>
                <div className={`cmv2-bubble-reactions${isMine ? ' me' : ''}`}>
                  <ReactionChips reactions={msg.reactions} onToggle={(em) => onReact(msg.id, em)} />
                </div>
              </div>
            </React.Fragment>
          )
        })}
      </div>

      {/* Barre d'outils et d'actions tout en BAS du panneau de discussion */}
      <div className="cmv2-chat-composer bottom-tools-toolbar">
        <div className="cmv2-chat-composer-row bottom-toolbar-row">
          <ComposerTools onFiles={addFiles} />
          <span className="toolbar-filler" style={{ flex: 1 }} />
        </div>
      </div>

      {/* Dialogue de suppression */}
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
