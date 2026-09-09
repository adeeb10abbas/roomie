import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

const BADGE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  verified: { label: 'Verified', icon: 'check-circle', color: '#2563EB', bg: '#EFF6FF' },
  verified_student: { label: 'Student Verified', icon: 'shield', color: '#0369A1', bg: '#F0F9FF' },
  complete_profile: { label: 'Complete Profile', icon: 'user-check', color: '#059669', bg: '#ECFDF5' },
  serious_renter: { label: 'Serious Renter', icon: 'home', color: '#7C3AED', bg: '#F5F3FF' },
  school_verified: { label: 'School Verified', icon: 'book', color: '#D97706', bg: '#FFFBEB' },
};

interface Props {
  type: string;
  size?: 'sm' | 'md';
}

export default function Badge({ type, size = 'md' }: Props) {
  const config = BADGE_CONFIG[type];
  if (!config) return null;
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, isSmall && styles.badgeSm]}>
      <Feather name={config.icon as any} size={isSmall ? 10 : 12} color={config.color} />
      {!isSmall && (
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
