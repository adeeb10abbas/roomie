import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';

const FAQS = [
  {
    q: 'How does RoomieMatch work?',
    a: 'RoomieMatch uses a compatibility score based on lifestyle preferences to match you with potential roommates. Swipe right to like, left to skip, or up to shortlist. When both users like each other, it\'s a match!',
  },
  {
    q: 'What is the verified student badge?',
    a: 'The verified student badge appears when you confirm your enrollment with a .edu email address. It builds trust with other users and unlocks all matching features.',
  },
  {
    q: 'How is the compatibility score calculated?',
    a: 'Your score (0–100) is based on sleep schedule, cleanliness, noise preference, smoking/drinking habits, pet preferences, budget overlap, and communication style.',
  },
  {
    q: 'Can I unmatch someone?',
    a: 'Yes. Open the chat with that person, tap the "..." menu in the top right, and select "Unmatch". This removes the match and all messages.',
  },
  {
    q: 'How do I block or report someone?',
    a: 'Open the user\'s profile or the chat, tap the "..." menu, and select "Block" or "Report". Blocked users can\'t see or contact you.',
  },
  {
    q: 'What\'s the difference between Open Rooms and Forming Groups?',
    a: 'Open Rooms are existing places with a spare room. Forming Groups are people building a roommate group before finding a place.',
  },
  {
    q: 'Can I pause my account?',
    a: 'Yes. Go to Settings → Account Management → Deactivate Account. Your profile is hidden but your data is preserved. You can reactivate anytime.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Settings → Delete Account. This permanently removes all your data, matches, and messages. This cannot be undone.',
  },
];

export default function HelpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {/* Contact */}
        <View style={[styles.contactCard, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}>
          <Feather name="mail" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.contactTitle, { color: colors.foreground }]}>Contact Us</Text>
            <Text style={[styles.contactSub, { color: colors.mutedForeground }]}>hello@roomiematch.app</Text>
          </View>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:hello@roomiematch.app')}>
            <Text style={[styles.contactLink, { color: colors.primary }]}>Email</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>FREQUENTLY ASKED QUESTIONS</Text>

        <View style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {FAQS.map((faq, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.faqRow, { borderBottomColor: colors.border }, i === FAQS.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => setExpanded(expanded === i ? null : i)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQ, { color: colors.foreground, flex: 1 }]}>{faq.q}</Text>
                <Feather
                  name={expanded === i ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.mutedForeground}
                />
              </View>
              {expanded === i && (
                <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{faq.a}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '700' },
  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 24,
  },
  contactTitle: { fontSize: 15, fontWeight: '600' },
  contactSub: { fontSize: 13, marginTop: 1 },
  contactLink: { fontSize: 14, fontWeight: '600' },
  sectionTitle: {
    fontSize: 12, fontWeight: '600', letterSpacing: 0.5,
    marginBottom: 8, marginLeft: 4,
  },
  faqCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  faqRow: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  faqQ: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  faqA: { fontSize: 13, lineHeight: 19, marginTop: 8 },
});
