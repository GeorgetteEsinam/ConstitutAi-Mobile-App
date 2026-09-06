import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import BackButton from '../components/BackButton';

const NAVY = '#0f1f3d';
const GOLD = '#c9a84c';

// All 26 chapters of Ghana's 1992 Constitution
const CHAPTERS = [
  { id: '1',  number: 1,  title: 'The Republic',                                        articles: 3  },
  { id: '2',  number: 2,  title: 'Territories of Ghana',                                articles: 2  },
  { id: '3',  number: 3,  title: 'Citizenship',                                         articles: 5  },
  { id: '4',  number: 4,  title: 'The Laws of Ghana',                                   articles: 1  },
  { id: '5',  number: 5,  title: 'Fundamental Human Rights and Freedoms',               articles: 23 },
  { id: '6',  number: 6,  title: 'The Directive Principles of State Policy',            articles: 22 },
  { id: '7',  number: 7,  title: 'Representation of the People',                        articles: 14 },
  { id: '8',  number: 8,  title: 'The Executive',                                       articles: 12 },
  { id: '9',  number: 9,  title: 'The Legislature',                                     articles: 31 },
  { id: '10', number: 10, title: 'The Judiciary',                                       articles: 33 },
  { id: '11', number: 11, title: 'Local Government',                                    articles: 14 },
  { id: '12', number: 12, title: 'Chieftaincy',                                         articles: 8  },
  { id: '13', number: 13, title: 'Land',                                                articles: 11 },
  { id: '14', number: 14, title: 'Finance',                                             articles: 18 },
  { id: '15', number: 15, title: 'The Public Services',                                 articles: 18 },
  { id: '16', number: 16, title: 'Defence and Security',                                articles: 17 },
  { id: '17', number: 17, title: 'Commissions of Inquiry',                              articles: 7  },
  { id: '18', number: 18, title: 'Freedom and Independence of the Media',               articles: 7  },
  { id: '19', number: 19, title: 'Offices of the Republic',                             articles: 8  },
  { id: '20', number: 20, title: 'Decentralization and Local Government',               articles: 5  },
  { id: '21', number: 21, title: 'Transitional and Consequential Provisions',           articles: 16 },
  { id: '22', number: 22, title: 'Miscellaneous',                                       articles: 7  },
  { id: '23', number: 23, title: 'Code of Conduct for Public Officers',                 articles: 4  },
  { id: '24', number: 24, title: 'Transitional Provisions',                             articles: 5  },
  { id: '25', number: 25, title: 'Interpretation',                                      articles: 5  },
  { id: '26', number: 26, title: 'Supplementary and Miscellaneous Provisions',          articles: 3  },
];

function ChapterRow({ item, theme, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
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
          {item.articles} article{item.articles !== 1 ? 's' : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.subText} />
    </TouchableOpacity>
  );
}

export default function ChaptersScreen({ navigation }) {
  const { theme } = useAppContext();
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? CHAPTERS.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          String(c.number).includes(query)
      )
    : CHAPTERS;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style="light" />

      {/* Header */}
      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerRow}>
          <BackButton navigation={navigation} />
          <View>
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChapterRow
            item={item}
            theme={theme}
            onPress={() => navigation.navigate('Articles', { chapterId: item.id })}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, marginBottom: 14, gap: 14 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
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
});
