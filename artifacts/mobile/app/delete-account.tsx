import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const REASONS = [
  'Found a roommate',
  'Not finding good matches',
  'Privacy concerns',
  'App issues',
  'Taking a break',
  'Other',
];

export default function DeleteAccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deleteAccount, deactivateAccount } = useApp();
  const [step, setStep] = useState<'choose' | 'confirm'>('choose');
  const [selectedReason, setSelectedReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeactivate = async () => {
    Alert.alert(
      'Deactivate Account?',
      'Your profile will be hidden. You can reactivate any time from Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          onPress: async () => {
            setLoading(true);
            try {
              await deactivateAccount();
              Alert.alert('Account Deactivated', 'Your profile is now hidden.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch {
              Alert.alert('Error', 'Failed to deactivate account. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleDeleteConfirm = async () => {
    if (confirmText.toLowerCase().trim() !== 'delete my account') {
      Alert.alert('Confirmation Required', 'Please type "delete my account" exactly to confirm.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setLoading(true);
    try {
      await deleteAccount(selectedReason || undefined);
    } catch {
      setLoading(false);
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => step === 'confirm' ? setStep('choose') : router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {step === 'choose' ? 'Manage Account' : 'Delete Account'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        {step === 'choose' ? (
          <>
            {/* Deactivate option */}
            <View style={[styles.optionCard, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}>
              <View style={styles.optionIcon}>
                <Feather name="pause-circle" size={28} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: colors.foreground }]}>Deactivate Account</Text>
                <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                  Temporarily hide your profile. Reactivate anytime from Settings.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.optionBtn, { backgroundColor: colors.primary }]}
                onPress={handleDeactivate}
                disabled={loading}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Pause</Text>
              </TouchableOpacity>
            </View>

            {/* Delete option */}
            <View style={[styles.optionCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <View style={styles.optionIcon}>
                <Feather name="trash-2" size={28} color={colors.destructive} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: colors.destructive }]}>Delete Account</Text>
                <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                  Permanently delete all data. This cannot be undone.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.optionBtn, { backgroundColor: colors.destructive }]}
                onPress={() => setStep('confirm')}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.warningBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Feather name="alert-triangle" size={20} color={colors.destructive} />
              <Text style={[styles.warningText, { color: colors.destructive }]}>
                This will permanently delete your account, matches, messages, and all your data. This cannot be undone.
              </Text>
            </View>

            <Text style={[styles.label, { color: colors.foreground }]}>Reason (optional)</Text>
            <View style={[styles.reasonGrid, { marginBottom: 24 }]}>
              {REASONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.reasonChip,
                    { borderColor: selectedReason === r ? colors.destructive : colors.border },
                    selectedReason === r && { backgroundColor: '#FEF2F2' },
                  ]}
                  onPress={() => setSelectedReason(r)}
                >
                  <Text style={{ color: selectedReason === r ? colors.destructive : colors.mutedForeground, fontSize: 13 }}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.foreground }]}>
              Type <Text style={{ fontWeight: '700' }}>"delete my account"</Text> to confirm
            </Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="delete my account"
              placeholderTextColor={colors.mutedForeground}
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.deleteBtn, { backgroundColor: colors.destructive, opacity: loading ? 0.6 : 1 }]}
              onPress={handleDeleteConfirm}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.deleteBtnText}>Delete My Account</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16,
  },
  optionIcon: { width: 44, alignItems: 'center' },
  optionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  optionDesc: { fontSize: 12, lineHeight: 17 },
  optionBtn: {
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  warningBox: {
    flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12,
    borderWidth: 1, marginBottom: 24, alignItems: 'flex-start',
  },
  warningText: { flex: 1, fontSize: 13, lineHeight: 19 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonChip: {
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
  },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, marginBottom: 24,
  },
  deleteBtn: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  deleteBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
