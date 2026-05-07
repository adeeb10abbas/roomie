import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoommateProfile } from '@/context/types';
import { getProfileImage } from '@/utils/images';

interface Props {
  visible: boolean;
  profile: RoommateProfile;
  onClose: () => void;
  onMessage: () => void;
}

export default function MatchModal({ visible, profile, onClose, onMessage }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 100 }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity }]}>
        <LinearGradient
          colors={['rgba(2,132,199,0.97)', 'rgba(3,105,161,0.99)']}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
          <View style={styles.sparkleRow}>
            <Text style={styles.sparkle}>✦</Text>
            <Text style={styles.sparkle}>✦</Text>
            <Text style={styles.sparkle}>✦</Text>
          </View>
          <Text style={styles.title}>It's a Match!</Text>
          <Text style={styles.subtitle}>
            You and {profile.name} both want to connect
          </Text>

          <View style={styles.photoContainer}>
            <Image
              source={getProfileImage(profile.photoIndex)}
              style={styles.photo}
              contentFit="cover"
            />
            <View style={styles.matchBadge}>
              <Text style={styles.matchScore}>{profile.matchScore}%</Text>
            </View>
          </View>

          <Text style={styles.name}>{profile.name}, {profile.age}</Text>
          <Text style={styles.university}>{profile.university}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.messageBtn}
              onPress={onMessage}
            >
              <Text style={styles.messageBtnText}>Send a Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
              <Text style={styles.skipBtnText}>Keep Browsing</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  sparkleRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  sparkle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 32,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  photo: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  matchBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#059669',
  },
  matchScore: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  university: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 40,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  messageBtn: {
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  messageBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0284C7',
  },
  skipBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
});
