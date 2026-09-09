import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator,
  ScrollView, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import ProfileCard from '@/components/ProfileCard';
import MatchModal from '@/components/MatchModal';
import ErrorBanner from '@/components/ErrorBanner';
import RoomsListView from '@/components/RoomsListView';
import AuthGateModal from '@/components/AuthGateModal';
import { RoommateProfile } from '@/context/types';

type DiscoverTab = 'roomies' | 'rooms';

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    filteredProfiles, swipe, undoLastSwipe, shortlisted,
    profilesLoading, error, clearError, refreshProfiles,
    currentUser, verificationStatus,
    isGuest, guestProfile,
    pendingGuestAction, setPendingGuestAction,
    isAuthenticated,
  } = useApp();
  const verificationRequired = currentUser && !currentUser.isVerified && (!verificationStatus || !verificationStatus.isVerified);
  const [deck, setDeck] = useState<RoommateProfile[]>(filteredProfiles);
  const [activeTab, setActiveTab] = useState<DiscoverTab>('roomies');

  useEffect(() => {
    setDeck(filteredProfiles);
  }, [filteredProfiles]);
  const [matchProfile, setMatchProfile] = useState<RoommateProfile | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);

  // After the user completes auth (login or end of onboarding), replay any queued swipe action.
  useEffect(() => {
    if (!isAuthenticated || isGuest || !pendingGuestAction) return;
    const { profileId, action } = pendingGuestAction;
    setPendingGuestAction(null);
    swipe(profileId, action).then((isMatch) => {
      const profile = filteredProfiles.find(p => p.id === profileId);
      if (isMatch && profile) {
        setMatchProfile(profile);
        setShowMatch(true);
      }
    }).catch(() => {
      // Non-fatal: pending action replay failed silently
    });
  }, [isAuthenticated, isGuest]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProfiles();
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfiles]);

  const handleSwipe = useCallback(async (profileId: string, action: 'like' | 'skip' | 'shortlist') => {
    if (isGuest) {
      setPendingGuestAction({ profileId, action });
      setShowAuthGate(true);
      return;
    }
    const profile = deck.find(p => p.id === profileId);
    setDeck(prev => prev.filter(p => p.id !== profileId));
    const isMatch = await swipe(profileId, action);
    if (isMatch && profile) {
      setMatchProfile(profile);
      setShowMatch(true);
    }
  }, [deck, swipe, isGuest]);

  const handleUndo = () => {
    if (isGuest) {
      setPendingGuestAction(null);
      setShowAuthGate(true);
      return;
    }
    undoLastSwipe();
    setDeck(filteredProfiles);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // In guest mode, show only the one preview card
  const activeDeck = isGuest ? (guestProfile ? [guestProfile] : []) : deck;
  const topCards = activeDeck.slice(0, 3);
  const isEmpty = activeDeck.length === 0;
  const topProfile = topCards[0];

  const topPaddingWeb = Platform.OS === 'web' ? 67 : insets.top + 8;
  const TAB_BAR_HEIGHT = Platform.OS === 'web' ? 84 : 60;
  const bottomPaddingWeb = insets.bottom + TAB_BAR_HEIGHT + 16;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPaddingWeb, borderBottomColor: colors.border }]}>
        <View style={styles.logoRow}>
          <Text style={[styles.logoText, { color: colors.foreground }]}>Roomie</Text>
          <View style={[styles.logoBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}>
            <Text style={[styles.logoBadgeText, { color: colors.primary }]}>AI</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {!isGuest && activeTab === 'roomies' && (
            <>
              <TouchableOpacity
                testID="discover-refresh-btn"
                style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={handleRefresh}
                disabled={refreshing}
              >
                <Feather name="refresh-cw" size={17} color={refreshing ? colors.mutedForeground : colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity
                testID="discover-filters-btn"
                style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push('/filters')}
              >
                <Feather name="sliders" size={17} color={colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push('/shortlist')}
              >
                <Feather name="bookmark" size={17} color={colors.foreground} />
                {shortlisted.length > 0 && (
                  <View style={[styles.pip, { backgroundColor: colors.primary }]}>
                    <Text style={styles.pipText}>{shortlisted.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}
          {isGuest && (
            <TouchableOpacity
              style={[styles.signUpBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowAuthGate(true)}
            >
              <Text style={[styles.signUpBtnText, { color: colors.primaryForeground }]}>Sign Up</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Guest banner */}
      {isGuest && (
        <View style={[styles.guestBanner, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}>
          <Feather name="eye" size={14} color={colors.primary} />
          <Text style={[styles.guestBannerText, { color: colors.primary }]}>
            You're browsing as a guest — sign up to start matching
          </Text>
        </View>
      )}

      {/* Segmented Tabs (authenticated users only) */}
      {!isGuest && (
        <View style={[styles.segmentedContainer, { backgroundColor: colors.primaryLight, borderBottomColor: colors.border }]}>
          <View style={[styles.segmentedTrack, { backgroundColor: colors.primaryLight }]}>
            {([
              { key: 'roomies', label: 'Roomies', icon: 'users' },
              { key: 'rooms', label: 'Rooms', icon: 'home' },
            ] as const).map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.segmentedTab,
                  activeTab === tab.key && [styles.segmentedTabActive, { backgroundColor: colors.card, shadowColor: colors.primary }],
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Feather
                  name={tab.icon}
                  size={14}
                  color={activeTab === tab.key ? colors.primary : colors.mutedForeground}
                />
                <Text style={[
                  styles.segmentedTabText,
                  { color: activeTab === tab.key ? colors.primary : colors.mutedForeground },
                  activeTab === tab.key && styles.segmentedTabTextActive,
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Verification nudge (Roomies tab only, authenticated) */}
      {!isGuest && activeTab === 'roomies' && verificationRequired && (
        <TouchableOpacity
          testID="verify-nudge"
          style={[styles.verifyNudge, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}
          onPress={() => router.push('/verify-edu')}
        >
          <Feather name="shield" size={14} color="#D97706" />
          <Text style={[styles.verifyNudgeText, { color: '#D97706' }]}>
            Verify your .edu email to boost your profile
          </Text>
          <Feather name="chevron-right" size={14} color="#D97706" />
        </TouchableOpacity>
      )}

      {/* Error Banner */}
      {error && (activeTab === 'roomies' || isGuest) && (
        <ErrorBanner
          message={error}
          onRetry={() => { clearError(); refreshProfiles(); }}
          onDismiss={clearError}
        />
      )}

      {/* Rooms tab */}
      {!isGuest && activeTab === 'rooms' && (
        <RoomsListView bottomPadding={bottomPaddingWeb} />
      )}

      {/* Roomies tab (and guest mode preview) */}
      {(isGuest || activeTab === 'roomies') && (
        <>
          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardArea}
            refreshControl={
              !isGuest ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              ) : undefined
            }
          >
            {profilesLoading && !isGuest ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                  Finding roommates…
                </Text>
              </View>
            ) : isEmpty ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Feather name="users" size={36} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  {isGuest ? 'No preview available' : 'All caught up'}
                </Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {isGuest
                    ? 'Sign up to browse all roommate profiles near you.'
                    : 'You have seen everyone nearby. Adjust your filters or check back soon.'}
                </Text>
                {isGuest ? (
                  <TouchableOpacity
                    style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setShowAuthGate(true)}
                  >
                    <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>
                      Get Started
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                      onPress={() => router.push('/filters')}
                    >
                      <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>
                        Adjust Filters
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.emptyBtnSecondary, { borderColor: colors.border }]}
                      onPress={() => refreshProfiles()}
                    >
                      <Feather name="refresh-cw" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                      <Text style={[styles.emptyBtnSecondaryText, { color: colors.primary }]}>
                        Check for new profiles
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : (
              [...topCards].reverse().map((profile, reverseIdx) => {
                const distanceFromTop = topCards.length - 1 - reverseIdx;
                return (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    isTop={distanceFromTop === 0}
                    distanceFromTop={distanceFromTop}
                    onLike={() => handleSwipe(profile.id, 'like')}
                    onSkip={() => handleSwipe(profile.id, 'skip')}
                    onShortlist={() => handleSwipe(profile.id, 'shortlist')}
                  />
                );
              })
            )}
          </ScrollView>

          {/* Action Buttons */}
          {!isEmpty && !(profilesLoading && !isGuest) && (
            <View style={[styles.actions, { paddingBottom: bottomPaddingWeb }]}>
              <View style={[styles.actionFloating, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {!isGuest && (
                  <TouchableOpacity
                    style={styles.actionInner}
                    onPress={handleUndo}
                  >
                    <Feather name="rotate-ccw" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  testID="skip-btn"
                  style={[styles.actionInner, styles.skipInner, { backgroundColor: colors.muted }]}
                  onPress={() => {
                    if (topProfile) {
                      if (!isGuest) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleSwipe(topProfile.id, 'skip');
                    }
                  }}
                >
                  <Feather name="x" size={26} color="#64748B" />
                </TouchableOpacity>

                <TouchableOpacity
                  testID="like-btn"
                  style={[styles.actionInner, styles.likeInner, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    if (topProfile) {
                      if (!isGuest) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      handleSwipe(topProfile.id, 'like');
                    }
                  }}
                >
                  <Feather name="heart" size={28} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  testID="shortlist-btn"
                  style={styles.actionInner}
                  onPress={() => {
                    if (topProfile) {
                      if (!isGuest) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      handleSwipe(topProfile.id, 'shortlist');
                    }
                  }}
                >
                  <Feather name="bookmark" size={17} color={colors.warning} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}

      {matchProfile && (
        <MatchModal
          visible={showMatch}
          profile={matchProfile}
          onClose={() => setShowMatch(false)}
          onMessage={() => {
            setShowMatch(false);
            router.push('/(tabs)/messages');
          }}
        />
      )}

      <AuthGateModal
        visible={showAuthGate}
        onDismiss={() => setShowAuthGate(false)}
      />
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
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  logoBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  logoBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  headerRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  signUpBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  signUpBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pip: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  guestBannerText: { flex: 1, fontSize: 13, fontWeight: '500' },
  segmentedContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  segmentedTrack: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segmentedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  segmentedTabActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentedTabText: { fontSize: 14, fontWeight: '600' },
  segmentedTabTextActive: { fontWeight: '700' },
  verifyNudge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  verifyNudgeText: { flex: 1, fontSize: 13, fontWeight: '500' },
  cardScroll: { flex: 1 },
  cardArea: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  loadingWrap: { alignItems: 'center', gap: 14 },
  loadingText: { fontSize: 15 },
  empty: { alignItems: 'center', paddingHorizontal: 32, gap: 12 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 22, fontWeight: '700' },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 28,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700' },
  emptyBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 28,
    borderWidth: 1,
  },
  emptyBtnSecondaryText: { fontSize: 15, fontWeight: '600' },
  actions: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  actionFloating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 40,
    borderWidth: 1,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  actionInner: {
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  skipInner: {
    width: 56,
    height: 56,
  },
  likeInner: {
    width: 64,
    height: 64,
  },
});
