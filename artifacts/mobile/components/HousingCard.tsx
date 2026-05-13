import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { HousingListing } from '@/context/types';
import { getHousingImage, getProfileImage } from '@/utils/images';

interface Props {
  listing: HousingListing;
  onPress: () => void;
}

export default function HousingCard({ listing, onPress }: Props) {
  const colors = useColors();
  const isOpenRoom = listing.type === 'open_room';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <View style={styles.imageContainer}>
        <Image
          source={getHousingImage(listing.photoIndex)}
          style={styles.image}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={styles.gradient}
        />
        <View style={[styles.typeBadge, { backgroundColor: isOpenRoom ? colors.primary : '#7C3AED' }]}>
          <Text style={styles.typeBadgeText}>
            {isOpenRoom ? 'Open Room' : 'Forming Group'}
          </Text>
        </View>
        <View style={styles.rentBadge}>
          <Text style={styles.rentText}>${listing.rent.toLocaleString()}/mo</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {listing.title}
        </Text>

        <View style={styles.metaRow}>
          <MetaItem icon="map-pin" label={listing.neighborhood} colors={colors} />
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <MetaItem icon="calendar" label={listing.moveInDate} colors={colors} />
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <MetaItem icon="users" label={`${listing.currentRoommates}/${listing.maxRoommates}`} colors={colors} />
        </View>

        <View style={styles.tagsRow}>
          {listing.tags.slice(0, 3).map(tag => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Image
            source={getProfileImage(listing.postedBy.photoIndex)}
            style={[styles.posterAvatar, { borderColor: colors.border }]}
            contentFit="cover"
          />
          <Text style={[styles.posterName, { color: colors.mutedForeground }]}>
            by {listing.postedBy.name.split(' ')[0]}
          </Text>
          {listing.postedBy.isVerified && (
            <Feather name="check-circle" size={12} color={colors.primary} />
          )}
          <View style={{ flex: 1 }} />
          <View style={[styles.requestBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.requestBtnText}>Request</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function MetaItem({ icon, label, colors }: { icon: string; label: string; colors: any }) {
  return (
    <View style={styles.metaItem}>
      <Feather name={icon as any} size={12} color={colors.mutedForeground} />
      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
    backgroundColor: '#E0F2FE',
  },
  image: { width: '100%', height: '100%' },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  typeBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  rentBadge: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rentText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  body: { padding: 14 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  dot: { width: 3, height: 3, borderRadius: 2 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 11, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  posterAvatar: { width: 22, height: 22, borderRadius: 11, borderWidth: 1 },
  posterName: { fontSize: 12 },
  requestBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  requestBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
