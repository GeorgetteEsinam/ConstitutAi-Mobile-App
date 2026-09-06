import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

const NAVY = '#0f1f3d';
const GOLD = '#c9a84c';
const PURPLE = '#4a3fa0';

function FeatureCard({ children, iconBg, title, subtitle, onPress, theme }) {
  return (
    <TouchableOpacity
      style={[styles.featureCard, { backgroundColor: theme.card }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.featureIconWrap, { backgroundColor: iconBg }]}>
        {children}
      </View>
      <Text style={[styles.featureTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.featureSubtitle, { color: theme.subText }]}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }) {
  const { theme, darkMode, savedArticles, userName } = useAppContext();

  // First name only for the greeting
  const firstName = userName ? userName.split(' ')[0] : 'there';

  // Avatar initials from full name
  const initials = userName
    ? userName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'GK';
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style="light" />

      {/* Navy header */}
      <SafeAreaView style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>
          <View style={styles.headerRight}>
            
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
        </View>

        {/* Search bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
          accessibilityLabel="Search articles and chapters"
          accessibilityRole="search"
        >
          <Ionicons name="search-outline" size={16} color="#8a9bbf" />
          <Text style={styles.searchPlaceholder}>Search articles, chapters...</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Body */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats chips */}
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: theme.card }]}
            onPress={() => navigation.navigate('Chapters')}
            accessibilityRole="button"
            accessibilityLabel="Browse all 26 chapters"
          >
            <View style={[styles.chipDot, { backgroundColor: GOLD }]} />
            <Text style={[styles.chipText, { color: theme.text }]}>26 chapters</Text>
            <Ionicons name="chevron-forward" size={13} color={theme.subText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: theme.card }]}
            onPress={() => navigation.navigate('Saved')}
            accessibilityRole="button"
            accessibilityLabel={`View ${savedArticles.length} saved bookmarks`}
          >
            <View style={[styles.chipDot, { backgroundColor: PURPLE }]} />
            <Text style={[styles.chipText, { color: theme.text }]}>
              {savedArticles.length} bookmark{savedArticles.length !== 1 ? 's' : ''}
            </Text>
            <Ionicons name="chevron-forward" size={13} color={theme.subText} />
          </TouchableOpacity>
        </View>

        {/* Feature grid */}
        <View style={styles.grid}>
          <FeatureCard iconBg="#ede9fb" title="Ask AI" subtitle="Ask a question" onPress={() => navigation.navigate('AskAI')} theme={theme}>
            <MaterialCommunityIcons name="robot-outline" size={24} color={PURPLE} />
          </FeatureCard>

          <FeatureCard
            iconBg="#e8eef8"
            title="Search"
            subtitle="Find articles"
            onPress={() => navigation.navigate('Search')}
            theme={theme}
          >
            <Ionicons name="search-outline" size={24} color={NAVY} />
          </FeatureCard>

          <FeatureCard iconBg="#e8eef8" title="Explore" subtitle="All 26 chapters" onPress={() => navigation.navigate('Chapters')} theme={theme}>
            <Ionicons name="book-outline" size={24} color={NAVY} />
          </FeatureCard>

          <FeatureCard iconBg="#fdecea" title="Saved" subtitle="Bookmarks & notes" onPress={() => navigation.navigate('Saved')} theme={theme}>
            <Ionicons name="bookmark-outline" size={24} color="#c0392b" />
          </FeatureCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    marginBottom: 16,
  },
  greeting: {
    color: '#8a9bbf',
    fontSize: 14,
  },
  userName: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  searchPlaceholder: {
    color: '#8a9bbf',
    fontSize: 14,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 32,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chipText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  featureCard: {
    borderRadius: 16,
    padding: 20,
    width: '47%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 12,
    color: '#888',
  },
});
