import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export default function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
      <View style={styles.left}>
        <Feather name="wifi-off" size={16} color={colors.destructive} style={styles.icon} />
        <Text style={[styles.message, { color: '#B91C1C' }]} numberOfLines={2}>
          {message}
        </Text>
      </View>
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.destructive }]} onPress={onRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
            <Feather name="x" size={16} color="#B91C1C" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: { flexShrink: 0 },
  message: { flex: 1, fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  dismissBtn: { padding: 4 },
});
