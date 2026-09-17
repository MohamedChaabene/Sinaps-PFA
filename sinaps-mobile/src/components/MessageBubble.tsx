import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Bot, UserRound, FileText, ExternalLink, Copy, Check } from 'lucide-react-native';
import { ChatMessage, MessageAttachment } from '../types/chat';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';
import { resolveAttachmentUrl } from '../utils/formatters';

interface Props {
  message: ChatMessage;
  backendUrl: string;
  onPressAttachment?: (attachment: MessageAttachment, resolvedUrl: string) => void;
  onCopyText?: (text: string) => void;
}

export const MessageBubble: React.FC<Props> = ({
  message,
  backendUrl,
  onPressAttachment,
  onCopyText,
}) => {
  const { colors } = useTheme();
  const [copied, setCopied] = React.useState(false);

  const isClient = message.sender === 'client';
  const isAI = message.sender === 'ia';
  const isHuman = message.sender === 'humain';

  const handleCopy = () => {
    if (onCopyText && message.content) {
      onCopyText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <View style={[styles.container, isClient ? styles.clientContainer : styles.incomingContainer]}>
      {/* Avatar for incoming messages */}
      {!isClient && (
        <View style={styles.avatarContainer}>
          {isAI ? (
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Bot size={18} color={colors.primaryFg} />
            </View>
          ) : (
            message.authorAvatar ? (
              <Image
                source={{ uri: resolveAttachmentUrl(backendUrl, message.authorAvatar) }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.infoLight, borderWidth: 1, borderColor: colors.info }]}>
                <Text style={[styles.avatarInitials, { color: colors.info }]}>
                  {(message.authorName || 'AS').slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )
          )}
        </View>
      )}

      {/* Bubble Content */}
      <View style={[styles.bubbleWrapper, isClient && styles.clientBubbleWrapper]}>
        {/* Header with author badge */}
        {!isClient && (
          <View style={styles.headerRow}>
            {isAI ? (
              <View style={styles.aiBadge}>
                <Text
                  style={[
                    styles.aiBadgeText,
                    { color: colors.primary, backgroundColor: colors.primaryBg },
                  ]}
                >
                  🤖 Agent IA
                </Text>
                <Text style={[styles.aiSubText, { color: colors.textMuted }]}>Assistant IA avec RAG</Text>
              </View>
            ) : (
              <View style={styles.humanBadge}>
                <Text
                  style={[
                    styles.humanBadgeText,
                    { color: colors.info, backgroundColor: colors.infoLight },
                  ]}
                >
                  👤 {message.authorName || 'Agent Support'}
                </Text>
              </View>
            )}
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isClient
              ? { backgroundColor: colors.clientBubble, borderBottomRightRadius: 2 }
              : isHuman
              ? { backgroundColor: colors.humanBubble, borderWidth: 1, borderColor: colors.humanBubbleBorder, borderBottomLeftRadius: 2 }
              : { backgroundColor: colors.aiBubble, borderBottomLeftRadius: 2 },
          ]}
        >
          {/* Text message content */}
          {message.content ? (
            <Text
              style={[
                styles.messageText,
                { color: isClient ? colors.clientBubbleText : colors.textPrimary },
              ]}
              selectable
            >
              {message.content}
            </Text>
          ) : null}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {message.attachments.map((att, index) => {
                const resolved = resolveAttachmentUrl(backendUrl, att.url);
                const isImage = att.type === 'image';

                if (isImage) {
                  return (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.85}
                      onPress={() => onPressAttachment && onPressAttachment(att, resolved)}
                      style={styles.imageWrapper}
                      accessibilityRole="button"
                      accessibilityLabel={`Ouvrir ${att.name || 'la pièce jointe'}`}
                    >
                      <Image
                        source={{ uri: resolved }}
                        style={styles.attachmentImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => onPressAttachment && onPressAttachment(att, resolved)}
                    style={[
                      styles.filePill,
                      isClient
                        ? styles.clientFilePill
                        : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Ouvrir ${att.name || 'le document joint'}`}
                  >
                    <FileText
                      size={16}
                      color={isClient ? colors.textLight : colors.primary}
                    />
                    <Text
                      style={[
                        styles.fileName,
                        { color: isClient ? colors.clientBubbleText : colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {att.name || 'Document joint'}
                    </Text>
                    <ExternalLink
                      size={13}
                      color={isClient ? colors.textLight : colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Footer with timestamp and copy button */}
        <View style={[styles.footerRow, isClient && styles.clientFooterRow]}>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>{message.time}</Text>
          {!isClient && message.content && (
            <TouchableOpacity
              onPress={handleCopy}
              style={styles.copyBtn}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel="Copier le message"
            >
              {copied ? (
                <>
                  <Check size={11} color={colors.success} />
                  <Text style={[styles.copyText, { color: colors.success }]}>Copié</Text>
                </>
              ) : (
                <>
                  <Copy size={11} color={colors.textMuted} />
                  <Text style={[styles.copyText, { color: colors.textMuted }]}>Copier</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 6,
    paddingHorizontal: SPACING.md,
    alignItems: 'flex-end',
  },
  incomingContainer: {
    justifyContent: 'flex-start',
  },
  clientContainer: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
  },
  avatarInitials: {
    fontSize: 11,
    fontWeight: '700',
  },
  bubbleWrapper: {
    maxWidth: '82%',
  },
  clientBubbleWrapper: {
    alignItems: 'flex-end',
  },
  headerRow: {
    marginBottom: 4,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  aiSubText: {
    fontSize: 10,
  },
  humanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  humanBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  bubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  attachmentsContainer: {
    marginTop: 6,
    gap: 6,
  },
  imageWrapper: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginTop: 4,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: RADIUS.md,
    backgroundColor: '#e2e8f0',
  },
  filePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    gap: 6,
    marginTop: 4,
  },
  clientFilePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  fileName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
    paddingHorizontal: 2,
  },
  clientFooterRow: {
    justifyContent: 'flex-end',
  },
  timeText: {
    fontSize: 10,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  copyText: {
    fontSize: 10,
  },
});
