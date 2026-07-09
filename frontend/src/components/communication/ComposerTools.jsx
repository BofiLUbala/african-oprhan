import React from 'react'
import CIcon from './icons'

/**
 * Barre d'outils du composeur : pièce jointe (feuille Image/Fichier →
 * source image galerie/caméra avant/arrière), enregistrement vocal (durée,
 * pause/reprise/annuler/envoyer, aperçu) et enregistrement vidéo (choix
 * caméra avant/arrière, démarrer/pause/reprise/stop/aperçu/refaire/envoyer).
 *
 * Émet les fichiers prêts via onFiles(fileArray). Rétro-compatible : rien
 * n'est déclenché tant que l'utilisateur n'a pas choisi puis validé.
 */
export default function ComposerTools({ onFiles, disabled }) {
  const [sheet, setSheet] = React.useState(null) // 'attach' | 'image' | 'voice' | 'video'
  const galleryRef = React.useRef(null)
  const cameraFrontRef = React.useRef(null)
  const cameraRearRef = React.useRef(null)
  const fileRef = React.useRef(null)

  const emit = (fileList) => {
    const arr = Array.from(fileList || [])
    if (arr.length) onFiles(arr)
  }

  return (
    <>
      <button type="button" className="cmv2-tool round" disabled={disabled}
        onClick={() => setSheet('attach')} title="Joindre" aria-label="Joindre une pièce jointe">
        <CIcon name="paperclip" size={19} />
      </button>
      <button type="button" className="cmv2-tool round" disabled={disabled}
        onClick={() => setSheet('voice')} title="Note vocale" aria-label="Enregistrer une note vocale">
        <CIcon name="mic" size={19} />
      </button>
      <button type="button" className="cmv2-tool round" disabled={disabled}
        onClick={() => setSheet('video')} title="Vidéo" aria-label="Enregistrer une vidéo">
        <CIcon name="videocam" size={19} />
      </button>

      {/* entrées fichiers cachées — capture= déclenche la caméra sur mobile */}
      <input ref={galleryRef} type="file" accept="image/*" multiple hidden
        onChange={e => { emit(e.target.files); e.target.value = '' }} />
      <input ref={cameraFrontRef} type="file" accept="image/*" capture="user" hidden
        onChange={e => { emit(e.target.files); e.target.value = '' }} />
      <input ref={cameraRearRef} type="file" accept="image/*" capture="environment" hidden
        onChange={e => { emit(e.target.files); e.target.value = '' }} />
      <input ref={fileRef} type="file" multiple hidden
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt,.csv,application/*,text/*"
        onChange={e => { emit(e.target.files); e.target.value = '' }} />

      {/* Feuille : Image ou Fichier */}
      {sheet === 'attach' && (
        <BottomSheet title="Ajouter une pièce jointe" onClose={() => setSheet(null)}>
          <SheetOption icon="image" label="Image" hint="Photo ou capture"
            onClick={() => setSheet('image')} />
          <SheetOption icon="file" label="Fichier" hint="PDF, Word, Excel, ZIP…"
            onClick={() => { setSheet(null); fileRef.current?.click() }} />
        </BottomSheet>
      )}

      {/* Feuille : source de l'image */}
      {sheet === 'image' && (
        <BottomSheet title="Choisir une image" onClose={() => setSheet(null)} onBack={() => setSheet('attach')}>
          <SheetOption icon="image" label="Depuis la galerie" hint="Bibliothèque de l'appareil"
            onClick={() => { setSheet(null); galleryRef.current?.click() }} />
          <SheetOption icon="camera" label="Caméra avant" hint="Selfie"
            onClick={() => { setSheet(null); cameraFrontRef.current?.click() }} />
          <SheetOption icon="camera" label="Caméra arrière" hint="Appareil principal"
            onClick={() => { setSheet(null); cameraRearRef.current?.click() }} />
        </BottomSheet>
      )}

      {sheet === 'voice' && (
        <VoiceRecorder onClose={() => setSheet(null)} onSend={(f) => { onFiles([f]); setSheet(null) }} />
      )}

      {sheet === 'video' && (
        <VideoRecorder onClose={() => setSheet(null)} onSend={(f) => { onFiles([f]); setSheet(null) }} />
      )}
    </>
  )
}

