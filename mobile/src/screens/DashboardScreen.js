import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Animated, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API, ROLE_STATS, ROLE_NAV, ROLE_PAGES, RECENT_ACTIVITIES, COLORS, ROLE_LABELS, getInitials, hueFromName } from '../constants'

const MOBILE_SCREENS = ['dashboard', 'enfants', 'communication', 'parametres']

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_GAP = 12
const CARD_WIDTH = (SCREEN_WIDTH - 48 - CARD_GAP) / 2

export default function DashboardScreen({ user, role, onNavigate }) {
  const navItems = ROLE_NAV[role] || ROLE_NAV.director
  const page = (ROLE_PAGES[role] || ROLE_PAGES.director).dashboard

  const quickAccess = navItems.filter(n => n.key !== 'dashboard' && n.key !== 'parametres')

  const initials = getInitials(user?.first_name)
  const hue = hueFromName(user?.first_name)

  const safeRole = role || 'director'
  const displayRole = (ROLE_LABELS[safeRole] || safeRole).toUpperCase()

  const [isOpen, setIsOpen] = useState(false)
  const [liveKpis, setLiveKpis] = useState(null)
  const statCards = liveKpis || ROLE_STATS[role] || ROLE_STATS.director
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.5)).current

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token')
        if (!token) return
        const res = await fetch(`${API}/auth/stats/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.kpis) && data.kpis.length > 0) {
            setLiveKpis(data.kpis)
          }
        }
      } catch (_) {}
    }
    fetchStats()
  }, [])

  const toggleMenu = () => {
    const toValue = isOpen ? -SCREEN_WIDTH * 0.5 : 0
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start()
    setIsOpen(!isOpen)
  }

  return (
    <View style={styles.wrapper}>
      {/* Top Trigger Area - Hamburger */}
      <TouchableOpacity style={styles.topTrigger} onPress={toggleMenu} activeOpacity={0.7}>
        <View style={styles.topTriggerContent}>
          <View style={styles.hamburger}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </View>
          <View style={styles.topTriggerBadge}>
            <Text style={styles.topTriggerBadgeText}>{displayRole}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{page?.title || 'Tableau de bord'}</Text>
            <Text style={styles.subtitle}>{page?.subtitle}</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: `hsl(${hue},50%,35%)` }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          {statCards.map((card, i) => (
            <View key={i} style={[styles.statCard, { borderTopColor: card.color }]}>
              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
              <Text style={[styles.statSub, { color: card.color }]}>{card.sub}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.gridRow}>
          {quickAccess.slice(0, 4).map((item, i) => {
            const color = statCards[i]?.color || '#f59e0b'
            return (
              <TouchableOpacity key={item.key} style={[styles.gridCard, { borderTopColor: color }]} onPress={() => MOBILE_SCREENS.includes(item.key) ? onNavigate(item.key) : Alert.alert('Version Web', 'Cette fonctionnalité est disponible sur la version web du tableau de bord.')}>
                <Text style={styles.gridCardTitle}>{item.label.toUpperCase()}</Text>
                <Text style={styles.gridCardSub}>Accéder à {item.label.toLowerCase()}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <Text style={styles.sectionTitle}>Activités récentes</Text>
        <View style={styles.activityCard}>
          {RECENT_ACTIVITIES.map((act, i) => (
            <View key={i} style={[styles.activityItem, i > 0 && { borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: 12 }]}>
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{act.text}</Text>
                <Text style={styles.activityTime}>{act.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Slide-out Backdrop Overlay */}
      {isOpen && (
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={toggleMenu}
        >
          <View style={styles.backdrop} />
        </TouchableOpacity>
      )}

      {/* Left-Side Half-Screen sliding menu */}
      <Animated.View style={[styles.slidingMenu, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Menu Web</Text>
          <Text style={styles.menuRole}>{displayRole}</Text>
        </View>
        <ScrollView style={styles.menuItemsList}>
          {navItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.menuItem}
              onPress={() => {
                toggleMenu()
                onNavigate(item.key)
              }}
            >
              <Text style={styles.menuItemText}>{item.label}</Text>
              <Text style={styles.menuItemArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: COLORS.bg },
  topTrigger: {
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  topTriggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hamburger: {
    width: 24, height: 18, justifyContent: 'space-between', alignItems: 'flex-start',
  },
  hamburgerLine: {
    width: '100%', height: 2.5, backgroundColor: '#94a3b8', borderRadius: 2,
  },
  topTriggerBadge: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accent,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  topTriggerBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.accent,
  },
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 2 },
  subtitle: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, marginBottom: 24 },
  statCard: {
    width: CARD_WIDTH, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 14, borderTopWidth: 2, minHeight: 120, justifyContent: 'space-between',
  },
  statValue: { fontSize: 32, fontWeight: '900', color: COLORS.text, lineHeight: 36 },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: COLORS.text, marginTop: 8 },
  statSub: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, marginBottom: 24 },
  gridCard: {
    width: CARD_WIDTH, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 14, borderTopWidth: 2, minHeight: 90, justifyContent: 'center',
  },
  gridCardTitle: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  gridCardSub: { fontSize: 9, fontWeight: '700', color: COLORS.textBody, letterSpacing: 0.5 },

  activityCard: {
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16,
  },
  activityItem: { flexDirection: 'row', gap: 10 },
  activityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent, marginTop: 5 },
  activityContent: { flex: 1 },
  activityText: { fontSize: 12, color: '#cbd5e1', fontWeight: '600', lineHeight: 18 },
  activityTime: { fontSize: 10, color: '#475569', fontWeight: '500', marginTop: 2 },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 13, 26, 0.75)',
  },
  slidingMenu: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.5,
    backgroundColor: '#0f172a',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    zIndex: 100,
    paddingTop: 40,
  },
  menuHeader: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f8fafc',
  },
  menuRole: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
    marginTop: 4,
    letterSpacing: 1,
  },
  menuItemsList: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.02)',
  },
  menuItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  menuItemArrow: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
})
