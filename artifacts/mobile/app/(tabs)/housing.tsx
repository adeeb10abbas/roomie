import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { apiFetch } from '@/utils/api';
import HousingCard from '@/components/HousingCard';
import ErrorBanner from '@/components/ErrorBanner';
import { HousingListing } from '@/context/types';

type Tab = 'rooms' | 'sublets';

export default function PostScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('rooms');
  const [listings, setListings] = useState<HousingListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyListings = useCallback(async (showRefresh = false) => {
    if (!userId) return;
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await apiFetch<{ listings: HousingListing[] }>('/housing/mine', userId);
      setListings(data.listings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchMyListings();
    }, [fetchMyListings])
  );

  const myRooms = listings.filter(h => h.type === 'permanent_room' || h.type === 'forming_group');
  const mySublets = listings.filter(h => h.type === 'sublet');
  const filtered = activeTab === 'rooms' ? myRooms : mySublets;

  const topPadding = Platform.OS === 'web' ? 67 : insets.top + 8;
  const TAB_BAR_HEIGHT = Platform.OS === 'web' ? 84 : 60;
  const bottomPadding = insets.bottom + TAB_BAR_HEIGHT + 16;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>My Listings</Text>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}
          onPress={() => router.push('/housing-create')}
        >
          <Feather name="plus" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => { setError(null); fetchMyListings(); }}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Tab Toggle */}
      <View style={[styles.tabRow, { backgroundColor: colors.primaryLight, marginHorizontal: 16, marginTop: 14 }]}>
        {([
          { key: 'rooms', label: 'My Rooms', count: myRooms.length },
          { key: 'sublets', label: 'My Sublets', count: mySublets.length },
        ] as const).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && { backgroundColor: colors.card }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab.key ? colors.foreground : colors.mutedForeground }]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: activeTab === tab.key ? colors.primary : colors.primaryMedium }]}>
                <Text style={[styles.tabBadgeText, { color: activeTab === tab.key ? '#FFF' : colors.primary }]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading your listings…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchMyListings(true)} tintColor={colors.primary} />
          }
        >
          {filtered.length === 0 ? (
            <EmptyState tab={activeTab} colors={colors} />
          ) : (
            filtered.map(listing => (
              <View key={listing.id} style={styles.cardWrap}>
                {/* Group tag for forming_group listings shown under My Rooms */}
                {listing.type === 'forming_group' && (
                  <View style={[styles.groupTag, { backgroundColor: '#7C3AED' }]}>
                    <Feather name="users" size={11} color="#FFF" />
                    <Text style={styles.groupTagText}>Group</Text>
                  </View>
                )}
                <HousingCard
                  listing={listing}
                  onPress={() => router.push(`/housing-detail/${listing.id}`)}
                />
                {/* Pending request badge */}
                {(listing.pendingRequestCount ?? 0) > 0 && (
                  <TouchableOpacity
                    style={[styles.pendingBadge, { backgroundColor: colors.primary }]}
                    onPress={() => router.push(`/housing-requests/${listing.id}`)}
                  >
                    <Feather name="bell" size={13} color="#FFF" />
                    <Text style={styles.pendingBadgeText}>
                      {listing.pendingRequestCount} pending request{listing.pendingRequestCount !== 1 ? 's' : ''}
                    </Text>
                    <Feather name="chevron-right" size={13} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function EmptyState({ tab, colors }: { tab: Tab; colors: any }) {
  const isRooms = tab === 'rooms';
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
        <Feather name={isRooms ? 'home' : 'calendar'} size={32} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {isRooms ? 'No rooms listed yet' : 'No sublets listed yet'}
      </Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
        {isRooms
          ? 'Post your room to find compatible roommates'
          : 'List your sublet to find a short-term tenant'}
      </Text>
      <TouchableOpacity
        style={[styles.postBtn, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/housing-create')}
      >
        <Feather name="plus" size={16} color="#FFF" />
        <Text style={styles.postBtnText}>
          {isRooms ? 'Post a Room' : 'Post a Sublet'}
        </Text>
      </TouchableOpacity>
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
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  tabRow: {
    flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 0,
  },
  tabBtn: {
    flex: 1, paddingVertical: 9, alignItems: 'center',
    borderRadius: 12, flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  tabText: { fontSize: 14, fontWeight: '600' },
  tabBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  tabBadgeText: { fontSize: 11, fontWeight: '700' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 15 },
  list: { flex: 1 },
  cardWrap: { marginBottom: 0 },
  groupTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginBottom: -8, marginLeft: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    zIndex: 1,
  },
  groupTagText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  pendingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 4, marginTop: -8, marginBottom: 12,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
  },
  pendingBadgeText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#FFF' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
  postBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
  },
  postBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
