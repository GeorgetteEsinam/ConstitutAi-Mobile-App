import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ToastAndroid,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import constitutionData from '../data/constitution';
import { summarizeArticle, autoTagArticle } from '../services/api';
import BackButton from '../components/BackButton';
import { useDownload } from '../utils/useDownload';

const NAVY = '#0f1f3d';
const GOLD = '#c9a84c';
const PURPLE = '#4a3fa0';

// Show a brief "toast-like" feedback across platforms
function showFeedback(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

export default function ArticleDetailScreen({ navigation, route }) {
  const { articleId, chapterId } = route.params;
  const { theme, savedArticles, toggleSavedArticle, logArticleView, authToken } = useAppContext();
  const { downloading, downloadArticle } = useDownload();
  const [summary, setSummary] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagError, setTagError] = useState('');
  const [tagging, setTagging] = useState(false);

  const chapter = useMemo(
    () => constitutionData.chapters.find((c) => c.id === chapterId),
    [chapterId]
  );

  const article = useMemo(
    () => (chapter ? chapter.articles.find((a) => a.id === articleId) : null),
    [chapter, articleId]
  );

  const isSaved = savedArticles && savedArticles.some((a) => a.id === articleId);

  useEffect(() => {
    if (article?.id) {
      logArticleView(article);
    }
  }, [article?.id]);

  useEffect(() => {
    setSummary('');
    setSummaryError('');
    setSummarizing(false);
    setTags([]);
    setTagError('');
    setTagging(false);
  }, [articleId]);

  const handleSummarize = async () => {
    if (!article || summarizing) return;

    if (!authToken) {
      setSummaryError('Please log in to summarise this article.');
      return;
    }

    setSummarizing(true);
    setSummaryError('');

    try {
      const data = await summarizeArticle(
        {
          articleId: article.id,
          title: article.title,
          content: article.text,
        },
        authToken
      );
      setSummary(data.summary || '');
    } catch (err) {
      setSummaryError(err.message || 'Could not summarise this article.');
    } finally {
      setSummarizing(false);
    }
  };

  const handleAutoTag = async () => {
    if (!article || tagging) return;

    if (!authToken) {
      setTagError('Please log in to generate tags.');
      return;
    }

    setTagging(true);
    setTagError('');

    try {
      const data = await autoTagArticle(
        {
          articleId: article.id,
          title: article.title,
          content: article.text,
        },
        authToken
      );
      const nextTags = Array.isArray(data.tags) ? data.tags.filter(Boolean) : [];
      setTags(nextTags);
      if (nextTags.length === 0) {
        setTagError('No tags were returned. Try again.');
      }
    } catch (err) {
      setTagError(err.message || 'Could not generate tags.');
    } finally {
      setTagging(false);
    }
  };

  const handleToggleSave = () => {
    if (article) {
      toggleSavedArticle({
        ...article,
        chapterTitle: chapter ? chapter.title : '',
        chapterId: chapterId,
      });
      showFeedback(isSaved ? 'Removed from bookmarks' : 'Saved to bookmarks');
    }
  };

  if (!article) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.subText} />
        <Text style={{ color: theme.subText, marginTop: 12 }}>Article not found</Text>
      </View>
    );
  }

  // Split the text into paragraphs by double newline
  const paragraphs = article.text.split('\n\n').filter(Boolean);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style="light" />

      {/* Header */}
      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerRow}>
          <BackButton navigation={navigation} />

          <View style={{ flex: 1 }}>
            <Text style={styles.headerSub}>
              CHAPTER {chapter ? chapter.number : ''} · ARTICLE {article.number}
            </Text>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {article.title}
            </Text>
          </View>

          {/* Bookmark toggle */}
          <TouchableOpacity
            style={styles.bookmarkBtn}
            onPress={handleToggleSave}
            accessibilityLabel={isSaved ? 'Remove bookmark' : 'Bookmark this article'}
            accessibilityRole="button"
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isSaved ? GOLD : '#fff'}
            />
          </TouchableOpacity>

          {/* Download button */}
          <TouchableOpacity
            style={styles.bookmarkBtn}
            onPress={() => downloadArticle(article, chapter ? chapter.title : '')}
            disabled={downloading}
            accessibilityLabel="Download this article"
            accessibilityRole="button"
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="download-outline" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Body */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Article badge */}
        <View style={[styles.articleBadge, { backgroundColor: theme.card }]}>
          <View style={styles.badgeLeft}>
            <View style={styles.badgeDot} />
            <Text style={[styles.badgeText, { color: theme.subText }]}>
              {chapter ? chapter.title : ''}
            </Text>
          </View>
          <View style={[styles.articleNum, { backgroundColor: NAVY }]}>
            <Text style={styles.articleNumText}>Art. {article.number}</Text>
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIconWrap}>
              <Ionicons name="reader-outline" size={16} color={PURPLE} />
            </View>
            <Text style={[styles.summaryLabel, { color: theme.text }]}>AI summary</Text>
          </View>

          {summary ? (
            <Text style={[styles.summaryText, { color: theme.text }]}>{summary}</Text>
          ) : summaryError ? (
            <Text style={styles.summaryError}>{summaryError}</Text>
          ) : (
            <Text style={[styles.summaryHint, { color: theme.subText }]}>
              Get a short plain-language summary of this article.
            </Text>
          )}

          <TouchableOpacity
            style={[styles.summaryBtn, { opacity: summarizing ? 0.7 : 1 }]}
            onPress={handleSummarize}
            disabled={summarizing}
            accessibilityRole="button"
            accessibilityLabel={summary ? 'Refresh summary' : 'Summarize this article'}
          >
            {summarizing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name={summary || summaryError ? 'refresh' : 'document-text-outline'} size={16} color="#fff" />
            )}
            <Text style={styles.summaryBtnText}>
              {summarizing
                ? 'Summarising…'
                : summary || summaryError
                  ? 'Try again'
                  : 'Summarize this article'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIconWrap}>
              <Ionicons name="pricetags-outline" size={16} color={PURPLE} />
            </View>
            <Text style={[styles.summaryLabel, { color: theme.text }]}>AI tags</Text>
          </View>

          {tags.length > 0 ? (
            <View style={styles.tagsWrap}>
              {tags.map((tag) => (
                <View key={tag} style={[styles.tagChip, { borderColor: theme.border }]}>
                  <Text style={styles.tagChipText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : tagError ? (
            <Text style={styles.summaryError}>{tagError}</Text>
          ) : (
            <Text style={[styles.summaryHint, { color: theme.subText }]}>
              Generate short topic tags for this article.
            </Text>
          )}

          <TouchableOpacity
            style={[styles.summaryBtn, { opacity: tagging ? 0.7 : 1 }]}
            onPress={handleAutoTag}
            disabled={tagging}
            accessibilityRole="button"
            accessibilityLabel={tags.length ? 'Refresh tags' : 'Generate tags'}
          >
            {tagging ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name={tags.length || tagError ? 'refresh' : 'pricetag-outline'} size={16} color="#fff" />
            )}
            <Text style={styles.summaryBtnText}>
              {tagging
                ? 'Generating…'
                : tags.length || tagError
                  ? 'Try again'
                  : 'Generate tags'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Paragraphs */}
        {paragraphs.map((para, index) => (
          <Text
            key={index}
            style={[styles.paragraph, { color: theme.text }]}
            accessibilityRole="text"
          >
            {para}
          </Text>
        ))}

        <TouchableOpacity
          style={styles.askAIBtn}
          onPress={() =>
            navigation.navigate('AskAI', {
              articleId: article.id,
              articleNumber: article.number,
              articleTitle: article.title,
              articleText: article.text,
              chapterTitle: chapter ? chapter.title : '',
            })
          }
          accessibilityRole="button"
          accessibilityLabel="Ask AI about this article"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={NAVY} />
          <Text style={styles.askAIText}>Ask AI about this article</Text>
          <Ionicons name="arrow-forward" size={16} color={NAVY} />
        </TouchableOpacity>

        {/* Save button at bottom */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: isSaved ? '#e8f0e8' : NAVY },
          ]}
          onPress={handleToggleSave}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? 'Remove from bookmarks' : 'Save article'}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={isSaved ? '#2a7a2a' : '#fff'}
          />
          <Text style={[styles.saveBtnText, { color: isSaved ? '#2a7a2a' : '#fff' }]}>
            {isSaved ? 'Saved to Bookmarks' : 'Save Article'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSub: {
    color: '#8a9bbf',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  bookmarkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 48 },
  articleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  badgeLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
  },
  badgeText: { fontSize: 12, fontWeight: '600', flex: 1 },
  articleNum: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  articleNumText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 26,
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  summaryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ede9fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryHint: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  summaryError: {
    fontSize: 13,
    lineHeight: 20,
    color: '#c0392b',
    marginBottom: 12,
  },
  summaryBtn: {
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  summaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ede9fb',
  },
  tagChipText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
  },
  askAIBtn: {
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  askAIText: {
    flex: 1,
    color: NAVY,
    fontSize: 15,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
