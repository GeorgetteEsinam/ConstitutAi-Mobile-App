import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import BackButton from '../components/BackButton';

const NAVY = '#0f1f3d';
const GOLD = '#c9a84c';

function ArticleCard({ article, theme, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${article.number}: ${article.title}`}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.articleNumber}>{article.number}</Text>
        <Text style={[styles.dot, { color: theme.subText }]}> · </Text>
        <Text style={[styles.chapterTag, { color: theme.subText }]}>{article.chapter}</Text>
      </View>
      <Text style={[styles.articleTitle, { color: theme.text }]}>{article.title}</Text>
      <Text style={[styles.articlePreview, { color: theme.subText }]}>{article.preview}</Text>
    </TouchableOpacity>
  );
}

export default function SavedScreen({ navigation }) {
  const { theme, savedArticles, savedNotes, addNote, deleteNote } = useAppContext();
  const [noteVisible, setNoteVisible] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');

  const handleSaveNote = () => {
    if (!noteBody.trim()) {
      Alert.alert('Empty note', 'Please write something before saving.');
      return;
    }
    const newNote = {
      id: Date.now().toString(),
      title: noteTitle.trim() || 'Untitled Note',
      body: noteBody.trim(),
      date: new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      }),
    };
    addNote(newNote);
    setNoteTitle('');
    setNoteBody('');
    setNoteVisible(false);
  };

  const handleDeleteNote = (id) => {
    Alert.alert('Delete note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteNote(id),
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style="light" />

      {/* Header */}
      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerRow}>
          <BackButton navigation={navigation} />
          <View>
            <Text style={styles.headerSub}>YOUR COLLECTION</Text>
            <Text style={styles.headerTitle}>Saved Articles</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, { color: theme.subText }]}>
          {savedArticles.length} BOOKMARKS
        </Text>

        {savedArticles.length === 0 && (
          <View style={[styles.card, { backgroundColor: theme.card, alignItems: 'center', paddingVertical: 32 }]}>
            <Ionicons name="bookmark-outline" size={40} color={theme.subText} />
            <Text style={[styles.articleTitle, { color: theme.subText, textAlign: 'center', marginTop: 12 }]}>
              No saved articles yet
            </Text>
            <Text style={[styles.articlePreview, { color: theme.subText, textAlign: 'center', marginTop: 4 }]}>
              Tap the bookmark icon in any article to save it here.
            </Text>
          </View>
        )}

        {savedArticles.map((article) => (
          <ArticleCard
            key={article.id}
            article={{
              id: article.id,
              number: `Article ${article.number}`,
              chapter: article.chapterTitle || '',
              title: article.title,
              preview: article.text ? article.text.replace(/\n/g, ' ').slice(0, 120) + '...' : '',
            }}
            theme={theme}
            onPress={() =>
              navigation.navigate('ArticleDetail', {
                articleId: article.id,
                chapterId: article.chapterId || '',
              })
            }
          />
        ))}

        {/* Add a note card */}
        <TouchableOpacity
          style={[styles.card, styles.noteCard, { backgroundColor: theme.card }]}
          onPress={() => setNoteVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Add a note"
        >
          <Ionicons name="document-text-outline" size={28} color={GOLD} />
          <View>
            <Text style={[styles.noteTitle, { color: theme.text }]}>Add a note</Text>
            <Text style={[styles.noteSub, { color: theme.subText }]}>Annotate any saved article</Text>
          </View>
          <Ionicons name="add-circle-outline" size={22} color={GOLD} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {/* Saved notes list */}
        {savedNotes.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.subText, marginTop: 8 }]}>
              {savedNotes.length} NOTE{savedNotes.length !== 1 ? 'S' : ''}
            </Text>
            {savedNotes.map((note) => (
              <View key={note.id} style={[styles.card, styles.savedNoteCard, { backgroundColor: theme.card }]}>
                <View style={styles.savedNoteHeader}>
                  <View style={styles.savedNoteLeft}>
                    <Ionicons name="document-text" size={18} color={GOLD} />
                    <Text style={[styles.savedNoteTitle, { color: theme.text }]}>{note.title}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteNote(note.id)}
                    accessibilityLabel="Delete note"
                    accessibilityRole="button"
                  >
                    <Ionicons name="trash-outline" size={18} color="#e53935" />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.savedNoteBody, { color: theme.subText }]} numberOfLines={3}>
                  {note.body}
                </Text>
                <Text style={[styles.savedNoteDate, { color: theme.settingValue }]}>{note.date}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* ── Note editor modal ── */}
      <Modal
        visible={noteVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNoteVisible(false)}
        accessibilityViewIsModal
      >
        <Pressable style={styles.modalOverlay} onPress={() => setNoteVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <Pressable style={[styles.noteSheet, { backgroundColor: theme.card }]} onPress={() => {}}>
              {/* Handle */}
              <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

              {/* Sheet header */}
              <View style={styles.sheetHeaderRow}>
                <Text style={[styles.sheetTitle, { color: theme.text }]}>New Note</Text>
                <TouchableOpacity
                  onPress={() => setNoteVisible(false)}
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={22} color={theme.subText} />
                </TouchableOpacity>
              </View>

              {/* Note title input */}
              <TextInput
                style={[styles.titleInput, { color: theme.text, borderBottomColor: theme.border }]}
                value={noteTitle}
                onChangeText={setNoteTitle}
                placeholder="Note title (optional)"
                placeholderTextColor={theme.subText}
                accessibilityLabel="Note title"
              />

              {/* Note body */}
              <TextInput
                style={[styles.bodyInput, { color: theme.text, backgroundColor: theme.inputBg }]}
                value={noteBody}
                onChangeText={setNoteBody}
                placeholder="Write your note here..."
                placeholderTextColor={theme.subText}
                multiline
                textAlignVertical="top"
                autoFocus
                accessibilityLabel="Note content"
              />

              {/* Save button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveNote}
                accessibilityRole="button"
                accessibilityLabel="Save note"
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Save Note</Text>
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, gap: 14 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSub: { color: '#8a9bbf', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
  body: { padding: 16, paddingBottom: 40, gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  card: {
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  articleNumber: { fontSize: 14, fontWeight: '700', color: GOLD },
  dot: { fontSize: 14 },
  chapterTag: { fontSize: 13, flex: 1 },
  articleTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  articlePreview: { fontSize: 13, lineHeight: 20 },
  noteCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, gap: 14 },
  noteTitle: { fontSize: 15, fontWeight: '600' },
  noteSub: { fontSize: 13, marginTop: 2 },
  // Saved notes
  savedNoteCard: { gap: 8 },
  savedNoteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  savedNoteLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  savedNoteTitle: { fontSize: 14, fontWeight: '700' },
  savedNoteBody: { fontSize: 13, lineHeight: 20 },
  savedNoteDate: { fontSize: 11, marginTop: 4 },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  noteSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  titleInput: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  bodyInput: {
    fontSize: 14,
    lineHeight: 22,
    borderRadius: 12,
    padding: 14,
    minHeight: 160,
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: { color: GOLD, fontSize: 15, fontWeight: '700' },
});
