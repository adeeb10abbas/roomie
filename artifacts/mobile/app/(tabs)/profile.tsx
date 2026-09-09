import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import Badge from '@/components/Badge';
import ErrorBanner from '@/components/ErrorBanner';
import SettingsCard from '@/components/SettingsCard';
import SettingsRow from '@/components/SettingsRow';
import { getProfileImage } from '@/utils/images';
import { apiFetch } from '@/utils/api';
import { HousingListing, HousingType, HousingStatus } from '@/context/types';

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

type Segment = 'profile' | 'listings';

const POST_ICON: Record<HousingType, keyof typeof Feather.glyphMap> = {
  permanent_room: 'home',
  sublet: 'calendar',
  forming_group: 'users',
};

const POST_TYPE_BADGE: Record<HousingType, { label: string; color: string }> = {
  permanent_room: { label: 'Room', color: '#0284C7' },
  sublet: { label: 'Sublet', color: '#7C3AED' },
  forming_group: { label: 'Group', color: '#059669' },
};

function statusBadge(status: HousingStatus, colors: any) {
  if (status === 'filled') return { label: 'Filled', color: colors.warningSoft, bg: colors.warningLight };
  return { label: 'Active', color: colors.successDark, bg: colors.successLight };
}

function postSubtitle(listing: HousingListing) {
  const parts = [listing.neighborhood, `$${listing.rent.toLocaleString()}/mo`];
  if ((listing.pendingRequestCount ?? 0) > 0) {
    parts.push(`${listing.pendingRequestCount} pending`);
  }
  return parts.filter(Boolean).join(' · ');
}

