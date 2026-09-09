import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { apiFetch } from '@/utils/api';
import ConversationItem from '@/components/ConversationItem';
import ErrorBanner from '@/components/ErrorBanner';
import { HousingListing } from '@/context/types';

const PROMPT_CHIPS = [
  'Ask about cleanliness',
  'Ask about guest rules',
  'Ask about move-in timing',
  'Ask about quiet hours',
];

type Segment = 'matches' | 'groups';

const SEGMENT_STORAGE_KEY = 'messagesSegment';

function isSegment(value: unknown): value is Segment {
  return value === 'matches' || value === 'groups';
}

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId, matches, matchesLoading, error, clearError, refreshMatches } = useApp();
  const { section } = useLocalSearchParams<{ section?: string }>();

  const [segment, setSegment] = useState<Segment>('matches');

  const selectSegment = useCallback((seg: Segment) => {
    setSegment(seg);
    AsyncStorage.setItem(SEGMENT_STORAGE_KEY, seg);
  }, []);

  // Restore the last-selected segment from device-local storage on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await AsyncStorage.getItem(SEGMENT_STORAGE_KEY);
      if (!cancelled && isSegment(stored)) setSegment(stored);
    })();
    return () => { cancelled = true; };
  }, []);

  // A `?section=` route param deep-links straight into a segment and takes
  // precedence over the stored preference.
  useEffect(() => {
    if (isSegment(section)) selectSegment(section);
  }, [section, selectSegment]);

  // Group chats — only the groups the user belongs to (browsing lives in the Groups tab)
  const [myGroups, setMyGroups] = useState<HousingListing[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsRefreshing, setGroupsRefreshing] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  const fetchGroups = useCallback(async (showRefresh = false) => {
    if (!userId) return;
    if (showRefresh) setGroupsRefreshing(true); else setGroupsLoading(true);
    try {
      const myGroupsData = await apiFetch<{ listings: HousingListing[] }>('/housing/my-groups', userId);
      setMyGroups(myGroupsData.listings);
      setGroupsError(null);
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setGroupsLoading(false);
      setGroupsRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups])
  );

  const topPadding = Platform.OS === 'web' ? 67 : insets.top + 8;
  const TAB_BAR_HEIGHT = Platform.OS === 'web' ? 84 : 60;
  const bottomPadding = insets.bottom + TAB_BAR_HEIGHT + 16;

  const totalUnread = matches.reduce((s, m) => s + m.unread, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Messages</Text>
          {segment === 'matches' && totalUnread > 0 && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {totalUnread} unread
            </Text>
          )}
        </View>
        {segment === 'groups' ? (
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}
            onPress={() => router.push('/(tabs)/groups')}
          >
            <Feather name="search" size={18} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}
          >
            <Feather name="edit-2" size={17} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented control */}
      <View style={styles.segmentWrap}>
        <View style={[styles.segment, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          {(['matches', 'groups'] as Segment[]).map((seg) => {
            const active = segment === seg;
            return (
              <TouchableOpacity
                key={seg}
                style={[
                  styles.segmentBtn,
                  active && { backgroundColor: colors.primary },
                ]}
                onPress={() => selectSegment(seg)}
                activeOpacity={0.85}
              >
                <Feather
                  name={seg === 'matches' ? 'message-circle' : 'users'}
                  size={15}
                  color={active ? colors.primaryForeground : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: active ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  {seg === 'matches' ? 'Matches' : 'Groups'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {segment === 'matches' ? (
        <MatchesView
          colors={colors}
          matches={matches}
          matchesLoading={matchesLoading}
          error={error}
          clearError={clearError}
          refreshMatches={refreshMatches}
          bottomPadding={bottomPadding}
        />
      ) : (
        <GroupsView
          colors={colors}
          myGroups={myGroups}
          loading={groupsLoading}
          refreshing={groupsRefreshing}
          error={groupsError}
          onRetry={() => { setGroupsError(null); fetchGroups(); }}
          onDismissError={() => setGroupsError(null)}
          onRefresh={() => fetchGroups(true)}
          bottomPadding={bottomPadding}
        />
      )}
    </View>
  );
}

/* ---------------- Matches segment ---------------- */

function MatchesView({
  colors, matches, matchesLoading, error, clearError, refreshMatches, bottomPadding,
}: {
  colors: ReturnType<typeof useColors>;
  matches: ReturnType<typeof useApp>['matches'];
  matchesLoading: boolean;
  error: string | null;
  clearError: () => void;
  refreshMatches: () => void;
  bottomPadding: number;
}) {
  return (
    <>
      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => { clearError(); refreshMatches(); }}
          onDismiss={clearError}
        />
      )}

      {matchesLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading matches…
          </Text>
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
            <Feather name="message-circle" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No matches yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Start swiping in Match to find your future roommate
          </Text>
          <TouchableOpacity
            style={[styles.discoverBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={[styles.discoverBtnText, { color: colors.primaryForeground }]}>
              Go to Match
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingTop: 16, paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
        >
          {/* Matches Count Banner */}
          <View style={[styles.matchBanner, { backgroundColor: colors.primaryLight, marginHorizontal: 16, marginBottom: 12 }]}>
            <View style={[styles.matchBannerIcon, { backgroundColor: colors.primaryMedium }]}>
              <Feather name="heart" size={14} color={colors.primary} />
            </View>
            <Text style={[styles.matchBannerText, { color: colors.primary }]}>
              {matches.length} match{matches.length !== 1 ? 'es' : ''}
            </Text>
          </View>

          {/* Prompt Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            style={styles.chipsScroll}
          >
            {PROMPT_CHIPS.map(chip => (
              <View key={chip} style={[styles.chip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.chipText, { color: colors.foreground }]}>{chip}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Conversation List */}
          {matches.map(match => (
            <ConversationItem
              key={match.id}
              match={match}
              onPress={() => router.push(`/chat/${match.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </>
  );
}

/* ---------------- Groups segment ---------------- */

function GroupsView({
  colors, myGroups, loading, refreshing, error,
  onRetry, onDismissError, onRefresh, bottomPadding,
}: {
  colors: ReturnType<typeof useColors>;
  myGroups: HousingListing[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRetry: () => void;
  onDismissError: () => void;
  onRefresh: () => void;
  bottomPadding: number;
}) {
  return (
    <>
      {error && (
        <ErrorBanner message={error} onRetry={onRetry} onDismiss={onDismissError} />
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading group chats…</Text>
        </View>
      ) : myGroups.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
            <Feather name="users" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No group chats yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Join a group from the Groups tab and its chat will show up here
          </Text>
          <TouchableOpacity
            style={[styles.discoverBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/groups')}
          >
            <Text style={[styles.discoverBtnText, { color: colors.primaryForeground }]}>
              Browse Groups
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          <View style={styles.section}>
            {myGroups.map(listing => (
              <GroupRow
                key={listing.id}
                listing={listing}
                colors={colors}
                onPress={() => router.push(`/housing-detail/${listing.id}`)}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </>
  );
}

/* ---------------- Group row (distinct from one-on-one rows) ---------------- */

function GroupRow({
  listing, colors, onPress,
}: {
  listing: HousingListing;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const memberCount = listing.currentMembers?.length ?? listing.currentRoommates ?? 0;
  return (
    <TouchableOpacity
      style={[styles.groupRow, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.groupIconWrap, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}>
        <Feather name="users" size={22} color={colors.primary} />
      </View>

      <View style={styles.groupInfo}>
        <View style={styles.groupTopRow}>
          <Text style={[styles.groupName, { color: colors.foreground }]} numberOfLines={1}>
            {listing.title}
          </Text>
          <View style={[styles.groupBadge, { backgroundColor: colors.primaryMedium }]}>
            <Text style={[styles.groupBadgeText, { color: colors.primary }]}>Group</Text>
          </View>
        </View>
        <View style={styles.groupMetaRow}>
          <Feather name="user" size={12} color={colors.mutedForeground} />
          <Text style={[styles.groupMeta, { color: colors.mutedForeground }]}>
            {memberCount}/{listing.maxRoommates} members
          </Text>
          {!!listing.neighborhood && (
            <>
              <View style={[styles.groupMetaDot, { backgroundColor: colors.border }]} />
              <Feather name="map-pin" size={12} color={colors.mutedForeground} />
              <Text style={[styles.groupMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                {listing.neighborhood}
              </Text>
            </>
          )}
        </View>
      </View>

      <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 4,
  },
  segmentWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  segment: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  segmentText: { fontSize: 14, fontWeight: '700' },
  matchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  matchBannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchBannerText: { fontSize: 14, fontWeight: '600' },
  chipsScroll: { marginBottom: 12 },
  chips: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  discoverBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 28 },
  discoverBtnText: { fontSize: 15, fontWeight: '700' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 15 },
  // Groups
  scroll: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  // Group row
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  groupIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  groupInfo: { flex: 1, minWidth: 0, gap: 4 },
  groupTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupName: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  groupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  groupBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  groupMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  groupMeta: { fontSize: 12, flexShrink: 1 },
  groupMetaDot: { width: 3, height: 3, borderRadius: 2, marginHorizontal: 2 },
});
