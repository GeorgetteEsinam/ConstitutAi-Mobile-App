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
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAppContext } from '../context/AppContext';
import { askAI, analyzeFile } from '../services/api';
import BackButton from '../components/BackButton';

const PURPLE = '#4a3fa0';
const NAVY = '#0f1f3d';
const GOLD = '#c9a84c';

// Allowed file types
const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${Math.round(kb)} KB`;
}

export default function AskAIScreen({ navigation, route }) {
  const { theme, incrementQuestions, authToken } = useAppContext();
  const articleId   = route.params?.articleId;
  const articleTitle = route.params?.articleTitle;
  const articleText  = route.params?.articleText;
  const articleNumber = route.params?.articleNumber;
  const chapterTitle  = route.params?.chapterTitle;

  const [input, setInput]               = useState('');
  const [messages, setMessages]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [attachedFile, setAttachedFile] = useState(null); // { uri, name, mimeType, size, file, text }
  const flatListRef = useRef(null);

  const hasArticle = Boolean(articleText);

  // ── Pick a file ─────────────────────────────────────────────
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: Platform.OS === 'web'
          ? ['application/pdf', 'text/plain', '.pdf', '.txt', '.doc', '.docx', '*/*']
          : ALLOWED_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      // 10 MB guard on the client side
      if (asset.size && asset.size > 10 * 1024 * 1024) {
        Alert.alert('File too large', 'Please upload a file smaller than 10 MB.');
        return;
      }

      let fileName = asset.name || 'case_document';
      const mime = asset.mimeType || '';
      if (!fileName.includes('.')) {
        if (mime.includes('pdf')) fileName += '.pdf';
        else if (mime.includes('word') || mime.includes('officedocument')) fileName += '.docx';
        else if (mime.includes('text')) fileName += '.txt';
      }

      let extractedText = '';
      if (asset.file && (fileName.toLowerCase().endsWith('.txt') || mime === 'text/plain')) {
        try {
          extractedText = await asset.file.text();
        } catch (_) {}
      }

      setAttachedFile({
        uri: asset.uri,
        name: fileName,
        mimeType: asset.mimeType,
        size: asset.size,
        file: asset.file,
        base64: asset.base64,
        text: extractedText,
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not pick a file.');
    }
  };

  const removeAttachment = () => setAttachedFile(null);

  // ── Send message or analyse file ────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text && !attachedFile) return;
    if (loading) return;

    if (!authToken) {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-auth`, role: 'ai', text: 'Please log in to use Constitut AI.' },
      ]);
      return;
    }

    const fileToSend = attachedFile;

    // Build the user bubble label
    const userBubbleText = fileToSend
      ? `📎 ${fileToSend.name}${fileToSend.size ? ` (${formatFileSize(fileToSend.size)})` : ''}${text ? `\n\n${text}` : ''}`
      : text;

    const userMsg = { id: Date.now().toString(), role: 'user', text: userBubbleText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAttachedFile(null);

    setLoading(true);

    try {
      let answer, sources;

      if (fileToSend) {
        // ── File analysis mode ──────────────────────────────
        const data = await analyzeFile({ file: fileToSend, question: text || '' }, authToken);
        answer  = data.analysis;
        sources = data.sources || [];
      } else {
        // ── Regular Q&A mode ────────────────────────────────
        const data = await askAI(
          { question: text, articleId, title: articleTitle, content: articleText },
          authToken
        );
        answer  = data.answer || 'No response from AI.';
        sources = data.sources || [];
      }

      incrementQuestions();
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-ai`, role: 'ai', text: answer, sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'ai',
          text: err.message || 'Could not reach the server. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  // ── Render a single message bubble ──────────────────────────
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

          {sources.length > 0 && (
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
          )}
        </View>
      </View>
    );
  };

  // ── Render ──────────────────────────────────────────────────
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
                {articleNumber ? `Art. ${articleNumber} · ` : ''}{articleTitle}
              </Text>
            ) : (
              <Text style={styles.headerSub}>Grounded in the Constitution</Text>
            )}
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Message list */}
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
                  : "Ask a question or upload a case file to compare with Ghana's Constitution"}
              </Text>

              {/* Upload hint card */}
              {!hasArticle && (
                <TouchableOpacity
                  style={[styles.uploadHintCard, { backgroundColor: theme.card }]}
                  onPress={pickFile}
                  accessibilityRole="button"
                  accessibilityLabel="Upload a case file"
                >
                  <View style={styles.uploadHintIconWrap}>
                    <Ionicons name="cloud-upload-outline" size={24} color={PURPLE} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.uploadHintTitle, { color: theme.text }]}>
                      Upload a case file
                    </Text>
                    <Text style={[styles.uploadHintSub, { color: theme.subText }]}>
                      PDF, DOCX, or TXT · Compare against 1992 Ghana Constitution
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.subText} />
                </TouchableOpacity>
              )}
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

        {/* Attached file chip */}
        {attachedFile && (
          <View style={[styles.attachmentBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
            <View style={styles.attachmentBadge}>
              <Ionicons name="document-attach-outline" size={16} color={PURPLE} />
            </View>
            <Text style={[styles.attachmentName, { color: theme.text }]} numberOfLines={1}>
              {attachedFile.name}
              {attachedFile.size ? `  •  ${formatFileSize(attachedFile.size)}` : ''}
            </Text>
            <TouchableOpacity
              onPress={removeAttachment}
              accessibilityLabel="Remove attachment"
              accessibilityRole="button"
            >
              <Ionicons name="close-circle" size={20} color={theme.subText} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>

          {/* Attach button */}
          <TouchableOpacity
            style={[styles.attachBtn, { backgroundColor: attachedFile ? PURPLE : theme.bg, borderColor: theme.border }]}
            onPress={pickFile}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Attach a file"
          >
            <Ionicons
              name={attachedFile ? "document-text" : "attach"}
              size={20}
              color={attachedFile ? '#fff' : theme.subText}
            />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
            value={input}
            onChangeText={setInput}
            placeholder={
              attachedFile
                ? 'Ask about this case file...'
                : hasArticle
                  ? 'Ask about this article'
                  : 'Ask anything or upload a case file'
            }
            placeholderTextColor={theme.subText}
            multiline
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
            accessibilityLabel="Ask a question"
          />

          {/* Send button */}
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: (input.trim() || attachedFile) ? PURPLE : theme.border,
                opacity: loading ? 0.6 : 1,
              },
            ]}
            onPress={() => sendMessage()}
            disabled={loading || (!input.trim() && !attachedFile)}
            accessibilityLabel="Send message"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name={attachedFile ? 'cloud-upload-outline' : input.trim() ? 'send' : 'send'}
                size={20}
                color="#fff"
              />
            )}
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
  emptyWrap: { alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ede9fb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center' },

  uploadHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: PURPLE,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    width: '100%',
  },
  uploadHintIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ede9fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadHintTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  uploadHintSub: { fontSize: 12 },

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
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAI: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  sourcesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  sourcesHeader: { width: '100%', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  sourceChip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  sourceChipText: { color: PURPLE, fontSize: 12, fontWeight: '700' },

  attachmentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  attachmentBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ede9fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentName: { flex: 1, fontSize: 13, fontWeight: '600' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 28,
    gap: 8,
    borderTopWidth: 1,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