function groupSubtitle(group: HousingListing) {
  const memberCount = group.currentMembers?.length ?? group.currentRoommates;
  const parts = [group.neighborhood];
  if (memberCount) parts.push(`${memberCount} member${memberCount !== 1 ? 's' : ''}`);
  return parts.filter(Boolean).join(' · ');
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, swipeActions, matches, generateBio, patchCurrentUser, verificationStatus, userId } = useApp();
  const [generatingBio, setGeneratingBio] = useState(false);
  const [segment, setSegment] = useState<Segment>('profile');

  // My Rooms & Sublets state
  const [listings, setListings] = useState<HousingListing[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<HousingListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);

  const fetchMyListings = useCallback(async (showRefresh = false) => {
    if (!userId) return;
    if (showRefresh) setRefreshing(true); else setListingsLoading(true);
    try {
      const [mine, groups] = await Promise.all([
        apiFetch<{ listings: HousingListing[] }>('/housing/mine', userId),
        apiFetch<{ listings: HousingListing[] }>('/housing/my-groups', userId),
      ]);
      setListings(mine.listings);
      setJoinedGroups(groups.listings);
      setListingsError(null);
    } catch (err) {
      setListingsError(err instanceof Error ? err.message : 'Failed to load your listings');
    } finally {
      setListingsLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchMyListings();
    }, [fetchMyListings])
  );

  const handleGenerateBio = async () => {
    setGeneratingBio(true);
    try {
      const bio = await generateBio();
      await patchCurrentUser({ bio });
      Alert.alert('Bio Generated!', 'Your AI bio has been applied. Edit it any time from Edit Profile.');
    } catch {
      Alert.alert('Error', 'Could not generate bio. Please try again.');
    } finally {
      setGeneratingBio(false);
    }
  };

  const profileCompletion = currentUser?.profileCompletion ?? 0;

  const topPadding = Platform.OS === 'web' ? 67 : insets.top + 8;
  const TAB_BAR_HEIGHT = Platform.OS === 'web' ? 84 : 60;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom + 80;
  const listingsBottomPadding = insets.bottom + TAB_BAR_HEIGHT + 16;

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        <View style={styles.headerActions}>
          {segment === 'profile' ? (
            <>
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
            </>
          ) : (
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}
              onPress={() => router.push('/housing-create')}
            >
              <Feather name="plus" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Segmented Control */}
      <View style={[styles.segmentRow, { backgroundColor: colors.primaryLight }]}>
        {([
          { key: 'profile', label: 'Profile Info' },
          { key: 'listings', label: 'My Rooms & Sublets' },
        ] as const).map(seg => (
          <TouchableOpacity
            key={seg.key}
            style={[styles.segmentBtn, segment === seg.key && { backgroundColor: colors.card }]}
            onPress={() => setSegment(seg.key)}
          >
            <Text style={[styles.segmentText, { color: segment === seg.key ? colors.foreground : colors.mutedForeground }]}>
              {seg.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {segment === 'profile' ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ paddingBottom: bottomPadding, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Banner */}
          <View style={[styles.heroBanner, { backgroundColor: colors.primaryMedium }]} />

          {/* Avatar + Info Card */}
          <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16 }]}>
            <View style={styles.avatarRow}>
              <Image
                source={getProfileImage(currentUser.photoIndex, currentUser.photoUrl)}
                style={[styles.avatar, { borderColor: colors.card }]}
                contentFit="cover"
              />
              <View style={styles.nameBlock}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.foreground }]}>
                    {currentUser.name}
                  </Text>
                  {currentUser.isVerified && (
                    <Feather name="shield" size={15} color={colors.primary} style={{ marginLeft: 6 }} />
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

          {/* Profile Completion Bar */}
          {profileCompletion > 0 && profileCompletion < 100 && (
            <View style={[styles.completionCard, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginTop: 12 }]}>
              <View style={styles.completionHeader}>
                <Text style={[styles.completionTitle, { color: colors.foreground }]}>Profile Completion</Text>
                <Text style={[styles.completionPct, { color: colors.primary }]}>{profileCompletion}%</Text>
              </View>
              <View style={[styles.completionBarBg, { backgroundColor: colors.muted }]}>
                <View style={[styles.completionBarFill, { backgroundColor: colors.primary, width: `${profileCompletion}%` as any }]} />
              </View>
              {!currentUser.isVerified && (
                <TouchableOpacity
                  style={[styles.completionCta, { backgroundColor: colors.primaryLight }]}
                  onPress={() => router.push('/verify-edu')}
                >
                  <Feather name="shield" size={13} color={colors.primary} />
                  <Text style={[styles.completionCtaText, { color: colors.primary }]}>Verify student email to reach 100%</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Student verified banner */}
          {!currentUser.isVerified && (
            <TouchableOpacity
              style={[styles.verifyBanner, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium, marginHorizontal: 16, marginTop: 12 }]}
              onPress={() => router.push('/verify-edu')}
            >
              <Feather name="shield" size={16} color={colors.primary} />
              <Text style={[styles.verifyBannerText, { color: colors.primary }]}>Verify your .edu email to unlock all features</Text>
              <Feather name="chevron-right" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}

          {/* Badges */}
          {(currentUser.isVerified || currentUser.badges.length > 0) && (
            <Section title="Trust & Verification" icon="shield" colors={colors}>
              {currentUser.isVerified && (
                <View style={[styles.verifyRow, { borderColor: colors.border }]}>
                  <Badge type="verified_student" />
                  <Text style={[styles.verifyDetail, { color: colors.mutedForeground }]}>{currentUser.eduDomain ?? 'Verified'}</Text>
                </View>
              )}
              {currentUser.badges.filter(b => b !== 'verified_student').map(b => (
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
            <TouchableOpacity
              style={[styles.aiBioBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}
              onPress={handleGenerateBio}
              disabled={generatingBio}
            >
              {generatingBio ? <ActivityIndicator size="small" color={colors.primary} /> : <Feather name="zap" size={13} color={colors.primary} />}
              <Text style={[styles.aiBioBtnText, { color: colors.primary }]}>
                {generatingBio ? 'Generating…' : 'Generate AI bio'}
              </Text>
            </TouchableOpacity>
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
      ) : (
        <View style={styles.flex}>
          {listingsError && (
            <ErrorBanner
              message={listingsError}
              onRetry={() => { setListingsError(null); fetchMyListings(); }}
              onDismiss={() => setListingsError(null)}
            />
          )}

          {listingsLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading your listings…</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.flex}
              contentContainerStyle={{ paddingTop: 18, paddingBottom: listingsBottomPadding }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => fetchMyListings(true)} tintColor={colors.primary} />
              }
            >
              {/* My Posts */}
              <SettingsCard
                title="My Posts"
                count={listings.length}
                headerActionIcon="plus"
                onHeaderAction={() => router.push('/housing-create')}
              >
                {listings.length === 0 ? (
                  <SettingsEmptyRow icon="home" text="No listings yet" colors={colors} />
                ) : (
                  listings.map(listing => (
                    <SettingsRow
                      key={listing.id}
                      icon={POST_ICON[listing.type]}
                      title={listing.title}
                      subtitle={postSubtitle(listing)}
                      typeBadge={POST_TYPE_BADGE[listing.type]}
                      statusBadge={statusBadge(listing.status, colors)}
                      onPress={() => router.push(`/housing-detail/${listing.id}`)}
                    />
                  ))
                )}
                <SettingsRow
                  icon="plus"
                  iconColor={colors.primary}
                  iconBg={colors.primaryMedium}
                  title="Create New Post"
                  onPress={() => router.push('/housing-create')}
                />
              </SettingsCard>

              {/* Groups I've Joined */}
              <SettingsCard title="Groups I've Joined" count={joinedGroups.length}>
                {joinedGroups.length === 0 ? (
                  <SettingsEmptyRow icon="users" text="You haven't joined any groups" colors={colors} />
                ) : (
                  joinedGroups.map(group => (
                    <SettingsRow
                      key={group.id}
                      icon="users"
                      iconColor="#059669"
                      iconBg="#D1FAE5"
                      title={group.title}
                      subtitle={groupSubtitle(group)}
                      onPress={() => router.push(`/housing-detail/${group.id}`)}
                    />
                  ))
                )}
              </SettingsCard>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

function SettingsEmptyRow({ icon, text, colors }: { icon: keyof typeof Feather.glyphMap; text: string; colors: any }) {
  return (
    <View style={styles.emptyRow}>
      <Feather name={icon} size={16} color={colors.mutedForeground} />
      <Text style={[styles.emptyRowText, { color: colors.mutedForeground }]}>{text}</Text>
    </View>
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
  flex: { flex: 1 },
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
  segmentRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 14,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  segmentText: { fontSize: 14, fontWeight: '600' },
  heroBanner: {
    height: 80,
    marginHorizontal: 16,
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
  aiBioBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start', marginTop: 10,
  },
  aiBioBtnText: { fontSize: 13, fontWeight: '600' },
  verifyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 14, borderWidth: 1,
  },
  verifyBannerText: { flex: 1, fontSize: 13, fontWeight: '500' },
  verifyDetail: { fontSize: 12, marginLeft: 'auto' as any },
  completionCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  completionTitle: { fontSize: 14, fontWeight: '600' },
  completionPct: { fontSize: 14, fontWeight: '700' },
  completionBarBg: { height: 6, borderRadius: 3, marginBottom: 10 },
  completionBarFill: { height: '100%', borderRadius: 3 },
  completionCta: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, padding: 10 },
  completionCtaText: { fontSize: 13, fontWeight: '500' },
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

  // My Rooms & Sublets
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 15 },
  emptyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 16, paddingHorizontal: 14,
  },
  emptyRowText: { fontSize: 14 },
});
