import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator,
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
import { RoommateProfile } from '@/context/types';

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { filteredProfiles, swipe, undoLastSwipe, shortlisted, profilesLoading, error, clearError, refreshProfiles } = useApp();
  const [deck, setDeck] = useState<RoommateProfile[]>(filteredProfiles);

  useEffect(() => {
    setDeck(filteredProfiles);
  }, [filteredProfiles]);
  const [matchProfile, setMatchProfile] = useState<RoommateProfile | null>(null);
  const [showMatch, setShowMatch] = useState(false);

  const handleSwipe = useCallback(async (profileId: string, action: 'like' | 'skip' | 'shortlist') => {
    const profile = deck.find(p => p.id === profileId);
    setDeck(prev => prev.filter(p => p.id !== profileId));
    const isMatch = await swipe(profileId, action);
    if (isMatch && profile) {
      setMatchProfile(profile);
      setShowMatch(true);
    }
  }, [deck, swipe]);

  const handleUndo = () => {
    undoLastSwipe();
    setDeck(filteredProfiles);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const topCards = deck.slice(0, 3);
  const isEmpty = deck.length === 0;
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
          <TouchableOpacity
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
        </View>
      </View>

      {/* Error Banner */}
      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => { clearError(); refreshProfiles(); }}
          onDismiss={clearError}
        />
      )}

      {/* Card Stack */}
      <View style={styles.cardArea}>
        {profilesLoading ? (
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
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All caught up</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              You have seen everyone nearby. Adjust your filters or check back soon.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/filters')}
            >
              <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>
                Adjust Filters
              </Text>
            </TouchableOpacity>
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
      </View>

      {/* Action Buttons */}
      {!isEmpty && !profilesLoading && (
        <View style={[styles.actions, { paddingBottom: bottomPaddingWeb }]}>
          <View style={[styles.actionFloating, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.actionInner}
              onPress={handleUndo}
            >
              <Feather name="rotate-ccw" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionInner, styles.skipInner, { backgroundColor: colors.muted }]}
              onPress={() => {
                if (topProfile) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleSwipe(topProfile.id, 'skip');
                }
              }}
            >
              <Feather name="x" size={26} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionInner, styles.likeInner, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (topProfile) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleSwipe(topProfile.id, 'like');
                }
              }}
            >
              <Feather name="heart" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionInner}
              onPress={() => {
                if (topProfile) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleSwipe(topProfile.id, 'shortlist');
                }
              }}
            >
              <Feather name="bookmark" size={17} color={colors.warning} />
            </TouchableOpacity>
          </View>
        </View>
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
  headerRight: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
  cardArea: {
    flex: 1,
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
