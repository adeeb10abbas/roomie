import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type Step = 'email' | 'code' | 'success';

export default function VerifyEduScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { requestVerification, confirmVerification, resendVerification, verificationStatus } = useApp();

  const [step, setStep] = useState<Step>('email');
  const [eduEmail, setEduEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (verificationStatus?.isVerified) {
      setStep('success');
    } else if (verificationStatus?.pendingRequest) {
      setStep('code');
      if (verificationStatus.eduEmail) setEduEmail(verificationStatus.eduEmail);
    }
  }, [verificationStatus]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCooldown = () => {
    setResendCooldown(60);
    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestCode = async () => {
    if (!eduEmail.includes('@') || !eduEmail.toLowerCase().includes('.edu')) {
      setError('Please enter a valid .edu email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await requestVerification(eduEmail.trim().toLowerCase());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('code');
      startCooldown();
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('edu_required')) {
        setError('Only .edu email addresses are accepted');
      } else if (msg.includes('rate_limited')) {
        setError('Please wait 1 minute before requesting another code');
        startCooldown();
        setStep('code');
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length !== 6 || !/^\d+$/.test(trimmedCode)) {
      setError('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await confirmVerification(trimmedCode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('success');
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('invalid_code')) {
        setError('Incorrect code. Please try again.');
      } else if (msg.includes('no_pending')) {
        setError('No pending verification. Please request a new code.');
        setStep('email');
      } else if (msg.includes('max_attempts')) {
        setError('Too many attempts. Please request a new code.');
        setStep('email');
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      await resendVerification();
      startCooldown();
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.iconRow}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
            <Feather name="shield" size={32} color={colors.primary} />
          </View>
        </View>

        {step === 'email' && (
          <>
            <Text style={[styles.title, { color: colors.foreground }]}>Verify Student Status</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Enter your .edu email to unlock all features and show a verified badge on your profile.
            </Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="you@university.edu"
              placeholderTextColor={colors.mutedForeground}
              value={eduEmail}
              onChangeText={setEduEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {!!error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={handleRequestCode}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.btnText}>Send Verification Code</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {step === 'code' && (
          <>
            <Text style={[styles.title, { color: colors.foreground }]}>Enter Your Code</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              We sent a 6-digit code to{'\n'}
              <Text style={{ fontWeight: '600', color: colors.foreground }}>{eduEmail || 'your .edu email'}</Text>
            </Text>
            <TextInput
              style={[styles.codeInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="000000"
              placeholderTextColor={colors.mutedForeground}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            {!!error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={handleConfirmCode}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.btnText}>Verify</Text>
              )}
            </TouchableOpacity>
            <View style={styles.resendRow}>
              <Text style={{ color: colors.mutedForeground }}>Didn't get it? </Text>
              <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0 || loading}>
                <Text style={{ color: resendCooldown > 0 ? colors.mutedForeground : colors.primary, fontWeight: '600' }}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => { setStep('email'); setCode(''); setError(''); }}>
              <Text style={[styles.link, { color: colors.primary }]}>Use a different email</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'success' && (
          <>
            <View style={[styles.successIcon, { backgroundColor: colors.successLight }]}>
              <Feather name="check-circle" size={40} color={colors.successDark} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>You're Verified! 🎓</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Your student status has been verified. A verified badge will now appear on your profile.
            </Text>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={handleDone}
            >
              <Text style={styles.btnText}>Continue</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, alignItems: 'stretch' },
  back: { marginBottom: 24 },
  iconRow: { alignItems: 'center', marginBottom: 24 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  input: {
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, marginBottom: 12,
  },
  codeInput: {
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 18,
    fontSize: 28, fontWeight: '700', textAlign: 'center', letterSpacing: 8, marginBottom: 12,
  },
  error: { fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 16,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  link: { textAlign: 'center', fontSize: 14, fontWeight: '500', marginTop: 4 },
});
