import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, oauthSignIn } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top + 24;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom + 24;

  const canSubmit = email.trim().length > 0 && password.length >= 8;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.hasProfile) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      const clean = msg.replace(/^API error \d+: /, '');
      try {
        const parsed = JSON.parse(clean);
        Alert.alert('Login Failed', parsed.error ?? 'Invalid email or password');
      } catch {
        Alert.alert('Login Failed', 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      Alert.alert(
        'Google Sign-In',
        'Google Sign-In is not configured yet. Please use email and password.',
      );
      return;
    }

    setOauthLoading('google');
    try {
      const AuthSession = await import('expo-auth-session').catch(() => null);
      if (!AuthSession) {
        Alert.alert('Google Sign-In', 'Google Sign-In is not available on this platform.');
        setOauthLoading(null);
        return;
      }
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'roomiematch' });
      const request = new AuthSession.AuthRequest({
        clientId: googleClientId,
        redirectUri,
        scopes: ['openid', 'email', 'profile'],
        responseType: AuthSession.ResponseType.IdToken,
        extraParams: { nonce: Math.random().toString(36) },
      });
      const discovery = { authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth' };
      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.params?.id_token) {
        const authResult = await oauthSignIn('google', result.params.id_token);
        router.replace(authResult.hasProfile ? '/(tabs)' : '/onboarding');
      }
    } catch {
      Alert.alert('Google Sign-In Failed', 'Could not complete Google sign-in. Please try again.');
    } finally {
      setOauthLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert(
        'Apple Sign-In',
        'Apple Sign-In is available on iOS devices only.',
      );
      return;
    }
    setOauthLoading('apple');
    try {
      const AppleAuthentication = await import('expo-apple-authentication').catch(() => null);
      if (!AppleAuthentication) {
        Alert.alert('Apple Sign-In', 'Apple Sign-In is not available in this build.');
        return;
      }
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        const displayName = credential.fullName?.givenName
          ? `${credential.fullName.givenName} ${credential.fullName.familyName ?? ''}`.trim()
          : undefined;
        const authResult = await oauthSignIn('apple', credential.identityToken, displayName);
        router.replace(authResult.hasProfile ? '/(tabs)' : '/onboarding');
      }
    } catch (err: any) {
      if (err?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Sign-In Failed', 'Could not complete Apple sign-in. Please try again.');
      }
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPadding, paddingBottom: bottomPadding }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo/Brand */}
        <View style={styles.brandRow}>
          <Text style={[styles.brandText, { color: colors.foreground }]}>Roomie</Text>
          <View style={[styles.aiBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Find your perfect roommate</Text>

        {/* OAuth Buttons */}
        <TouchableOpacity
          style={[styles.oauthBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleGoogleSignIn}
          disabled={!!oauthLoading}
        >
          {oauthLoading === 'google' ? (
            <ActivityIndicator size="small" color={colors.foreground} />
          ) : (
            <Feather name="globe" size={18} color={colors.foreground} />
          )}
          <Text style={[styles.oauthBtnText, { color: colors.foreground }]}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.oauthBtn, { backgroundColor: colors.foreground, borderColor: colors.foreground }]}
          onPress={handleAppleSignIn}
          disabled={!!oauthLoading}
        >
          {oauthLoading === 'apple' ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Feather name="smartphone" size={18} color="#FFF" />
          )}
          <Text style={[styles.oauthBtnText, { color: '#FFF' }]}>Continue with Apple</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Welcome back</Text>
          <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>Sign in with email</Text>

          <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
          />

          <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            autoComplete="current-password"
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
          />

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: canSubmit && !loading ? colors.primary : colors.muted }]}
            onPress={handleLogin}
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.btnText, { color: canSubmit ? colors.primaryForeground : colors.mutedForeground }]}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.switchText, { color: colors.mutedForeground }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/register')}>
            <Text style={[styles.switchLink, { color: colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.legalRow}>
          <TouchableOpacity onPress={() => router.push('/terms')}>
            <Text style={[styles.legalLink, { color: colors.mutedForeground }]}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={[styles.legalDot, { color: colors.mutedForeground }]}>·</Text>
          <TouchableOpacity onPress={() => router.push('/privacy-policy')}>
            <Text style={[styles.legalLink, { color: colors.mutedForeground }]}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, alignItems: 'stretch' },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8, gap: 8 },
  brandText: { fontSize: 36, fontWeight: '800' },
  aiBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  aiBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  tagline: { fontSize: 15, textAlign: 'center', marginBottom: 24 },
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  oauthBtnText: { fontSize: 15, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 12 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  btn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  btnText: { fontSize: 16, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText: { fontSize: 14 },
  switchLink: { fontSize: 14, fontWeight: '700' },
  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 6 },
  legalLink: { fontSize: 12 },
  legalDot: { fontSize: 12 },
});
