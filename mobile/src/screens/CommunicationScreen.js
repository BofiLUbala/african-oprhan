import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API, COLORS, getInitials, hueFromName } from '../constants'
import MobileIcon from '../icons'

function avatarColor(name) {
  const hue = hueFromName(name || '')
  return `hsl(${hue},50%,38%)`
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export default function CommunicationScreen({ user }) {
  const [view, setView] = useState('list') // 'list' | 'thread' | 'newconv'
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [chatUsers, setChatUsers] = useState([])
  const scrollRef = useRef(null)
  const pollRef = useRef(null)

  const getToken = useCallback(async () => {
    return AsyncStorage.getItem('access_token')
  }, [])

  const fetchConversations = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    try {
      const res = await fetch(`${API}/conversations/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setConversations(Array.isArray(data) ? data : [])
      }
    } catch (_) {}
    setLoading(false)
  }, [getToken])

  const fetchMessages = useCallback(async (convId) => {
    const token = await getToken()
    if (!token || !convId) return
    try {
      const res = await fetch(`${API}/conversations/${convId}/messages/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(Array.isArray(data) ? data : [])
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100)
        // mark read
        fetch(`${API}/conversations/${convId}/read/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {})
      }
    } catch (_) {}
  }, [getToken])

  // Poll conversations in list view
  useEffect(() => {
    if (view === 'list') {
      fetchConversations()
      pollRef.current = setInterval(fetchConversations, 5000)
    }
    return () => clearInterval(pollRef.current)
  }, [view, fetchConversations])

  // Poll messages in thread view
  useEffect(() => {
    if (view === 'thread' && activeConv) {
      fetchMessages(activeConv.id)
      pollRef.current = setInterval(() => fetchMessages(activeConv.id), 5000)
    }
    return () => clearInterval(pollRef.current)
  }, [view, activeConv, fetchMessages])

  // Load chat users when entering newconv view
  useEffect(() => {
    if (view === 'newconv') loadChatUsers()
  }, [view])

  const openThread = (conv) => {
    setActiveConv(conv)
    setMessages([])
    setInput('')
    setView('thread')
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeConv || sending) return
    const token = await getToken()
    if (!token) return
    setSending(true)
    try {
      const res = await fetch(`${API}/conversations/${activeConv.id}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: input.trim() }),
      })
      if (res.ok) {
        setInput('')
        fetchMessages(activeConv.id)
      }
    } catch (_) {}
    setSending(false)
  }

  const loadChatUsers = async () => {
    const token = await getToken()
    if (!token) return
    try {
      const res = await fetch(`${API}/users/chat-list/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setChatUsers(Array.isArray(data) ? data : [])
      }
    } catch (_) {}
  }

  const startConversation = async (userId) => {
    const token = await getToken()
    if (!token) return
    try {
      const res = await fetch(`${API}/conversations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ participant_id: userId }),
      })
      if (res.ok) {
        const conv = await res.json()
        setView('list')
        setTimeout(() => openThread(conv), 50)
      }
    } catch (_) {}
  }

  // helper: get partner info from conversation (the other participant)
  const getPartner = (conv) => {
    const others = (conv.participants || []).filter(p => p.id !== user?.id)
    return others[0] || conv.participants?.[0] || { full_name: 'Inconnu', initials: '?' }
  }

  // ── NEW CONV VIEW ──────────────────────────────────────────────
  if (view === 'newconv') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('list')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle conversation</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {chatUsers.length === 0 && (
            <Text style={styles.emptyText}>Chargement des utilisateurs...</Text>
          )}
          {chatUsers.map(u => (
            <TouchableOpacity key={u.id} style={styles.userItem} onPress={() => startConversation(u.id)}>
              <View style={[styles.avatar, { backgroundColor: avatarColor(u.full_name) }]}>
                <Text style={styles.avatarText}>{u.initials}</Text>
              </View>
              <Text style={styles.userName}>{u.full_name}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )
  }

  // ── THREAD VIEW ────────────────────────────────────────────────
  if (view === 'thread' && activeConv) {
    const partner = getPartner(activeConv)
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setView('list'); setActiveConv(null) }} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Retour</Text>
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: avatarColor(partner.full_name) }]}>
            <Text style={styles.avatarText}>{partner.initials}</Text>
          </View>
          <Text style={styles.headerTitle}>{partner.full_name}</Text>
        </View>
        <ScrollView
          ref={scrollRef}
          style={styles.messagesArea}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 && (
            <Text style={styles.emptyText}>Aucun message. Envoyez le premier !</Text>
          )}
          {messages.map(msg => {
            const isMine = msg.sender?.id === user?.id
            return (
              <View key={msg.id} style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                {!isMine && (
                  <View style={[styles.bubbleAvatar, { backgroundColor: avatarColor(msg.sender?.full_name) }]}>
                    <Text style={styles.bubbleAvatarText}>{msg.sender?.initials || '?'}</Text>
                  </View>
                )}
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
                    {msg.content}
                  </Text>
                  <Text style={styles.bubbleTime}>{formatTime(msg.created_at)}</Text>
                </View>
              </View>
            )
          })}
        </ScrollView>
        <View style={styles.compose}>
          <TextInput
            style={styles.composeInput}
            value={input}
            onChangeText={setInput}
            placeholder="Message..."
            placeholderTextColor="#475569"
            multiline
          />
          <TouchableOpacity style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]} onPress={sendMessage} disabled={!input.trim() || sending}>
            {sending ? <ActivityIndicator size="small" color="#0b1121" /> : <Text style={styles.sendBtnText}>{'\u27A4'}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )
  }

  // ── LIST VIEW ──────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => { setView('newconv'); loadChatUsers() }}>
          <Text style={styles.newBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MobileIcon name="communication" size={48} color="#475569" />
          <Text style={styles.emptyTitle}>Aucune conversation</Text>
          <Text style={styles.emptyText}>Appuyez sur + pour commencer.</Text>
        </View>
      ) : (
        <ScrollView>
          {conversations.map(conv => {
            const partner = getPartner(conv)
            const preview = conv.last_message?.content || ''
            const time = formatTime(conv.last_message?.created_at || conv.updated_at)
            const unread = conv.unread_count || 0
            return (
              <TouchableOpacity key={conv.id} style={styles.convItem} onPress={() => openThread(conv)}>
                <View style={[styles.avatar, { backgroundColor: avatarColor(partner.full_name) }]}>
                  <Text style={styles.avatarText}>{partner.initials}</Text>
                </View>
                <View style={styles.convInfo}>
                  <View style={styles.convTopRow}>
                    <Text style={[styles.convName, unread > 0 && styles.convNameUnread]} numberOfLines={1}>{partner.full_name}</Text>
                    <Text style={styles.convTime}>{time}</Text>
                  </View>
                  <View style={styles.convBottomRow}>
                    <Text style={styles.convPreview} numberOfLines={1}>{preview || 'Pas de message'}</Text>
                    {unread > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unread}</Text></View>}
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: COLORS.text },
  backBtn: { paddingRight: 4 },
  backBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  newBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  newBtnText: { fontSize: 22, color: '#0b1121', lineHeight: 26, fontWeight: '700' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },

  convItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  convInfo: { flex: 1, minWidth: 0 },
  convTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  convName: { fontSize: 14, fontWeight: '600', color: COLORS.text, flex: 1, marginRight: 8 },
  convNameUnread: { fontWeight: '800', color: COLORS.accent },
  convTime: { fontSize: 11, color: COLORS.textMuted, flexShrink: 0 },
  convBottomRow: { flexDirection: 'row', alignItems: 'center' },
  convPreview: { fontSize: 12, color: COLORS.textMuted, flex: 1 },
  badge: { backgroundColor: COLORS.accent, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#0b1121' },

  messagesArea: { flex: 1 },
  messagesContent: { padding: 12, paddingBottom: 8 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8, gap: 6 },
  bubbleRowMine: { flexDirection: 'row-reverse' },
  bubbleRowTheirs: {},
  bubbleAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubbleAvatarText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  bubble: { maxWidth: '72%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: COLORS.accent, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#1e293b', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: '#0b1121', fontWeight: '600' },
  bubbleTextTheirs: { color: COLORS.text },
  bubbleTime: { fontSize: 9, color: '#64748b', marginTop: 3, textAlign: 'right' },

  compose: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: '#0f172a',
  },
  composeInput: {
    flex: 1, backgroundColor: '#1e293b', borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    color: COLORS.text, fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontSize: 16, color: '#0b1121', fontWeight: '700' },

  userItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  userName: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  chevron: { fontSize: 20, color: COLORS.textMuted },
})
