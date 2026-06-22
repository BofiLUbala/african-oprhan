import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fédération des Orphelinats</Text>
        <Text style={styles.subtitle}>Application Mobile</Text>
      </View>

      <View style={styles.main}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bienvenue sur mobile</Text>
          <Text style={styles.cardText}>
            Interface de gestion pour les administrateurs
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => setCount(c => c + 1)}>
            <Text style={styles.btnText}>Compteur : {count}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Built on Backend / Frontend / Desktop / Mobile — v2.4.1
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1121',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  btn: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  footer: {
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  footerText: {
    fontSize: 12,
    color: '#475569',
  },
})
