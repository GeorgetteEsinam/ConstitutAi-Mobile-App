import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import constitutionData from '../data/constitution';
import BackButton from '../components/BackButton';
import { useDownload } from '../utils/useDownload';

const NAVY = '#0f1f3d';
const GOLD = '#c9a84c';

// Keep full chapter objects (including articles) for download
const CHAPTERS = constitutionData.chapters;

function ChapterRow({ item, theme, onPress, onDownload, downloadingId }) {
  const isDownloading = downloadingId === item.id;
  const articleCount = item.articles.length;

  return (
    <View style={[styles.row, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
      <TouchableOpacity
        style={styles.rowMain}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Chapter ${item.number}: ${item.title}`}
      >
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{item.number}</Text>
        </View>
        <View style={styles.rowContent}>
          <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.rowSub, { color: theme.subText }]}>
            {articleCount} article{articleCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.subText} />
      </TouchableOpacity>

      {/* Per-row download button */}
      <TouchableOpacity
        style={styles.rowDownloadBtn}
        onPress={onDownload}
        disabled={isDownloading}
        accessibilityRole="button"
        accessibilityLabel={`Download Chapter ${item.number}`}
      >
        {isDownloading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="download-outline" size={18} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function ChaptersScreen({ navigation }) {
  const { theme } = useAppContext();
  const [query, setQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const { downloadChapter } = useDownload();

  const filtered = query.trim()
    ? CHAPTERS.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          String(c.number).includes(query)
      )
    : CHAPTERS;

  async function handleDownloadChapter(chapter) {
    setDownloadingId(chapter.id);
    await downloadChapter(chapter);
    setDownloadingId(null);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style="light" />

      {/* Header */}
      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerRow}>
          <BackButton navigation={navigation} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSub}>GHANA CONSTITUTION · 1992</Text>
            <Text style={styles.headerTitle}>All Chapters</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={15} color="#8a9bbf" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search chapters..."
            placeholderTextColor="#8a9bbf"
            accessibilityLabel="Search chapters"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear">
              <Ionicons name="close" size={15} color="#8a9bbf" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* Info bar */}
      <View style={[styles.infoBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.infoText, { color: theme.subText }]}>
          {filtered.length} chapter{filtered.length !== 1 ? 's' : ''} · Tap{' '}
          <Ionicons name="download-outline" size={12} color={theme.subText} /> to save
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChapterRow
            item={item}
            theme={theme}
            downloadingId={downloadingId}
            onPress={() => navigation.navigate('Articles', { chapterId: item.id })}
            onDownload={() => handleDownloadChapter(item)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    marginBottom: 14,
    gap: 14,
  },
  headerSub: { color: '#8a9bbf', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, padding: 0 },
  infoBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoText: { fontSize: 12, fontWeight: '600' },
  list: { paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { color: NAVY, fontSize: 13, fontWeight: '700' },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  rowSub: { fontSize: 12 },
  rowDownloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});
