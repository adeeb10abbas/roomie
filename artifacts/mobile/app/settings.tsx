import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { setNotificationsEnabled } from '@/utils/pushNotifications';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logout, userId, currentUser, patchCurrentUser, reactivateAccount } = useApp();
  const [notifications, setNotificationsState] = useState(currentUser?.notificationsEnabled !== false);

  const isDeactivated = !!(currentUser as any)?.deactivatedAt;

  useEffect(() => {
    if (currentUser?.notificationsEnabled !== undefined) {
      setNotificationsState(currentUser.notificationsEnabled);
    }
  }, [currentUser?.notificationsEnabled]);

  const handleNotificationsToggle = async (v: boolean) => {
    setNotificationsState(v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (userId) {
      try {
        await setNotificationsEnabled(userId, v);
        await patchCurrentUser({ notificationsEnabled: v });
      } catch {
        setNotificationsState(!v);
        Alert.alert('Error', 'Could not update notification preference.');
      }
    }
  };

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom + 20;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  const handleReactivate = async () => {
    Alert.alert('Reactivate Account', 'Your profile will be visible in the Discover feed again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reactivate',
        onPress: async () => {
          try {
            await reactivateAccount();
            Alert.alert('Account Reactivated', 'Welcome back! Your profile is visible again.');
          } catch {
            Alert.alert('Error', 'Failed to reactivate. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Verification Banner */}
      {currentUser && !currentUser.isVerified && (
        <TouchableOpacity
          style={[styles.verifyBanner, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}
          onPress={() => router.push('/verify-edu')}
        >
          <Feather name="shield" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.verifyTitle, { color: colors.primary }]}>Verify your student email</Text>
            <Text style={[styles.verifySub, { color: colors.mutedForeground }]}>Unlock all features with a .edu address</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}

      {currentUser?.isVerified && (
        <View style={[styles.verifyBanner, { backgroundColor: colors.successLight, borderColor: '#A7F3D0' }]}>
          <Feather name="check-circle" size={18} color={colors.successDark} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.verifyTitle, { color: colors.successDark }]}>Student Verified ✓</Text>
            <Text style={[styles.verifySub, { color: colors.mutedForeground }]}>
              {currentUser.eduDomain ?? 'Verified student'}
            </Text>
          </View>
        </View>
      )}

      {/* Notifications */}
      <SettingsSection title="Notifications" colors={colors}>
        <ToggleRow
          label="All Notifications"
          sublabel="Master switch for all alerts"
          value={notifications}
          onChange={handleNotificationsToggle}
          colors={colors}
        />
      </SettingsSection>

      {/* Privacy */}
      <SettingsSection title="Privacy" colors={colors}>
        <SettingsRow
          icon="eye-off"
          label="Blocked Users"
          sublabel="Manage your blocked list"
          onPress={() => router.push('/blocked-users')}
          colors={colors}
        />
        <SettingsRow
          icon="lock"
          label="Privacy Settings"
          sublabel="Control what others can see"
          onPress={() => router.push('/privacy')}
          colors={colors}
        />
        {!currentUser?.isVerified && (
          <SettingsRow
            icon="shield"
            label="Student Verification"
            sublabel="Verify your .edu email"
            onPress={() => router.push('/verify-edu')}
            colors={colors}
          />
        )}
      </SettingsSection>

      {/* Account */}
      <SettingsSection title="Account" colors={colors}>
        <SettingsRow
          icon="edit-2"
          label="Edit Profile"
          sublabel="Update your roommate profile"
          onPress={() => router.push('/edit-profile')}
          colors={colors}
        />
        <SettingsRow
          icon="sliders"
          label="Matching Preferences"
          sublabel="Adjust your filter settings"
          onPress={() => router.push('/filters')}
          colors={colors}
        />
        <SettingsRow
          icon="help-circle"
          label="Help & Support"
          sublabel="FAQs and contact us"
          onPress={() => router.push('/help')}
          colors={colors}
        />
        <SettingsRow
          icon="message-square"
          label="Send Feedback"
          sublabel="Help us improve RoomieMatch"
          onPress={() => router.push('/feedback')}
          colors={colors}
        />
      </SettingsSection>

      {/* Account Management */}
      <SettingsSection title="Account Management" colors={colors}>
        {isDeactivated ? (
          <TouchableOpacity
            style={[styles.dangerRow, { borderBottomColor: colors.border }]}
            onPress={handleReactivate}
          >
            <View style={[styles.dangerIcon, { backgroundColor: colors.successLight }]}>
              <Feather name="play-circle" size={18} color={colors.successDark} />
            </View>
            <View style={styles.dangerInfo}>
              <Text style={[styles.dangerLabel, { color: colors.successDark }]}>Reactivate Account</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Make your profile visible again</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <SettingsRow
            icon="pause-circle"
            label="Deactivate Account"
            sublabel="Temporarily hide your profile"
            onPress={() => router.push('/delete-account')}
            colors={colors}
          />
        )}
        <TouchableOpacity
          style={[styles.dangerRow, { borderBottomColor: colors.border }]}
          onPress={handleLogout}
        >
          <View style={[styles.dangerIcon, { backgroundColor: '#FFF7ED' }]}>
            <Feather name="log-out" size={18} color="#EA580C" />
          </View>
          <View style={styles.dangerInfo}>
            <Text style={[styles.dangerLabel, { color: '#EA580C' }]}>Sign Out</Text>
            <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Sign out of your account</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dangerRow, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/delete-account')}
        >
          <View style={[styles.dangerIcon, { backgroundColor: '#FEF2F2' }]}>
            <Feather name="trash-2" size={18} color={colors.destructive} />
          </View>
          <View style={styles.dangerInfo}>
            <Text style={[styles.dangerLabel, { color: colors.destructive }]}>Delete Account</Text>
            <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Permanently remove your account</Text>
          </View>
        </TouchableOpacity>
      </SettingsSection>

      {/* Legal */}
      <SettingsSection title="Legal" colors={colors}>
        <SettingsRow
          icon="file-text"
          label="Terms of Service"
          sublabel="Read our terms of use"
          onPress={() => router.push('/terms')}
          colors={colors}
        />
        <SettingsRow
          icon="shield"
          label="Privacy Policy"
          sublabel="How we handle your data"
          onPress={() => router.push('/privacy-policy')}
          colors={colors}
        />
      </SettingsSection>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>RoomieMatch v1.0.0</Text>
    </ScrollView>
  );
}

function SettingsSection({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function SettingsRow({ icon, label, sublabel, onPress, colors }: {
  icon: string; label: string; sublabel: string; onPress: () => void; colors: any;
}) {
  return (
    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
        <Feather name={icon as any} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{sublabel}</Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function ToggleRow({ label, sublabel, value, onChange, colors }: {
  label: string; sublabel: string; value: boolean; onChange: (v: boolean) => void; colors: any;
}) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{sublabel}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.muted, true: colors.primary }} thumbColor="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  verifyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginTop: 16, padding: 14,
    borderRadius: 14, borderWidth: 1,
  },
  verifyTitle: { fontSize: 14, fontWeight: '600' },
  verifySub: { fontSize: 12, marginTop: 1 },
  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  rowSub: { fontSize: 12 },
  dangerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  dangerIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dangerInfo: { flex: 1 },
  dangerLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  version: { textAlign: 'center', fontSize: 12, marginTop: 32, marginBottom: 16 },
});
