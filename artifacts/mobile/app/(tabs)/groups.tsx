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

export default function GroupsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useApp();
  const [createdGroups, setCreatedGroups] = useState<HousingListing[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<HousingListing[]>([]);
  const [browseGroups, setBrowseGroups] = useState<HousingListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOpen, setCreatedOpen] = useState(false);
  const [joinedOpen, setJoinedOpen] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (!userId) return;
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [mineData, joinedData, browseData] = await Promise.all([
        apiFetch<{ listings: HousingListing[] }>('/housing/mine', userId),
        apiFetch<{ listings: HousingListing[] }>('/housing/my-groups', userId),
        apiFetch<{ listings: HousingListing[] }>('/housing?type=forming_group', userId),
      ]);

      const created = mineData.listings.filter((l) => l.type === 'forming_group');
      const joined = joinedData.listings;
      setCreatedGroups(created);
      setJoinedGroups(joined);

      // Exclude any group the user created or joined from the browse list
      const ownIds = new Set([...created, ...joined].map((l) => l.id));
      setBrowseGroups(browseData.listings.filter((l) => !ownIds.has(l.id)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const topPadding = Platform.OS === 'web' ? 67 : insets.top + 8;
  const TAB_BAR_HEIGHT = Platform.OS === 'web' ? 84 : 60;
  const bottomPadding = insets.bottom + TAB_BAR_HEIGHT + 16;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Groups</Text>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}
          onPress={() => router.push('/housing-create?type=forming_group')}
        >
          <Feather name="plus" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => { setError(null); fetchData(); }}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.infoBannerIcon, { backgroundColor: colors.primaryLight }]}>
          <Feather name="users" size={18} color={colors.primary} />
        </View>
        <View style={styles.infoBannerText}>
          <Text style={[styles.infoBannerTitle, { color: colors.foreground }]}>
            Form a group, then find a place
          </Text>
          <Text style={[styles.infoBannerSub, { color: colors.mutedForeground }]}>
            Team up with roommates for a future move-in before securing an apartment.
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading groups…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} />
          }
        >
          {/* Created by Me */}
          {createdGroups.length > 0 && (
            <CollapsibleSection
              icon="award"
              title="Created by Me"
              count={createdGroups.length}
              open={createdOpen}
              onToggle={() => setCreatedOpen((v) => !v)}
              colors={colors}
            >
              {createdGroups.map((listing) => (
                <MyGroupRow key={listing.id} listing={listing} colors={colors} />
              ))}
            </CollapsibleSection>
          )}

          {/* Joined by Me */}
          {joinedGroups.length > 0 && (
            <CollapsibleSection
              icon="check-circle"
              title="Joined by Me"
              count={joinedGroups.length}
              open={joinedOpen}
              onToggle={() => setJoinedOpen((v) => !v)}
              colors={colors}
            >
              {joinedGroups.map((listing) => (
                <MyGroupRow key={listing.id} listing={listing} colors={colors} />
              ))}
            </CollapsibleSection>
          )}

          {/* Browse Groups */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Feather name="users" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {createdGroups.length > 0 || joinedGroups.length > 0 ? 'Discover More Groups' : 'Browse Groups'}
              </Text>
              {browseGroups.length > 0 && (
                <View style={[styles.sectionCount, { backgroundColor: colors.primaryMedium }]}>
                  <Text style={[styles.sectionCountText, { color: colors.primary }]}>{browseGroups.length}</Text>
                </View>
              )}
            </View>

            {browseGroups.length === 0 ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Feather name="users" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  No groups forming yet
                </Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Be the first to start a group and find roommates together
                </Text>
                <TouchableOpacity
                  style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/housing-create?type=forming_group')}
                >
                  <Feather name="plus" size={16} color="#FFF" />
                  <Text style={styles.ctaBtnText}>Start a Group</Text>
                </TouchableOpacity>
              </View>
            ) : (
              browseGroups.map(listing => (
                <HousingCard
                  key={listing.id}
                  listing={listing}
                  onPress={() => router.push(`/housing-detail/${listing.id}`)}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/* ---------------- Collapsible section ---------------- */

function CollapsibleSection({
  icon, title, count, open, onToggle, colors, children,
}: {
  icon: string;
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={[styles.sectionIconWrap, { backgroundColor: colors.primaryLight }]}>
          <Feather name={icon as any} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        <View style={[styles.sectionCount, { backgroundColor: colors.primaryMedium }]}>
          <Text style={[styles.sectionCountText, { color: colors.primary }]}>{count}</Text>
        </View>
        <Feather
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>
      {open && <View style={styles.collapsibleBody}>{children}</View>}
    </View>
  );
}

/* ---------------- My group row (created / joined) ---------------- */

function MyGroupRow({
  listing, colors,
}: {
  listing: HousingListing;
  colors: ReturnType<typeof useColors>;
}) {
  const memberCount = listing.currentMembers?.length ?? listing.currentRoommates ?? 0;
  const statusLabel =
    listing.status === 'filled' ? 'Full' :
    listing.status === 'withdrawn' ? 'Closed' : 'Active';
  const statusColor = listing.status === 'active' ? colors.success : colors.mutedForeground;

  return (
    <View style={[styles.groupRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.groupMain}
        onPress={() => router.push(`/housing-detail/${listing.id}`)}
        activeOpacity={0.8}
      >
        <View style={[styles.groupIconWrap, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}>
          <Feather name="users" size={20} color={colors.primary} />
        </View>
        <View style={styles.groupInfo}>
          <Text style={[styles.groupName, { color: colors.foreground }]} numberOfLines={1}>
            {listing.title}
          </Text>
          <View style={styles.groupMetaRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.groupMeta, { color: colors.mutedForeground }]}>{statusLabel}</Text>
            <View style={[styles.groupMetaDot, { backgroundColor: colors.border }]} />
            <Feather name="user" size={12} color={colors.mutedForeground} />
            <Text style={[styles.groupMeta, { color: colors.mutedForeground }]}>
              {memberCount}/{listing.maxRoommates}
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
      </TouchableOpacity>

      <View style={styles.groupActions}>
        <TouchableOpacity
          style={[styles.groupActionBtn, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push(`/housing-detail/${listing.id}`)}
          activeOpacity={0.8}
        >
          <Feather name="settings" size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.groupActionBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/housing-detail/${listing.id}`)}
          activeOpacity={0.8}
        >
          <Feather name="message-circle" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  infoBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBannerText: { flex: 1 },
  infoBannerTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  infoBannerSub: { fontSize: 12, lineHeight: 16 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 15 },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collapsibleBody: { marginTop: 12 },
  sectionIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
  sectionCount: {
    minWidth: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  sectionCountText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
  },
  ctaBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  // My group row
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  groupMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  groupIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  groupInfo: { flex: 1, minWidth: 0, gap: 4 },
  groupName: { fontSize: 15, fontWeight: '700' },
  groupMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  groupMeta: { fontSize: 12, flexShrink: 1 },
  groupMetaDot: { width: 3, height: 3, borderRadius: 2, marginHorizontal: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  groupActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
