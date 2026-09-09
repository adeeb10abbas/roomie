import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

// Display label → API enum value (see CreateFeedbackSchema in @workspace/api-zod).
const CATEGORIES: Array<{ label: string; value: 'bug' | 'feature' | 'general' | 'other' }> = [
  { label: 'Bug', value: 'bug' },
  { label: 'Feature Request', value: 'feature' },
  { label: 'UI Feedback', value: 'general' },
  { label: 'Account Issue', value: 'general' },
  { label: 'Other', value: 'other' },
];

export default function FeedbackScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { submitFeedback } = useApp();
  const [category, setCategory] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!category) { Alert.alert('Category Required', 'Please select a feedback category.'); return; }
    if (body.trim().length < 10) { Alert.alert('More Detail', 'Please provide at least 10 characters of feedback.'); return; }
    setLoading(true);
    try {
      await submitFeedback(category, body.trim(), '1.0.0');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    } catch {
      Alert.alert('Error', 'Failed to send feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Send Feedback</Text>
        <View style={{ width: 40 }} />
      </View>

      {sent ? (
        <View style={styles.successContainer}>
          <Feather name="check-circle" size={56} color={colors.success} />
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Thank you!</Text>
          <Text style={[styles.successDesc, { color: colors.mutedForeground }]}>
            Your feedback helps us improve RoomieMatch for everyone.
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.btnText}>Back to Settings</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>CATEGORY</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.label}
                style={[
                  styles.chip,
                  { borderColor: category === cat.value ? colors.primary : colors.border },
                  category === cat.value && { backgroundColor: colors.primaryLight },
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Text style={{ color: category === cat.value ? colors.primary : colors.mutedForeground, fontWeight: '500', fontSize: 13 }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>YOUR FEEDBACK</Text>
          <TextInput
            style={[styles.textarea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
            placeholder="Tell us what's on your mind..."
            placeholderTextColor={colors.mutedForeground}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{body.length} characters</Text>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Feedback</Text>}
          </TouchableOpacity>
        </View>
      )}
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
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  textarea: {
    borderWidth: 1, borderRadius: 14, padding: 14,
    fontSize: 15, height: 140, marginBottom: 6,
  },
  charCount: { fontSize: 12, textAlign: 'right', marginBottom: 24 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  successContainer: { flex: 1, alignItems: 'center', padding: 40, gap: 16, marginTop: 40 },
  successTitle: { fontSize: 24, fontWeight: '700' },
  successDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
