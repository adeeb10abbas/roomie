import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By downloading or using RoomieMatch, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.',
  },
  {
    title: '2. Eligibility',
    body: 'You must be at least 18 years old to use RoomieMatch. By using the app, you represent and warrant that you meet this requirement.',
  },
  {
    title: '3. Your Account',
    body: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and complete information when creating your profile.',
  },
  {
    title: '4. User Conduct',
    body: 'You agree not to use RoomieMatch to harass, harm, or deceive other users. Impersonation, spam, and abusive behavior are strictly prohibited and may result in account termination.',
  },
  {
    title: '5. Content',
    body: 'You retain ownership of content you submit. By posting content, you grant RoomieMatch a non-exclusive license to display it within the app. You are responsible for ensuring your content does not violate any third-party rights.',
  },
  {
    title: '6. Disclaimer',
    body: 'RoomieMatch is provided "as is" without warranties of any kind. We do not guarantee the accuracy of user profiles or the outcome of any roommate arrangement.',
  },
  {
    title: '7. Limitation of Liability',
    body: 'RoomieMatch shall not be liable for any indirect, incidental, or consequential damages arising from your use of the app.',
  },
  {
    title: '8. Changes to Terms',
    body: 'We may update these Terms from time to time. Continued use of the app after changes constitutes acceptance of the updated Terms.',
  },
  {
    title: '9. Contact',
    body: 'If you have questions about these Terms, please contact us at legal@roomiematch.app.',
  },
];

export default function TermsScreen() {
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
        Welcome to RoomieMatch. These Terms of Service govern your use of our app and services.
        Please read them carefully before using the app.
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
