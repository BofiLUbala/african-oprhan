import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const WS_URL = 'http://localhost:8000'
const API_URL = 'http://localhost:8000/api'
const POLL_MS = 5000

function hasHttpPhoto(child) {
  const url = child.photo_url || child.photo || ''
  return typeof url === 'string' && url.startsWith('http')
}

// Single shared source of truth for every landing-page section that shows
// child cards: polls the public roster (system-wide, every chef d'orphelinat),
// listens for live socket updates when available, dedupes by id/uid, and
// excludes any photo URL that has failed to load. Consumers just get back
// a clean, always-real, always-current list of children with photos.
export default function useLiveChildren() {
  const [children, setChildren] = useState([])
  const [brokenUrls, setBrokenUrls] = useState(() => new Set())

  const reportBroken = (url) => {
    setBrokenUrls(prev => (prev.has(url) ? prev : new Set(prev).add(url)))
  }

  useEffect(() => {
    let socket = null
    try {
      socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      })

      socket.on('child_updated', (payload) => {
        if (!payload || (!payload.id && !payload.uid)) return
        setChildren(prev => {
          const idx = prev.findIndex(c =>
            (c.id != null && c.id === payload.id) ||
            (c.uid != null && c.uid === payload.uid)
          )
          if (idx >= 0) {
            const copy = [...prev]
            copy[idx] = { ...copy[idx], ...payload }
            return copy
          }
          return [payload, ...prev]
        })
      })

      socket.on('enfant_enregistre', (payload) => {
        if (!payload || (!payload.id && !payload.uid)) return
        setChildren(prev => {
          if (prev.some(c =>
            (c.id != null && c.id === payload.id) ||
            (c.uid != null && c.uid === payload.uid)
          )) return prev
          return [payload, ...prev]
        })
      })
    } catch (err) {
      console.warn('[useLiveChildren] WebSocket unavailable — offline mode', err)
    }

    return () => { if (socket) socket.disconnect() }
  }, [])

  // Fallback for real-time pickup across every chef d'orphelinat dashboard:
  // the backend doesn't run a socket.io server yet, so the events above never
  // actually fire. Poll the public endpoint (full roster, newest first) and
  // fully resync so new registrations, updates, and removals all reflect here.
  useEffect(() => {
    let cancelled = false
    const poll = () => {
      fetch(`${API_URL}/enfants/public/`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          if (cancelled || !Array.isArray(data)) return
          setChildren(data)
        })
        .catch(() => {})
    }
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  const seen = new Set()
  const pool = []
  for (const child of children) {
    const key = child.id ?? child.uid
    if (key != null) {
      if (seen.has(key)) continue
      seen.add(key)
    }
    const url = child.photo_url || child.photo || ''
    if (hasHttpPhoto(child) && !brokenUrls.has(url)) pool.push(child)
  }

  return { pool, reportBroken }
}
