import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { askAI } from '../services/api';
import BackButton from '../components/BackButton';

const PURPLE = '#4a3fa0';

export default function AskAIScreen({ navigation, route }) {
  const { theme, incrementQuestions, authToken } = useAppContext();
  const articleId = route.params?.articleId;
  const articleTitle = route.params?.articleTitle;
  const articleText = route.params?.articleText;
  const articleNumber = route.params?.articleNumber;
  const chapterTitle = route.params?.chapterTitle;

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  const hasArticle = Boolean(articleText);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    if (!authToken) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-auth`,
          role: 'ai',
          text: 'Please log in to ask Constitut AI a question.',
        },
      ]);
      return;
    }

    setLoading(true);

    try {
      const data = await askAI(
        {
          question: text,
          articleId,
          title: articleTitle,
          content: articleText,
        },
        authToken
      );

      incrementQuestions();
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-ai`,
          role: 'ai',
          text: data.answer || 'No response from AI.',
          sources: data.sources || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'ai',
          text:
            err.message ||
            'Could not reach the server. Make sure the backend is running and you are logged in.',
        },
      ]);
    } finally {
      setLoading(false);
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    const sources = !isUser && Array.isArray(item.sources) ? item.sources : [];
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.aiBubbleIcon}>
            <MaterialCommunityIcons name="robot-outline" size={16} color="#fff" />
          </View>
        )}
        <View style={styles.bubbleCol}>
          <View
            style={[
              styles.bubble,
              isUser
                ? [styles.bubbleUser, { backgroundColor: PURPLE }]
                : [styles.bubbleAI, { backgroundColor: theme.card }],
            ]}
          >
            <Text style={[styles.bubbleText, { color: isUser ? '#fff' : theme.text }]}>
              {item.text}
            </Text>
          </View>
          {sources.length > 0 ? (
            <View style={styles.sourcesWrap}>
              {sources.map((source) => (
                <TouchableOpacity
                  key={source.id}
                  style={[styles.sourceChip, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() =>
                    navigation.navigate('ArticleDetail', {
                      articleId: source.id,
                      chapterId: source.chapterId,
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Open article ${source.number}`}
                >
                  <Text style={styles.sourceChipText}>Art. {source.number}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style="light" />

      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerRow}>
          <BackButton navigation={navigation} />
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons name="robot-outline" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Constitut AI</Text>
            {hasArticle ? (
              <Text style={styles.headerSub} numberOfLines={1}>
                {articleNumber ? `Art. ${articleNumber} · ` : ''}
                {articleTitle}
              </Text>
            ) : (
              <Text style={styles.headerSub} numberOfLines={1}>
                Grounded in the Constitution
              </Text>
            )}
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={[
            styles.messageList,
            messages.length === 0 && styles.messageListEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons name="robot-outline" size={40} color={PURPLE} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {hasArticle ? 'Ask about this article' : 'Ask me anything'}
              </Text>
              <Text style={[styles.emptySub, { color: theme.subText }]}>
                {hasArticle
                  ? chapterTitle || articleTitle
                  : "Answers are drawn from Ghana's Constitution"}
              </Text>
            </View>
          }
          ListFooterComponent={
            loading ? (
              <View style={styles.msgRow}>
                <View style={styles.aiBubbleIcon}>
                  <MaterialCommunityIcons name="robot-outline" size={16} color="#fff" />
                </View>
                <View style={[styles.bubble, styles.bubbleAI, { backgroundColor: theme.card }]}>
                  <ActivityIndicator size="small" color={PURPLE} />
                </View>
              </View>
            ) : null
          }
          onContentSizeChange={() =>
            (messages.length > 0 || loading) &&
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
            value={input}
            onChangeText={setInput}
            placeholder={hasArticle ? 'Ask about this article' : 'Ask anything'}
            placeholderTextColor={theme.subText}
            multiline
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            accessibilityLabel="Ask a question"
          />
          <TouchableOpacity
            style={[styles.micBtn, { backgroundColor: PURPLE, opacity: loading ? 0.6 : 1 }]}
            onPress={sendMessage}
            disabled={loading}
            accessibilityLabel={input.trim() ? 'Send message' : 'Voice input'}
            accessibilityRole="button"
          >
            <Ionicons
              name={input.trim() ? 'send' : 'mic'}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, gap: 12 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#c5d0ea', fontSize: 12, marginTop: 2 },
  messageList: { padding: 16, gap: 12, paddingBottom: 8 },
  messageListEmpty: { flex: 1, justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', gap: 10 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ede9fb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  msgRowUser: { flexDirection: 'row-reverse' },
  bubbleCol: { maxWidth: '78%' },
  aiBubbleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAI: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  sourcesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  sourceChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sourceChipText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 28,
    gap: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
