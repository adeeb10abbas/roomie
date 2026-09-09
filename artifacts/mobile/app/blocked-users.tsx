import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import type { BlockedUser } from '@/context/types';

export default function BlockedUsersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { blockedUsers, unblockUser, refreshBlockedUsers } = useApp();
  const [loading, setLoading] = useState(false);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    refreshBlockedUsers().finally(() => setLoading(false));
  }, []);

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      'Unblock User',
      `Unblock ${user.name}? They will be able to see and interact with your profile again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            setUnblocking(user.id);
            try {
              await unblockUser(user.id);
            } catch {
              Alert.alert('Error', 'Failed to unblock user. Please try again.');
            } finally {
              setUnblocking(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Blocked Users</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : blockedUsers.length === 0 ? (
        <View style={styles.center}>
          <Feather name="user-x" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Blocked Users</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Users you block won't appear in your feed and can't message you.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.date, { color: colors.mutedForeground }]}>
                  Blocked {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.unblockBtn, { borderColor: colors.primary }]}
                onPress={() => handleUnblock(item)}
                disabled={unblocking === item.id}
              >
                {unblocking === item.id
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <Text style={[styles.unblockText, { color: colors.primary }]}>Unblock</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 14, borderWidth: 1, marginVertical: 4, gap: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  date: { fontSize: 12 },
  unblockBtn: {
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  unblockText: { fontSize: 13, fontWeight: '600' },
});
