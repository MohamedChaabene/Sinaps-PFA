import React from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { MessageAttachment } from '../types/chat';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

interface Props {
  visible: boolean;
  attachment: MessageAttachment | null;
  resolvedUrl: string;
  onClose: () => void;
}

export const AttachmentModal: React.FC<Props> = ({
  visible,
  attachment,
  resolvedUrl,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  if (!attachment || !resolvedUrl) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Header toolbar */}
        <View style={[styles.toolbar, { paddingTop: Math.max(insets.top, SPACING.md) }]}>
          <Text style={styles.title} numberOfLines={1}>
            {attachment.name || 'Pièce jointe'}
          </Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Fermer la pièce jointe">
            <X size={22} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.imageContainer}>
          {attachment.type === 'image' ? (
            <Image
              source={{ uri: resolvedUrl }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.docNotice, { backgroundColor: colors.card }]}>
              <Text style={[styles.docNoticeText, { color: colors.textPrimary }]}>Document : {attachment.name}</Text>
              <Text style={[styles.docNoticeSub, { color: colors.textMuted }]}>{resolvedUrl}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000ee',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: SPACING.md,
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  docNotice: {
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  docNoticeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  docNoticeSub: {
    fontSize: 12,
    marginTop: 6,
  },
});
