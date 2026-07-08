import { useEffect, useSyncExternalStore } from 'react'

const API_URL = 'http://localhost:8000/api'
const POLL_MS = 20000

// ── Store singleton ─────────────────────────────────────────────────
// Une seule source de vérité pour les notifications, partagée entre le
// badge du Dashboard et celui du module Communication : quel que soit
// l'écran affiché, les deux compteurs restent identiques.
let state = { notifications: [], unreadCount: 0, loaded: false }
const listeners = new Set()
let pollTimer = null
let focusBound = false

function emit(next) {
  state = { ...state, ...next }
  listeners.forEach(fn => fn())
}

function authHeaders() {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchUnreadCount() {
  try {
    const res = await fetch(`${API_URL}/notifications/unread-count/`, { headers: authHeaders() })
    if (!res.ok) return
    const data = await res.json()
    if (typeof data.count === 'number' && data.count !== state.unreadCount) {
      emit({ unreadCount: data.count })
      // le compteur a bougé → rafraîchir la liste pour rester cohérent
      fetchList()
    }
  } catch { /* hors-ligne : on réessaiera au prochain tick */ }
}

async function fetchList() {
  try {
    const res = await fetch(`${API_URL}/notifications/`, { headers: authHeaders() })
    if (!res.ok) return
    const data = await res.json()
    const list = Array.isArray(data) ? data : (data.results || [])
    emit({
      notifications: list,
      unreadCount: list.filter(n => n && n.is_read === false).length,
      loaded: true,
    })
  } catch { /* ignore */ }
}

function startPolling() {
  if (pollTimer) return
  fetchList()
  pollTimer = setInterval(fetchUnreadCount, POLL_MS)
  if (!focusBound && typeof window !== 'undefined') {
    focusBound = true
    window.addEventListener('focus', fetchUnreadCount)
  }
}

function stopPollingIfUnused() {
  if (listeners.size === 0 && pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

export function refreshNotifications() {
  fetchList()
}

export async function markNotificationRead(id) {
  // optimiste : le badge décrémente immédiatement
  emit({
    notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })
  try {
    await fetch(`${API_URL}/notifications/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ id }),
    })
  } catch { fetchList() }
}

export async function markAllNotificationsRead() {
  emit({
    notifications: state.notifications.map(n => ({ ...n, is_read: true })),
    unreadCount: 0,
  })
  try {
    await fetch(`${API_URL}/notifications/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ mark_read: true }),
    })
  } catch { fetchList() }
}

function subscribe(fn) {
  listeners.add(fn)
  startPolling()
  return () => { listeners.delete(fn); stopPollingIfUnused() }
}

function getSnapshot() {
  return state
}

export default function useNotifications() {
  const snap = useSyncExternalStore(subscribe, getSnapshot)
  useEffect(() => { startPolling() }, [])
  return {
    notifications: snap.notifications,
    unreadCount: snap.unreadCount,
    loaded: snap.loaded,
    refresh: refreshNotifications,
    markRead: markNotificationRead,
    markAllRead: markAllNotificationsRead,
  }
}
