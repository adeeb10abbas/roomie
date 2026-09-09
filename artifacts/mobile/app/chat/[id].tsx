import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Platform, Alert, KeyboardAvoidingView, Modal,
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
import { formatTime } from '@/utils/time';
import { Message } from '@/context/types';

const PROMPTS = [
  'What is your move-in timeline?',
  'What is your sleep schedule like?',
  'Do you work from home?',
  'Are you pet-friendly?',
  'Tell me about your cleaning habits',
];

// Display label → server enum value (see CreateReportSchema in api-zod).
const REPORT_CATEGORIES: Array<{ label: string; value: string }> = [
  { label: 'Fake profile', value: 'fake_profile' },
  { label: 'Harassment', value: 'harassment' },
  { label: 'Spam', value: 'spam' },
  { label: 'Inappropriate content', value: 'inappropriate' },
  { label: 'Scam', value: 'safety' },
  { label: 'Other', value: 'other' },
];

type DialogKind =
  | null
  | { kind: 'menu' }
  | { kind: 'confirm-unmatch' }
  | { kind: 'confirm-block' }
  | { kind: 'report-categories' }
  | { kind: 'report-success' };

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    matches, messages, sendMessage, markAsRead, userId,
    refreshMessages, socketStatus, setActiveChatMatchId,
    unmatch, blockUser, reportUser,
  } = useApp();
  const navigation = useNavigation();

  const match = matches.find(m => m.id === id);
  const chatMessages = messages.filter(m => m.matchId === id);
  const [text, setText] = useState('');
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [actionError, setActionError] = useState<string>('');

  useEffect(() => {
    if (id) {
      refreshMessages(id);
      setActiveChatMatchId(id);
    }
    return () => { setActiveChatMatchId(null); };
  }, [id]);

  const handleUnmatch = async () => {
    if (!match) return;
    try {
      await unmatch(match.id);
      setDialog(null);
      router.back();
    } catch {
      setActionError('Failed to unmatch. Please try again.');
    }
  };

  const handleBlock = async () => {
    if (!match) return;
    try {
      await blockUser(match.profile.id, 'blocked_from_chat');
      setDialog(null);
      router.back();
    } catch {
      setActionError('Failed to block user. Please try again.');
    }
  };

  const handleReportCategory = async (category: string) => {
    if (!match) return;
    try {
      await reportUser(match.profile.id, match.id, category);
      setDialog({ kind: 'report-success' });
    } catch {
      setActionError('Failed to report user. Please try again.');
    }
  };

  const showMenu = () => {
    if (!match) return;
    setActionError('');
    setDialog({ kind: 'menu' });
  };

  useEffect(() => {
    if (match) {
      markAsRead(match.id);
      navigation.setOptions({
        headerTitle: () => (
          <View style={styles.headerTitle}>
            <Image
              source={getProfileImage(match.profile.photoIndex, match.profile.photoUrl)}
              style={styles.headerAvatar}
              contentFit="cover"
            />
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.headerName, { color: colors.foreground }]}>
                  {match.profile.name}
                </Text>
                {match.profile.isVerified && (
                  <Feather name="shield" size={13} color={colors.primary} />
                )}
              </View>
              <Text style={[styles.headerMeta, { color: socketStatus === 'connected' ? colors.mutedForeground : '#F59E0B' }]}>
                {socketStatus === 'connected' ? `${match.profile.matchScore}% match` : 'Reconnecting…'}
              </Text>
            </View>
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity
            testID="chat-menu-btn"
            style={{ marginRight: 16 }}
            onPress={showMenu}
          >
            <Feather name="more-horizontal" size={22} color={colors.foreground} />
          </TouchableOpacity>
        ),
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
      });
    }
  }, [match, colors, socketStatus]);

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

  const handlePrompt = (prompt: string) => { setText(prompt); };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === userId || item.senderId === 'me';
    return (
      <View
        style={[styles.msgRow, isMe && styles.msgRowMe]}
        testID={isMe ? 'msg-bubble-me' : 'msg-bubble-them'}
      >
        {!isMe && (
          <Image
            source={getProfileImage(match.profile.photoIndex, match.profile.photoUrl)}
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

  const closeDialog = () => { setDialog(null); setActionError(''); };

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
            <Image source={getProfileImage(match.profile.photoIndex, match.profile.photoUrl)} style={styles.emptyChatAvatar} contentFit="cover" />
            <Text style={[styles.emptyChatName, { color: colors.foreground }]}>{match.profile.name}</Text>
            <Text style={[styles.emptyChatText, { color: colors.mutedForeground }]}>You matched! Start the conversation.</Text>
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
          testID="msg-input"
          value={text}
          onChangeText={setText}
          placeholder={`Message ${match.profile.name.split(' ')[0]}...`}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
          multiline
        />
        <TouchableOpacity
          testID="send-btn"
          style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Feather name="send" size={18} color={text.trim() ? '#FFFFFF' : colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Cross-platform menu / confirm / report modals.
          react-native-web's Alert.alert is a no-op, so we render real
          Modal-based dialogs that work on web as well as native. */}
      <Modal
        transparent
        animationType="fade"
        visible={dialog !== null}
        onRequestClose={closeDialog}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={closeDialog}
          testID="dialog-backdrop"
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalCard, { backgroundColor: colors.card }]}
            onPress={() => {}}
            testID="dialog-card"
          >
            {dialog?.kind === 'menu' && (
              <View testID="chat-menu">
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {match.profile.name}
                </Text>
                <TouchableOpacity
                  testID="menu-view-profile"
                  style={styles.menuItem}
                  onPress={() => { setDialog(null); router.push(`/user/${match.profile.id}`); }}
                >
                  <Text style={[styles.menuItemText, { color: colors.foreground }]}>View Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="menu-report"
                  style={styles.menuItem}
                  onPress={() => setDialog({ kind: 'report-categories' })}
                >
                  <Text style={[styles.menuItemText, { color: '#DC2626' }]}>Report User</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="menu-block"
                  style={styles.menuItem}
                  onPress={() => setDialog({ kind: 'confirm-block' })}
                >
                  <Text style={[styles.menuItemText, { color: '#DC2626' }]}>Block User</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="menu-unmatch"
                  style={styles.menuItem}
                  onPress={() => setDialog({ kind: 'confirm-unmatch' })}
                >
                  <Text style={[styles.menuItemText, { color: '#DC2626' }]}>Unmatch</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="menu-cancel"
                  style={[styles.menuItem, styles.menuItemCancel]}
                  onPress={closeDialog}
                >
                  <Text style={[styles.menuItemText, { color: colors.mutedForeground }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {dialog?.kind === 'confirm-unmatch' && (
              <View testID="confirm-unmatch">
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Unmatch</Text>
                <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
                  Unmatch with {match.profile.name}? All messages will be deleted.
                </Text>
                {actionError ? <Text style={styles.errorBanner}>{actionError}</Text> : null}
                <View style={styles.modalActions}>
                  <TouchableOpacity testID="confirm-cancel" style={styles.modalBtn} onPress={closeDialog}>
                    <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity testID="confirm-unmatch-yes" style={[styles.modalBtn, styles.modalBtnDanger]} onPress={handleUnmatch}>
                    <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Unmatch</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {dialog?.kind === 'confirm-block' && (
              <View testID="confirm-block">
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Block User</Text>
                <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
                  Block {match.profile.name}? They won't be able to see or message you.
                </Text>
                {actionError ? <Text style={styles.errorBanner}>{actionError}</Text> : null}
                <View style={styles.modalActions}>
                  <TouchableOpacity testID="confirm-cancel" style={styles.modalBtn} onPress={closeDialog}>
                    <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity testID="confirm-block-yes" style={[styles.modalBtn, styles.modalBtnDanger]} onPress={handleBlock}>
                    <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Block</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {dialog?.kind === 'report-categories' && (
              <View testID="report-categories">
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Report User</Text>
                <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
                  What is the reason for reporting?
                </Text>
                {actionError ? <Text style={styles.errorBanner}>{actionError}</Text> : null}
                {REPORT_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.value}
                    testID={`report-cat-${cat.value}`}
                    style={styles.menuItem}
                    onPress={() => handleReportCategory(cat.value)}
                  >
                    <Text style={[styles.menuItemText, { color: colors.foreground }]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  testID="confirm-cancel"
                  style={[styles.menuItem, styles.menuItemCancel]}
                  onPress={closeDialog}
                >
                  <Text style={[styles.menuItemText, { color: colors.mutedForeground }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {dialog?.kind === 'report-success' && (
              <View testID="report-success">
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Reported</Text>
                <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
                  Thank you for helping keep RoomieMatch safe.
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity testID="report-success-ok" style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={closeDialog}>
                    <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  whyMatch: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
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
  promptChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  promptChipText: { fontSize: 13 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 8, gap: 8, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 22, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 16, padding: 16, gap: 6 },
  modalTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  modalBody: { fontSize: 14, marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  modalBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  modalBtnDanger: { backgroundColor: '#DC2626' },
  modalBtnText: { fontSize: 14, fontWeight: '600' },
  menuItem: { paddingVertical: 12, paddingHorizontal: 4 },
  menuItemCancel: { marginTop: 4 },
  menuItemText: { fontSize: 15, fontWeight: '500' },
  errorBanner: { color: '#DC2626', fontSize: 13, marginBottom: 8 },
});
