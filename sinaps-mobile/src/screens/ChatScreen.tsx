import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, RotateCw } from 'lucide-react-native';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { useTheme } from '../context/ThemeContext';
import { ChatHeader } from '../components/ChatHeader';
import { ChatThread } from '../components/ChatThread';
import { QuickPrompts } from '../components/QuickPrompts';
import { MessageComposer } from '../components/MessageComposer';
import { SatisfactionModal } from '../components/SatisfactionModal';
import { AttachmentModal } from '../components/AttachmentModal';
import { MessageAttachment } from '../types/chat';
import { RADIUS, SPACING } from '../constants/theme';

interface Props {
  onOpenSettings: () => void;
}

export const ChatScreen: React.FC<Props> = ({ onOpenSettings }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const { backendUrl } = useConfig();
  const {
    conversation,
    isLoading,
    isTyping,
    error,
    refreshConversation,
    sendMessage,
    escalateToHuman,
    switchToAI,
    closeConversation,
    sendQuickReply,
    socketState,
    startNewConversation,
  } = useChat();

  const [satisfactionVisible, setSatisfactionVisible] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<MessageAttachment | null>(null);
  const [selectedAttachmentUrl, setSelectedAttachmentUrl] = useState<string>('');
  const [quickReplyLoadingAction, setQuickReplyLoadingAction] = useState<string | null>(null);
  const [dismissedQuickReplyId, setDismissedQuickReplyId] = useState<string | null>(null);
  const [composerFocusSignal, setComposerFocusSignal] = useState(0);

  const isResolved = conversation?.status === 'resolu';

  const handleEscalate = async () => {
    try {
      await escalateToHuman();
      Alert.alert('Demande transmise 👋', 'Un agent de support prendra le relais.');
    } catch {
      // Error handled by context
    }
  };

  const handleSwitchToAI = async () => {
    try {
      await switchToAI();
      Alert.alert('Mode IA réactivé 🤖', "L'assistant IA est prêt à répondre.");
    } catch {
      // Error handled by context
    }
  };

  const handleOpenAttachment = (attachment: MessageAttachment, resolvedUrl: string) => {
    setSelectedAttachment(attachment);
    setSelectedAttachmentUrl(resolvedUrl);
  };

  const handleQuickReply = async (
    action: string,
    metadata?: Record<string, unknown>,
    _label?: string
  ) => {
    if (!conversation || quickReplyLoadingAction) return;
    setQuickReplyLoadingAction(action);
    try {
      if (action === 'NEW_QUESTION' || action === 'YES_ANOTHER_QUESTION') {
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        if (lastMessage) setDismissedQuickReplyId(lastMessage.id);
        setComposerFocusSignal((value) => value + 1);
      }
      await sendQuickReply(action, metadata);
      if (action === 'CONFIRM_RESOLVED' || action === 'NO_ALL_DONE') {
        setSatisfactionVisible(true);
      }
      if (action === 'ESCALATE_TO_HUMAN') {
        Alert.alert('Demande transmise', "Un agent de support prendra le relais.");
      }
    } catch {
      // The context exposes the server error in the screen error state.
    } finally {
      setQuickReplyLoadingAction(null);
    }
  };

  const handleCopyText = (text: string) => {
    Alert.alert('Texte copié', text);
  };

  if (isLoading && !conversation) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingTitle, { color: colors.textPrimary }]}>Sinaps Support</Text>
          <Text style={[styles.loadingSubtitle, { color: colors.textSecondary }]}>
            Initialisation de votre session de support en temps réel...
          </Text>
        </View>
      </View>
    );
  }

  if (error && !conversation) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Impossible de charger la conversation</Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>{error}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={[styles.retryBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={refreshConversation}
            >
              <RotateCw size={15} color={colors.textPrimary} />
              <Text style={[styles.retryBtnText, { color: colors.textPrimary }]}>Réessayer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.resetBtn, { backgroundColor: colors.primary }]} onPress={logout}>
              <Text style={[styles.resetBtnText, { color: colors.primaryFg }]}>Se reconnecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ChatHeader
        conversation={conversation}
        onEscalate={handleEscalate}
        onSwitchToAI={handleSwitchToAI}
        onCloseConversation={() => setSatisfactionVisible(true)}
        onOpenSettings={onOpenSettings}
        onLogout={logout}
        socketState={socketState}
      />

      <View style={styles.threadWrapper}>
        <ChatThread
          messages={conversation?.messages || []}
          isTyping={isTyping}
          backendUrl={backendUrl}
          onPressAttachment={handleOpenAttachment}
          onCopyText={handleCopyText}
          onQuickReply={handleQuickReply}
          quickReplyLoadingAction={quickReplyLoadingAction}
          dismissedQuickReplyId={dismissedQuickReplyId}
          quickRepliesEnabled={!isResolved && conversation?.handledBy === 'ia'}
        />
      </View>

      {isResolved ? (
        <View
          style={[
            styles.resolvedBanner,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, SPACING.md),
            },
          ]}
        >
          <View style={styles.resolvedInfo}>
            <CheckCircle2 size={18} color={colors.success} />
            <Text style={[styles.resolvedText, { color: colors.success }]}>
              Cette conversation est résolue et clôturée. Merci pour votre confiance !
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.newConvBtn,
              { backgroundColor: colors.primaryBg, borderColor: colors.primaryLight },
            ]}
            onPress={startNewConversation}
            activeOpacity={0.7}
          >
            <Text style={[styles.newConvBtnText, { color: colors.primary }]}>Nouvelle demande</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <QuickPrompts onSelectPrompt={(q) => sendMessage(q)} disabled={isTyping} />
          <MessageComposer
            onSendMessage={sendMessage}
            disabled={isTyping}
            focusSignal={composerFocusSignal}
          />
        </>
      )}

      {/* Satisfaction Modal */}
      <SatisfactionModal
        visible={satisfactionVisible}
        clientName={user?.name || 'Client'}
        onClose={() => setSatisfactionVisible(false)}
        onSubmit={closeConversation}
      />

      {/* Fullscreen Attachment Viewer */}
      <AttachmentModal
        visible={!!selectedAttachment}
        attachment={selectedAttachment}
        resolvedUrl={selectedAttachmentUrl}
        onClose={() => {
          setSelectedAttachment(null);
          setSelectedAttachmentUrl('');
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  threadWrapper: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  loadingCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    borderWidth: 1,
    maxWidth: 320,
    width: '100%',
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: SPACING.md,
    marginBottom: 4,
  },
  loadingSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    maxWidth: 340,
    width: '100%',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  errorActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resetBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resolvedBanner: {
    borderTopWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  resolvedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resolvedText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  newConvBtn: {
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  newConvBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
