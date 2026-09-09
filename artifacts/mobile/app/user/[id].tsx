import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/utils/api';
import { useColors } from '@/hooks/useColors';
import { getProfileImage } from '@/utils/images';
import Badge from '@/components/Badge';

const CATEGORY_ICONS: Record<string, string> = {
  'Sleep Schedule': 'moon',
  'Cleanliness': 'star',
  'Noise Level': 'volume-2',
  'Smoking': 'wind',
  'Budget': 'dollar-sign',
  'Drinking': 'coffee',
  'Guest Policy': 'users',
  'Pets': 'heart',
  'Communication': 'message-circle',
};

const LIFESTYLE_LABELS: Record<string, string> = {
  early_bird: 'Early Bird',
  night_owl: 'Night Owl',
  flexible: 'Flexible',
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

export default function UserProfileScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { swipe, matches, swipeActions, filteredProfiles, shortlisted, userId } = useApp();
  const [profile, setProfile] = React.useState<import('@/context/types').RoommateProfile | null>(null);

  React.useEffect(() => {
    const cached =
      filteredProfiles.find(p => p.id === id) ||
      shortlisted.find(p => p.id === id) ||
      matches.find(m => m.profile.id === id)?.profile || null;
    if (cached) {
      setProfile(cached);
    } else {
      apiFetch<import('@/context/types').RoommateProfile>(`/profiles/${id}`, userId)
        .then(setProfile)
        .catch(() => null);
    }
  }, [id, userId]);

  const isMatched = matches.some(m => m.profile.id === id);
  const alreadySwiped = swipeActions.some(a => a.profileId === id);

  const handleLike = () => {
    if (!profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swipe(profile.id, 'like');
    router.back();
  };

  const handleSkip = () => {
    if (!profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    swipe(profile.id, 'skip');
    router.back();
  };

  if (!profile) return null;

  const compatibilityItems = (profile.matchBreakdown ?? []).map(item => ({
    label: item.category,
    icon: CATEGORY_ICONS[item.category] ?? 'check-circle',
    match: item.compatible,
  }));

  const scoreColor =
    profile.matchScore >= 85 ? colors.success :
    profile.matchScore >= 70 ? colors.warning :
    colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Photo */}
        <View style={styles.heroContainer}>
          <Image
            source={getProfileImage(profile.photoIndex, profile.photoUrl)}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
            locations={[0.5, 1]}
          />
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
            <Text style={styles.scoreText}>{profile.matchScore}%</Text>
          </View>
          <View style={styles.heroContent}>
            <View style={styles.nameRow}>
              <Text style={styles.heroName}>{profile.name}, {profile.age}</Text>
              {profile.isVerified && (
                <Feather name="check-circle" size={20} color="#60A5FA" style={{ marginLeft: 8 }} />
              )}
            </View>
            <Text style={styles.heroMeta}>{profile.occupation} · {profile.university}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Badges */}
          <View style={styles.badgesRow}>
            {profile.badges.map(b => <Badge key={b} type={b} />)}
          </View>

          {/* Quick Info */}
          <View style={[styles.quickInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <QuickItem icon="map-pin" value={profile.neighborhoods[0]} colors={colors} />
            <View style={[styles.qDivider, { backgroundColor: colors.border }]} />
            <QuickItem icon="dollar-sign" value={`$${profile.budgetMin.toLocaleString()}–${profile.budgetMax.toLocaleString()}`} colors={colors} />
            <View style={[styles.qDivider, { backgroundColor: colors.border }]} />
            <QuickItem icon="calendar" value={profile.moveInDate} colors={colors} />
          </View>

          {/* Compatibility Breakdown */}
          <Section title="Why You Match" icon="zap" colors={colors}>
            <View style={[styles.compatGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {compatibilityItems.map(item => (
                <View key={item.label} style={styles.compatItem}>
                  <View style={[styles.compatIcon, { backgroundColor: item.match ? '#F0FDF4' : '#FEF2F2' }]}>
                    <Feather name={item.icon as any} size={16} color={item.match ? colors.success : colors.destructive} />
                  </View>
                  <Text style={[styles.compatLabel, { color: colors.foreground }]}>{item.label}</Text>
                  <Feather
                    name={item.match ? 'check' : 'x'}
                    size={14}
                    color={item.match ? colors.success : colors.destructive}
                  />
                </View>
              ))}
            </View>
          </Section>

          {/* Bio */}
          <Section title="About" icon="user" colors={colors}>
            <Text style={[styles.bio, { color: colors.foreground }]}>{profile.bio}</Text>
          </Section>

          {/* Prompts */}
          {profile.prompts.map((p, i) => (
            <View key={i} style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.promptQ, { color: colors.mutedForeground }]}>{p.question}</Text>
              <Text style={[styles.promptA, { color: colors.foreground }]}>{p.answer}</Text>
            </View>
          ))}

          {/* Lifestyle */}
          <Section title="Lifestyle" icon="sun" colors={colors}>
            <View style={[styles.lifestyleGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {[
                { label: 'Sleep', value: LIFESTYLE_LABELS[profile.lifestyle.sleepSchedule] },
                { label: 'Noise', value: LIFESTYLE_LABELS[profile.lifestyle.noise] },
                { label: 'Guests', value: LIFESTYLE_LABELS[profile.lifestyle.guests] },
                { label: 'Communication', value: LIFESTYLE_LABELS[profile.lifestyle.communicationStyle] },
                { label: 'Smoking', value: profile.lifestyle.smoking ? 'Smoker' : 'Non-smoker' },
                { label: 'Pets', value: profile.lifestyle.pets ? 'Pet-friendly' : 'No pets' },
              ].map(item => (
                <View key={item.label} style={styles.lifestyleItem}>
                  <Text style={[styles.lifestyleLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                  <Text style={[styles.lifestyleValue, { color: colors.foreground }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          </Section>

          {/* Tags */}
          {profile.tags.length > 0 && (
            <Section title="Tags" icon="tag" colors={colors}>
              <View style={styles.tagsRow}>
                {profile.tags.map(tag => (
                  <View key={tag} style={[styles.tag, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {/* Languages & Preferences */}
          {(profile.language || profile.religion) && (
            <Section title="Background" icon="globe" colors={colors}>
              {profile.language ? <InfoRow label="Languages" value={profile.language} colors={colors} /> : null}
              {profile.religion ? <InfoRow label="Religion" value={profile.religion} colors={colors} /> : null}
            </Section>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {!alreadySwiped && !isMatched && (
        <View style={[styles.actions, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.skipBtn]}
            onPress={handleSkip}
          >
            <Feather name="x" size={26} color={colors.skip} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.likeBtn, { backgroundColor: colors.primary }]}
            onPress={handleLike}
          >
            <Feather name="heart" size={22} color="#FFFFFF" />
            <Text style={styles.likeBtnText}>Like {profile.name.split(' ')[0]}</Text>
          </TouchableOpacity>
        </View>
      )}
      {isMatched && (
        <View style={[styles.actions, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.likeBtn, { backgroundColor: colors.primary, flex: 1 }]}
            onPress={() => {
              const match = matches.find(m => m.profile.id === id);
              if (match) router.push(`/chat/${match.id}`);
            }}
          >
            <Feather name="message-circle" size={20} color="#FFFFFF" />
            <Text style={styles.likeBtnText}>Send a Message</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function Section({ title, icon, children, colors }: { title: string; icon: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Feather name={icon as any} size={15} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function QuickItem({ icon, value, colors }: { icon: string; value: string; colors: any }) {
  return (
    <View style={styles.quickItem}>
      <Feather name={icon as any} size={14} color={colors.mutedForeground} />
      <Text style={[styles.quickValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroContainer: { height: 380, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  scoreBadge: {
    position: 'absolute',
    top: 60,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  heroContent: { position: 'absolute', bottom: 20, left: 16, right: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  heroName: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  heroMeta: { fontSize: 15, color: 'rgba(255,255,255,0.85)' },
  body: { paddingHorizontal: 16, paddingTop: 16 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  quickInfo: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  quickItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 14 },
  quickValue: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  qDivider: { width: 1 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  bio: { fontSize: 15, lineHeight: 24 },
  compatGrid: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  compatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEECF0',
  },
  compatIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  compatLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  promptCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  promptQ: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  promptA: { fontSize: 15, lineHeight: 22 },
  lifestyleGrid: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  lifestyleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEECF0',
  },
  lifestyleLabel: { fontSize: 14 },
  lifestyleValue: { fontSize: 14, fontWeight: '600' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { fontSize: 13, fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  actionBtn: { borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  skipBtn: {
    width: 56,
    height: 56,
    backgroundColor: '#FEF2F2',
  },
  likeBtn: {
    flex: 1,
    height: 56,
    flexDirection: 'row',
    gap: 8,
  },
  likeBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
