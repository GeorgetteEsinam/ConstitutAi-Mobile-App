import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import BackButton from '../components/BackButton';

export default function Onboarding2Screen({ navigation }) {
  const { markOnboardingDone } = useAppContext();

  const handleGetStarted = () => {
    markOnboardingDone(); // flag so onboarding is skipped on future launches
    navigation.replace('Login');
  };
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>⚖</Text>
          </View>
          <Text style={styles.logoText}>ConstitutAI</Text>
        </View>
        <BackButton navigation={navigation} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </BackButton>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <Text style={styles.heading}>
          Study{'\n'}
          <Text style={styles.headingGold}>Smarter,{'\n'}</Text>
          Not Harder
        </Text>
        <Text style={styles.subtext}>
          Bookmark articles, write notes{'\n'}
          and get AI summaries to help{'\n'}
          with your legal studies.
        </Text>
      </View>

      {/* Bottom */}
      <View style={styles.bottom}>
        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>
        <TouchableOpacity
          style={styles.getStartedBtn}
          onPress={handleGetStarted}
          accessibilityLabel="Get started"
          accessibilityRole="button"
        >
          <Text style={styles.getStartedText}>Get Started  →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const NAVY = '#0b1628';
const GOLD = '#c9a84c';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAVY,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 20,
    color: NAVY,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backBtn: {
    borderWidth: 1,
    borderColor: '#3a4f72',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  backText: {
    color: '#8a9bbf',
    fontSize: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 56,
    marginBottom: 20,
  },
  headingGold: {
    color: GOLD,
  },
  subtext: {
    fontSize: 15,
    color: '#8a9bbf',
    lineHeight: 24,
  },
  bottom: {
    paddingBottom: 40,
    gap: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3a4f72',
  },
  dotActive: {
    backgroundColor: GOLD,
    width: 40,
  },
  getStartedBtn: {
    backgroundColor: GOLD,
    borderRadius: 32,
    paddingVertical: 18,
    alignItems: 'center',
  },
  getStartedText: {
    color: '#0b1628',
    fontSize: 17,
    fontWeight: '700',
  },
});
