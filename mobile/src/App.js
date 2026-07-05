import React, { useState, useEffect, useRef } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, StatusBar, Animated, Easing } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import LoginScreen from './screens/LoginScreen'
import DashboardScreen from './screens/DashboardScreen'
import ChildrenScreen from './screens/ChildrenScreen'
import CommunicationScreen from './screens/CommunicationScreen'
import SettingsScreen from './screens/SettingsScreen'
import { COLORS, API } from './constants'

const TABS = [
  { key: 'dashboard', label: 'Accueil', icon: '🏠' },
  { key: 'enfants', label: 'Enfants', icon: '👶' },
  { key: 'communication', label: 'Social', icon: '💬' },
  { key: 'parametres', label: 'Paramètres', icon: '⚙️' },
]

/* ─── Animated Splash Screen ─── */
function SplashScreen() {
  const pulseAnim = useRef(new Animated.Value(1)).current
  const progressAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const glowAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Fade in everything
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start()

    // Pulsing logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start()

    // Glow ring pulsing
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start()

    // Progress bar (fills over ~2s)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [])

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <View style={splashStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070d1a" />

      <Animated.View style={[splashStyles.content, { opacity: fadeAnim }]}>
        {/* Glow ring behind logo */}
        <Animated.View
          style={[
            splashStyles.glowRing,
            { opacity: glowAnim },
          ]}
        />

        {/* Pulsing logo */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Image
            source={require('../assets/logo.jpg')}
            style={splashStyles.logo}
          />
        </Animated.View>

        {/* App name */}
        <Text style={splashStyles.title}>Fédération des</Text>
        <Text style={splashStyles.titleAccent}>Orphelinats</Text>

        {/* Progress bar */}
        <View style={splashStyles.progressTrack}>
          <Animated.View
            style={[splashStyles.progressFill, { width: progressWidth }]}
          />
        </View>

        <Text style={splashStyles.statusText}>Initialisation en cours…</Text>

        {/* Version */}
        <Text style={splashStyles.version}>v2.4.1</Text>
      </Animated.View>
    </View>
  )
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070d1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    top: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    alignSelf: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  titleAccent: {
    fontSize: 26,
    color: '#f59e0b',
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 32,
  },
  progressTrack: {
    width: 200,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#f59e0b',
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 16,
    letterSpacing: 0.5,
  },
  version: {
    fontSize: 11,
    color: '#334155',
    marginTop: 40,
    letterSpacing: 1,
  },
})

/* ─── Main App ─── */
export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  )
}

function AppContent() {
  const [auth, setAuth] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    // Minimum splash duration so the user always sees it
    const minSplash = new Promise(resolve => setTimeout(resolve, 2400))
    try {
      const token = await AsyncStorage.getItem('access_token')
      if (token) {
        const res = await fetch(`${API}/auth/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const userProfile = await res.json()
          const role = (userProfile.role || '').toLowerCase()
          setAuth({ user: userProfile, role, access_token: token })
        } else {
          await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user', 'role', 'cdo_auth'])
        }
      }
    } catch (e) {
      console.error('Auth restore error:', e)
    }
    await minSplash
    setLoading(false)
  }

  const handleLogin = async (authData) => {
    setAuth(authData)
    try {
      await AsyncStorage.setItem('access_token', authData.access_token || '')
      await AsyncStorage.setItem('refresh_token', authData.refresh_token || '')
      await AsyncStorage.setItem('user', JSON.stringify(authData.user))
      await AsyncStorage.setItem('role', authData.role || '')
      await AsyncStorage.setItem('cdo_auth', JSON.stringify(authData))
    } catch (e) {
      console.error('Auth save error:', e)
    }
    setActiveTab('dashboard')
  }

  const handleLogout = async () => {
    setAuth(null)
    try {
      await AsyncStorage.multiRemove(['cdo_auth', 'access_token', 'refresh_token', 'user', 'role'])
    } catch (e) {
      console.error('Logout error:', e)
    }
  }

  const handleNavigate = (key) => {
    setActiveTab(key)
  }

  if (loading) {
    return <SplashScreen />
  }

  if (!auth) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <LoginScreen onLogin={handleLogin} />
      </SafeAreaView>
    )
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen user={auth.user} role={auth.role} onNavigate={handleNavigate} />
      case 'enfants':
        return <ChildrenScreen user={auth} />
      case 'communication':
        return <CommunicationScreen user={auth.user} />
      case 'parametres':
        return <SettingsScreen user={auth.user} role={auth.role} onLogout={handleLogout} />
      default:
        return <DashboardScreen user={auth.user} role={auth.role} onNavigate={handleNavigate} />
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.screenArea}>
        {renderScreen()}
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  loadingLogo: { width: 80, height: 80, borderRadius: 16, marginBottom: 16 },
  loadingText: { fontSize: 48, color: COLORS.accent, marginBottom: 12 },
  loadingLabel: { fontSize: 14, color: COLORS.textMuted },

  screenArea: { flex: 1 },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#0f172a',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
    paddingBottom: 4, paddingTop: 4,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 6, position: 'relative' },
  tabActive: {},
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  tabLabelActive: { color: COLORS.accent },
  tabIndicator: {
    position: 'absolute', top: 0, left: '25%', right: '25%', height: 2,
    backgroundColor: COLORS.accent, borderRadius: 1,
  },
})
