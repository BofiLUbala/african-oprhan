import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native'
import { COLORS, ROLE_LABELS, getInitials, hueFromName } from '../constants'

const LANGS = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'ln', label: 'Lingala' },
  { code: 'kg', label: 'Kikongo' },
  { code: 'tl', label: 'Tshiluba' },
]

export default function SettingsScreen({ user, role, onLogout }) {
  const [theme, setTheme] = useState('dark')
  const [lang, setLang] = useState('fr')
  const [orpName, setOrpName] = useState('')
  const [bgTheme, setBgTheme] = useState('')

  const initials = getInitials(user?.first_name)
  const hue = hueFromName(user?.first_name)
  const roleLabel = ROLE_LABELS[role] || 'Utilisateur'

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: onLogout },
    ])
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Paramètres</Text>
      <Text style={styles.subtitle}>Configuration du compte</Text>

      <View style={styles.profileCard}>
        <View style={[styles.bigAvatar, { backgroundColor: `hsl(${hue},50%,35%)` }]}>
          <Text style={styles.bigAvatarText}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.first_name || ''} {user?.last_name || ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{roleLabel}</Text>
          </View>
          {user?.email ? <Text style={styles.profileEmail}>{user.email}</Text> : null}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Configuration</Text>
      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Nom de l'orphelinat</Text>
        <TextInput
          style={styles.input}
          value={orpName}
          onChangeText={setOrpName}
          placeholder="Entrez le nom"
          placeholderTextColor="#475569"
        />

        <Text style={styles.fieldLabel}>Langue</Text>
        <View style={styles.optionRow}>
          {LANGS.map(l => (
            <TouchableOpacity
              key={l.code}
              style={[styles.optionBtn, lang === l.code && styles.optionBtnActive]}
              onPress={() => setLang(l.code)}
            >
              <Text style={[styles.optionBtnText, lang === l.code && styles.optionBtnTextActive]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Fond d'écran</Text>
        <View style={styles.optionRow}>
          {[{ v: '', label: 'Par défaut' }, { v: '1', label: 'Usine' }, { v: '2', label: 'Chantier' }, { v: '3', label: 'Distribution' }].map(bg => (
            <TouchableOpacity
              key={bg.v}
              style={[styles.optionBtn, bgTheme === bg.v && styles.optionBtnActive]}
              onPress={() => setBgTheme(bg.v)}
            >
              <Text style={[styles.optionBtnText, bgTheme === bg.v && styles.optionBtnTextActive]}>
                {bg.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Sauvegarder</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Compte</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>🔔 Notifications</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>🔒 Sécurité</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>ℹ️ À propos</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Déconnexion</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Fédération des Orphelinats — v2.4.1</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 2 },
  subtitle: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500', marginBottom: 20 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, marginBottom: 24,
  },
  bigAvatar: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bigAvatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: COLORS.accentDim, borderRadius: 6, paddingVertical: 2, paddingHorizontal: 10 },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.accent, letterSpacing: 1 },
  profileEmail: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  card: {
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, marginBottom: 24,
  },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6, letterSpacing: 0.5, marginTop: 4 },
  input: {
    backgroundColor: 'rgba(15,23,42,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 10, color: COLORS.text, fontSize: 13, marginBottom: 16,
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  optionBtn: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: 'rgba(15,23,42,0.4)',
  },
  optionBtnActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentDim },
  optionBtnText: { fontSize: 12, color: COLORS.textMuted },
  optionBtnTextActive: { color: COLORS.accent },
  saveBtn: {
    backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 10, alignItems: 'center',
  },
  saveBtnText: { fontSize: 13, fontWeight: '800', color: '#0b1121' },

  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  menuItemText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  menuItemArrow: { fontSize: 18, color: COLORS.textMuted },
  menuDivider: { height: 1, backgroundColor: COLORS.borderLight },

  logoutBtn: {
    borderWidth: 1, borderColor: COLORS.red, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginBottom: 16,
  },
  logoutBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.red },
  footer: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center' },
})
