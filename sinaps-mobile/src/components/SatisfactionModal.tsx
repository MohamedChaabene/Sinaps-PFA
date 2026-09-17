import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Star, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

interface Props {
  visible: boolean;
  clientName: string;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => Promise<void>;
}

export const SatisfactionModal: React.FC<Props> = ({
  visible,
  clientName,
  onClose,
  onSubmit,
}) => {
  const { colors } = useTheme();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert('Évaluation requise', 'Veuillez sélectionner une note de 1 à 5 étoiles.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(rating, comment.trim());
      setRating(0);
      setComment('');
      onClose();
      Alert.alert('Merci ! ✨', 'Votre avis a été enregistré avec succès.');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || "Impossible d'enregistrer votre avis");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.dialog, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.dialogHeader}>
            <Text style={[styles.dialogTitle, { color: colors.textPrimary }]}>Comment évaluez-vous le support ?</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Fermer l'évaluation">
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.dialogDescription, { color: colors.textSecondary }]}>
            La conversation avec {clientName || 'vous'} va être clôturée. Votre retour nous aide à
            améliorer nos services 🙏
          </Text>

          {/* Star selector */}
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starBtn}
                accessibilityLabel={`${star} étoiles`}
                accessibilityRole="radio"
                accessibilityState={{ selected: star === rating }}
              >
                <Star
                  size={36}
                  color={star <= rating ? colors.warning : colors.border}
                  fill={star <= rating ? colors.warning : 'none'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Comment input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Un commentaire ? (facultatif)</Text>
            <TextInput
              style={[styles.commentInput, { backgroundColor: colors.background, borderColor: colors.inputBorder, color: colors.textPrimary }]}
              placeholder="Partagez votre expérience..."
              placeholderTextColor={colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          {/* Action buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: rating === 0 ? colors.inputBorder : colors.primary },
                rating === 0 && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={rating === 0 || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.primaryFg} />
              ) : (
                <Text style={[styles.submitBtnText, { color: colors.primaryFg }]}>Envoyer mon avis</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  dialogDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: SPACING.md,
  },
  starBtn: {
    padding: 4,
  },
  inputContainer: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  cancelBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
