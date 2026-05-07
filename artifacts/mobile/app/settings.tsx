import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logout } = useApp();
  const [notifications, setNotifications] = useState(true);
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [showOnline, setShowOnline] = useState(true);

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom + 20;

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This cannot be undone. All your matches and messages will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleFeedback = () => {
    Alert.alert('Feedback', 'Thank you! We would love to hear from you. Please email us at hello@roomiematch.app');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Notifications */}
      <SettingsSection title="Notifications" colors={colors}>
        <ToggleRow
          label="All Notifications"
          sublabel="Master switch for all alerts"
          value={notifications}
          onChange={v => { setNotifications(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          colors={colors}
        />
        <ToggleRow
          label="New Matches"
          sublabel="When someone matches with you"
          value={matchAlerts}
          onChange={setMatchAlerts}
          colors={colors}
        />
        <ToggleRow
          label="New Messages"
          sublabel="When you receive a message"
          value={messageAlerts}
          onChange={setMessageAlerts}
          colors={colors}
        />
      </SettingsSection>

      {/* Privacy */}
      <SettingsSection title="Privacy" colors={colors}>
        <ToggleRow
          label="Show Online Status"
          sublabel="Let matches see when you are active"
          value={showOnline}
          onChange={setShowOnline}
          colors={colors}
        />
        <SettingsRow
          icon="eye-off"
          label="Blocked Users"
          sublabel="Manage your blocked list"
          onPress={() => Alert.alert('Blocked Users', 'No users blocked')}
          colors={colors}
        />
        <SettingsRow
          icon="lock"
          label="Privacy Settings"
          sublabel="Control what others can see"
          onPress={() => {}}
          colors={colors}
        />
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
          onPress={() => Alert.alert('Support', 'Visit roomiematch.app/help or email hello@roomiematch.app')}
          colors={colors}
        />
        <SettingsRow
          icon="message-square"
          label="Send Feedback"
          sublabel="Help us improve RoomieMatch"
          onPress={handleFeedback}
          colors={colors}
        />
      </SettingsSection>

      {/* Account Management */}
      <SettingsSection title="Account Management" colors={colors}>
        <SettingsRow
          icon="pause-circle"
          label="Pause Account"
          sublabel="Temporarily hide your profile"
          onPress={() => Alert.alert('Account Paused', 'Your profile is now hidden from other users.')}
          colors={colors}
        />
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
          onPress={handleDeleteAccount}
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
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
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
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.muted, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  rowSub: { fontSize: 12 },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  dangerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerInfo: { flex: 1 },
  dangerLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  version: { textAlign: 'center', fontSize: 12, marginTop: 32, marginBottom: 16 },
});
