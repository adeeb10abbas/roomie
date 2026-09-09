import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TouchableWithoutFeedback, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function AuthGateModal({ visible, onDismiss }: Props) {
  const colors = useColors();
  const { clearGuestMode } = useApp();

  const handleSignUp = () => {
    onDismiss();
    clearGuestMode();
    router.push('/register');
  };

  const handleLogIn = () => {
    onDismiss();
    clearGuestMode();
    router.push('/login');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
          <Feather name="heart" size={28} color={colors.primary} />
        </View>

        <Text style={[styles.headline, { color: colors.foreground }]}>
          Create an account to keep matching
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Join RoomieMatch to like, skip, and find your perfect roommate.
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={handleSignUp}
          activeOpacity={0.85}
        >
          <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
            Sign Up — It's Free
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: colors.border }]}
          onPress={handleLogIn}
          activeOpacity={0.75}
        >
          <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
            Already have an account? Log In
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
          <Text style={[styles.dismissText, { color: colors.mutedForeground }]}>
            Continue browsing as guest
          </Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  headline: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 32,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dismissBtn: {
    paddingVertical: 8,
    marginTop: 4,
  },
  dismissText: {
    fontSize: 13,
  },
});
