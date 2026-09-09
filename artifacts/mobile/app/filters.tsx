import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { FilterSettings } from '@/context/types';

const NEIGHBORHOODS = [
  'Williamsburg', 'Brooklyn Heights', 'Park Slope', 'Lower East Side',
  'Astoria', 'Long Island City', 'Bushwick', 'Greenpoint',
  'Upper West Side', 'Harlem', 'Chelsea', 'Murray Hill',
];

const BUDGET_PRESETS = [
  { label: 'Any', min: 0, max: 5000 },
  { label: 'Under $1,000', min: 0, max: 1000 },
  { label: '$1,000 – $1,500', min: 1000, max: 1500 },
  { label: '$1,500 – $2,000', min: 1500, max: 2000 },
  { label: '$2,000 – $2,500', min: 2000, max: 2500 },
  { label: '$2,500+', min: 2500, max: 5000 },
];

export default function FiltersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { filters, setFilters } = useApp();

  const [budgetMin, setBudgetMin] = useState(filters.budgetMin);
  const [budgetMax, setBudgetMax] = useState(filters.budgetMax);
  const [neighborhoods, setNeighborhoods] = useState<string[]>(filters.neighborhoods ?? []);
  const [noiseLevel, setNoiseLevel] = useState(filters.noiseLevel);
  const [smokingOk, setSmokingOk] = useState<boolean | null>(filters.smokingOk);
  const [sameGenderOnly, setSameGenderOnly] = useState(filters.sameGenderOnly);
  const [cleanliness, setCleanliness] = useState<number | null>(filters.cleanliness ?? null);
  const [drinking, setDrinking] = useState(filters.drinking ?? '');
  const [guests, setGuests] = useState(filters.guests ?? '');
  const [pets, setPets] = useState<boolean | null>(filters.pets ?? null);

  const toggleNeighborhood = (n: string) => {
    setNeighborhoods(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  };

  const handleApply = () => {
    const newFilters: FilterSettings = {
      budgetMin, budgetMax, neighborhoods, noiseLevel, smokingOk, sameGenderOnly,
      cleanliness, drinking, guests, pets,
    };
    setFilters(newFilters);
    router.back();
  };

  const handleReset = () => {
    setBudgetMin(0); setBudgetMax(5000); setNeighborhoods([]);
    setNoiseLevel(''); setSmokingOk(null); setSameGenderOnly(false);
    setCleanliness(null); setDrinking(''); setGuests(''); setPets(null);
  };

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom + 16;
  const selectedPreset = BUDGET_PRESETS.find(p => p.min === budgetMin && p.max === budgetMax);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad + 80 }} showsVerticalScrollIndicator={false}>

        {/* Budget */}
        <Section title="Budget Range" colors={colors}>
          {BUDGET_PRESETS.map(preset => (
            <TouchableOpacity
              key={preset.label}
              style={[styles.presetBtn, {
                backgroundColor: selectedPreset?.label === preset.label ? colors.primaryLight : colors.muted,
                borderColor: selectedPreset?.label === preset.label ? colors.primary : colors.border,
              }]}
              onPress={() => { setBudgetMin(preset.min); setBudgetMax(preset.max); }}
            >
              <Text style={[styles.presetText, { color: selectedPreset?.label === preset.label ? colors.primary : colors.foreground }]}>
                {preset.label}
              </Text>
              {selectedPreset?.label === preset.label && <Feather name="check" size={14} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </Section>

        {/* Neighborhoods */}
        <Section title="Neighborhoods" colors={colors}>
          <View style={styles.chipWrap}>
            {NEIGHBORHOODS.map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.chip, {
                  backgroundColor: neighborhoods.includes(n) ? colors.primary : colors.muted,
                  borderColor: neighborhoods.includes(n) ? colors.primary : colors.border,
                }]}
                onPress={() => toggleNeighborhood(n)}
              >
                <Text style={[styles.chipText, { color: neighborhoods.includes(n) ? '#FFF' : colors.foreground }]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Noise Level */}
        <Section title="Noise Preference" colors={colors}>
          <View style={styles.chipWrap}>
            {[
              { label: 'Any', value: '' },
              { label: 'Quiet', value: 'quiet' },
              { label: 'Moderate', value: 'moderate' },
              { label: 'Social', value: 'social' },
            ].map(o => (
              <TouchableOpacity
                key={o.value}
                style={[styles.chip, {
                  backgroundColor: noiseLevel === o.value ? colors.primary : colors.muted,
                  borderColor: noiseLevel === o.value ? colors.primary : colors.border,
                }]}
                onPress={() => setNoiseLevel(o.value)}
              >
                <Text style={[styles.chipText, { color: noiseLevel === o.value ? '#FFF' : colors.foreground }]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Cleanliness */}
        <Section title="Cleanliness (1=relaxed, 5=spotless)" colors={colors}>
          <View style={styles.chipWrap}>
            {[null, 1, 2, 3, 4, 5].map(v => (
              <TouchableOpacity
                key={String(v)}
                style={[styles.chip, {
                  backgroundColor: cleanliness === v ? colors.primary : colors.muted,
                  borderColor: cleanliness === v ? colors.primary : colors.border,
                }]}
                onPress={() => setCleanliness(v)}
              >
                <Text style={[styles.chipText, { color: cleanliness === v ? '#FFF' : colors.foreground }]}>
                  {v === null ? 'Any' : String(v)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Drinking */}
        <Section title="Drinking Habits" colors={colors}>
          <View style={styles.chipWrap}>
            {[
              { label: 'Any', value: '' },
              { label: 'Never', value: 'never' },
              { label: 'Socially', value: 'socially' },
              { label: 'Regularly', value: 'regularly' },
            ].map(o => (
              <TouchableOpacity
                key={o.value}
                style={[styles.chip, {
                  backgroundColor: drinking === o.value ? colors.primary : colors.muted,
                  borderColor: drinking === o.value ? colors.primary : colors.border,
                }]}
                onPress={() => setDrinking(o.value)}
              >
                <Text style={[styles.chipText, { color: drinking === o.value ? '#FFF' : colors.foreground }]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Guests */}
        <Section title="Guest Frequency" colors={colors}>
          <View style={styles.chipWrap}>
            {[
              { label: 'Any', value: '' },
              { label: 'Rarely', value: 'rarely' },
              { label: 'Sometimes', value: 'sometimes' },
              { label: 'Often', value: 'often' },
            ].map(o => (
              <TouchableOpacity
                key={o.value}
                style={[styles.chip, {
                  backgroundColor: guests === o.value ? colors.primary : colors.muted,
                  borderColor: guests === o.value ? colors.primary : colors.border,
                }]}
                onPress={() => setGuests(o.value)}
              >
                <Text style={[styles.chipText, { color: guests === o.value ? '#FFF' : colors.foreground }]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Smoking */}
        <Section title="Smoking" colors={colors}>
          <View style={styles.chipWrap}>
            {[
              { label: 'Any', value: null },
              { label: 'Non-smokers only', value: false },
              { label: 'Smokers OK', value: true },
            ].map(o => (
              <TouchableOpacity
                key={String(o.value)}
                style={[styles.chip, {
                  backgroundColor: smokingOk === o.value ? colors.primary : colors.muted,
                  borderColor: smokingOk === o.value ? colors.primary : colors.border,
                }]}
                onPress={() => setSmokingOk(o.value)}
              >
                <Text style={[styles.chipText, { color: smokingOk === o.value ? '#FFF' : colors.foreground }]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Pets */}
        <Section title="Pets" colors={colors}>
          <View style={styles.chipWrap}>
            {[
              { label: 'Any', value: null },
              { label: 'Pet-free', value: false },
              { label: 'Pets OK', value: true },
            ].map(o => (
              <TouchableOpacity
                key={String(o.value)}
                style={[styles.chip, {
                  backgroundColor: pets === o.value ? colors.primary : colors.muted,
                  borderColor: pets === o.value ? colors.primary : colors.border,
                }]}
                onPress={() => setPets(o.value)}
              >
                <Text style={[styles.chipText, { color: pets === o.value ? '#FFF' : colors.foreground }]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Same Gender */}
        <Section title="Gender Preference" colors={colors}>
          <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Same-gender only</Text>
              <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                Only show roommates who share your gender
              </Text>
            </View>
            <Switch
              value={sameGenderOnly}
              onValueChange={setSameGenderOnly}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Section>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: bottomPad, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.resetBtn, { borderColor: colors.border }]} onPress={handleReset}>
          <Text style={[styles.resetText, { color: colors.foreground }]}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.primary }]} onPress={handleApply}>
          <Text style={[styles.applyText, { color: colors.primaryForeground }]}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={[styles.section, { borderBottomColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { padding: 20, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  presetBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
  },
  presetText: { fontSize: 14, fontWeight: '500' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '500' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14,
  },
  toggleLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  toggleSub: { fontSize: 12 },
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  resetBtn: { flex: 1, paddingVertical: 15, borderRadius: 32, alignItems: 'center', borderWidth: 1 },
  resetText: { fontSize: 15, fontWeight: '600' },
  applyBtn: { flex: 2, paddingVertical: 15, borderRadius: 32, alignItems: 'center' },
  applyText: { fontSize: 15, fontWeight: '700' },
});
