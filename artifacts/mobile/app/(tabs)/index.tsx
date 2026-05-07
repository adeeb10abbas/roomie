import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import ProfileCard from '@/components/ProfileCard';
import MatchModal from '@/components/MatchModal';
import { RoommateProfile } from '@/context/types';

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { filteredProfiles, swipe, undoLastSwipe, shortlisted } = useApp();
  const [deck, setDeck] = useState<RoommateProfile[]>(filteredProfiles);
  const [matchProfile, setMatchProfile] = useState<RoommateProfile | null>(null);
  const [showMatch, setShowMatch] = useState(false);

  const handleSwipe = useCallback((profileId: string, action: 'like' | 'skip' | 'shortlist') => {
    const isMatch = swipe(profileId, action);
    if (isMatch) {
      const profile = deck.find(p => p.id === profileId);
      if (profile) {
        setMatchProfile(profile);
        setShowMatch(true);
      }
    }
    setDeck(prev => prev.filter(p => p.id !== profileId));
  }, [deck, swipe]);

  const handleUndo = () => {
    undoLastSwipe();
    setDeck(filteredProfiles);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const topCards = deck.slice(0, 3);
  const isEmpty = deck.length === 0;
  const topProfile = topCards[topCards.length - 1];

  const topPaddingWeb = Platform.OS === 'web' ? 67 : insets.top + 8;
  const bottomPaddingWeb = Platform.OS === 'web' ? 34 : insets.bottom + 20;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPaddingWeb }]}>
        <Text style={[styles.logo, { color: colors.primary }]}>RoomieMatch</Text>
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

      {/* Card Stack */}
      <View style={styles.cardArea}>
        {isEmpty ? (
          <View style={styles.empty}>
            <Feather name="users" size={52} color={colors.mutedForeground} />
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
      {!isEmpty && (
        <View style={[styles.actions, { paddingBottom: bottomPaddingWeb }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.undoBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleUndo}
          >
            <Feather name="rotate-ccw" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.skipBtn]}
            onPress={() => {
              if (topProfile) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleSwipe(topProfile.id, 'skip');
              }
            }}
          >
            <Feather name="x" size={28} color={colors.skip} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.shortlistBtn]}
            onPress={() => {
              if (topProfile) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleSwipe(topProfile.id, 'shortlist');
              }
            }}
          >
            <Feather name="bookmark" size={22} color={colors.shortlist} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.likeBtn]}
            onPress={() => {
              if (topProfile) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleSwipe(topProfile.id, 'like');
              }
            }}
          >
            <Feather name="heart" size={28} color={colors.like} />
          </TouchableOpacity>
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
    paddingBottom: 10,
  },
  logo: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
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
  empty: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  actionBtn: {
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoBtn: {
    width: 44,
    height: 44,
    borderWidth: 1,
  },
  skipBtn: {
    width: 62,
    height: 62,
    backgroundColor: '#FEF2F2',
  },
  shortlistBtn: {
    width: 52,
    height: 52,
    backgroundColor: '#FFFBEB',
  },
  likeBtn: {
    width: 62,
    height: 62,
    backgroundColor: '#F0FDF4',
  },
});
