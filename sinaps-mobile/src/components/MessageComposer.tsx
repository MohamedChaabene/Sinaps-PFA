import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SendHorizonal, Paperclip, Smile, X, FileText, Image as ImageIcon } from 'lucide-react-native';
import { MessageAttachment } from '../types/chat';
import { uploadMobileFile } from '../api/upload';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

const QUICK_EMOJIS = ['😀', '😂', '🙏', '👍', '🎉', '😍', '😕', '🤔', '❤️', '🔥', '✨', '🙌'];

interface Props {
  onSendMessage: (text: string, attachments?: MessageAttachment[]) => Promise<void>;
  disabled?: boolean;
  focusSignal?: number;
}

export const MessageComposer: React.FC<Props> = ({ onSendMessage, disabled, focusSignal = 0 }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (focusSignal > 0 && !disabled) inputRef.current?.focus();
  }, [focusSignal, disabled]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    try {
      await onSendMessage(trimmed, attachments);
      setText('');
      setAttachments([]);
      setShowEmojis(false);
    } catch {
      // Error handled by context
    }
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission requise',
          "L'accès à la galerie photos est requis pour envoyer une image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const filename = asset.fileName || `image-${Date.now()}.jpg`;
        const mimeType = asset.mimeType || 'image/jpeg';

        setUploading(true);
        try {
          const uploadRes = await uploadMobileFile({
            uri,
            name: filename,
            type: mimeType,
          });

          if (uploadRes?.url) {
            setAttachments((prev) => [
              ...prev,
              {
                url: uploadRes.url,
                type: 'image',
                name: uploadRes.name || filename,
              },
            ]);
          }
        } catch (err: any) {
          Alert.alert('Erreur de téléversement', err.message || "Impossible d'envoyer l'image");
        } finally {
          setUploading(false);
        }
      }
    } catch (e: any) {
      console.warn('Image picker error:', e);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const doc = result.assets[0];
        setUploading(true);
        try {
          const uploadRes = await uploadMobileFile({
            uri: doc.uri,
            name: doc.name || `document-${Date.now()}`,
            type: doc.mimeType || 'application/pdf',
            size: doc.size,
          });

          if (uploadRes?.url) {
            setAttachments((prev) => [
              ...prev,
              {
                url: uploadRes.url,
                type: 'document',
                name: uploadRes.name || doc.name,
                size: doc.size,
              },
            ]);
          }
        } catch (err: any) {
          Alert.alert('Erreur de téléversement', err.message || "Impossible d'envoyer le document");
        } finally {
          setUploading(false);
        }
      }
    } catch (e: any) {
      console.warn('Document picker error:', e);
    }
  };

  const showAttachmentOptions = () => {
    Alert.alert(
      'Joindre un fichier',
      'Choisissez le type de contenu à envoyer :',
      [
        { text: '📷 Photo / Image', onPress: pickImage },
        { text: '📄 Document (PDF / Word)', onPress: pickDocument },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const appendEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !uploading && !disabled;

  return (
    <View
      style={[
        styles.composerContainer,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, SPACING.sm),
        },
      ]}
    >
      {/* Attached items preview */}
      {attachments.length > 0 && (
        <ScrollView horizontal style={styles.attachmentsRow} showsHorizontalScrollIndicator={false}>
          {attachments.map((att, idx) => (
            <View key={idx} style={[styles.attachmentChip, { backgroundColor: colors.primaryBg }]}>
              {att.type === 'image' ? (
                <ImageIcon size={13} color={colors.primary} />
              ) : (
                <FileText size={13} color={colors.primary} />
              )}
              <Text style={[styles.attachmentChipText, { color: colors.primary }]} numberOfLines={1}>
                {att.name || 'Pièce jointe'}
              </Text>
              <TouchableOpacity onPress={() => removeAttachment(idx)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel={`Supprimer ${att.name || 'la pièce jointe'}`}>
                <X size={13} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Quick Emoji Bar */}
      {showEmojis && (
        <View style={[styles.emojiBar, { borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiScroll}>
            {QUICK_EMOJIS.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={styles.emojiBtn}
                onPress={() => appendEmoji(emoji)}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel={`Ajouter ${emoji}`}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => setShowEmojis(!showEmojis)}
          activeOpacity={0.6}
          accessibilityLabel="Emojis"
          accessibilityRole="button"
          accessibilityState={{ expanded: showEmojis, disabled: !!disabled }}
        >
          <Smile size={20} color={showEmojis ? colors.primary : colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolBtn}
          onPress={showAttachmentOptions}
          disabled={uploading}
          activeOpacity={0.6}
          accessibilityLabel="Joindre un fichier"
          accessibilityRole="button"
          accessibilityState={{ disabled: uploading || !!disabled, busy: uploading }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Paperclip size={20} color={colors.textMuted} />
          )}
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.inputBorder,
              color: colors.textPrimary,
            },
          ]}
          placeholder="Écrivez votre message..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1500}
          editable={!disabled}
          accessibilityLabel="Message à envoyer"
        />

        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: colors.primary },
            !canSend && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.7}
          accessibilityLabel="Envoyer le message"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSend, busy: uploading }}
        >
          <SendHorizonal size={18} color={colors.primaryFg} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  composerContainer: {
    borderTopWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  attachmentsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    marginRight: 6,
    maxWidth: 180,
  },
  attachmentChipText: {
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
  emojiBar: {
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
  emojiScroll: {
    gap: 6,
  },
  emojiBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
  },
  emojiText: {
    fontSize: 18,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolBtn: {
    padding: 6,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
});
