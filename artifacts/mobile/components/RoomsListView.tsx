import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { HousingListing } from '@/context/types';
import HousingCard from '@/components/HousingCard';
import NeighborhoodMapView from '@/components/NeighborhoodMapView';
import { apiFetch } from '@/utils/api';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const RENT_STEPS = [500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000, 5000];

interface RoomsFilters {
  neighborhood: string;
  moveInMonth: string;
  maxRent: number;
}

const DEFAULT_FILTERS: RoomsFilters = {
  neighborhood: '',
  moveInMonth: '',
  maxRent: 5000,
};

interface Props {
  bottomPadding: number;
}

export default function RoomsListView({ bottomPadding }: Props) {
  const colors = useColors();
  const { housing, housingLoading, userId, refreshHousing } = useApp();
  const [filters, setFilters] = useState<RoomsFilters>(DEFAULT_FILTERS);
  const [roomType, setRoomType] = useState<'permanent_room' | 'sublet'>('permanent_room');
  const [mapMode, setMapMode] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [membershipBanner, setMembershipBanner] = useState<HousingListing | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const allNeighborhoods = Array.from(
    new Set(housing.filter(h => h.type !== 'forming_group').map(h => h.neighborhood))
  ).sort();

  useEffect(() => {
    if (!userId) return;
    apiFetch<{ membership: { listingId: string } | null }>('/housing/my-membership', userId)
      .then(({ membership }) => {
        if (membership) {
          const listing = housing.find(h => h.id === membership.listingId);
          if (listing) setMembershipBanner(listing);
        }
      })
      .catch(() => {});
  }, [userId, housing]);

  const matchesFilters = (h: HousingListing) => {
    if (filters.neighborhood && h.neighborhood !== filters.neighborhood) return false;
    if (filters.maxRent < 5000 && h.rent > filters.maxRent) return false;
    if (filters.moveInMonth) {
      const monthIdx = MONTHS.indexOf(filters.moveInMonth);
      if (monthIdx >= 0 && h.moveInDate) {
        const parts = h.moveInDate.split('-');
        if (parts.length >= 2) {
          const listingMonth = parseInt(parts[1], 10) - 1;
          if (listingMonth > monthIdx) return false;
        }
      }
    }
    return true;
  };

  const openRooms = housing.filter(h => h.type === 'permanent_room' && matchesFilters(h));
  const sublets = housing.filter(h => h.type === 'sublet' && matchesFilters(h));
  const filtered = roomType === 'sublet' ? sublets : openRooms;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refreshHousing(); } finally { setRefreshing(false); }
  }, [refreshHousing]);

  const handleMapSelect = (listing: HousingListing) => {
    setSelectedListingId(listing.id);
    setMapMode(false);
    setTimeout(() => {
      router.push(`/housing-detail/${listing.id}`);
    }, 100);
  };

  const activeFilterCount =
    (filters.neighborhood ? 1 : 0) +
    (filters.moveInMonth ? 1 : 0) +
    (filters.maxRent < 5000 ? 1 : 0);

  const ROOM_TABS = [
    { key: 'permanent_room' as const, label: 'Open Rooms', count: openRooms.length },
    { key: 'sublet' as const, label: 'Sublets', count: sublets.length },
  ];

  return (
    <View style={styles.container}>
      {/* Open Rooms / Sublets divider */}
      <View style={[styles.roomTypeDivider, { borderBottomColor: colors.border }]}>
        {ROOM_TABS.map(tab => {
          const active = roomType === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.roomTypeTab}
              activeOpacity={0.7}
              onPress={() => setRoomType(tab.key)}
            >
              <View style={styles.roomTypeTabInner}>
                <Text style={[styles.roomTypeTabText, { color: active ? colors.primary : colors.mutedForeground }]}>
                  {tab.label}
                </Text>
                <View style={[styles.roomTypeCount, { backgroundColor: active ? colors.primaryMedium : colors.muted }]}>
                  <Text style={[styles.roomTypeCountText, { color: active ? colors.primary : colors.mutedForeground }]}>
                    {tab.count}
                  </Text>
                </View>
              </View>
              {active && <View style={[styles.roomTypeIndicator, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filter Bar */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {/* Neighborhood filter */}
          <View style={[styles.filterChipGroup, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="map-pin" size={12} color={filters.neighborhood ? colors.primary : colors.mutedForeground} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 120 }}>
              {filters.neighborhood ? (
                <TouchableOpacity
                  style={styles.filterChipSelected}
                  onPress={() => setFilters(f => ({ ...f, neighborhood: '' }))}
                >
                  <Text style={[styles.filterChipText, { color: colors.primary }]}>
                    {filters.neighborhood}
                  </Text>
                  <Feather name="x" size={10} color={colors.primary} />
                </TouchableOpacity>
              ) : (
                <Text style={[styles.filterPlaceholder, { color: colors.mutedForeground }]}>
                  Neighborhood
                </Text>
              )}
            </ScrollView>
            {!filters.neighborhood && (
              <TouchableOpacity onPress={() => setNeighborhoodSearch(neighborhoodSearch ? '' : ' ')}>
                <Feather name="chevron-down" size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          {/* Move-in month */}
          <View style={styles.filterChipRow}>
            {MONTHS.slice(0, 6).map(m => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.monthChip,
                  {
                    backgroundColor: filters.moveInMonth === m ? colors.primary : colors.card,
                    borderColor: filters.moveInMonth === m ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setFilters(f => ({ ...f, moveInMonth: f.moveInMonth === m ? '' : m }))}
              >
                <Text style={[
                  styles.monthChipText,
                  { color: filters.moveInMonth === m ? '#FFF' : colors.mutedForeground },
                ]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Rent cap */}
          <View style={[styles.filterChipGroup, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="dollar-sign" size={12} color={filters.maxRent < 5000 ? colors.primary : colors.mutedForeground} />
            <TouchableOpacity
              onPress={() => {
                const idx = RENT_STEPS.indexOf(filters.maxRent);
                const next = idx <= 0 ? RENT_STEPS[RENT_STEPS.length - 1] : RENT_STEPS[idx - 1];
                setFilters(f => ({ ...f, maxRent: next }));
              }}
            >
              <Feather name="minus" size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
            <Text style={[styles.filterChipText, { color: filters.maxRent < 5000 ? colors.primary : colors.mutedForeground }]}>
              {filters.maxRent < 5000 ? `≤$${(filters.maxRent / 1000).toFixed(1)}k` : 'Any rent'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const idx = RENT_STEPS.indexOf(filters.maxRent);
                const next = idx >= RENT_STEPS.length - 1 ? RENT_STEPS[0] : RENT_STEPS[idx + 1];
                setFilters(f => ({ ...f, maxRent: next }));
              }}
            >
              <Feather name="plus" size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <TouchableOpacity
              style={[styles.clearChip, { borderColor: colors.border }]}
              onPress={() => setFilters(DEFAULT_FILTERS)}
            >
              <Feather name="x" size={11} color={colors.mutedForeground} />
              <Text style={[styles.clearChipText, { color: colors.mutedForeground }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Neighborhood dropdown */}
      {neighborhoodSearch !== '' && !filters.neighborhood && (
        <View style={[styles.neighborhoodDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.searchRow, { borderColor: colors.border }]}>
            <Feather name="search" size={13} color={colors.mutedForeground} />
            <TextInput
              value={neighborhoodSearch.trim()}
              onChangeText={setNeighborhoodSearch}
              placeholder="Search neighborhoods…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
              autoFocus
            />
          </View>
          <ScrollView style={{ maxHeight: 160 }}>
            {allNeighborhoods
              .filter(n => neighborhoodSearch.trim().length === 0 || n.toLowerCase().includes(neighborhoodSearch.trim().toLowerCase()))
              .map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.neighborhoodOption, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setFilters(f => ({ ...f, neighborhood: n }));
                    setNeighborhoodSearch('');
                  }}
                >
                  <Text style={[styles.neighborhoodOptionText, { color: colors.foreground }]}>{n}</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      )}

      {/* Map / List toggle */}
      <View style={[styles.viewToggle, { borderBottomColor: colors.border }]}>
        <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
          {filtered.length} {filtered.length === 1 ? 'listing' : 'listings'}
          {activeFilterCount > 0 ? ' · filtered' : ''}
        </Text>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            { backgroundColor: mapMode ? colors.primary : colors.card, borderColor: mapMode ? colors.primary : colors.border },
          ]}
          onPress={() => setMapMode(m => !m)}
        >
          <Feather name={mapMode ? 'list' : 'map'} size={14} color={mapMode ? '#FFF' : colors.foreground} />
          <Text style={[styles.toggleBtnText, { color: mapMode ? '#FFF' : colors.foreground }]}>
            {mapMode ? 'List' : 'Map'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {housingLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading rooms…</Text>
        </View>
      ) : mapMode ? (
        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          {membershipBanner && !bannerDismissed && (
            <MembershipBanner listing={membershipBanner} onDismiss={() => setBannerDismissed(true)} colors={colors} />
          )}
          <NeighborhoodMapView
            listings={filtered}
            onSelectListing={handleMapSelect}
            selectedId={selectedListingId}
          />
        </ScrollView>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.list}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          {membershipBanner && !bannerDismissed && (
            <MembershipBanner listing={membershipBanner} onDismiss={() => setBannerDismissed(true)} colors={colors} />
          )}
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Feather name="home" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No {roomType === 'sublet' ? 'sublets' : 'open rooms'} found
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {activeFilterCount > 0
                  ? 'Try adjusting your filters.'
                  : roomType === 'sublet'
                    ? 'No short-term sublets are listed right now. Check back soon.'
                    : 'No open rooms are listed right now. Check back soon.'}
              </Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity
                  style={[styles.clearBtn, { borderColor: colors.border }]}
                  onPress={() => setFilters(DEFAULT_FILTERS)}
                >
                  <Text style={[styles.clearBtnText, { color: colors.primary }]}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filtered.map(listing => (
              <HousingCard
                key={listing.id}
                listing={listing}
                onPress={() => router.push(`/housing-detail/${listing.id}`)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function MembershipBanner({
  listing, onDismiss, colors,
}: { listing: HousingListing; onDismiss: () => void; colors: any }) {
  return (
    <TouchableOpacity
      style={[styles.membershipBanner, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}
      onPress={() => router.push(`/housing-detail/${listing.id}`)}
      activeOpacity={0.85}
    >
      <View style={[styles.membershipBannerIcon, { backgroundColor: colors.primary }]}>
        <Feather name="home" size={14} color="#FFF" />
      </View>
      <View style={styles.membershipBannerText}>
        <Text style={[styles.membershipBannerTitle, { color: colors.primary }]}>
          You're in a housing group
        </Text>
        <Text style={[styles.membershipBannerSub, { color: colors.primary }]} numberOfLines={1}>
          {listing.title}
        </Text>
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Feather name="x" size={16} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  roomTypeDivider: { flexDirection: 'row', borderBottomWidth: 1 },
  roomTypeTab: { flex: 1, alignItems: 'center', position: 'relative' },
  roomTypeTabInner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 13 },
  roomTypeTabText: { fontSize: 14, fontWeight: '700' },
  roomTypeCount: { minWidth: 20, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  roomTypeCountText: { fontSize: 11, fontWeight: '700' },
  roomTypeIndicator: { position: 'absolute', bottom: 0, height: 2.5, width: '55%', borderRadius: 2 },
  filterBar: { borderBottomWidth: 1, paddingVertical: 10 },
  filterScroll: { paddingHorizontal: 16, gap: 8, alignItems: 'center', flexDirection: 'row' },
  filterChipGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipRow: { flexDirection: 'row', gap: 6 },
  filterChipSelected: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  filterPlaceholder: { fontSize: 12 },
  monthChip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  monthChipText: { fontSize: 11, fontWeight: '600' },
  clearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  clearChipText: { fontSize: 12 },
  neighborhoodDropdown: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 13 },
  neighborhoodOption: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  neighborhoodOptionText: { fontSize: 14 },
  viewToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  resultCount: { fontSize: 13 },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  toggleBtnText: { fontSize: 13, fontWeight: '600' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 15 },
  list: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center' },
  clearBtn: {
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1,
  },
  clearBtnText: { fontSize: 14, fontWeight: '600' },
  membershipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  membershipBannerIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  membershipBannerText: { flex: 1 },
  membershipBannerTitle: { fontSize: 13, fontWeight: '700' },
  membershipBannerSub: { fontSize: 12, marginTop: 1 },
});
