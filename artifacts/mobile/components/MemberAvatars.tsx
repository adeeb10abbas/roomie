import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { HousingMember } from '@/context/types';
import { getProfileImage } from '@/utils/images';

interface Props {
  members: HousingMember[];
  size?: number;
  max?: number;
}

export default function MemberAvatars({ members, size = 26, max = 4 }: Props) {
  const colors = useColors();
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;
  const overlap = Math.floor(size * 0.35);

  return (
    <View style={[styles.row, { height: size }]}>
      {visible.map((m, i) => (
        <View
          key={m.id}
          style={[
            styles.avatarWrap,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: colors.card,
              marginLeft: i === 0 ? 0 : -overlap,
              zIndex: visible.length - i,
            },
          ]}
        >
          <Image
            source={getProfileImage(m.photoIndex, m.photoUrl)}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            contentFit="cover"
          />
        </View>
      ))}
      {overflow > 0 && (
        <View
          style={[
            styles.overflow,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.primaryMedium,
              borderColor: colors.card,
              marginLeft: -overlap,
            },
          ]}
        >
          <Text style={[styles.overflowText, { color: colors.primary, fontSize: size * 0.32 }]}>
            +{overflow}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { borderWidth: 2, overflow: 'hidden' },
  overflow: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: { fontWeight: '700' },
});