/* ── Feuille inférieure générique ─────────────────────────────────── */
function BottomSheet({ title, children, onClose, onBack }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="cmv2-sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="cmv2-sheet" onClick={e => e.stopPropagation()}>
        <div className="cmv2-sheet-grip" />
        <div className="cmv2-sheet-head">
          {onBack && <button className="cmv2-sheet-back" onClick={onBack} aria-label="Retour"><CIcon name="reply" size={18} /></button>}
          <h3 className="cmv2-sheet-title">{title}</h3>
          <button className="cmv2-sheet-close" onClick={onClose} aria-label="Fermer"><CIcon name="x" size={18} /></button>
        </div>
        <div className="cmv2-sheet-body">{children}</div>
      </div>
    </div>
  )
}

function SheetOption({ icon, label, hint, onClick }) {
  return (
    <button className="cmv2-sheet-opt" onClick={onClick}>
      <span className="cmv2-sheet-opt-icon"><CIcon name={icon} size={22} /></span>
      <span className="cmv2-sheet-opt-body">
        <span className="cmv2-sheet-opt-label">{label}</span>
        {hint && <span className="cmv2-sheet-opt-hint">{hint}</span>}
      </span>
    </button>
  )
}

const fmtDur = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/* ── Enregistreur vocal ───────────────────────────────────────────── */
function VoiceRecorder({ onClose, onSend }) {
  const [state, setState] = React.useState('recording') // recording | paused | preview
  const [seconds, setSeconds] = React.useState(0)
  const [blobUrl, setBlobUrl] = React.useState(null)
  const recorderRef = React.useRef(null)
  const chunksRef = React.useRef([])
  const streamRef = React.useRef(null)
  const timerRef = React.useRef(null)
  const blobRef = React.useRef(null)

  const tick = (run) => {
    clearInterval(timerRef.current)
    if (run) timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }

  React.useEffect(() => {
    let cancelled = false
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
      streamRef.current = stream
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        blobRef.current = blob
        setBlobUrl(URL.createObjectURL(blob))
        setState('preview')
        tick(false)
      }
      rec.start(); recorderRef.current = rec; tick(true)
    }).catch(() => { onClose() })
    return () => {
      cancelled = true
      clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const pause = () => { recorderRef.current?.pause(); setState('paused'); tick(false) }
  const resume = () => { recorderRef.current?.resume(); setState('recording'); tick(true) }
  const stop = () => { recorderRef.current?.stop(); streamRef.current?.getTracks().forEach(t => t.stop()) }
  const cancel = () => { tick(false); recorderRef.current?.stop?.(); streamRef.current?.getTracks().forEach(t => t.stop()); onClose() }
  const send = () => {
    const f = new File([blobRef.current], `note-vocale-${Date.now()}.webm`, { type: 'audio/webm' })
    onSend(f)
  }

  return (
    <div className="cmv2-rec-overlay" role="dialog" aria-modal="true" aria-label="Enregistrement vocal">
      <div className="cmv2-rec-panel">
        <div className="cmv2-rec-head">
          <span className={`cmv2-rec-dot${state === 'recording' ? ' live' : ''}`} />
          <span className="cmv2-rec-status">
            {state === 'recording' ? 'Enregistrement…' : state === 'paused' ? 'En pause' : 'Aperçu'}
          </span>
          <span className="cmv2-rec-time">{fmtDur(seconds)}</span>
        </div>

        {state === 'preview' && blobUrl && (
          <audio src={blobUrl} controls className="cmv2-rec-audio" />
        )}

        <div className="cmv2-rec-actions">
          <button className="cmv2-rec-btn ghost" onClick={cancel} aria-label="Annuler"><CIcon name="trash" size={20} /></button>
          {state === 'recording' && <button className="cmv2-rec-btn" onClick={pause} aria-label="Pause"><CIcon name="pause" size={20} /></button>}
          {state === 'paused' && <button className="cmv2-rec-btn" onClick={resume} aria-label="Reprendre"><CIcon name="play" size={20} /></button>}
          {state !== 'preview' && <button className="cmv2-rec-btn stop" onClick={stop} aria-label="Terminer"><CIcon name="stop" size={20} /></button>}
          {state === 'preview' && <button className="cmv2-rec-btn send" onClick={send} aria-label="Envoyer"><CIcon name="send" size={20} /></button>}
        </div>
      </div>
    </div>
  )
}

