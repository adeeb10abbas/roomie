import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface StatusBadge {
  label: string;
  color: string;
  bg: string;
}

interface Props {
  icon: keyof typeof Feather.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  typeBadge?: { label: string; color: string };
  statusBadge?: StatusBadge;
  showChevron?: boolean;
  onPress?: () => void;
}

/**
 * A single tappable row inside a SettingsCard: leading icon tile, title with
 * optional subtitle and type badge, optional status pill, and a chevron.
 */
export default function SettingsRow({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  typeBadge,
  statusBadge,
  showChevron = true,
  onPress,
}: Props) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.6}
      disabled={!onPress}
    >
      <View style={[styles.iconTile, { backgroundColor: iconBg ?? colors.primaryLight }]}>
        <Feather name={icon} size={17} color={iconColor ?? colors.primary} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {title}
          </Text>
          {typeBadge && (
            <View style={[styles.typeBadge, { backgroundColor: typeBadge.color }]}>
              <Text style={styles.typeBadgeText}>{typeBadge.label}</Text>
            </View>
          )}
        </View>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {statusBadge && (
        <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
          <Text style={[styles.statusText, { color: statusBadge.color }]}>{statusBadge.label}</Text>
        </View>
      )}
      {showChevron && (
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} style={styles.chevron} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    minHeight: 56,
  },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  typeBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  subtitle: { fontSize: 12.5, marginTop: 2 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9 },
  statusText: { fontSize: 11, fontWeight: '700' },
  chevron: { marginLeft: -2 },
});
