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
        <View style={[styles.emptyFull, { paddingTop: topPadding }]}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
            <Feather name="user" size={36} color={colors.primary} />
          </View>
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
      <View style={[styles.header, { paddingTop: topPadding, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}
            onPress={() => router.push('/edit-profile')}
          >
            <Feather name="edit-2" size={17} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/settings')}
          >
            <Feather name="settings" size={17} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Banner */}
      <View style={[styles.heroBanner, { backgroundColor: colors.primaryMedium }]} />

      {/* Avatar + Info Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16 }]}>
        <View style={styles.avatarRow}>
          <Image
            source={getProfileImage(currentUser.photoIndex)}
            style={[styles.avatar, { borderColor: colors.card }]}
            contentFit="cover"
          />
          <View style={styles.nameBlock}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.foreground }]}>
                {currentUser.name}
              </Text>
              {currentUser.isVerified && (
                <Feather name="check-circle" size={16} color={colors.primary} style={{ marginLeft: 6 }} />
              )}
            </View>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>
              {currentUser.occupation}
            </Text>
            <View style={[styles.schoolBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.schoolBadgeText, { color: colors.primary }]}>
                {currentUser.university}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={[styles.statsGrid, { borderTopColor: colors.border }]}>
          <View style={[styles.statItem, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.statLabel, { color: colors.primary }]}>Budget</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              ${currentUser.budgetMin.toLocaleString()}–${currentUser.budgetMax.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.statLabel, { color: colors.primary }]}>Move-in</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{currentUser.moveInDate}</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.statLabel, { color: colors.primary }]}>Area</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]} numberOfLines={1}>
              {currentUser.neighborhoods[0] ?? '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* Activity Stats */}
      <View style={[styles.activityRow, { marginHorizontal: 16, marginTop: 12 }]}>
        <StatCard label="Matches" value={matches.length} color={colors.primary} colors={colors} />
        <StatCard label="Liked" value={likes} color={colors.success} colors={colors} />
        <StatCard label="Passed" value={skips} color={colors.mutedForeground} colors={colors} />
      </View>

      {/* Badges */}
      {currentUser.badges.length > 0 && (
        <Section title="Trust & Verification" icon="shield" colors={colors}>
          {currentUser.badges.map(b => (
            <View key={b} style={[styles.verifyRow, { borderColor: colors.border }]}>
              <Badge type={b} />
              <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
            </View>
          ))}
        </Section>
      )}

      {/* Bio */}
      <Section title="About Me" icon="sparkles" colors={colors}>
        <Text style={[styles.bio, { color: colors.foreground }]}>{currentUser.bio || 'No bio yet — tap Edit to add one.'}</Text>
      </Section>

      {/* Preferences */}
      <Section title="My Preferences" icon="sliders" colors={colors}>
        <View style={styles.prefWrap}>
          {[
            currentUser.sameGenderOnly ? 'Same-gender only' : null,
            `$${currentUser.budgetMin.toLocaleString()}–$${currentUser.budgetMax.toLocaleString()}`,
            currentUser.moveInDate,
            ...currentUser.neighborhoods.slice(0, 2),
            LIFESTYLE_LABELS[currentUser.lifestyle.noise] ?? '',
            currentUser.lifestyle.pets ? 'Pets OK' : null,
            currentUser.lifestyle.smoking ? 'Smoking OK' : 'Non-smoking',
          ].filter(Boolean).map(pref => (
            <View key={pref} style={[styles.prefChip, { backgroundColor: colors.muted }]}>
              <Text style={[styles.prefChipText, { color: colors.foreground }]}>{pref}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* Lifestyle */}
      <Section title="Lifestyle" icon="sun" colors={colors}>
        {[
          { label: 'Sleep', value: LIFESTYLE_LABELS[currentUser.lifestyle.sleepSchedule] },
          { label: 'Cleanliness', value: '★'.repeat(currentUser.lifestyle.cleanliness) + '☆'.repeat(5 - currentUser.lifestyle.cleanliness) },
          { label: 'Guests', value: LIFESTYLE_LABELS[currentUser.lifestyle.guests] },
          { label: 'Communication', value: LIFESTYLE_LABELS[currentUser.lifestyle.communicationStyle] },
        ].map(item => (
          <View key={item.label} style={[styles.lifestyleRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.lifestyleLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
            <Text style={[styles.lifestyleValue, { color: colors.foreground }]}>{item.value}</Text>
          </View>
        ))}
      </Section>

      {/* Prompts */}
      {currentUser.prompts.length > 0 && (
        <Section title="What matters to me" icon="message-circle" colors={colors}>
          {currentUser.prompts.map((p, i) => (
            <View key={i} style={[styles.promptCard, { borderColor: colors.border }]}>
              <Text style={[styles.promptQ, { color: colors.primary }]}>{p.question}</Text>
              <Text style={[styles.promptA, { color: colors.foreground }]}>{p.answer}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* Tags */}
      {currentUser.tags.length > 0 && (
        <Section title="Tags" icon="tag" colors={colors}>
          <View style={styles.prefWrap}>
            {currentUser.tags.map(tag => (
              <View key={tag} style={[styles.prefChip, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.prefChipText, { color: colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}
    </ScrollView>
  );
}

function Section({ title, icon, children, colors }: { title: string; icon: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={[styles.section, { borderTopColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: colors.primaryLight }]}>
          <Feather name={icon as any} size={14} color={colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function StatCard({ label, value, color, colors }: { label: string; value: number; color: string; colors: any }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statCardNum, { color }]}>{value}</Text>
      <Text style={[styles.statCardLabel, { color: colors.mutedForeground }]}>{label}</Text>
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
    borderBottomWidth: 1,
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
  heroBanner: {
    height: 80,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
  },
  profileCard: {
    marginTop: -40,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 3,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 4 },
  nameBlock: { flex: 1, paddingBottom: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 20, fontWeight: '700' },
  meta: { fontSize: 13, marginBottom: 6 },
  schoolBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  schoolBadgeText: { fontSize: 12, fontWeight: '600' },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  statItem: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
  },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 13, fontWeight: '700' },
  activityRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statCardNum: { fontSize: 22, fontWeight: '800' },
  statCardLabel: { fontSize: 12, marginTop: 2 },
  section: { paddingHorizontal: 20, paddingVertical: 18, borderTopWidth: 1, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  bio: { fontSize: 14, lineHeight: 22 },
  verifyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  prefWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prefChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  prefChipText: { fontSize: 13, fontWeight: '500' },
  lifestyleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  lifestyleLabel: { fontSize: 14 },
  lifestyleValue: { fontSize: 14, fontWeight: '600' },
  promptCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  promptQ: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  promptA: { fontSize: 14, lineHeight: 21 },
  emptyFull: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  btn: { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 28 },
  btnText: { fontSize: 15, fontWeight: '700' },
});
