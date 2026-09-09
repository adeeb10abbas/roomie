import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity,
  Platform, KeyboardAvoidingView, ActivityIndicator, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { NoiseLevel, CleanlinessLevel } from '@/context/types';
import { getProfileImage } from '@/utils/images';
import { pickAndCompressPhoto, uploadPhoto, showPhotoPickerSheet } from '@/utils/photoUpload';

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, setCurrentUser } = useApp();

  const [bio, setBio] = useState(currentUser?.bio ?? '');
  const [budgetMin, setBudgetMin] = useState(String(currentUser?.budgetMin ?? 1000));
  const [budgetMax, setBudgetMax] = useState(String(currentUser?.budgetMax ?? 2000));
  const [moveInDate, setMoveInDate] = useState(currentUser?.moveInDate ?? 'July 2026');
  const [noise, setNoise] = useState<NoiseLevel>(currentUser?.lifestyle.noise ?? 'moderate');
  const [cleanliness, setCleanliness] = useState<CleanlinessLevel>(currentUser?.lifestyle.cleanliness ?? 3);
  const [smoking, setSmoking] = useState(currentUser?.lifestyle.smoking ?? false);
  const [pets, setPets] = useState(currentUser?.lifestyle.pets ?? false);
  const [sameGenderOnly, setSameGenderOnly] = useState(currentUser?.sameGenderOnly ?? false);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!currentUser) return null;

  const displayPhotoUrl = photoUri ?? currentUser.photoUrl;

  const handlePickPhoto = (source: 'gallery' | 'camera') => {
    (async () => {
      try {
        const uri = await pickAndCompressPhoto(source);
        if (!uri) return;
        setUploading(true);
        const url = await uploadPhoto(uri);
        setPhotoUri(url);
        await setCurrentUser({ ...currentUser, photoUrl: url });
      } catch {
        Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
      } finally {
        setUploading(false);
      }
    })();
  };

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setCurrentUser({
      ...currentUser,
      bio,
      budgetMin: parseInt(budgetMin) || currentUser.budgetMin,
      budgetMax: parseInt(budgetMax) || currentUser.budgetMax,
      moveInDate,
      lifestyle: {
        ...currentUser.lifestyle,
        noise,
        cleanliness,
        smoking,
        pets,
      },
      sameGenderOnly,
    });
    router.back();
  };

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom + 16;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPad + 80 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo */}
        <Label colors={colors}>Profile Photo</Label>
        <View style={styles.photoRow}>
          <View style={styles.photoWrap}>
            <Image
              source={getProfileImage(currentUser.photoIndex, displayPhotoUrl)}
              style={styles.photoPreview}
              contentFit="cover"
            />
            {uploading && (
              <View style={styles.photoOverlay}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.changePhotoBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}
            onPress={() => showPhotoPickerSheet(handlePickPhoto)}
            disabled={uploading}
          >
            <Feather name="camera" size={15} color={colors.primary} />
            <Text style={[styles.changePhotoBtnText, { color: colors.primary }]}>
              {uploading ? 'Uploading…' : 'Change Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bio */}
        <Label colors={colors}>Bio</Label>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Tell others about yourself..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={4}
          style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
        />

        {/* Budget */}
        <Label colors={colors}>Monthly Budget</Label>
        <View style={styles.budgetRow}>
          <View style={styles.budgetField}>
            <Text style={[styles.budgetLabel, { color: colors.mutedForeground }]}>Min ($)</Text>
            <TextInput
              value={budgetMin}
              onChangeText={setBudgetMin}
              keyboardType="numeric"
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
            />
          </View>
          <Text style={[styles.budgetSep, { color: colors.mutedForeground }]}>–</Text>
          <View style={styles.budgetField}>
            <Text style={[styles.budgetLabel, { color: colors.mutedForeground }]}>Max ($)</Text>
            <TextInput
              value={budgetMax}
              onChangeText={setBudgetMax}
              keyboardType="numeric"
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
            />
          </View>
        </View>

        {/* Move-in Date */}
        <Label colors={colors}>Move-in Date</Label>
        <View style={styles.chipWrap}>
          {['June 2026', 'July 2026', 'August 2026', 'September 2026', 'Flexible'].map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.chip, {
                backgroundColor: moveInDate === d ? colors.primary : colors.muted,
                borderColor: moveInDate === d ? colors.primary : colors.border,
              }]}
              onPress={() => setMoveInDate(d)}
            >
              <Text style={[styles.chipText, { color: moveInDate === d ? '#FFF' : colors.foreground }]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Noise */}
        <Label colors={colors}>Noise Level</Label>
        <View style={styles.chipWrap}>
          {[
            { label: 'Quiet', value: 'quiet' },
            { label: 'Moderate', value: 'moderate' },
            { label: 'Social', value: 'social' },
          ].map(o => (
            <TouchableOpacity
              key={o.value}
              style={[styles.chip, {
                backgroundColor: noise === o.value ? colors.primary : colors.muted,
                borderColor: noise === o.value ? colors.primary : colors.border,
              }]}
              onPress={() => setNoise(o.value as NoiseLevel)}
            >
              <Text style={[styles.chipText, { color: noise === o.value ? '#FFF' : colors.foreground }]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cleanliness */}
        <Label colors={colors}>Cleanliness</Label>
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <TouchableOpacity key={n} onPress={() => setCleanliness(n as CleanlinessLevel)}>
              <Text style={[styles.star, { color: n <= cleanliness ? colors.warning : colors.border }]}>★</Text>
            </TouchableOpacity>
          ))}
          <Text style={[styles.cleanLabel, { color: colors.mutedForeground }]}>
            {['', 'Relaxed', 'Fairly tidy', 'Tidy', 'Very tidy', 'Spotless'][cleanliness]}
          </Text>
        </View>

        {/* Toggles */}
        <ToggleRow label="Smoking OK" value={smoking} onChange={setSmoking} colors={colors} />
        <ToggleRow label="Pets OK" value={pets} onChange={setPets} colors={colors} />
        <ToggleRow label="Same-gender roommates only" value={sameGenderOnly} onChange={setSameGenderOnly} colors={colors} />
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { paddingBottom: bottomPad, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={uploading}
        >
          <Feather name="check" size={18} color={colors.primaryForeground} />
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Label({ children, colors }: { children: string; colors: any }) {
  return <Text style={[styles.label, { color: colors.foreground }]}>{children}</Text>;
}

function ToggleRow({ label, value, onChange, colors }: { label: string; value: boolean; onChange: (v: boolean) => void; colors: any }) {
  return (
    <TouchableOpacity
      style={styles.toggleRow}
      onPress={() => onChange(!value)}
    >
      <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={[styles.toggle, { backgroundColor: value ? colors.primary : colors.muted }]}>
        <View style={[styles.toggleThumb, { left: value ? 22 : 2 }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  photoWrap: { position: 'relative' },
  photoPreview: { width: 80, height: 80, borderRadius: 40 },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  changePhotoBtnText: { fontSize: 14, fontWeight: '600' },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textarea: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  budgetRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  budgetField: { flex: 1 },
  budgetLabel: { fontSize: 12, marginBottom: 6 },
  budgetSep: { fontSize: 20, marginBottom: 12 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '500' },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  star: { fontSize: 30 },
  cleanLabel: { fontSize: 13, marginLeft: 4 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  toggleLabel: { fontSize: 15, fontWeight: '500' },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 32,
    gap: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700' },
});
