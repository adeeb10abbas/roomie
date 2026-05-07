import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import ConversationItem from '@/components/ConversationItem';
import ErrorBanner from '@/components/ErrorBanner';

const PROMPT_CHIPS = [
  'Ask about cleanliness',
  'Ask about guest rules',
  'Ask about move-in timing',
  'Ask about quiet hours',
];

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { matches, matchesLoading, error, clearError, refreshMatches } = useApp();

  const topPadding = Platform.OS === 'web' ? 67 : insets.top + 8;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom + 80;

  const totalUnread = matches.reduce((s, m) => s + m.unread, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Messages</Text>
          {totalUnread > 0 && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {totalUnread} unread
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}
        >
          <Feather name="edit-2" size={17} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
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
    </View>
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
});
