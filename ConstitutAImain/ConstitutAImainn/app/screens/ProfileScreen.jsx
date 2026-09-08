import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  Pressable,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

const NAVY = '#0f1f3d';
const GOLD = '#c9a84c';
const RED = '#e53935';
const INDIGO = '#3949ab';

const LANGUAGES = ['English'];

// Only English supported
const LABELS = {
  myProfile: 'My Profile',
  edit: 'Edit',
  email: 'Email',
  phone: 'Phone Number',
  bookmarks: 'Bookmarks',
  notes: 'Notes',
  questions: 'Questions\nasked',
  settings: 'SETTINGS',
  language: 'Language',
  notifications: 'Notifications',
  darkMode: 'Dark Mode',
  changePassword: 'Change Password',
  logOut: 'Log Out',
  logout: 'Logout',
  logoutQuestion: 'Are you sure you want to log\nout of ConstitutAI?',
  selectLanguage: 'Language',
  currentPw: 'Current password',
  newPw: 'New password',
  confirmPw: 'Confirm new password',
  savePw: 'Save Password',
  editProfile: 'Edit Profile',
  fullName: 'Full Name',
  saveChanges: 'Save Changes',
};

function formatQuestionDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (_) {
    return isoString;
  }
}

export default function ProfileScreen({ navigation }) {
  const { darkMode, setDarkMode, notifications, setNotifications, theme,
          savedArticles, savedNotes, questionsAsked,
          askedQuestionsHistory = [], clearQuestionsHistory, deleteAskedQuestion,
          userName, setUserName, userEmail, setUserEmail, userPhone, setUserPhone,
          signOut } =
    useAppContext();

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [pwVisible, setPwVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [questionsVisible, setQuestionsVisible] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Edit drafts — populated when modal opens
  const [draftName, setDraftName] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftPhone, setDraftPhone] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const t = LABELS;

  const openEdit = () => {
    setDraftName(userName);
    setDraftEmail(userEmail);
    setDraftPhone(userPhone);
    setEditVisible(true);
  };

  const saveEdit = () => {
    if (!draftName.trim() || !draftEmail.trim()) {
      Alert.alert('Error', 'Name and email are required.');
      return;
    }
    setUserName(draftName.trim());
    setUserEmail(draftEmail.trim());
    setUserPhone(draftPhone.trim());
    setEditVisible(false);
  };

  const handleLogout = async () => {
    setLogoutVisible(false);
    await signOut();
    navigation.replace('Login');
  };

  const handleChangePassword = () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    if (newPw.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setPwVisible(false);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    Alert.alert('✓', 'Password changed successfully.');
  };

  const handleClearQuestions = () => {
    Alert.alert(
      'Clear Questions History',
      'Are you sure you want to delete all recorded AI questions and answers?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearQuestionsHistory();
            setExpandedId(null);
          },
        },
      ]
    );
  };

  const handleDeleteQuestion = (id) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to remove this question from your history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAskedQuestion(id);
            if (expandedId === id) setExpandedId(null);
          },
        },
      ]
    );
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Initials from name
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style="light" />

      {/* Header */}
      <SafeAreaView style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>{t.myProfile}</Text>
          <TouchableOpacity style={styles.editBtn} onPress={openEdit} accessibilityLabel={t.edit} accessibilityRole="button">
            <Text style={styles.editText}>{t.edit}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{userName}</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {/* Info card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.text }]}>{t.email}</Text>
            <Text style={[styles.infoValue, { color: theme.subText }]}>{userEmail}</Text>
          </View>
          <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.text }]}>{t.phone}</Text>
            <Text style={[styles.infoValue, { color: theme.subText }]}>{userPhone || '—'}</Text>
          </View>
        </View>

        {/* Stats card */}
        <View style={[styles.card, styles.statsCard, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => navigation.navigate('Saved')}
            accessibilityRole="button"
            accessibilityLabel="View saved bookmarks"
          >
            <Ionicons name="bookmark-outline" size={22} color={GOLD} />
            <Text style={styles.statNumber}>{savedArticles.length}</Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>{t.bookmarks}</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => navigation.navigate('Saved')}
            accessibilityRole="button"
            accessibilityLabel="View notes"
          >
            <Ionicons name="document-text-outline" size={22} color={GOLD} />
            <Text style={styles.statNumber}>{savedNotes.length}</Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>{t.notes}</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <TouchableOpacity
            style={[styles.statItem, styles.statItemClickable]}
            onPress={() => setQuestionsVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="View questions asked history"
          >
            <MaterialCommunityIcons name="chat-question-outline" size={22} color={GOLD} />
            <Text style={styles.statNumber}>{askedQuestionsHistory.length > 0 ? askedQuestionsHistory.length : questionsAsked}</Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>{t.questions}</Text>
            <View style={styles.viewBadge}>
              <Text style={styles.viewBadgeText}>Tap to view</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <Text style={[styles.sectionLabel, { color: theme.subText }]}>{t.settings}</Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          {/* Language — English only, no picker needed */}
          <View style={[styles.settingRow, styles.settingRowBorder, { borderBottomColor: theme.border }]}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>{t.language}</Text>
            <Text style={[styles.settingValue, { color: theme.settingValue }]}>English</Text>
          </View>

          {/* Notifications */}
          <View style={[styles.settingRow, styles.settingRowBorder, { borderBottomColor: theme.border }]}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>{t.notifications}</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#ddd', true: GOLD }}
              thumbColor={notifications ? NAVY : '#fff'}
              accessibilityLabel="Toggle notifications"
            />
          </View>

          {/* Dark Mode */}
          <View style={[styles.settingRow, styles.settingRowBorder, { borderBottomColor: theme.border }]}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>{t.darkMode}</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#ddd', true: GOLD }}
              thumbColor={darkMode ? NAVY : '#fff'}
              accessibilityLabel="Toggle dark mode"
            />
          </View>

          {/* Change Password */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setPwVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={t.changePassword}
          >
            <Text style={[styles.settingLabel, { color: theme.text }]}>{t.changePassword}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.settingValue} />
          </TouchableOpacity>
        </View>

        {/* Log Out */}
        <TouchableOpacity
          style={[styles.card, styles.logoutRow, { backgroundColor: theme.card }]}
          onPress={() => setLogoutVisible(true)}
          accessibilityLabel={t.logOut}
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={20} color={RED} />
          <Text style={styles.logoutText}>{t.logOut}</Text>
          <Ionicons name="arrow-forward" size={18} color={RED} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </ScrollView>

      {/* ── Edit Profile modal ── */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)} accessibilityViewIsModal>
        <Pressable style={styles.modalOverlay} onPress={() => setEditVisible(false)}>
          <Pressable style={[styles.pickerSheet, { backgroundColor: theme.card }]} onPress={() => {}}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>{t.editProfile}</Text>

            <Text style={[styles.pwLabel, { color: theme.label }]}>{t.fullName}</Text>
            <TextInput
              style={[styles.pwInput, { backgroundColor: theme.inputBg, color: theme.inputText }]}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Full name"
              placeholderTextColor="#aaa"
              accessibilityLabel="Full name"
            />

            <Text style={[styles.pwLabel, { color: theme.label }]}>{t.email}</Text>
            <TextInput
              style={[styles.pwInput, { backgroundColor: theme.inputBg, color: theme.inputText }]}
              value={draftEmail}
              onChangeText={setDraftEmail}
              placeholder="Email"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email"
            />

            <Text style={[styles.pwLabel, { color: theme.label }]}>{t.phone}</Text>
            <TextInput
              style={[styles.pwInput, { backgroundColor: theme.inputBg, color: theme.inputText }]}
              value={draftPhone}
              onChangeText={setDraftPhone}
              placeholder="Phone number"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
              accessibilityLabel="Phone number"
            />

            <TouchableOpacity style={styles.pwBtn} onPress={saveEdit} accessibilityRole="button" accessibilityLabel={t.saveChanges}>
              <Text style={styles.pwBtnText}>{t.saveChanges}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Change password modal ── */}
      <Modal visible={pwVisible} transparent animationType="slide" onRequestClose={() => setPwVisible(false)} accessibilityViewIsModal>
        <Pressable style={styles.modalOverlay} onPress={() => setPwVisible(false)}>
          <Pressable style={[styles.pickerSheet, { backgroundColor: theme.card }]} onPress={() => {}}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>{t.changePassword}</Text>
            <Text style={[styles.pwLabel, { color: theme.label }]}>{t.currentPw}</Text>
            <TextInput style={[styles.pwInput, { backgroundColor: theme.inputBg, color: theme.inputText }]} value={currentPw} onChangeText={setCurrentPw} secureTextEntry placeholder="••••••••" placeholderTextColor="#aaa" accessibilityLabel={t.currentPw} />
            <Text style={[styles.pwLabel, { color: theme.label }]}>{t.newPw}</Text>
            <TextInput style={[styles.pwInput, { backgroundColor: theme.inputBg, color: theme.inputText }]} value={newPw} onChangeText={setNewPw} secureTextEntry placeholder="••••••••" placeholderTextColor="#aaa" accessibilityLabel={t.newPw} />
            <Text style={[styles.pwLabel, { color: theme.label }]}>{t.confirmPw}</Text>
            <TextInput style={[styles.pwInput, { backgroundColor: theme.inputBg, color: theme.inputText }]} value={confirmPw} onChangeText={setConfirmPw} secureTextEntry placeholder="••••••••" placeholderTextColor="#aaa" accessibilityLabel={t.confirmPw} />
            <TouchableOpacity style={styles.pwBtn} onPress={handleChangePassword} accessibilityRole="button" accessibilityLabel={t.savePw}>
              <Text style={styles.pwBtnText}>{t.savePw}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Logout confirmation modal ── */}
      <Modal visible={logoutVisible} transparent animationType="slide" onRequestClose={() => setLogoutVisible(false)} accessibilityViewIsModal>
        <Pressable style={styles.modalOverlay} onPress={() => setLogoutVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setLogoutVisible(false)} accessibilityLabel="Close" accessibilityRole="button">
              <Ionicons name="close" size={22} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t.logout}</Text>
            <Text style={styles.modalBody}>{t.logoutQuestion}</Text>
            <View style={styles.modalDivider} />
            <TouchableOpacity style={styles.modalLogoutBtn} onPress={handleLogout} accessibilityLabel={t.logout} accessibilityRole="button">
              <Text style={styles.modalLogoutText}>{t.logout}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Questions history modal ── */}
      <Modal
        visible={questionsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQuestionsVisible(false)}
        accessibilityViewIsModal
      >
        <SafeAreaView style={styles.historyModalBackdrop}>
          <View style={[styles.historyModalSheet, { backgroundColor: theme.bg }]}>
            {/* Header */}
            <View style={[styles.historyHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
              <View style={styles.historyTitleWrap}>
                <MaterialCommunityIcons name="chat-question-outline" size={24} color={GOLD} />
                <View>
                  <Text style={styles.historyHeaderTitle}>Questions History</Text>
                  <Text style={styles.historyHeaderSub}>
                    {askedQuestionsHistory.length} {askedQuestionsHistory.length === 1 ? 'question' : 'questions'} recorded
                  </Text>
                </View>
              </View>
              <View style={styles.historyHeaderActions}>
                {askedQuestionsHistory.length > 0 && (
                  <TouchableOpacity
                    style={styles.historyClearBtn}
                    onPress={handleClearQuestions}
                    accessibilityRole="button"
                    accessibilityLabel="Clear questions history"
                  >
                    <Ionicons name="trash-outline" size={16} color={RED} />
                    <Text style={styles.historyClearBtnText}>Clear</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.historyCloseBtn}
                  onPress={() => setQuestionsVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close questions history"
                >
                  <Ionicons name="close" size={22} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content List */}
            {askedQuestionsHistory.length === 0 ? (
              <View style={styles.historyEmptyWrap}>
                <View style={styles.historyEmptyIconWrap}>
                  <MaterialCommunityIcons name="chat-question-outline" size={48} color={GOLD} />
                </View>
                <Text style={[styles.historyEmptyTitle, { color: theme.text }]}>No questions asked yet</Text>
                <Text style={[styles.historyEmptySub, { color: theme.subText }]}>
                  When you ask questions or upload case documents in Constitut AI, your questions and full AI constitutional responses will be saved here for offline review.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.historyScrollView}
                contentContainerStyle={styles.historyListContent}
                showsVerticalScrollIndicator={false}
              >
                {askedQuestionsHistory.map((item) => {
                  const isExpanded = expandedId === item.id;
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.historyCard,
                        { backgroundColor: theme.card, borderColor: theme.border },
                      ]}
                    >
                      {/* Top row: timestamp and delete single item */}
                      <View style={styles.historyCardTopRow}>
                        <View style={styles.historyDateBadge}>
                          <Ionicons name="time-outline" size={12} color={theme.subText} />
                          <Text style={[styles.historyDateText, { color: theme.subText }]}>
                            {formatQuestionDate(item.timestamp)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.historyItemDeleteBtn}
                          onPress={() => handleDeleteQuestion(item.id)}
                          accessibilityRole="button"
                          accessibilityLabel="Delete this question"
                        >
                          <Ionicons name="trash-outline" size={15} color={RED} />
                        </TouchableOpacity>
                      </View>

                      {/* Question text */}
                      <Text style={[styles.historyQuestionText, { color: theme.text }]}>
                        {item.question}
                      </Text>

                      {/* File attachment tag if analyzed file */}
                      {item.fileName ? (
                        <View style={[styles.historyFileTag, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                          <Ionicons name="document-attach-outline" size={14} color={GOLD} />
                          <Text style={[styles.historyFileTagText, { color: theme.inputText }]} numberOfLines={1}>
                            {item.fileName}
                          </Text>
                        </View>
                      ) : null}

                      {/* Toggle AI Analysis button */}
                      <TouchableOpacity
                        style={[styles.historyExpandBtn, { borderColor: theme.border }]}
                        onPress={() => toggleExpand(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel={isExpanded ? 'Hide AI response' : 'View AI response'}
                      >
                        <MaterialCommunityIcons name="robot-outline" size={16} color={GOLD} />
                        <Text style={[styles.historyExpandBtnText, { color: GOLD }]}>
                          {isExpanded ? 'Hide AI Response' : 'View AI Response'}
                        </Text>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={GOLD}
                        />
                      </TouchableOpacity>

                      {/* Expanded AI answer & sources */}
                      {isExpanded ? (
                        <View style={[styles.historyAnswerContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                          <View style={styles.historyAnswerHeader}>
                            <MaterialCommunityIcons name="scale-balance" size={16} color={GOLD} />
                            <Text style={[styles.historyAnswerHeaderText, { color: theme.label }]}>
                              ConstitutAI Analysis
                            </Text>
                          </View>
                          <Text style={[styles.historyAnswerText, { color: theme.inputText }]} selectable>
                            {item.answer || 'No response recorded.'}
                          </Text>

                          {/* Sources / Articles referenced */}
                          {Array.isArray(item.sources) && item.sources.length > 0 ? (
                            <View style={styles.historySourcesWrap}>
                              <Text style={[styles.historySourcesTitle, { color: theme.subText }]}>
                                Referenced Articles:
                              </Text>
                              <View style={styles.historySourcesList}>
                                {item.sources.map((src) => (
                                  <TouchableOpacity
                                    key={src.id || src.number || `${Math.random()}`}
                                    style={[styles.historySourceChip, { borderColor: GOLD, backgroundColor: theme.card }]}
                                    onPress={() => {
                                      setQuestionsVisible(false);
                                      navigation.navigate('ArticleDetail', {
                                        articleId: src.id,
                                        chapterId: src.chapterId,
                                      });
                                    }}
                                    accessibilityRole="button"
                                    accessibilityLabel={`View Article ${src.number}`}
                                  >
                                    <Text style={styles.historySourceChipText}>
                                      Art. {src.number}
                                    </Text>
                                    <Ionicons name="arrow-forward" size={10} color={GOLD} style={{ marginLeft: 3 }} />
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginBottom: 20,
  },
  headerTitle: { color: '#ffffff', fontSize: 22, fontWeight: '700' },
  editBtn: {
    borderWidth: 1,
    borderColor: '#3a4f72',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  editText: { color: '#8a9bbf', fontSize: 13 },
  avatarWrap: { alignItems: 'center', gap: 10 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: NAVY, fontWeight: '800', fontSize: 24 },
  profileName: { color: '#ffffff', fontSize: 17, fontWeight: '600' },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 32, gap: 14 },
  card: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: { paddingVertical: 14 },
  infoLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 13 },
  cardDivider: { height: 1 },
  statsCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 18, fontWeight: '700', color: GOLD },
  statLabel: { fontSize: 11, textAlign: 'center' },
  statDivider: { width: 1, height: 48 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginLeft: 4, marginBottom: -4 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingRowBorder: { borderBottomWidth: 1 },
  settingLabel: { fontSize: 14, fontWeight: '500' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { fontSize: 13 },
  logoutRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12 },
  logoutText: { fontSize: 15, fontWeight: '600', color: RED },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  langText: { fontSize: 15 },
  langTextActive: { color: NAVY, fontWeight: '700' },
  pwLabel: { fontSize: 13, marginBottom: 6, marginTop: 10 },
  pwInput: {
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 4,
  },
  pwBtn: {
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  pwBtnText: { color: GOLD, fontSize: 15, fontWeight: '700' },
  modalSheet: {
    backgroundColor: INDIGO,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 28,
    paddingBottom: 0,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  modalBody: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 32,
  },
  modalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: -28 },
  modalLogoutBtn: {
    backgroundColor: '#f5f5f5',
    marginHorizontal: -28,
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalLogoutText: { color: '#1a1a2e', fontSize: 17, fontWeight: '700' },
  statItemClickable: {
    position: 'relative',
  },
  viewBadge: {
    marginTop: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(201, 168, 76, 0.15)',
  },
  viewBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.3,
  },
  historyModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  historyModalSheet: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  historyTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyHeaderTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  historyHeaderSub: {
    color: '#8a9bbf',
    fontSize: 12,
    marginTop: 2,
  },
  historyHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(229, 57, 53, 0.12)',
  },
  historyClearBtnText: {
    color: RED,
    fontSize: 12,
    fontWeight: '600',
  },
  historyCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyEmptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  historyEmptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  historyEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  historyEmptySub: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  historyScrollView: {
    flex: 1,
  },
  historyListContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  historyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    gap: 10,
  },
  historyCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  historyDateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  historyItemDeleteBtn: {
    padding: 4,
  },
  historyQuestionText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  historyFileTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '90%',
  },
  historyFileTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
  },
  historyExpandBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyAnswerContainer: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  historyAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyAnswerHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  historyAnswerText: {
    fontSize: 13.5,
    lineHeight: 21,
  },
  historySourcesWrap: {
    marginTop: 4,
    gap: 6,
  },
  historySourcesTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  historySourcesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  historySourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  historySourceChipText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '700',
  },
});
