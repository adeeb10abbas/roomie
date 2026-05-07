import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Platform, Alert, KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { getProfileImage } from '@/utils/images';
import { formatTime, uniqueId } from '@/utils/time';
import { Message } from '@/context/types';

const PROMPTS = [
  'What is your move-in timeline?',
  'What is your sleep schedule like?',
  'Do you work from home?',
  'Are you pet-friendly?',
  'Tell me about your cleaning habits',
];

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { matches, messages, sendMessage, markAsRead } = useApp();
  const navigation = useNavigation();

  const match = matches.find(m => m.id === id);
  const chatMessages = messages.filter(m => m.matchId === id);
  const [text, setText] = useState('');

  useEffect(() => {
    if (match) {
      markAsRead(match.id);
      navigation.setOptions({
        headerTitle: () => (
          <View style={styles.headerTitle}>
            <Image
              source={getProfileImage(match.profile.photoIndex)}
              style={styles.headerAvatar}
              contentFit="cover"
            />
            <View>
              <Text style={[styles.headerName, { color: colors.foreground }]}>
                {match.profile.name}
              </Text>
              <Text style={[styles.headerMeta, { color: colors.mutedForeground }]}>
                {match.profile.matchScore}% match
              </Text>
            </View>
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 16 }}
            onPress={() => Alert.alert(
              match.profile.name,
              'What would you like to do?',
              [
                { text: 'Report User', style: 'destructive', onPress: () => {} },
                { text: 'Block User', style: 'destructive', onPress: () => {} },
                { text: 'Unmatch', style: 'destructive', onPress: () => router.back() },
                { text: 'Cancel', style: 'cancel' },
              ]
            )}
          >
            <Feather name="more-horizontal" size={22} color={colors.foreground} />
          </TouchableOpacity>
        ),
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
      });
    }
  }, [match, colors]);

  if (!match) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Conversation not found</Text>
      </View>
    );
  }

  const handleSend = () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(match.id, text.trim());
    setText('');
  };

  const handlePrompt = (prompt: string) => {
    setText(prompt);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === 'me';
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && (
          <Image
            source={getProfileImage(match.profile.photoIndex)}
            style={styles.msgAvatar}
            contentFit="cover"
          />
        )}
        <View style={[
          styles.bubble,
          isMe
            ? [styles.bubbleMe, { backgroundColor: colors.primary }]
            : [styles.bubbleThem, { backgroundColor: colors.muted }],
        ]}>
          <Text style={[styles.bubbleText, { color: isMe ? '#FFFFFF' : colors.foreground }]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, { color: isMe ? 'rgba(255,255,255,0.6)' : colors.mutedForeground }]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Why You Match Banner */}
      <TouchableOpacity
        style={[styles.whyMatch, { backgroundColor: colors.primaryLight }]}
        onPress={() => router.push(`/user/${match.profile.id}`)}
      >
        <Feather name="info" size={14} color={colors.primary} />
        <Text style={[styles.whyMatchText, { color: colors.primary }]}>
          {match.profile.matchScore}% compatibility — tap to see why you match
        </Text>
        <Feather name="chevron-right" size={14} color={colors.primary} />
      </TouchableOpacity>

      <FlatList
        data={chatMessages}
        keyExtractor={m => m.id}
        renderItem={renderMessage}
        contentContainerStyle={[styles.list, { paddingBottom: 8 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Image
              source={getProfileImage(match.profile.photoIndex)}
              style={styles.emptyChatAvatar}
              contentFit="cover"
            />
            <Text style={[styles.emptyChatName, { color: colors.foreground }]}>
              {match.profile.name}
            </Text>
            <Text style={[styles.emptyChatText, { color: colors.mutedForeground }]}>
              You matched! Start the conversation.
            </Text>
          </View>
        }
      />

      {/* Prompt Chips */}
      <View style={[styles.promptsBar, { borderTopColor: colors.border }]}>
        <FlatList
          data={PROMPTS}
          horizontal
          keyExtractor={p => p}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promptsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.promptChip, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => handlePrompt(item)}
            >
              <Text style={[styles.promptChipText, { color: colors.foreground }]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: bottomPad + 8, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={`Message ${match.profile.name.split(' ')[0]}...`}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Feather name="send" size={18} color={text.trim() ? '#FFFFFF' : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorText: { textAlign: 'center', marginTop: 40, fontSize: 15 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerName: { fontSize: 15, fontWeight: '700' },
  headerMeta: { fontSize: 12 },
  whyMatch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  whyMatchText: { flex: 1, fontSize: 13, fontWeight: '500' },
  list: { paddingHorizontal: 16, paddingTop: 12 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, gap: 8 },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14 },
  bubble: { maxWidth: '75%', borderRadius: 18, padding: 12 },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleThem: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTime: { fontSize: 10, marginTop: 4 },
  emptyChat: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyChatAvatar: { width: 80, height: 80, borderRadius: 40 },
  emptyChatName: { fontSize: 18, fontWeight: '700' },
  emptyChatText: { fontSize: 14, textAlign: 'center' },
  promptsBar: { borderTopWidth: 1 },
  promptsList: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  promptChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  promptChipText: { fontSize: 13 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
