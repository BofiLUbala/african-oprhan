import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native'
import { ROLE_STATS, ROLE_NAV, ROLE_PAGES, RECENT_ACTIVITIES, COLORS, getInitials, hueFromName } from '../constants'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_GAP = 12
const CARD_WIDTH = (SCREEN_WIDTH - 48 - CARD_GAP) / 2

export default function DashboardScreen({ user, role, onNavigate }) {
  const statCards = ROLE_STATS[role] || ROLE_STATS.director
  const navItems = ROLE_NAV[role] || ROLE_NAV.director
  const page = (ROLE_PAGES[role] || ROLE_PAGES.director).dashboard

  const quickAccess = navItems.filter(n => n.key !== 'dashboard' && n.key !== 'parametres')

  const initials = getInitials(user?.first_name)
  const hue = hueFromName(user?.first_name)

  return (
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
            <TouchableOpacity key={item.key} style={[styles.gridCard, { borderTopColor: color }]} onPress={() => onNavigate(item.key)}>
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
  )
}

const styles = StyleSheet.create({
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
})
