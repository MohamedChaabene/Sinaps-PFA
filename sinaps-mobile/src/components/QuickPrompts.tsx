import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

const QUICK_PROMPTS = [
  'Comment suivre ma commande ?',
  'Quels sont les délais de livraison ?',
  'Procédure de retour et remboursement ?',
  'Réinitialiser mon mot de passe',
  'Parler à un agent humain',
];

interface Props {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export const QuickPrompts: React.FC<Props> = ({ onSelectPrompt, disabled }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      <View style={styles.titleRow}>
        <Sparkles size={13} color={colors.primary} />
        <Text style={[styles.titleText, { color: colors.textMuted }]}>Suggestions rapides</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {QUICK_PROMPTS.map((prompt, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.pill,
              { backgroundColor: colors.card, borderColor: colors.border },
              disabled && styles.pillDisabled,
            ]}
            disabled={disabled}
            onPress={() => onSelectPrompt(prompt)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, { color: colors.textSecondary }]}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: SPACING.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: 4,
    gap: 4,
  },
  titleText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  pill: {
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pillDisabled: {
    opacity: 0.5,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
