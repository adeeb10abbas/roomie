import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, TextInput, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import HousingCard from '@/components/HousingCard';
import ErrorBanner from '@/components/ErrorBanner';

type Tab = 'open_room' | 'forming_group';

export default function HousingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { housing, housingLoading, error, clearError, refreshHousing } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('open_room');
  const [search, setSearch] = useState('');

  const filtered = housing.filter(h => {
    if (h.type !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        h.neighborhood.toLowerCase().includes(q) ||
        h.title.toLowerCase().includes(q) ||
        h.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const topPadding = Platform.OS === 'web' ? 67 : insets.top + 8;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom + 80;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Housing</Text>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}
        >
          <Feather name="plus" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => { clearError(); refreshHousing(); }}
          onDismiss={clearError}
        />
      )}

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.infoBannerIcon, { backgroundColor: colors.primaryLight }]}>
          <Feather name="users" size={18} color={colors.primary} />
        </View>
        <View style={styles.infoBannerText}>
          <Text style={[styles.infoBannerTitle, { color: colors.foreground }]}>
            Find a room or join a group
          </Text>
          <Text style={[styles.infoBannerSub, { color: colors.mutedForeground }]}>
            Browse open rooms or join a same-gender forming group
          </Text>
        </View>
      </View>

      {/* Tab Toggle */}
      <View style={[styles.tabRow, { backgroundColor: colors.primaryLight, marginHorizontal: 16 }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'open_room' && { backgroundColor: colors.card }]}
          onPress={() => setActiveTab('open_room')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'open_room' ? colors.foreground : colors.mutedForeground },
          ]}>
            Open Rooms
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'forming_group' && { backgroundColor: colors.card }]}
          onPress={() => setActiveTab('forming_group')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'forming_group' ? colors.foreground : colors.mutedForeground },
          ]}>
            Forming Groups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16 }]}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search neighborhoods, tags..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {housingLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading listings…
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Feather name="home" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {activeTab === 'open_room' ? 'No open rooms found' : 'No groups found'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Try a different search or check back soon
              </Text>
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
    marginBottom: 10,
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
  tabRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabText: { fontSize: 14, fontWeight: '600' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 15 },
  list: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
