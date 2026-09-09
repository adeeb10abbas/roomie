import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import type { PrivacySettings } from '@/context/types';

const DEFAULT_PRIVACY: PrivacySettings = {
  showAge: true,
  showUniversity: true,
  showOccupation: true,
  hideFromSearch: false,
};

export default function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, patchCurrentUser, setCurrentUser } = useApp();

  const [privacy, setPrivacy] = useState<PrivacySettings>(
    (currentUser?.privacy as PrivacySettings | undefined) ?? DEFAULT_PRIVACY,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser?.privacy) {
      setPrivacy(currentUser.privacy as PrivacySettings);
    }
  }, [currentUser?.privacy]);

  const toggle = async (key: keyof PrivacySettings, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newPrivacy = { ...privacy, [key]: value };
    setPrivacy(newPrivacy);
    setSaving(true);
    try {
      await setCurrentUser({ ...currentUser!, privacy: newPrivacy });
    } finally {
      setSaving(false);
    }
  };

  const rows: { key: keyof PrivacySettings; label: string; sublabel: string; danger?: boolean }[] = [
    { key: 'showAge', label: 'Show Age', sublabel: 'Display your age on your profile card' },
    { key: 'showUniversity', label: 'Show University', sublabel: 'Show your university name to other users' },
    { key: 'showOccupation', label: 'Show Occupation', sublabel: 'Display your occupation to potential roommates' },
    { key: 'hideFromSearch', label: 'Hide from Search', sublabel: 'Prevent your profile from appearing in the Discover feed', danger: true },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Privacy Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
          Control who can see your information and how you appear to other users.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {rows.map((row, i) => (
            <View
              key={row.key}
              style={[
                styles.row,
                { borderBottomColor: colors.border },
                i === rows.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.rowInfo}>
                <Text style={[styles.rowLabel, { color: row.danger ? colors.destructive : colors.foreground }]}>
                  {row.label}
                </Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{row.sublabel}</Text>
              </View>
              <Switch
                value={privacy[row.key]}
                onValueChange={(v) => toggle(row.key, v)}
                trackColor={{ false: colors.muted, true: row.danger ? colors.destructive : colors.primary }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>
          ))}
        </View>

        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          Changes take effect immediately. Your existing matches can still see your profile.
        </Text>
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
  backBtn: { width: 40, alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '700' },
  sectionDesc: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 14, borderBottomWidth: 1, gap: 12,
  },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  rowSub: { fontSize: 12 },
  note: { fontSize: 12, lineHeight: 18, paddingHorizontal: 4 },
});
