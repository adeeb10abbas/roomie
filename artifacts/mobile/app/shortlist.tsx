import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { getProfileImage } from '@/utils/images';
import { RoommateProfile } from '@/context/types';

export default function ShortlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { shortlisted, swipe } = useApp();

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom + 16;

  const handleLike = (profile: RoommateProfile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swipe(profile.id, 'like');
  };

  const renderItem = ({ item }: { item: RoommateProfile }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => router.push(`/user/${item.id}`)}
        activeOpacity={0.8}
      >
        <Image
          source={getProfileImage(item.photoIndex, item.photoUrl)}
          style={styles.avatar}
          contentFit="cover"
        />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.foreground }]}>{item.name}, {item.age}</Text>
            {item.isVerified && (
              <Feather name="check-circle" size={14} color="#2563EB" />
            )}
          </View>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {item.university} · {item.occupation}
          </Text>
          <Text style={[styles.budget, { color: colors.primary }]}>
            ${item.budgetMin.toLocaleString()}–${item.budgetMax.toLocaleString()}/mo
          </Text>
          <View style={styles.tagsRow}>
            {item.tags.slice(0, 2).map(tag => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
                <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[styles.score, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.scoreText, { color: colors.primary }]}>{item.matchScore}%</Text>
        </View>
      </TouchableOpacity>

      <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]}
          onPress={() => swipe(item.id, 'skip')}
        >
          <Feather name="x" size={18} color={colors.skip} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.likeBtn, { backgroundColor: colors.primary }]}
          onPress={() => handleLike(item)}
        >
          <Feather name="heart" size={16} color="#FFFFFF" />
          <Text style={styles.likeBtnText}>Like</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {shortlisted.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="bookmark" size={52} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No saved profiles</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Swipe up or tap the bookmark button to save profiles you want to revisit.
          </Text>
          <TouchableOpacity
            style={[styles.discoverBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.discoverBtnText, { color: colors.primaryForeground }]}>Keep Browsing</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={shortlisted}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomPad }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.count, { color: colors.mutedForeground }]}>
              {shortlisted.length} saved profile{shortlisted.length !== 1 ? 's' : ''}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
  },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, marginBottom: 3 },
  budget: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  tagsRow: { flexDirection: 'row', gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  tagText: { fontSize: 11, fontWeight: '500' },
  score: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  scoreText: { fontSize: 13, fontWeight: '800' },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  likeBtn: {},
  likeBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  count: { fontSize: 13, marginBottom: 12, marginLeft: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  discoverBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 28 },
  discoverBtnText: { fontSize: 15, fontWeight: '700' },
});
