import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API } from '../config/api';
import { useAppContext } from '../context/AppContext';
import BackButton from '../components/BackButton';

export default function SignUpScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const { signIn } = useAppContext();

  const handleSignUp = async () => {
    if (!agreed) {
      Alert.alert('Terms Required', 'You must agree to the Terms of Use and Privacy Policy.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    
    try {
      const response = await fetch(API.signup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, email, password }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        Alert.alert('Signup Failed', data.error || 'Something went wrong');
        return;
      }

      const userData = data.user ?? data;
      const authToken = data.token ?? data.accessToken ?? data.authToken ?? null;
      const refreshTokenValue = data.refreshToken ?? data.refresh_token ?? null;

      signIn({
        token: authToken,
        refreshToken: refreshTokenValue,
        user: {
          id: userData?.id ?? userData?._id ?? userData?.userId ?? null,
          name: userData?.name ?? userData?.fullName ?? fullName,
          email: userData?.email ?? email,
        },
      });
      
      Alert.alert('Success', 'Account created successfully!');
      navigation.replace('Main');
    } catch (error) {
      Alert.alert('Network Error', 'Could not connect to the backend server. Make sure it is running.');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <BackButton navigation={navigation} color="#0f1f3d" style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </BackButton>

          {/* Title */}
          <Text style={styles.title}>Create{'\n'}Account</Text>
          <Text style={styles.subtitle}>
            Already have an account?{' '}
            <Text
              style={styles.link}
              onPress={() => navigation.navigate('Login')}
              accessibilityRole="link"
            >
              Log in
            </Text>
          </Text>

          {/* Form */}
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            placeholder=""
            placeholderTextColor="#888"
            accessibilityLabel="Full name"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder=""
            placeholderTextColor="#888"
            accessibilityLabel="Email address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder=""
            placeholderTextColor="#888"
            accessibilityLabel="Password"
          />

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder=""
            placeholderTextColor="#888"
            accessibilityLabel="Confirm password"
          />

          {/* Terms checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreed(!agreed)}
            accessibilityLabel="Agree to terms of use and privacy policy"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.link}>Terms of Use</Text>
              {'  '}and{'\n'}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          {/* Sign Up button */}
          <TouchableOpacity
            style={styles.signUpBtn}
            onPress={handleSignUp}
            accessibilityLabel="Sign up"
            accessibilityRole="button"
          >
            <Text style={styles.signUpBtnText}>Sign Up</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const NAVY = '#0f1f3d';
const GOLD = '#c9a84c';
const BG = '#f0f2f5';
const INPUT_BG = '#4a4a4a';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 28,
  },
  backArrow: {
    fontSize: 20,
    color: '#333',
    lineHeight: 22,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: NAVY,
    lineHeight: 48,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 28,
  },
  link: {
    color: GOLD,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 15,
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 28,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: NAVY,
  },
  checkmark: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 13,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },
  signUpBtn: {
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signUpBtnText: {
    color: GOLD,
    fontSize: 16,
    fontWeight: '700',
  },
});
