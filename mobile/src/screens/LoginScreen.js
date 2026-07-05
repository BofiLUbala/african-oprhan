import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { API, ROLE_LABELS, COLORS } from '../constants'

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState('director')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Email ou mot de passe incorrect')
      }
      const data = await res.json()
      // Fetch real user profile
      let userProfile = null
      try {
        const meRes = await fetch(`${API}/auth/me/`, {
          headers: { Authorization: `Bearer ${data.access}` },
        })
        if (meRes.ok) userProfile = await meRes.json()
      } catch (_) {}
      const user = userProfile || { first_name: email.split('@')[0], last_name: '', email, role: selectedRole }
      const role = (userProfile?.role || selectedRole).toLowerCase()
      onLogin({ user, role, access_token: data.access, refresh_token: data.refresh })
    } catch (e) {
      setError(e.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image source={require('../../assets/logo.jpg')} style={styles.loginLogo} />
          <Text style={styles.logoText}>Fédération des Orphelinats</Text>
          <Text style={styles.subtitle}>Application Mobile v2.4.1</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="exemple@email.com"
            placeholderTextColor="#475569"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#475569"
            secureTextEntry
          />

          <Text style={styles.label}>Rôle</Text>
          <View style={styles.roleRow}>
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[styles.roleBtn, selectedRole === key && styles.roleBtnActive]}
                onPress={() => setSelectedRole(key)}
              >
                <Text style={[styles.roleBtnText, selectedRole === key && styles.roleBtnTextActive]}>
                  {label.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            <Text style={styles.loginBtnText}>{loading ? 'Connexion...' : 'SE CONNECTER'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Fédération des Orphelinats – Africa</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  loginLogo: { width: 60, height: 60, borderRadius: 12, marginBottom: 12 },
  logoIcon: { fontSize: 40, color: COLORS.accent, marginBottom: 8 },
  logoText: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textMuted },
  card: {
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 24, width: '100%',
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: COLORS.accent, marginBottom: 20, textAlign: 'center' },
  error: { color: COLORS.red, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(15,23,42,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20, padding: 12, color: COLORS.text, fontSize: 14, marginBottom: 16, fontFamily: undefined,
  },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  roleBtn: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: 'rgba(15,23,42,0.4)',
  },
  roleBtnActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentDim },
  roleBtnText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  roleBtnTextActive: { color: COLORS.accent },
  loginBtn: {
    backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 14, alignItems: 'center',
  },
  loginBtnText: { fontSize: 14, fontWeight: '800', color: '#0b1121', letterSpacing: 1 },
  footer: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 24 },
})
