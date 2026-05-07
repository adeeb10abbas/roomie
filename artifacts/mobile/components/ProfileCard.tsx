import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, PanResponder,
  Dimensions, TouchableOpacity, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { RoommateProfile } from '@/context/types';
import { getProfileImage } from '@/utils/images';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.60;
const SWIPE_THRESHOLD = 100;

interface Props {
  profile: RoommateProfile;
  onLike: () => void;
  onSkip: () => void;
  onShortlist: () => void;
  isTop: boolean;
  distanceFromTop: number;
}

export default function ProfileCard({ profile, onLike, onSkip, onShortlist, isTop, distanceFromTop }: Props) {
  const colors = useColors();
  const position = useRef(new Animated.ValueXY()).current;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [25, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const skipOpacity = position.x.interpolate({
    inputRange: [-100, -25],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
      friction: 6,
    }).start();
  };

  const animateSwipe = (dir: 'left' | 'right' | 'up', callback: () => void) => {
    const x = dir === 'right' ? SCREEN_WIDTH * 1.5 : dir === 'left' ? -SCREEN_WIDTH * 1.5 : 0;
    const y = dir === 'up' ? -SCREEN_HEIGHT : 0;
    Animated.timing(position, {
      toValue: { x, y },
      duration: 280,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      callback();
    });
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => isTop,
    onPanResponderMove: (_, g) => {
      if (!isTop) return;
      position.setValue({ x: g.dx, y: g.dy });
    },
    onPanResponderRelease: (_, g) => {
      if (!isTop) return;
      if (g.dx > SWIPE_THRESHOLD) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        animateSwipe('right', onLike);
      } else if (g.dx < -SWIPE_THRESHOLD) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        animateSwipe('left', onSkip);
      } else if (g.dy < -SWIPE_THRESHOLD) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        animateSwipe('up', onShortlist);
      } else {
        resetPosition();
      }
    },
  })).current;

  const scale = 1 - distanceFromTop * 0.03;
  const translateY = distanceFromTop * 10;

  const cardStyle = isTop
    ? {
        transform: [
          { translateX: position.x },
          { translateY: position.y },
          { rotate },
        ],
      }
    : { transform: [{ scale }, { translateY }] };

  const scoreColor =
    profile.matchScore >= 85 ? colors.success :
    profile.matchScore >= 70 ? colors.warning :
    colors.primary;

  return (
    <Animated.View
      style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }, cardStyle]}
      {...(isTop ? panResponder.panHandlers : {})}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={styles.touchable}
        onPress={() => isTop && router.push(`/user/${profile.id}`)}
      >
        <Image
          source={getProfileImage(profile.photoIndex)}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.88)']}
          style={styles.gradient}
          locations={[0.35, 1]}
        />

        {/* Match Score */}
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
          <Text style={styles.scoreText}>{profile.matchScore}%</Text>
        </View>

        {/* Like Overlay */}
        <Animated.View style={[styles.overlay, styles.likeOverlay, { opacity: likeOpacity }]}>
          <Text style={[styles.overlayText, { color: '#22C55E' }]}>LIKE</Text>
        </Animated.View>

        {/* Skip Overlay */}
        <Animated.View style={[styles.overlay, styles.skipOverlay, { opacity: skipOpacity }]}>
          <Text style={[styles.overlayText, { color: '#EF4444' }]}>PASS</Text>
        </Animated.View>

        {/* Bottom Content */}
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}, {profile.age}</Text>
            {profile.isVerified && (
              <Feather name="check-circle" size={18} color="#60A5FA" style={{ marginLeft: 6 }} />
            )}
          </View>
          <Text style={styles.university}>{profile.university} · {profile.occupation}</Text>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={12} color="rgba(255,255,255,0.75)" />
            <Text style={styles.location}>{profile.neighborhoods[0]}</Text>
          </View>
          <Text style={styles.budget}>
            ${profile.budgetMin.toLocaleString()} – ${profile.budgetMax.toLocaleString()}/mo
          </Text>
          <View style={styles.tagsRow}>
            {profile.tags.slice(0, 3).map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.viewHint}>
            <Feather name="chevron-up" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.viewHintText}>Tap to view profile</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1C1C2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  touchable: { flex: 1 },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
  },
  scoreBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  overlay: {
    position: 'absolute',
    top: 44,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 3,
  },
  likeOverlay: {
    left: 20,
    borderColor: '#22C55E',
    transform: [{ rotate: '-15deg' }],
  },
  skipOverlay: {
    right: 20,
    borderColor: '#EF4444',
    transform: [{ rotate: '15deg' }],
  },
  overlayText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 25,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  university: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  budget: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '700',
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  viewHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewHintText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
  },
});
