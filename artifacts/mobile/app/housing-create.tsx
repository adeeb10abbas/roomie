import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Switch, ActivityIndicator, Alert,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type ListingType = 'permanent_room' | 'sublet' | 'forming_group';

const TYPE_OPTIONS: { value: ListingType; label: string; desc: string; icon: string }[] = [
  { value: 'permanent_room', label: 'Open Room', desc: 'You have a spare room to fill', icon: '🏠' },
  { value: 'sublet', label: 'Sublet', desc: 'Short-term subletting', icon: '🗓️' },
  { value: 'forming_group', label: 'Forming Group', desc: 'Looking for roommates together', icon: '👥' },
];

export default function HousingCreateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { createHousingListing, updateHousingListing, housing, groups } = useApp();
  const params = useLocalSearchParams<{ edit?: string; type?: string }>();
  const editId = typeof params.edit === 'string' && params.edit ? params.edit : undefined;
  const presetType: ListingType | undefined =
    params.type === 'forming_group' || params.type === 'sublet' || params.type === 'permanent_room'
      ? params.type
      : undefined;
  const existing = editId ? [...housing, ...groups].find((l) => l.id === editId) : undefined;

  const [type, setType] = useState<ListingType>(existing?.type ?? presetType ?? 'permanent_room');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [neighborhood, setNeighborhood] = useState(existing?.neighborhood ?? '');
  const [rent, setRent] = useState(existing ? String(existing.rent) : '');
  const [moveInDate, setMoveInDate] = useState(existing?.moveInDate ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [maxRoommates, setMaxRoommates] = useState(existing ? String(existing.maxRoommates) : '2');
  const [sameGenderOnly, setSameGenderOnly] = useState(existing?.sameGenderOnly ?? false);
  const [requireReview, setRequireReview] = useState(existing?.requireRoommateReview ?? true);
  const [subletStart, setSubletStart] = useState(existing?.subletStart ?? '');
  const [subletEnd, setSubletEnd] = useState(existing?.subletEnd ?? '');
  const [loading, setLoading] = useState(false);

  const isGroup = type === 'forming_group';
  const headerTitle = editId
    ? (isGroup ? 'Edit Group' : 'Edit Listing')
    : presetType === 'forming_group'
      ? 'Start a Group'
      : 'List a Space';

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert('Title Required', 'Please add a listing title.'); return; }
    if (!neighborhood.trim()) { Alert.alert('Neighborhood Required', 'Please add a neighborhood.'); return; }
    if (!rent || isNaN(Number(rent)) || Number(rent) <= 0) {
      Alert.alert('Valid Rent Required', 'Please enter a valid monthly rent amount.');
      return;
    }

    setLoading(true);
    try {
      const data: Record<string, unknown> = {
        type,
        title: title.trim(),
        address: address.trim(),
        neighborhood: neighborhood.trim(),
        rent: Number(rent),
        moveInDate: moveInDate.trim(),
        description: description.trim(),
        maxRoommates: Number(maxRoommates) || 2,
        sameGenderOnly,
        requireRoommateReview: type === 'permanent_room' ? true : requireReview,
        rules: [],
        tags: [],
        amenities: [],
        photoIndex: 0,
      };
      if (type === 'sublet') {
        data.subletStart = subletStart;
        data.subletEnd = subletEnd;
      }

      if (editId) {
        await updateHousingListing(editId, data);
      } else {
        await createHousingListing(data);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        editId ? 'Listing Updated!' : isGroup ? 'Group Created!' : 'Listing Created!',
        editId ? 'Your changes are saved.' : isGroup ? 'Your group is now live.' : 'Your space is now live.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('verification_required')) {
        Alert.alert('Verification Required', 'Please verify your student email to list a space.', [
          { text: 'Verify Now', onPress: () => { router.back(); router.push('/verify-edu'); } },
          { text: 'Cancel', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Error', `Failed to ${editId ? 'update' : 'create'} listing. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ headerTitle }} />
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>

        {/* Type selector */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>LISTING TYPE</Text>
        <View style={styles.typeRow}>
          {TYPE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.typeCard,
                { borderColor: type === opt.value ? colors.primary : colors.border },
                type === opt.value && { backgroundColor: colors.primaryLight },
              ]}
              onPress={() => setType(opt.value)}
            >
              <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
              <Text style={[styles.typeLabel, { color: type === opt.value ? colors.primary : colors.foreground }]}>
                {opt.label}
              </Text>
              <Text style={[styles.typeDesc, { color: colors.mutedForeground }]}>{opt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Basic info */}
        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>LISTING DETAILS</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
          placeholder="Title (e.g., Sunny Room in Brooklyn)"
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
          placeholder="Neighborhood"
          placeholderTextColor={colors.mutedForeground}
          value={neighborhood}
          onChangeText={setNeighborhood}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
          placeholder="Street address (optional)"
          placeholderTextColor={colors.mutedForeground}
          value={address}
          onChangeText={setAddress}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="Monthly rent ($)"
              placeholderTextColor={colors.mutedForeground}
              value={rent}
              onChangeText={setRent}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="Move-in (MM/YYYY)"
              placeholderTextColor={colors.mutedForeground}
              value={moveInDate}
              onChangeText={setMoveInDate}
            />
          </View>
        </View>

        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
          placeholder="Max roommates"
          placeholderTextColor={colors.mutedForeground}
          value={maxRoommates}
          onChangeText={setMaxRoommates}
          keyboardType="numeric"
        />

        {type === 'sublet' && (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                placeholder="Sublet start (YYYY-MM-DD)"
                placeholderTextColor={colors.mutedForeground}
                value={subletStart}
                onChangeText={setSubletStart}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                placeholder="Sublet end (YYYY-MM-DD)"
                placeholderTextColor={colors.mutedForeground}
                value={subletEnd}
                onChangeText={setSubletEnd}
              />
            </View>
          </View>
        )}

        <TextInput
          style={[styles.textarea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
          placeholder="Description — tell potential roommates about the space..."
          placeholderTextColor={colors.mutedForeground}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        {/* Preferences */}
        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 8 }]}>PREFERENCES</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Same gender only</Text>
              <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>Only show to users of same gender</Text>
            </View>
            <Switch
              value={sameGenderOnly}
              onValueChange={setSameGenderOnly}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          {type !== 'permanent_room' && (
            <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Roommate review</Text>
                <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                  {requireReview ? 'You approve each request' : 'Auto-approve (instant join)'}
                </Text>
              </View>
              <Switch
                value={requireReview}
                onValueChange={setRequireReview}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{editId ? 'Save Changes' : isGroup ? 'Create Group' : 'Create Listing'}</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeCard: {
    flex: 1, borderWidth: 1.5, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4,
  },
  typeLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  typeDesc: { fontSize: 10, textAlign: 'center', lineHeight: 14 },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, marginBottom: 10,
  },
  textarea: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, height: 100, marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 10 },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  toggleSub: { fontSize: 12 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
