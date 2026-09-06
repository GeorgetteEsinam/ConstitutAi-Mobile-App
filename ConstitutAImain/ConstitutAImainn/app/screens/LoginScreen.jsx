import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { API } from '../config/api';
import { useAppContext } from '../context/AppContext';

// Finishes the auth session if the user is redirected back
WebBrowser.maybeCompleteAuthSession();

// ─────────────────────────────────────────────────────────────
// REPLACE these with your actual Google OAuth Client IDs.
// Get them at: https://console.cloud.google.com/
// ─────────────────────────────────────────────────────────────
const GOOGLE_EXPO_CLIENT_ID = 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';
// ─────────────────────────────────────────────────────────────

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn } = useAppContext();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_EXPO_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    redirectUri: makeRedirectUri({ useProxy: true }),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      fetchGoogleUser(authentication.accessToken);
    } else if (response?.type === 'error') {
      setGoogleLoading(false);
      Alert.alert('Google Sign-In Failed', response.error?.message ?? 'Something went wrong.');
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      setGoogleLoading(false);
    }
  }, [response]);

  const fetchGoogleUser = async (accessToken) => {
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const user = await res.json();
      setGoogleLoading(false);
      // TODO: pass user info to your auth context / backend here
      Alert.alert('Signed in!', `Welcome, ${user.name}`);
    } catch {
      setGoogleLoading(false);
      Alert.alert('Error', 'Could not fetch your Google profile.');
    }
  };

  const handleGoogleSignIn = async () => {
    if (GOOGLE_EXPO_CLIENT_ID === 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com') {
      Alert.alert(
        'Setup Required',
        'Add your Google Client IDs in LoginScreen.jsx to enable Google Sign-In.'
      );
      return;
    }
    setGoogleLoading(true);
    await promptAsync();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    
    try {
      const response = await fetch(API.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (!response.ok) {
        Alert.alert('Login Failed', data.error || 'Something went wrong');
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
          name: userData?.name ?? userData?.fullName ?? userData?.username ?? '',
          email: userData?.email ?? email,
        },
      });
      
      // Successful login
      navigation.replace('Main');
    } catch (error) {
      Alert.alert('Network Error', 'Could not connect to the backend server. Make sure it is running.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
          {/* Logo header */}
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>⚖</Text>
            </View>
            <Text style={styles.logoText}>ConstitutAI</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>
            Don't have an account?{' '}
            <Text
              style={styles.link}
              onPress={() => navigation.navigate('SignUp')}
              accessibilityRole="link"
            >
              Sign up
            </Text>
          </Text>

          {/* Form */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#888"
            accessibilityLabel="Email address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#888"
            accessibilityLabel="Password"
          />

          <TouchableOpacity accessibilityLabel="Forgot password" accessibilityRole="button">
            <Text style={styles.forgotText}>Forget Password?</Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            accessibilityLabel="Log in"
            accessibilityRole="button"
          >
            <Text style={styles.loginBtnText}>Log In</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google button */}
          <TouchableOpacity
            style={[styles.googleBtn, googleLoading && styles.googleBtnDisabled]}
            onPress={handleGoogleSignIn}
            disabled={!request || googleLoading}
            accessibilityLabel="Continue with Google"
            accessibilityRole="button"
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.googleText}>Continue with Google</Text>
              </>
            )}
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
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    marginBottom: 36,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 22,
    color: GOLD,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: NAVY,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 8,
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
  forgotText: {
    color: GOLD,
    textAlign: 'right',
    fontSize: 13,
    marginBottom: 24,
  },
  loginBtn: {
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 28,
  },
  loginBtnText: {
    color: GOLD,
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  dividerText: {
    color: '#888',
    fontSize: 13,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8e8e8',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
    minHeight: 50,
  },
  googleBtnDisabled: {
    opacity: 0.7,
  },
  googleG: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
});
