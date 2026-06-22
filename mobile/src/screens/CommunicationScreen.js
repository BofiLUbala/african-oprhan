import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { COLORS, getInitials, hueFromName } from '../constants'

const STORIES = [
  { name: 'Vous', initials: 'V', color: '#f59e0b', isYou: true, active: false },
  { name: 'Sarah', initials: 'SM', color: '#F472B6', active: true },
  { name: 'Johnson', initials: 'JN', color: '#60A5FA', active: true },
  { name: 'Mike', initials: 'MT', color: '#34D399', active: false },
  { name: 'Emma', initials: 'EW', color: '#A78BFA', active: true },
  { name: 'David', initials: 'DK', color: '#FBBF24', active: false },
]

const POSTS = [
  {
    id: 1, author: 'Johnson', initials: 'JN', color: '#60A5FA',
    time: 'Il y a 2 heures',
    text: 'Nouvelle interface de monitoring en cours de développement. 🚀',
    likes: 124, comments: 12,
  },
  {
    id: 2, author: 'Sarah M.', initials: 'SM', color: '#F472B6',
    time: 'Il y a 5 heures',
    text: 'Setup de la journée 💻',
    likes: 342, comments: 45,
  },
  {
    id: 3, author: 'Emma W.', initials: 'EW', color: '#A78BFA',
    time: 'Il y a 1 jour',
    text: 'Le pipeline CI/CD est prêt pour ça 💪',
    likes: 89, comments: 23,
  },
]

export default function CommunicationScreen({ user }) {
  const [postText, setPostText] = useState('')
  const [posts, setPosts] = useState(POSTS)
  const [showComments, setShowComments] = useState(null)

  const initials = getInitials(user?.first_name)
  const hue = hueFromName(user?.first_name)

  const handlePublish = () => {
    if (!postText.trim()) return
    const newPost = {
      id: Date.now(),
      author: user?.first_name || 'Vous',
      initials,
      color: `hsl(${hue},50%,45%)`,
      time: 'À l\'instant',
      text: postText.trim(),
      likes: 0,
      comments: 0,
    }
    setPosts([newPost, ...posts])
    setPostText('')
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>L'Éclat Social</Text>
        <Text style={styles.subtitle}>Communication & partage</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesRow}>
        {STORIES.map((s, i) => (
          <View key={i} style={styles.story}>
            <View style={[styles.storyAvatar, s.active && styles.storyAvatarActive, { backgroundColor: s.color }]}>
              <Text style={styles.storyAvatarText}>{s.initials}</Text>
              {s.isYou && <View style={styles.storyAddIcon}><Text style={styles.storyAddText}>+</Text></View>}
            </View>
            <Text style={styles.storyName}>{s.name}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.createCard}>
        <View style={[styles.miniAvatar, { backgroundColor: `hsl(${hue},50%,45%)` }]}>
          <Text style={styles.miniAvatarText}>{initials}</Text>
        </View>
        <TextInput
          style={styles.createInput}
          value={postText}
          onChangeText={setPostText}
          placeholder="Quoi de neuf ?"
          placeholderTextColor="#475569"
          multiline
        />
        <TouchableOpacity style={styles.publishBtn} onPress={handlePublish}>
          <Text style={styles.publishBtnText}>Publier</Text>
        </TouchableOpacity>
      </View>

      {posts.map(post => (
        <View key={post.id} style={styles.post}>
          <View style={styles.postHeader}>
            <View style={[styles.postAvatar, { backgroundColor: post.color }]}>
              <Text style={styles.postAvatarText}>{post.initials}</Text>
            </View>
            <View style={styles.postMeta}>
              <Text style={styles.postAuthor}>{post.author}</Text>
              <Text style={styles.postTime}>{post.time}</Text>
            </View>
          </View>
          <Text style={styles.postText}>{post.text}</Text>
          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionText}>❤️ {post.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(showComments === post.id ? null : post.id)}>
              <Text style={styles.actionText}>💬 {post.comments}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionText}>➦ Partager</Text>
            </TouchableOpacity>
          </View>
          {showComments === post.id && (
            <View style={styles.commentsSection}>
              <Text style={styles.noComments}>Connectez-vous pour voir les commentaires</Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 2 },
  subtitle: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },

  storiesRow: { marginBottom: 16, flexGrow: 0 },
  story: { alignItems: 'center', marginRight: 14, width: 64 },
  storyAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  storyAvatarActive: { borderWidth: 3, borderColor: COLORS.accent },
  storyAvatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  storyAddIcon: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  storyAddText: { fontSize: 14, fontWeight: '700', color: '#0b1121', lineHeight: 16 },
  storyName: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },

  createCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, marginBottom: 16,
  },
  miniAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  miniAvatarText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  createInput: { flex: 1, fontSize: 13, color: COLORS.text, padding: 0 },
  publishBtn: { backgroundColor: COLORS.accent, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
  publishBtnText: { fontSize: 11, fontWeight: '700', color: '#0b1121' },

  post: {
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, marginBottom: 12,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  postAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  postAvatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  postMeta: { flex: 1 },
  postAuthor: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  postTime: { fontSize: 10, color: COLORS.textMuted },
  postText: { fontSize: 13, color: '#cbd5e1', lineHeight: 20, marginBottom: 12 },

  postActions: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 12, color: COLORS.textBody, fontWeight: '600' },

  commentsSection: { borderTopWidth: 1, borderTopColor: COLORS.borderLight, marginTop: 10, paddingTop: 10 },
  noComments: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
})
