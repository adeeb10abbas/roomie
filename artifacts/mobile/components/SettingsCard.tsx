import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface Props {
  title?: string;
  count?: number;
  headerActionIcon?: keyof typeof Feather.glyphMap;
  onHeaderAction?: () => void;
  children: React.ReactNode;
}

/**
 * iOS Settings-style grouped card. Renders an optional uppercase section
 * label above a white rounded surface, with hairline separators between rows.
 */
export default function SettingsCard({ title, count, headerActionIcon, onHeaderAction, children }: Props) {
  const colors = useColors();
  const rows = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.wrap}>
      {(title || headerActionIcon) && (
        <View style={styles.header}>
          {title && (
            <Text style={[styles.title, { color: colors.mutedForeground }]}>
              {title}
              {typeof count === 'number' ? `  ·  ${count}` : ''}
            </Text>
          )}
          {headerActionIcon && onHeaderAction && (
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}
              onPress={onHeaderAction}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name={headerActionIcon} size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {rows.map((row, i) => (
          <View key={i}>
            {i > 0 && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginBottom: 22 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1,
  },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 56 },
});
