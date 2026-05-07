import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import Badge from '@/components/Badge';
import { getProfileImage } from '@/utils/images';

const LIFESTYLE_LABELS: Record<string, string> = {
  early_bird: 'Early Bird',
  night_owl: 'Night Owl',
  flexible: 'Flexible Schedule',
  quiet: 'Quiet',
  moderate: 'Moderate',
  social: 'Social',
  never: 'Non-drinker',
  socially: 'Social Drinker',
  regularly: 'Regular Drinker',
  rarely: 'Guests Rarely',
  sometimes: 'Guests Sometimes',
  often: 'Guests Often',
  direct: 'Direct Communicator',
  laid_back: 'Laid-back',
  reserved: 'Reserved',
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, swipeActions, matches } = useApp();

  const topPadding = Platform.OS === 'web' ? 67 : insets.top + 8;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom + 80;

  if (!currentUser) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.empty, { paddingTop: topPadding }]}>
          <Feather name="user" size={52} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No profile yet</Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/onboarding')}
          >
            <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const likes = swipeActions.filter(a => a.action === 'like').length;
  const skips = swipeActions.filter(a => a.action === 'skip').length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/edit-profile')}
          >
            <Feather name="edit-2" size={17} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/settings')}
          >
            <Feather name="settings" size={17} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar + Info */}
      <View style={styles.profileTop}>
        <View style={styles.avatarWrapper}>
          <Image
            source={getProfileImage(currentUser.photoIndex)}
            style={styles.avatar}
            contentFit="cover"
          />
          {currentUser.isVerified && (
            <View style={[styles.verifiedDot, { backgroundColor: '#2563EB' }]}>
              <Feather name="check" size={10} color="#FFFFFF" />
            </View>
          )}
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {currentUser.name}, {currentUser.age}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {currentUser.occupation} · {currentUser.university}
        </Text>
        <Text style={[styles.location, { color: colors.mutedForeground }]}>
          <Feather name="map-pin" size={12} /> {currentUser.location}
        </Text>
      </View>

      {/* Badges */}
      <View style={styles.badgesRow}>
        {currentUser.badges.map(b => (
          <Badge key={b} type={b} />
        ))}
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{matches.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Matches</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: colors.like }]}>{likes}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Liked</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: colors.mutedForeground }]}>{skips}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Passed</Text>
        </View>
      </View>

      {/* Bio */}
      <Section title="About Me" colors={colors}>
        <Text style={[styles.bio, { color: colors.foreground }]}>{currentUser.bio}</Text>
      </Section>

      {/* Budget & Timeline */}
      <Section title="Living Preferences" colors={colors}>
        <Row icon="dollar-sign" label="Budget" value={`$${currentUser.budgetMin.toLocaleString()} – $${currentUser.budgetMax.toLocaleString()}/mo`} colors={colors} />
        <Row icon="calendar" label="Move-in" value={currentUser.moveInDate} colors={colors} />
        <Row icon="map-pin" label="Neighborhoods" value={currentUser.neighborhoods.join(', ')} colors={colors} />
      </Section>

      {/* Lifestyle */}
      <Section title="Lifestyle" colors={colors}>
        <Row icon="sun" label="Sleep" value={LIFESTYLE_LABELS[currentUser.lifestyle.sleepSchedule]} colors={colors} />
        <Row icon="volume-2" label="Noise" value={LIFESTYLE_LABELS[currentUser.lifestyle.noise]} colors={colors} />
        <Row icon="star" label="Cleanliness" value={'★'.repeat(currentUser.lifestyle.cleanliness) + '☆'.repeat(5 - currentUser.lifestyle.cleanliness)} colors={colors} />
        <Row icon="users" label="Guests" value={LIFESTYLE_LABELS[currentUser.lifestyle.guests]} colors={colors} />
        <Row icon="message-square" label="Communication" value={LIFESTYLE_LABELS[currentUser.lifestyle.communicationStyle]} colors={colors} />
        {currentUser.lifestyle.pets && <Row icon="heart" label="Pets" value="Pet friendly" colors={colors} />}
        {currentUser.lifestyle.smoking && <Row icon="wind" label="Smoking" value="Smoker" colors={colors} />}
      </Section>

      {/* Prompts */}
      {currentUser.prompts.length > 0 && (
        <Section title="My Prompts" colors={colors}>
          {currentUser.prompts.map((p, i) => (
            <View key={i} style={[styles.promptCard, { backgroundColor: colors.muted }]}>
              <Text style={[styles.promptQ, { color: colors.mutedForeground }]}>{p.question}</Text>
              <Text style={[styles.promptA, { color: colors.foreground }]}>{p.answer}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* Tags */}
      {currentUser.tags.length > 0 && (
        <Section title="Tags" colors={colors}>
          <View style={styles.tagsRow}>
            {currentUser.tags.map(tag => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}
    </ScrollView>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={[styles.section, { borderTopColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  return (
    <View style={styles.row}>
      <Feather name={icon as any} size={15} color={colors.mutedForeground} style={styles.rowIcon} />
      <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  profileTop: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  verifiedDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  meta: { fontSize: 14, marginBottom: 4 },
  location: { fontSize: 13 },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  statDivider: { width: 1 },
  section: { paddingHorizontal: 20, paddingVertical: 18, borderTopWidth: 1 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  bio: { fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  rowIcon: { marginRight: 10 },
  rowLabel: { fontSize: 14, width: 110 },
  rowValue: { fontSize: 14, flex: 1, fontWeight: '500' },
  promptCard: { borderRadius: 12, padding: 14, marginBottom: 10 },
  promptQ: { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  promptA: { fontSize: 15, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { fontSize: 13, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  btn: { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 28 },
  btnText: { fontSize: 15, fontWeight: '700' },
});
