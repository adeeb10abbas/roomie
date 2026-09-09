import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Platform, KeyboardAvoidingView, Alert, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { UserProfile, Gender, NoiseLevel, CleanlinessLevel, SleepSchedule, DrinkingHabit, GuestFrequency, CommunicationStyle } from '@/context/types';
import { pickAndCompressPhoto, uploadPhoto, showPhotoPickerSheet } from '@/utils/photoUpload';

const NEIGHBORHOODS = [
  'Williamsburg', 'Brooklyn Heights', 'Park Slope', 'Lower East Side',
  'Astoria', 'Long Island City', 'Bushwick', 'Greenpoint',
  'Upper West Side', 'Harlem', 'Chelsea', 'Murray Hill',
];

const LIFESTYLE_TAGS = [
  'early riser', 'night owl', 'home cook', 'plant parent', 'gym rat',
  'bookworm', 'remote worker', 'social butterfly', 'introvert-friendly',
  'pet-friendly', 'minimalist', 'creative', 'foodie', 'traveler',
];

const PROMPTS = [
  'My ideal Sunday morning',
  'What I bring to a shared home',
  'The key to a good shared home',
  'Non-negotiable for me',
  'I am the roommate who',
  'My morning routine',
];

const TOTAL_STEPS = 6;

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setCurrentUser, userId } = useApp();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 0 — Basic info
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('prefer_not_to_say');
  const [sameGenderOnly, setSameGenderOnly] = useState(false);

  // Step 1 — School & work
  const [university, setUniversity] = useState('');
  const [occupation, setOccupation] = useState('');

  // Step 2 — Location & budget
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState('1000');
  const [budgetMax, setBudgetMax] = useState('2000');
  const [moveInDate, setMoveInDate] = useState('July 2026');

  // Step 3 — Core lifestyle
  const [noise, setNoise] = useState<NoiseLevel>('moderate');
  const [cleanliness, setCleanliness] = useState<CleanlinessLevel>(3);
  const [smoking, setSmoking] = useState(false);
  const [pets, setPets] = useState(false);

  // Step 4 — Extended lifestyle
  const [sleepSchedule, setSleepSchedule] = useState<SleepSchedule>('flexible');
  const [drinking, setDrinking] = useState<DrinkingHabit>('socially');
  const [guests, setGuests] = useState<GuestFrequency>('sometimes');
  const [communicationStyle, setCommunicationStyle] = useState<CommunicationStyle>('direct');

  // Step 5 — Bio, prompts, tags, photo
  const [bio, setBio] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [promptQ, setPromptQ] = useState(PROMPTS[0]);
  const [promptA, setPromptA] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const toggleNeighborhood = (n: string) => {
    setSelectedNeighborhoods(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    );
  };

  const toggleTag = (t: string) => {
    setSelectedTags(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  };

  const canNext = () => {
    if (step === 0) return name.trim().length > 0 && age.trim().length > 0;
    if (step === 1) return university.trim().length > 0;
    if (step === 2) return selectedNeighborhoods.length > 0;
    return true;
  };

  const handlePickPhoto = (source: 'gallery' | 'camera') => {
    (async () => {
      try {
        const uri = await pickAndCompressPhoto(source);
        if (!uri) return;
        setPhotoUploading(true);
        setPhotoUri(uri);
      } catch {
        Alert.alert('Error', 'Could not load photo. Please try again.');
      } finally {
        setPhotoUploading(false);
      }
    })();
  };

  const handleFinish = async () => {
    if (submitting) return;
    setSubmitting(true);
    const user: UserProfile = {
      id: userId ?? '',
      name: name.trim(),
      age: parseInt(age) || 25,
      gender,
      university: university.trim(),
      isVerified: false,
      bio: bio.trim(),
      photoIndex: 0,
      occupation: occupation.trim() || 'Professional',
      location: 'New York, NY',
      neighborhoods: selectedNeighborhoods,
      budgetMin: parseInt(budgetMin) || 1000,
      budgetMax: parseInt(budgetMax) || 2000,
      moveInDate,
      lifestyle: {
        sleepSchedule,
        cleanliness,
        noise,
        smoking,
        drinking,
        pets,
        guests,
        communicationStyle,
      },
      sameGenderOnly,
      language: 'English',
      religion: '',
      prompts: promptA.trim() ? [{ question: promptQ, answer: promptA.trim() }] : [],
      tags: selectedTags,
      badges: [],
    };
    try {
      await setCurrentUser(user);

      if (photoUri) {
        try {
          const url = await uploadPhoto(photoUri);
          await setCurrentUser({ ...user, photoUrl: url });
        } catch {
          // Non-fatal: user can update photo later via Edit Profile
        }
      }

      router.replace('/(tabs)');
    } finally {
      setSubmitting(false);
    }
  };

  const topPadding = Platform.OS === 'web' ? 67 : insets.top + 12;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom + 24;
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const STEP_LABELS = [
    'About you',
    'School & work',
    'Location',
    'Lifestyle',
    'More about you',
    'Your story',
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.topBar, { paddingTop: topPadding }]}>
        {step > 0 ? (
          <TouchableOpacity onPress={() => setStep(s => s - 1)}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress}%` as any }]} />
          </View>
          <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
            {STEP_LABELS[step]}
          </Text>
        </View>
        <Text style={[styles.stepText, { color: colors.mutedForeground }]}>
          {step + 1}/{TOTAL_STEPS}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step 0 — Basic info */}
        {step === 0 && (
          <StepView title="Let's set up your profile" subtitle="Tell us a bit about yourself">
            <Label colors={colors}>Your name</Label>
            <Input value={name} onChangeText={setName} placeholder="First name" colors={colors} />
            <Label colors={colors}>Age</Label>
            <Input value={age} onChangeText={setAge} placeholder="e.g. 24" keyboardType="numeric" colors={colors} />
            <Label colors={colors}>Gender</Label>
            <ChipGroup
              options={[
                { label: 'Man', value: 'male' },
                { label: 'Woman', value: 'female' },
                { label: 'Non-binary', value: 'non_binary' },
                { label: 'Prefer not to say', value: 'prefer_not_to_say' },
              ]}
              selected={gender}
              onSelect={v => setGender(v as Gender)}
              colors={colors}
            />
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Same-gender roommates only</Text>
              <Toggle value={sameGenderOnly} onChange={setSameGenderOnly} colors={colors} />
            </View>
          </StepView>
        )}

        {/* Step 1 — School & work */}
        {step === 1 && (
          <StepView title="Your school & work" subtitle="This helps us show relevant matches">
            <Label colors={colors}>University</Label>
            <Input value={university} onChangeText={setUniversity} placeholder="e.g. NYU, Columbia, Hunter College" colors={colors} />
            <View style={[styles.verifyHint, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}>
              <Feather name="shield" size={14} color={colors.primary} />
              <Text style={[styles.verifyHintText, { color: colors.primary }]}>
                You can verify your .edu email after setup to unlock the verified badge
              </Text>
            </View>
            <Label colors={colors}>Occupation</Label>
            <Input value={occupation} onChangeText={setOccupation} placeholder="e.g. Software Engineer, Grad Student" colors={colors} />
          </StepView>
        )}

        {/* Step 2 — Location & budget */}
        {step === 2 && (
          <StepView title="Where do you want to live?" subtitle="Select your preferred neighborhoods">
            <View style={styles.chipWrap}>
              {NEIGHBORHOODS.map(n => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedNeighborhoods.includes(n) ? colors.primary : colors.muted,
                      borderColor: selectedNeighborhoods.includes(n) ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => toggleNeighborhood(n)}
                >
                  <Text style={[styles.chipText, { color: selectedNeighborhoods.includes(n) ? '#FFF' : colors.foreground }]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label colors={colors}>Monthly budget range</Label>
            <View style={styles.budgetRow}>
              <View style={styles.budgetField}>
                <Text style={[styles.budgetLabel, { color: colors.mutedForeground }]}>Min</Text>
                <Input value={budgetMin} onChangeText={setBudgetMin} placeholder="1000" keyboardType="numeric" colors={colors} />
              </View>
              <Text style={[styles.budgetSep, { color: colors.mutedForeground }]}>–</Text>
              <View style={styles.budgetField}>
                <Text style={[styles.budgetLabel, { color: colors.mutedForeground }]}>Max</Text>
                <Input value={budgetMax} onChangeText={setBudgetMax} placeholder="2000" keyboardType="numeric" colors={colors} />
              </View>
            </View>

            <Label colors={colors}>Move-in date</Label>
            <ChipGroup
              options={['June 2026', 'July 2026', 'August 2026', 'September 2026', 'Flexible'].map(v => ({ label: v, value: v }))}
              selected={moveInDate}
              onSelect={setMoveInDate}
              colors={colors}
            />
          </StepView>
        )}

        {/* Step 3 — Core lifestyle */}
        {step === 3 && (
          <StepView title="Your lifestyle" subtitle="Help us find your best match">
            <Label colors={colors}>Noise level preference</Label>
            <ChipGroup
              options={[
                { label: 'Quiet', value: 'quiet' },
                { label: 'Moderate', value: 'moderate' },
                { label: 'Social', value: 'social' },
              ]}
              selected={noise}
              onSelect={v => setNoise(v as NoiseLevel)}
              colors={colors}
            />

            <Label colors={colors}>Cleanliness level</Label>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setCleanliness(n as CleanlinessLevel)}>
                  <Text style={[styles.star, { color: n <= cleanliness ? '#F59E0B' : colors.border }]}>★</Text>
                </TouchableOpacity>
              ))}
              <Text style={[styles.cleanLabel, { color: colors.mutedForeground }]}>
                {['', 'Relaxed', 'Fairly tidy', 'Tidy', 'Very tidy', 'Spotless'][cleanliness]}
              </Text>
            </View>

            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Smoking OK</Text>
              <Toggle value={smoking} onChange={setSmoking} colors={colors} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Pets OK</Text>
              <Toggle value={pets} onChange={setPets} colors={colors} />
            </View>
          </StepView>
        )}

        {/* Step 4 — Extended lifestyle */}
        {step === 4 && (
          <StepView title="A bit more about your habits" subtitle="Fine-tune your compatibility score">
            <Label colors={colors}>Sleep schedule</Label>
            <ChipGroup
              options={[
                { label: 'Early bird', value: 'early_bird' },
                { label: 'Night owl', value: 'night_owl' },
                { label: 'Flexible', value: 'flexible' },
              ]}
              selected={sleepSchedule}
              onSelect={v => setSleepSchedule(v as SleepSchedule)}
              colors={colors}
            />

            <Label colors={colors}>Drinking habits</Label>
            <ChipGroup
              options={[
                { label: 'Never', value: 'never' },
                { label: 'Socially', value: 'socially' },
                { label: 'Regularly', value: 'regularly' },
              ]}
              selected={drinking}
              onSelect={v => setDrinking(v as DrinkingHabit)}
              colors={colors}
            />

            <Label colors={colors}>Guests</Label>
            <ChipGroup
              options={[
                { label: 'Rarely', value: 'rarely' },
                { label: 'Sometimes', value: 'sometimes' },
                { label: 'Often', value: 'often' },
              ]}
              selected={guests}
              onSelect={v => setGuests(v as GuestFrequency)}
              colors={colors}
            />

            <Label colors={colors}>Communication style</Label>
            <ChipGroup
              options={[
                { label: 'Direct', value: 'direct' },
                { label: 'Laid-back', value: 'laid_back' },
                { label: 'Reserved', value: 'reserved' },
              ]}
              selected={communicationStyle}
              onSelect={v => setCommunicationStyle(v as CommunicationStyle)}
              colors={colors}
            />
          </StepView>
        )}

        {/* Step 5 — Bio, prompts, tags, photo */}
        {step === 5 && (
          <StepView title="Tell your story" subtitle="This is what others will see on your profile">
            <Label colors={colors}>Bio</Label>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="What makes you a great roommate? What are you looking for?"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
            />

            <Label colors={colors}>Prompt</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptScroll}>
              {PROMPTS.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.promptChip, {
                    backgroundColor: promptQ === p ? colors.primary : colors.muted,
                    borderColor: promptQ === p ? colors.primary : colors.border,
                  }]}
                  onPress={() => setPromptQ(p)}
                >
                  <Text style={[styles.promptChipText, { color: promptQ === p ? '#FFF' : colors.foreground }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Input value={promptA} onChangeText={setPromptA} placeholder="Your answer..." colors={colors} />

            <Label colors={colors}>Tags (pick any that fit)</Label>
            <View style={styles.chipWrap}>
              {LIFESTYLE_TAGS.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, {
                    backgroundColor: selectedTags.includes(t) ? colors.primary : colors.muted,
                    borderColor: selectedTags.includes(t) ? colors.primary : colors.border,
                  }]}
                  onPress={() => toggleTag(t)}
                >
                  <Text style={[styles.chipText, { color: selectedTags.includes(t) ? '#FFF' : colors.foreground }]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label colors={colors}>Profile photo</Label>
            <View style={styles.photoPickerRow}>
              <View style={styles.photoWrap}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
                ) : (
                  <View style={[styles.photoPlaceholder, { backgroundColor: colors.muted }]}>
                    <Feather name="user" size={36} color={colors.mutedForeground} />
                  </View>
                )}
                {photoUploading && (
                  <View style={styles.photoOverlay}>
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                )}
              </View>
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={[styles.photoBtn, { backgroundColor: colors.primary }]}
                  onPress={() => showPhotoPickerSheet(handlePickPhoto)}
                  disabled={photoUploading}
                >
                  <Feather name="camera" size={16} color="#FFFFFF" />
                  <Text style={styles.photoBtnText}>
                    {photoUri ? 'Change Photo' : 'Add Photo'}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.photoHint, { color: colors.mutedForeground }]}>
                  {photoUri ? 'Looking good!' : 'Optional — you can add one later'}
                </Text>
              </View>
            </View>
          </StepView>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={[styles.footer, { paddingBottom: bottomPadding, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: canNext() && !submitting ? colors.primary : colors.muted }]}
          onPress={step < TOTAL_STEPS - 1 ? () => setStep(s => s + 1) : handleFinish}
          disabled={!canNext() || submitting}
        >
          {step === TOTAL_STEPS - 1 && submitting ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Text style={[styles.nextBtnText, { color: canNext() && !submitting ? colors.primaryForeground : colors.mutedForeground }]}>
                {step < TOTAL_STEPS - 1 ? 'Continue' : 'Find My Roommate'}
              </Text>
              <Feather
                name={step < TOTAL_STEPS - 1 ? 'arrow-right' : 'check'}
                size={18}
                color={canNext() && !submitting ? colors.primaryForeground : colors.mutedForeground}
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function StepView({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
      {children}
    </View>
  );
}

function Label({ children, colors }: { children: string; colors: any }) {
  return <Text style={[styles.label, { color: colors.foreground }]}>{children}</Text>;
}

function Input({ value, onChangeText, placeholder, keyboardType, colors }: any) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      keyboardType={keyboardType}
      style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
    />
  );
}

function ChipGroup({ options, selected, onSelect, colors }: {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
  colors: any;
}) {
  return (
    <View style={styles.chipWrap}>
      {options.map(o => (
        <TouchableOpacity
          key={o.value}
          style={[styles.chip, {
            backgroundColor: selected === o.value ? colors.primary : colors.muted,
            borderColor: selected === o.value ? colors.primary : colors.border,
          }]}
          onPress={() => onSelect(o.value)}
        >
          <Text style={[styles.chipText, { color: selected === o.value ? '#FFF' : colors.foreground }]}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Toggle({ value, onChange, colors }: { value: boolean; onChange: (v: boolean) => void; colors: any }) {
  return (
    <TouchableOpacity
      style={[styles.toggle, { backgroundColor: value ? colors.primary : colors.muted }]}
      onPress={() => onChange(!value)}
    >
      <View style={[styles.toggleThumb, { left: value ? 22 : 2 }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  stepText: { fontSize: 12, minWidth: 32, textAlign: 'right' },
  stepLabel: { fontSize: 11, marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  step: { paddingBottom: 20 },
  stepTitle: { fontSize: 26, fontWeight: '800', color: '#1C1C2E', marginBottom: 6 },
  stepSubtitle: { fontSize: 15, color: '#6B7280', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: {
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 4,
  },
  textarea: {
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    minHeight: 100, textAlignVertical: 'top',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '500' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 4 },
  toggleLabel: { fontSize: 15, fontWeight: '500' },
  toggle: { width: 46, height: 26, borderRadius: 13, justifyContent: 'center', position: 'relative' },
  toggleThumb: {
    position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  budgetField: { flex: 1 },
  budgetLabel: { fontSize: 12, marginBottom: 4 },
  budgetSep: { fontSize: 20, marginTop: 8 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  star: { fontSize: 30 },
  cleanLabel: { fontSize: 13, marginLeft: 4 },
  promptScroll: { marginBottom: 10 },
  promptChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24, borderWidth: 1, marginRight: 8 },
  promptChipText: { fontSize: 12, fontWeight: '500' },
  photoPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 4 },
  photoWrap: { position: 'relative' },
  photoPreview: { width: 90, height: 90, borderRadius: 45 },
  photoPlaceholder: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 45,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: { flex: 1, gap: 8 },
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, alignSelf: 'flex-start',
  },
  photoBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  photoHint: { fontSize: 12 },
  verifyHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12,
    padding: 12, marginTop: 8, marginBottom: 4,
  },
  verifyHintText: { flex: 1, fontSize: 13 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 32, gap: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '700' },
});