/* ── Enregistreur vidéo ───────────────────────────────────────────── */
function VideoRecorder({ onClose, onSend }) {
  const [facing, setFacing] = React.useState(null) // null → choix ; 'user' | 'environment'
  const [state, setState] = React.useState('idle') // idle | recording | paused | preview
  const [seconds, setSeconds] = React.useState(0)
  const [blobUrl, setBlobUrl] = React.useState(null)
  const videoRef = React.useRef(null)
  const recorderRef = React.useRef(null)
  const chunksRef = React.useRef([])
  const streamRef = React.useRef(null)
  const timerRef = React.useRef(null)
  const blobRef = React.useRef(null)

  const tick = (run) => { clearInterval(timerRef.current); if (run) timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000) }
  const stopStream = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null }

  const openCamera = async (mode) => {
    setFacing(mode)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: true })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.muted = true; videoRef.current.play() }
    } catch { onClose() }
  }

  const start = () => {
    if (!streamRef.current) return
    const rec = new MediaRecorder(streamRef.current, { mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '' })
    chunksRef.current = []
    rec.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data) }
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      blobRef.current = blob
      setBlobUrl(URL.createObjectURL(blob))
      setState('preview'); tick(false)
      if (videoRef.current) videoRef.current.srcObject = null
      stopStream()
    }
    rec.start(); recorderRef.current = rec; setState('recording'); setSeconds(0); tick(true)
  }
  const pause = () => { recorderRef.current?.pause(); setState('paused'); tick(false) }
  const resume = () => { recorderRef.current?.resume(); setState('recording'); tick(true) }
  const stop = () => { recorderRef.current?.stop() }
  const retake = () => { setBlobUrl(null); setState('idle'); openCamera(facing) }
  const send = () => onSend(new File([blobRef.current], `video-${Date.now()}.webm`, { type: 'video/webm' }))
  const close = () => { tick(false); try { recorderRef.current?.stop() } catch {}; stopStream(); onClose() }

  React.useEffect(() => () => { clearInterval(timerRef.current); stopStream() }, [])

  return (
    <div className="cmv2-rec-overlay" role="dialog" aria-modal="true" aria-label="Enregistrement vidéo">
      <div className="cmv2-vid-panel">
        <div className="cmv2-vid-head">
          <h3 className="cmv2-sheet-title">Vidéo</h3>
          <button className="cmv2-sheet-close" onClick={close} aria-label="Fermer"><CIcon name="x" size={18} /></button>
        </div>

        {facing === null ? (
          <div className="cmv2-vid-choice">
            <button className="cmv2-vid-choice-btn" onClick={() => openCamera('user')}>
              <CIcon name="camera" size={28} /><span>Caméra avant</span>
            </button>
            <button className="cmv2-vid-choice-btn" onClick={() => openCamera('environment')}>
              <CIcon name="camera" size={28} /><span>Caméra arrière</span>
            </button>
          </div>
        ) : (
          <>
            <div className="cmv2-vid-stage">
              {state === 'preview' && blobUrl
                ? <video src={blobUrl} controls playsInline className="cmv2-vid-el" />
                : <video ref={videoRef} playsInline className="cmv2-vid-el" />}
              {(state === 'recording' || state === 'paused') && (
                <span className="cmv2-vid-timer"><span className={`cmv2-rec-dot${state === 'recording' ? ' live' : ''}`} /> {fmtDur(seconds)}</span>
              )}
            </div>
            <div className="cmv2-rec-actions">
              {state === 'idle' && <button className="cmv2-rec-btn stop" onClick={start} aria-label="Démarrer"><CIcon name="circle" size={22} /></button>}
              {state === 'recording' && <button className="cmv2-rec-btn" onClick={pause} aria-label="Pause"><CIcon name="pause" size={20} /></button>}
              {state === 'paused' && <button className="cmv2-rec-btn" onClick={resume} aria-label="Reprendre"><CIcon name="play" size={20} /></button>}
              {(state === 'recording' || state === 'paused') && <button className="cmv2-rec-btn stop" onClick={stop} aria-label="Arrêter"><CIcon name="stop" size={20} /></button>}
              {state === 'preview' && <button className="cmv2-rec-btn ghost" onClick={retake} aria-label="Refaire"><CIcon name="refresh" size={20} /></button>}
              {state === 'preview' && <button className="cmv2-rec-btn send" onClick={send} aria-label="Envoyer"><CIcon name="send" size={20} /></button>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
