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
      style={[styles.card, { backgroundColor: colors.card }]}
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
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.gradient}
        />
        <View style={[styles.typeBadge, { backgroundColor: isOpenRoom ? colors.primary : '#7C3AED' }]}>
          <Text style={styles.typeBadgeText}>
            {isOpenRoom ? 'Open Room' : 'Forming Group'}
          </Text>
        </View>
        <Text style={styles.rentOverlay}>${listing.rent.toLocaleString()}/mo</Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {listing.title}
        </Text>
        <View style={styles.row}>
          <Feather name="map-pin" size={13} color={colors.mutedForeground} />
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {listing.neighborhood}
          </Text>
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <Feather name="calendar" size={13} color={colors.mutedForeground} />
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {listing.moveInDate}
          </Text>
        </View>

        <View style={styles.row}>
          <Feather name="users" size={13} color={colors.mutedForeground} />
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {listing.currentRoommates}/{listing.maxRoommates} roommates
          </Text>
        </View>

        <View style={styles.tagsRow}>
          {listing.tags.slice(0, 3).map(tag => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Image
            source={getProfileImage(listing.postedBy.photoIndex)}
            style={styles.posterAvatar}
            contentFit="cover"
          />
          <Text style={[styles.posterName, { color: colors.mutedForeground }]}>
            Posted by {listing.postedBy.name.split(' ')[0]}
          </Text>
          {listing.postedBy.isVerified && (
            <Feather name="check-circle" size={13} color="#2563EB" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  rentOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  body: {
    padding: 14,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  meta: {
    fontSize: 13,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 10,
  },
  posterAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  posterName: {
    fontSize: 12,
    flex: 1,
  },
});
