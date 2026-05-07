import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Match } from '@/context/types';
import { getProfileImage } from '@/utils/images';
import { formatTime } from '@/utils/time';

interface Props {
  match: Match;
  onPress: () => void;
}

export default function ConversationItem({ match, onPress }: Props) {
  const colors = useColors();
  const hasUnread = match.unread > 0;
  const scoreColor =
    match.profile.matchScore >= 85 ? '#059669' :
    match.profile.matchScore >= 70 ? '#D97706' :
    colors.primary;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.avatarWrapper}>
        <Image
          source={getProfileImage(match.profile.photoIndex)}
          style={[styles.avatar, { borderColor: colors.primaryMedium }]}
          contentFit="cover"
        />
        <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <View style={styles.nameScoreRow}>
            <Text style={[styles.name, { color: colors.foreground }, hasUnread && styles.bold]}>
              {match.profile.name}
            </Text>
            <View style={[styles.scorePill, { backgroundColor: scoreColor + '18', borderColor: scoreColor + '33' }]}>
              <Text style={[styles.scoreText, { color: scoreColor }]}>
                {match.profile.matchScore}%
              </Text>
            </View>
          </View>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {formatTime(match.lastMessageTime)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.lastMessage,
              { color: hasUnread ? colors.foreground : colors.mutedForeground },
              hasUnread && styles.bold,
            ]}
            numberOfLines={1}
          >
            {match.lastMessage || 'You matched! Say hello 👋'}
          </Text>
          {hasUnread > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadText}>{match.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  info: { flex: 1, minWidth: 0 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  name: { fontSize: 15, fontWeight: '500' },
  scorePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  scoreText: { fontSize: 11, fontWeight: '700' },
  time: { fontSize: 12, marginLeft: 8, flexShrink: 0 },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: { fontSize: 13, flex: 1, marginRight: 8 },
  bold: { fontWeight: '700' },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
