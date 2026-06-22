import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { API, CHILD_FORMS, AFRICAN_COUNTRIES, COLORS, genChildUid, getInitials, hueFromName } from '../constants'

export default function ChildrenScreen({ user }) {
  const [view, setView] = useState('list')
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [editingChild, setEditingChild] = useState(null)
  const [formData, setFormData] = useState({})
  const uidRef = useRef(genChildUid())
  const [categoryKey, setCategoryKey] = useState(null)

  useEffect(() => {
    fetchChildren()
  }, [])

  const fetchChildren = async () => {
    try {
      const token = user?.access_token
      if (!token) return
      const res = await fetch(`${API}/enfants/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setChildren(data)
      }
    } catch (e) {
      console.error('Failed to fetch children:', e)
    }
  }

  const openForm = (child = null) => {
    if (child) {
      setEditingChild(child)
      setFormData({
        Nom: child.nom || '',
        Prénom: child.prenom || '',
        Sexe: child.sexe === 'M' ? 'Masculin' : child.sexe === 'F' ? 'Féminin' : '',
        'Date de naissance': child.date_naissance || '',
        Nationalité: child.nationalite || '',
        "Adresse d'origine": child.adresse || '',
      })
      uidRef.current = child.uid
    } else {
      setEditingChild(null)
      setFormData({})
      uidRef.current = genChildUid(new Set(children.map(c => c.uid)))
    }
    setCategoryKey('Profil & identité')
    setView('form')
  }

  const saveChild = async () => {
    const body = {
      uid: editingChild ? editingChild.uid : uidRef.current,
      nom: formData['Nom'] || '',
      prenom: formData['Prénom'] || '',
      sexe: formData['Sexe'] === 'Masculin' ? 'M' : formData['Sexe'] === 'Féminin' ? 'F' : '',
      date_naissance: formData['Date de naissance'] || null,
      nationalite: formData['Nationalité'] || '',
      adresse: formData["Adresse d'origine"] || '',
    }

    try {
      const token = user?.access_token
      if (!token) { Alert.alert('Erreur', 'Session expirée'); return }

      const url = editingChild ? `${API}/enfants/${editingChild.id}/` : `${API}/enfants/`
      const method = editingChild ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || Object.values(errData).flat().join(' ') || 'Erreur sauvegarde')
      }

      const saved = await res.json()
      setChildren(prev => {
        if (prev.some(c => c.id === saved.id)) {
          return prev.map(c => c.id === saved.id ? saved : c)
        }
        return [...prev, saved]
      })
      setView('list')
    } catch (e) {
      Alert.alert('Erreur', e.message)
    }
  }

  const categoryCards = [
    { key: 'Profil & identité', icon: '📋', subtitle: 'État civil, photo' },
    { key: 'Situation familiale', icon: '👨‍👩‍👧‍👦', subtitle: 'Parents, fratrie' },
    { key: 'Documents administratifs', icon: '📄', subtitle: 'Actes, décisions' },
    { key: 'Santé & médical', icon: '🏥', subtitle: 'Vaccins, allergies' },
    { key: 'Scolarité', icon: '📚', subtitle: 'École, résultats' },
  ]

  const currentForm = CHILD_FORMS[categoryKey]

  if (view === 'form') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => setView('list')}>
            <Text style={styles.backBtn}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.formTitle}>{editingChild ? 'Modifier' : 'Nouvel'} enfant</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
          {categoryCards.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryTab, categoryKey === cat.key && styles.categoryTabActive]}
              onPress={() => { setCategoryKey(cat.key); setFormData(formData) }}
            >
              <Text style={[styles.categoryTabText, categoryKey === cat.key && styles.categoryTabTextActive]}>
                {cat.icon} {cat.key}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.formCard}>
          {currentForm?.fields.map((field, i) => (
            <View key={i} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              {field.type === 'uid' ? (
                <View style={styles.uidBox}>
                  <Text style={styles.uidText}>{editingChild ? editingChild.uid : uidRef.current}</Text>
                </View>
              ) : field.type === 'select' ? (
                <View style={styles.selectRow}>
                  {field.options.slice(0, 4).map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.selectOpt, formData[field.label] === opt && styles.selectOptActive]}
                      onPress={() => setFormData({ ...formData, [field.label]: opt })}
                    >
                      <Text style={[styles.selectOptText, formData[field.label] === opt && styles.selectOptTextActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : field.type === 'textarea' ? (
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={formData[field.label] || ''}
                  onChangeText={v => setFormData({ ...formData, [field.label]: v })}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#475569"
                />
              ) : (
                <TextInput
                  style={styles.input}
                  value={formData[field.label] || ''}
                  onChangeText={v => setFormData({ ...formData, [field.label]: v })}
                  placeholderTextColor="#475569"
                />
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.saveBtn} onPress={saveChild}>
            <Text style={styles.saveBtnText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Enfants</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openForm(null)}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>{children.length} enfant(s) enregistré(s)</Text>

      <View style={styles.catGrid}>
        {categoryCards.map((cat, i) => (
          <TouchableOpacity key={cat.key} style={styles.catCard} onPress={() => {
            setCategoryKey(cat.key)
            setEditingChild(null)
            setFormData({})
            setView('form')
          }}>
            <View style={styles.catIconWrap}>
              <Text style={styles.catIcon}>{cat.icon}</Text>
            </View>
            <Text style={styles.catTitle}>{cat.key}</Text>
            <Text style={styles.catSub}>{cat.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {children.length > 0 && (
        <>
          {children.map(child => {
            const initials = getInitials(`${child.prenom || ''} ${child.nom || ''}`.trim())
            const hue = hueFromName(child.prenom)
            return (
              <TouchableOpacity key={child.id} style={styles.childItem} onPress={() => openForm(child)}>
                <View style={[styles.childAvatar, { backgroundColor: `hsl(${hue},50%,35%)` }]}>
                  <Text style={styles.childAvatarText}>{initials}</Text>
                </View>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.prenom || ''} {child.nom || ''}</Text>
                  <Text style={styles.childId}>{child.uid}</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  addBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#0b1121' },
  subtitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 8 },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  catCard: {
    width: '47%', backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 16, alignItems: 'center', minHeight: 110, justifyContent: 'center',
  },
  catIconWrap: { width: 44, height: 44, borderRadius: 8, backgroundColor: COLORS.accentDim, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  catIcon: { fontSize: 22 },
  catTitle: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 2, textAlign: 'center' },
  catSub: { fontSize: 9, color: COLORS.textMuted, fontWeight: '500', textAlign: 'center' },

  childItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(15,23,42,0.3)', borderWidth: 1, borderColor: COLORS.borderLight,
    borderRadius: 8, padding: 12, marginBottom: 6,
  },
  childAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  childAvatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  childInfo: { flex: 1 },
  childName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  childId: { fontSize: 11, color: COLORS.textMuted },

  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  formTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  categoryTabs: { marginBottom: 16, flexGrow: 0 },
  categoryTab: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, marginRight: 8, backgroundColor: COLORS.bgCardAlt,
  },
  categoryTabActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentDim },
  categoryTabText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  categoryTabTextActive: { color: COLORS.accent },

  formCard: {
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16,
  },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginBottom: 4, letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(15,23,42,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 10, color: COLORS.text, fontSize: 13,
  },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
  uidBox: {
    backgroundColor: 'rgba(15,23,42,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 10,
  },
  uidText: { fontSize: 13, color: COLORS.accent, fontWeight: '600', fontFamily: 'monospace' },
  selectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectOpt: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: 'rgba(15,23,42,0.4)',
  },
  selectOptActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentDim },
  selectOptText: { fontSize: 12, color: COLORS.textMuted },
  selectOptTextActive: { color: COLORS.accent },

  saveBtn: {
    backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#0b1121' },
})
