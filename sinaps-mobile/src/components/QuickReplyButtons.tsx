import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

interface QuickReply {
  id: string;
  label: string;
  action: string;
  metadata?: Record<string, unknown>;
}

interface Props {
  quickReplies: QuickReply[];
  onQuickReply?: (action: string, metadata?: Record<string, unknown>, label?: string) => void;
  loadingAction?: string | null;
  disabled?: boolean;
}

export const QuickReplyButtons: React.FC<Props> = ({
  quickReplies,
  onQuickReply,
  loadingAction,
  disabled = false,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {quickReplies.map((reply) => {
        const isLoading = loadingAction === reply.action;
        const isDisabled = disabled || !!loadingAction || !onQuickReply;
        return (
          <TouchableOpacity
            key={reply.id}
            accessibilityRole="button"
            accessibilityLabel={reply.label}
            accessibilityState={{ disabled: isDisabled, busy: isLoading }}
            disabled={isDisabled}
            onPress={() => onQuickReply?.(reply.action, reply.metadata, reply.label)}
            style={[
              styles.button,
              { backgroundColor: colors.primaryBg, borderColor: colors.primaryLight },
              isDisabled && styles.disabled,
            ]}
            activeOpacity={0.75}
          >
            {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
            <Text style={[styles.label, { color: colors.primary }]}>{reply.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
    marginLeft: 40,
    marginRight: SPACING.md,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  button: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
