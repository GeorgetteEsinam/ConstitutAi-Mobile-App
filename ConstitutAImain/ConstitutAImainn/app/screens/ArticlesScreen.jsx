import React, { useState, useMemo } from 'react';
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

function ArticleRow({ item, theme, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Article ${item.number}: ${item.title}`}
    >
      <View style={styles.numberBadge}>
        <Text style={styles.numberText}>{item.number}</Text>
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.rowPreview, { color: theme.subText }]} numberOfLines={2}>
          {item.text.replace(/\n/g, ' ')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.subText} />
    </TouchableOpacity>
  );
}

export default function ArticlesScreen({ navigation, route }) {
  const { chapterId } = route.params;
  const { theme } = useAppContext();
  const [query, setQuery] = useState('');
  const { downloading, downloadChapter } = useDownload();

  const chapter = useMemo(
    () => constitutionData.chapters.find((c) => c.id === chapterId),
    [chapterId]
  );

  const articles = chapter ? chapter.articles : [];

  const filtered = query.trim()
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          String(a.number).includes(query) ||
          a.text.toLowerCase().includes(query.toLowerCase())
      )
    : articles;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style="light" />

      {/* Header */}
      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerRow}>
          <BackButton navigation={navigation} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSub}>
              CHAPTER {chapter ? chapter.number : ''} · GHANA CONSTITUTION 1992
            </Text>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {chapter ? chapter.title : 'Articles'}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={15} color="#8a9bbf" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search articles..."
            placeholderTextColor="#8a9bbf"
            accessibilityLabel="Search articles"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search">
              <Ionicons name="close" size={15} color="#8a9bbf" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* Count bar */}
      <View style={[styles.countBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.countText, { color: theme.subText }]}>
          {filtered.length} article{filtered.length !== 1 ? 's' : ''}
        </Text>
        {chapter && (
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={() => downloadChapter(chapter)}
            disabled={downloading}
            accessibilityLabel="Download full chapter"
            accessibilityRole="button"
          >
            {downloading ? (
              <ActivityIndicator size="small" color={NAVY} />
            ) : (
              <Ionicons name="download-outline" size={16} color={NAVY} />
            )}
            <Text style={styles.downloadBtnText}>
              {downloading ? 'Downloading…' : 'Download Chapter'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ArticleRow
            item={item}
            theme={theme}
            onPress={() =>
              navigation.navigate('ArticleDetail', {
                articleId: item.id,
                chapterId,
              })
            }
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="document-outline" size={48} color={theme.subText} />
            <Text style={[styles.emptyText, { color: theme.subText }]}>
              No articles found
            </Text>
          </View>
        }
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSub: { color: '#8a9bbf', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 2 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 26 },
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
  countBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  countText: { fontSize: 12, fontWeight: '600' },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: GOLD,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  downloadBtnText: { color: NAVY, fontSize: 12, fontWeight: '700' },
  list: { paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  numberBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  numberText: { color: NAVY, fontSize: 12, fontWeight: '700' },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4, lineHeight: 20 },
  rowPreview: { fontSize: 12, lineHeight: 17 },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
});
