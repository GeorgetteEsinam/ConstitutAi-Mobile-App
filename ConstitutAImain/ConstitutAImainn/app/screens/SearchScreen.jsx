import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import constitutionData from '../data/constitution.json';
import BackButton from '../components/BackButton';

const NAVY = '#0f1f3d';
const GOLD = '#c9a84c';

// ── Pre-flatten all articles once at module load (not on every render) ──────
const ALL_ARTICLES = constitutionData.chapters.flatMap((chapter) =>
  chapter.articles.map((article) => ({
    ...article,
    chapterId: chapter.id,
    chapterNumber: chapter.number,
    chapterTitle: chapter.title,
    // lower-cased versions for fast search
    _titleLower: article.title.toLowerCase(),
    _textLower: article.text.toLowerCase(),
    _chapterLower: chapter.title.toLowerCase(),
  }))
);

const POPULAR = [
  'Right to life',
  'Freedom of speech',
  'Presidential powers',
  'Citizenship',
  'Right to education',
  'Chieftaincy',
  'Fundamental rights',
  'Parliament',
];

// Highlight matching text segment
function HighlightText({ text, query, style, numberOfLines }) {
  if (!query.trim()) {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {text.slice(0, idx)}
      <Text style={styles.highlight}>{text.slice(idx, idx + query.length)}</Text>
      {text.slice(idx + query.length)}
    </Text>
  );
}

function ResultCard({ item, query, theme, onPress }) {
  // Get a short snippet around the match in the body text
  const getSnippet = () => {
    const q = query.toLowerCase();
    const idx = item._textLower.indexOf(q);
    if (idx === -1) return item.text.slice(0, 100).replace(/\n/g, ' ') + '...';
    const start = Math.max(0, idx - 40);
    const end = Math.min(item.text.length, idx + query.length + 80);
    const snippet = (start > 0 ? '...' : '') + item.text.slice(start, end).replace(/\n/g, ' ') + (end < item.text.length ? '...' : '');
    return snippet;
  };

  return (
    <TouchableOpacity
      style={[styles.resultCard, { backgroundColor: theme.card }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Article ${item.number}: ${item.title}`}
    >
      {/* Top row: article badge + chapter tag */}
      <View style={styles.resultMeta}>
        <View style={styles.artBadge}>
          <Text style={styles.artBadgeText}>Art. {item.number}</Text>
        </View>
        <Text style={[styles.chapterTag, { color: theme.subText }]} numberOfLines={1}>
          Ch. {item.chapterNumber} · {item.chapterTitle}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={theme.subText} />
      </View>

      {/* Article title with highlight */}
      <HighlightText
        text={item.title}
        query={query}
        style={[styles.resultTitle, { color: theme.text }]}
        numberOfLines={2}
      />

      {/* Snippet from body text */}
      <HighlightText
        text={getSnippet()}
        query={query}
        style={[styles.resultSnippet, { color: theme.subText }]}
        numberOfLines={3}
      />
    </TouchableOpacity>
  );
}

export default function SearchScreen({ navigation }) {
  const { theme } = useAppContext();
  const [query, setQuery] = useState('');

  // ── Search logic ─────────────────────────────────────────────────────────
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    return ALL_ARTICLES.filter(
      (a) =>
        a._titleLower.includes(q) ||
        a._textLower.includes(q) ||
        a._chapterLower.includes(q) ||
        String(a.number) === q
    );
  }, [query]);

  const handleSelectPopular = useCallback((term) => {
    setQuery(term);
  }, []);

  const handleOpenArticle = useCallback(
    (item) => {
      Keyboard.dismiss();
      navigation.navigate('ArticleDetail', {
        articleId: item.id,
        chapterId: item.chapterId,
      });
    },
    [navigation]
  );

  const showPopular = query.trim().length < 2;
  const showNoResults = query.trim().length >= 2 && results.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style="light" />

      {/* Header */}
      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerTop}>
          <BackButton navigation={navigation} />
          <Text style={styles.headerTitle}>Search</Text>
        </View>

        {/* Search input */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#8a9bbf" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search articles, chapters, keywords..."
            placeholderTextColor="#8a9bbf"
            autoFocus
            returnKeyType="search"
            accessibilityLabel="Search input"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={18} color="#8a9bbf" />
            </TouchableOpacity>
          )}
        </View>

        {/* Result count */}
        {!showPopular && (
          <Text style={styles.resultCount}>
            {results.length} result{results.length !== 1 ? 's' : ''} for "{query.trim()}"
          </Text>
        )}
      </SafeAreaView>

      {/* Popular suggestions */}
      {showPopular && (
        <View style={styles.popularWrap}>
          <Text style={[styles.sectionLabel, { color: theme.subText }]}>
            POPULAR SEARCHES
          </Text>
          <View style={styles.pillsWrap}>
            {POPULAR.map((term) => (
              <TouchableOpacity
                key={term}
                style={[styles.pill, { backgroundColor: theme.card }]}
                onPress={() => handleSelectPopular(term)}
                accessibilityLabel={term}
                accessibilityRole="button"
              >
                <Ionicons name="trending-up-outline" size={13} color={GOLD} />
                <Text style={[styles.pillText, { color: theme.text }]}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* No results */}
      {showNoResults && (
        <View style={styles.emptyWrap}>
          <Ionicons name="search-outline" size={52} color={theme.subText} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No results found</Text>
          <Text style={[styles.emptySub, { color: theme.subText }]}>
            Try a different keyword or article number
          </Text>
        </View>
      )}

      {/* Results list */}
      {!showPopular && !showNoResults && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ResultCard
              item={item}
              query={query.trim()}
              theme={theme}
              onPress={() => handleOpenArticle(item)}
            />
          )}
          contentContainerStyle={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTop: {
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
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    padding: 0,
  },
  resultCount: {
    color: '#8a9bbf',
    fontSize: 12,
    marginTop: 10,
    fontWeight: '500',
  },
  popularWrap: {
    padding: 20,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 14,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  pillText: { fontSize: 13, fontWeight: '500' },
  resultsList: {
    padding: 14,
    paddingBottom: 32,
    gap: 10,
  },
  resultCard: {
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 7,
  },
  artBadge: {
    backgroundColor: GOLD,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  artBadgeText: {
    color: NAVY,
    fontSize: 11,
    fontWeight: '700',
  },
  chapterTag: {
    fontSize: 12,
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 5,
    lineHeight: 20,
  },
  resultSnippet: {
    fontSize: 12,
    lineHeight: 18,
  },
  highlight: {
    backgroundColor: '#fff3b0',
    color: '#1a1a1a',
    fontWeight: '700',
    borderRadius: 2,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 60,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
});
