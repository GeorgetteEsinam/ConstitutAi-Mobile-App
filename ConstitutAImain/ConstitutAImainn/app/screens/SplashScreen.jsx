import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '../context/AppContext';

const NAVY = '#0f1f3d';
const GOLD = '#c9a84c';

function AnimatedDot({ delay }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.4, duration: 400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4, duration: 400, useNativeDriver: true }),
        ]),
        Animated.delay(800),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [delay, scale, opacity]);

  return (
    <Animated.View style={[styles.dot, { transform: [{ scale }], opacity }]} />
  );
}

export default function SplashScreen({ navigation }) {
  const { onboardingDone } = useAppContext();

  useEffect(() => {
    const timer = setTimeout(() => {
      // If user has already seen onboarding, go straight to Login
      if (onboardingDone) {
        navigation.replace('Login');
      } else {
        navigation.replace('Onboarding1');
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, [navigation, onboardingDone]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.logoCircle}>
        <Text style={styles.logoIcon}>⚖</Text>
      </View>
      <Text style={styles.appName}>ConstitutAI</Text>
      <Text style={styles.tagline}>Constitutional Legal Assistant</Text>
      <View style={styles.dotsRow}>
        <AnimatedDot delay={0} />
        <AnimatedDot delay={200} />
        <AnimatedDot delay={400} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logoIcon: {
    fontSize: 48,
    color: NAVY,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#8a9bbf',
    marginBottom: 40,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: GOLD,
  },
});
