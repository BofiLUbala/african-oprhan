import React, { useState, useEffect } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import LoginScreen from './screens/LoginScreen'
import DashboardScreen from './screens/DashboardScreen'
import ChildrenScreen from './screens/ChildrenScreen'
import CommunicationScreen from './screens/CommunicationScreen'
import SettingsScreen from './screens/SettingsScreen'
import { COLORS } from './constants'

const TABS = [
  { key: 'dashboard', label: 'Accueil', icon: '🏠' },
  { key: 'enfants', label: 'Enfants', icon: '👶' },
  { key: 'communication', label: 'Social', icon: '💬' },
  { key: 'parametres', label: 'Paramètres', icon: '⚙️' },
]

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
    try {
      const stored = await AsyncStorage.getItem('cdo_auth')
      if (stored) {
        setAuth(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Auth restore error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (authData) => {
    setAuth(authData)
    try {
      if (authData.access_token) {
        await AsyncStorage.setItem('access_token', authData.access_token)
      }
      if (authData.refresh_token) {
        await AsyncStorage.setItem('refresh_token', authData.refresh_token)
      }
      await AsyncStorage.setItem('cdo_auth', JSON.stringify(authData))
    } catch (e) {
      console.error('Auth save error:', e)
    }
    setActiveTab('dashboard')
  }

  const handleLogout = async () => {
    setAuth(null)
    try {
      await AsyncStorage.multiRemove(['cdo_auth', 'access_token', 'refresh_token'])
    } catch (e) {
      console.error('Logout error:', e)
    }
  }

  const handleNavigate = (key) => {
    setActiveTab(key)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <Image source={require('../assets/logo.jpg')} style={styles.loadingLogo} />
        <Text style={styles.loadingLabel}>Chargement...</Text>
      </SafeAreaView>
    )
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
