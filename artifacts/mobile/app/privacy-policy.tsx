import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'We collect information you provide directly, such as your name, age, gender, university, lifestyle preferences, and profile photo. We also collect usage data and device identifiers to improve the app.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'We use your information to match you with compatible roommates, display your profile to other users, send notifications about matches and messages, and improve our services.',
  },
  {
    title: '3. Profile Visibility',
    body: 'Your profile is visible to other registered users of RoomieMatch. You can control certain visibility settings in the app. Deactivating your account hides your profile from the discover feed.',
  },
  {
    title: '4. Data Sharing',
    body: 'We do not sell your personal data. We may share data with service providers who help us operate the app (e.g. hosting, analytics). We may disclose data when required by law.',
  },
  {
    title: '5. Data Retention',
    body: 'We retain your data while your account is active. You may delete your account at any time, after which we will delete your personal data within 30 days, except where retention is required by law.',
  },
  {
    title: '6. Security',
    body: 'We use industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.',
  },
  {
    title: '7. Student Email Verification',
    body: 'If you verify your student email address, we store the domain (e.g. .edu) to display your verified badge. We do not store your full email address beyond what is necessary for verification.',
  },
  {
    title: '8. Your Rights',
    body: 'You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at privacy@roomiematch.app or use the account management features in the app.',
  },
  {
    title: '9. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or by email.',
  },
  {
    title: '10. Contact Us',
    body: 'If you have questions about this Privacy Policy, please contact us at privacy@roomiematch.app.',
  },
];

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom + 24;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>Last updated: May 2026</Text>
      <Text style={[styles.intro, { color: colors.foreground }]}>
        RoomieMatch is committed to protecting your privacy. This Privacy Policy explains how we collect,
        use, and safeguard your information when you use our app.
      </Text>
      {SECTIONS.map((s) => (
        <View key={s.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{s.title}</Text>
          <Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>{s.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  lastUpdated: { fontSize: 12, marginBottom: 12 },
  intro: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  sectionBody: { fontSize: 14, lineHeight: 22 },
});
