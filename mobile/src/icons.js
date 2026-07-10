import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

const glyphMap = {
  dashboard: '\u2302',
  enfants: '\u263A',
  communication: '\u2709',
  parametres: '\u2699',
  profil: '\u2B24',
  famille: '\u263E',
  documents: '\u25A1',
  sante: '\u2665',
  scolarite: '\u270E',
  notifications: '\u2609',
  securite: '\u2691',
  messages: '\u2709',
  home: '\u2302',
  search: '\u260E',
  bell: '\u2609',
  settings: '\u2699',
  edit: '\u270E',
  delete: '\u2717',
  lock: '\u2691',
  email: '\u2709',
  chart: '\u25B3',
  users: '\u263C',
  activity: '\u25B4',
  pdf: '\u2756',
  csv: '\u25B7',
  excel: '\u25B9',
  html: '\u2637',
  sponsor: '\u2661',
  gift: '\u2611',
  money: '\u25D0',
  need: '\u2605',
}

export default function MobileIcon({ name, size = 22, color = '#94a3b8', style }) {
  return (
    <View style={[iconStyles.wrapper, { width: size + 4, height: size + 4 }, style]}>
      <Text style={{ fontSize: size, color, textAlign: 'center', lineHeight: size + 4 }}>
        {glyphMap[name] || '\u25CB'}
      </Text>
    </View>
  )
}

const iconStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
