import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import type { JoinRequest } from '@/context/types';

export default function HousingRequestsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getJoinRequests, approveJoinRequest, denyJoinRequest } = useApp();

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getJoinRequests(id);
      setRequests(data);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleApprove = (req: JoinRequest) => {
    Alert.alert('Approve Request', `Let ${req.requester.name} join your listing?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          setActionId(req.id);
          try {
            await approveJoinRequest(req.id);
            setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status: 'approved' } : r));
          } catch {
            Alert.alert('Error', 'Failed to approve request');
          } finally {
            setActionId(null);
          }
        },
      },
    ]);
  };

  const handleDeny = (req: JoinRequest) => {
    Alert.alert('Deny Request', `Decline ${req.requester.name}'s request?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deny',
        style: 'destructive',
        onPress: async () => {
          setActionId(req.id);
          try {
            await denyJoinRequest(req.id);
            setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status: 'denied' } : r));
          } catch {
            Alert.alert('Error', 'Failed to deny request');
          } finally {
            setActionId(null);
          }
        },
      },
    ]);
  };

  const statusColor = (status: JoinRequest['status']) => {
    if (status === 'approved') return colors.successDark;
    if (status === 'denied') return colors.destructive;
    return colors.mutedForeground;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : requests.length === 0 ? (
        <View style={styles.center}>
          <Feather name="inbox" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.foreground }]}>No join requests yet</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => router.push(`/user/${item.requester.id}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {item.requester.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.foreground }]}>{item.requester.name}</Text>
                  <Text style={[styles.university, { color: colors.mutedForeground }]}>{item.requester.university}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '22' }]}>
                  <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </TouchableOpacity>
              {!!item.message && (
                <Text style={[styles.message, { color: colors.mutedForeground }]}>"{item.message}"</Text>
              )}
              {item.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.denyBtn, { borderColor: colors.destructive }]}
                    onPress={() => handleDeny(item)}
                    disabled={actionId === item.id}
                  >
                    <Text style={[styles.denyBtnText, { color: colors.destructive }]}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.approveBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleApprove(item)}
                    disabled={actionId === item.id}
                  >
                    {actionId === item.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.approveBtnText}>Approve</Text>
                    }
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '600' },
  university: { fontSize: 12, marginTop: 1 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  message: { fontSize: 13, fontStyle: 'italic', marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  denyBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  denyBtnText: { fontSize: 14, fontWeight: '600' },
  approveBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  approveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
