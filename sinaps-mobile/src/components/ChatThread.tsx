import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Bot, Sparkles, UserCheck } from 'lucide-react-native';
import { ChatMessage, MessageAttachment } from '../types/chat';
import { MessageBubble } from './MessageBubble';
import { QuickReplyButtons } from './QuickReplyButtons';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

interface Props {
  messages: ChatMessage[];
  isTyping?: boolean;
  backendUrl: string;
  onPressAttachment?: (attachment: MessageAttachment, resolvedUrl: string) => void;
  onCopyText?: (text: string) => void;
  onQuickReply?: (action: string, metadata?: Record<string, unknown>, label?: string) => void;
  quickReplyLoadingAction?: string | null;
  dismissedQuickReplyId?: string | null;
  quickRepliesEnabled?: boolean;
}

export const ChatThread: React.FC<Props> = ({
  messages,
  isTyping,
  backendUrl,
  onPressAttachment,
  onCopyText,
  onQuickReply,
  quickReplyLoadingAction,
  dismissedQuickReplyId,
  quickRepliesEnabled = true,
}) => {
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const { colors } = useTheme();
  const lastMessage = messages[messages.length - 1];
  const latestQuickReplyMessage =
    quickRepliesEnabled &&
    lastMessage &&
    lastMessage.sender !== 'client' &&
    (lastMessage.quickReplies?.length || 0) > 0
      ? lastMessage
      : null;

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isTyping]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryBg }]}>
        <Bot size={36} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Bienvenue sur Sinaps Support</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Posez votre question ou utilisez une des suggestions ci-dessous. Notre agent IA
        s'appuie sur la base de connaissances (RAG) pour vous répondre immédiatement.
      </Text>

      <View style={styles.emptyBadges}>
        <View style={[styles.emptyBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Sparkles size={13} color={colors.primary} />
          <Text style={[styles.emptyBadgeText, { color: colors.textSecondary }]}>Assistant IA avec RAG</Text>
        </View>
        <View style={[styles.emptyBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <UserCheck size={13} color={colors.info} />
          <Text style={[styles.emptyBadgeText, { color: colors.textSecondary }]}>Escalade humaine disponible</Text>
        </View>
      </View>
    </View>
  );

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.listContent,
        messages.length === 0 && styles.listContentEmpty,
      ]}
      ListEmptyComponent={renderEmptyState}
      renderItem={({ item }) => (
        <>
          <MessageBubble
            message={item}
            backendUrl={backendUrl}
            onPressAttachment={onPressAttachment}
            onCopyText={onCopyText}
          />
          {latestQuickReplyMessage?.id === item.id &&
            dismissedQuickReplyId !== item.id &&
            latestQuickReplyMessage.quickReplies && (
              <QuickReplyButtons
                quickReplies={latestQuickReplyMessage.quickReplies}
                onQuickReply={onQuickReply}
                loadingAction={quickReplyLoadingAction}
                disabled={!!isTyping}
              />
            )}
        </>
      )}
      ListFooterComponent={
        isTyping ? (
          <View style={styles.typingIndicator}>
            <View style={[styles.typingBubble, { backgroundColor: colors.aiBubble }]}>
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.typingText, { color: colors.textSecondary }]}>Agent IA réfléchit...</Text>
            </View>
          </View>
        ) : null
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: SPACING.md,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  emptyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  emptyBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  typingIndicator: {
    paddingHorizontal: SPACING.md,
    marginTop: 4,
    marginBottom: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    borderBottomLeftRadius: 2,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
