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
 * Interaction (sélection au CLIC, comme demandé) :
 *  - CLIQUER sur un message le SÉLECTIONNE : la bulle est mise en évidence et
 *    une barre d'actions apparaît en haut (répondre / réagir / copier /
 *    transférer / supprimer) ;
 *  - re-cliquer sur le message (ou sur ✕) le désélectionne ;
 *  - « Répondre » ouvre le bandeau de citation au-dessus du composeur ;
 *  - « Réagir » ouvre le sélecteur d'émoji ; la réaction s'affiche sous la bulle.
 *  - Aucun glissement (swipe) n'est requis.
 */
export default function ChatThread({
  conversation, other, messages, user,
  onSend, onReact, onLoadOlder, onDelete, onEdit, onForward,
  mediaUrl, roleLabel, avatarUrl,
}) {
  const [input, setInput] = React.useState('')
  const [files, setFiles] = React.useState([])
  const [replyTo, setReplyTo] = React.useState(null)
  const [sending, setSending] = React.useState(false)
  const [selected, setSelected] = React.useState(null)   // message sélectionné au clic
  const [pickerFor, setPickerFor] = React.useState(null) // sélecteur d'émoji ouvert
  const [deleteFor, setDeleteFor] = React.useState(null)
  const [editingMsg, setEditingMsg] = React.useState(null) // { id, content }
  const [loadingOlder, setLoadingOlder] = React.useState(false)
  const [noMore, setNoMore] = React.useState(false)
  const [hiddenIds, setHiddenIds] = React.useState(() => loadHidden(conversation?.id))
  const threadRef = React.useRef(null)
  const inputRef = React.useRef(null)
  const stickBottomRef = React.useRef(true)

  React.useEffect(() => {
    setInput(''); setFiles([]); setReplyTo(null); setSelected(null); setPickerFor(null); setNoMore(false)
    setHiddenIds(loadHidden(conversation?.id))
    stickBottomRef.current = true
  }, [conversation?.id])

  React.useEffect(() => {
    const el = threadRef.current
    if (el && stickBottomRef.current) el.scrollTop = el.scrollHeight
  }, [messages])

  // Échap = désélectionner
  React.useEffect(() => {
    if (selected == null) return
    const onKey = (e) => { if (e.key === 'Escape') { setSelected(null); setPickerFor(null) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selected])

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

  const clearSelection = () => { setSelected(null); setPickerFor(null) }

  const startReply = (msg) => {
    setReplyTo({
      id: msg.id, sender_name: senderNameOf(msg), content: msg.content,
      kind: msg.attachments?.[0]?.kind || 'text',
      attachment_name: msg.attachments?.[0]?.name || '',
    })
    clearSelection()
    inputRef.current?.focus()
  }

  const copyMsg = async (msg) => {
    try { await navigator.clipboard.writeText(msg.content || msg.attachments?.[0]?.name || '') } catch {}
    clearSelection()
  }

  const hideForMe = (msg) => {
    const next = new Set(hiddenIds); next.add(msg.id)
    setHiddenIds(next); saveHidden(conversation?.id, next); setDeleteFor(null); clearSelection()
  }
  const deleteForEveryone = async (msg) => {
    setDeleteFor(null); clearSelection()
    await onDelete?.(msg.id)
  }
  const startEdit = (msg) => { setEditingMsg({ id: msg.id, content: msg.content || '' }); clearSelection() }
  const saveEdit = async () => {
    if (!editingMsg?.content.trim()) return
    if (await onEdit?.(editingMsg.id, editingMsg.content.trim())) setEditingMsg(null)
  }

  const otherName = other ? `${other.first_name || ''} ${other.last_name || ''}`.trim() || other.email : ''
  const visible = messages.filter(m => !hiddenIds.has(m.id))
  const selectedMsg = visible.find(m => m.id === selected)
  const isMineMsg = (m) => (m.sender?.id ?? m.sender) === user?.id

  return (
    <div className="cmv2-chat">
      {/* ── En-tête : contact, ou barre d'actions si un message est sélectionné ── */}
      {selectedMsg ? (
        <header className="cmv2-chat-head cmv2-actionbar" role="toolbar" aria-label="Actions sur le message sélectionné">
          <button className="cmv2-actionbar-btn" onClick={clearSelection} aria-label="Annuler la sélection"><CIcon name="x" size={19} /></button>
          <span className="cmv2-actionbar-count">1 sélectionné</span>
          <span style={{ flex: 1 }} />
          <button className="cmv2-actionbar-btn" onClick={() => startReply(selectedMsg)} aria-label="Répondre" title="Répondre"><CIcon name="reply" size={19} /></button>
          {isMineMsg(selectedMsg) && (
            <button className="cmv2-actionbar-btn" onClick={() => startEdit(selectedMsg)} aria-label="Modifier" title="Modifier"><CIcon name="pencil" size={19} /></button>
          )}
          <div style={{ position: 'relative' }}>
            <button className="cmv2-actionbar-btn" onClick={() => setPickerFor(p => p === selectedMsg.id ? null : selectedMsg.id)}
              aria-label="Réagir" title="Réagir" aria-haspopup="menu" aria-expanded={pickerFor === selectedMsg.id}><CIcon name="smile" size={19} /></button>
            {pickerFor === selectedMsg.id && (
              <ReactionPicker mine={selectedMsg.reactions?.find(r => r.me)?.emoji}
                onPick={(em) => { onReact(selectedMsg.id, em); clearSelection() }}
                onClose={() => setPickerFor(null)} />
            )}
          </div>
          <button className="cmv2-actionbar-btn" onClick={() => copyMsg(selectedMsg)} aria-label="Copier" title="Copier"><CIcon name="copy" size={19} /></button>
          <button className="cmv2-actionbar-btn" onClick={() => { onForward?.(selectedMsg); clearSelection() }} aria-label="Transférer" title="Transférer"><CIcon name="forward" size={19} /></button>
          <button className="cmv2-actionbar-btn danger" onClick={() => setDeleteFor(selectedMsg)} aria-label="Supprimer" title="Supprimer"><CIcon name="trash" size={19} /></button>
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
        aria-label={`Conversation avec ${otherName}`}>
        {loadingOlder && <div className="cmv2-loading" role="status">Chargement de l'historique…</div>}
        {visible.length === 0 && <div className="cmv2-thread-empty">Aucun message. Dites bonjour 👋</div>}
        {visible.map((msg, i) => {
          const isMine = isMineMsg(msg)
          const prev = visible[i - 1]
          const grouped = prev && (prev.sender?.id ?? prev.sender) === (msg.sender?.id ?? msg.sender) && dayLabel(prev.created_at) === dayLabel(msg.created_at)
          const prevDay = prev ? dayLabel(prev.created_at) : null
          const thisDay = dayLabel(msg.created_at)
          const hasReactions = msg.reactions && msg.reactions.length > 0
          const isSel = selected === msg.id
          return (
            <React.Fragment key={msg.id || i}>
              {thisDay !== prevDay && <div className="cmv2-day" role="separator">{thisDay}</div>}
              <div className={`cmv2-brow${isMine ? ' me' : ''}${grouped ? ' grouped' : ''}${hasReactions ? ' has-reactions' : ''}${isSel ? ' selected' : ''}`}>
                <div
                  className={`cmv2-bubble selectable${isMine ? ' me' : ''}${grouped ? ' grouped' : ''}`}
                  role="button" tabIndex={0}
                  aria-pressed={isSel}
                  aria-label={`Message de ${senderNameOf(msg)}. Cliquez pour sélectionner.`}
                  onClick={() => { setSelected(s => s === msg.id ? null : msg.id); setPickerFor(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(s => s === msg.id ? null : msg.id) } }}
                >
                  <ReplyQuote reply={msg.reply_to} compact currentUserId={user?.id} />
                  <AttachmentList attachments={msg.attachments} mediaUrl={mediaUrl} />
                  {editingMsg?.id === msg.id ? (
                    <div className="cmv2-edit" onClick={e => e.stopPropagation()}>
                      <textarea autoFocus rows={2} value={editingMsg.content}
                        onChange={e => setEditingMsg(v => ({ ...v, content: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() } if (e.key === 'Escape') setEditingMsg(null) }} />
                      <div className="cmv2-edit-actions">
                        <button className="cmv2-send" onClick={saveEdit}>Enregistrer</button>
                        <button className="cmv2-cancel" onClick={() => setEditingMsg(null)}>Annuler</button>
                      </div>
                    </div>
                  ) : (
                    msg.content && <span className="cmv2-bubble-text">{msg.content}{msg.edited ? <em className="cmv2-edited-tag"> (modifié)</em> : null}</span>
                  )}
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
              {isMineMsg(deleteFor) && (
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
