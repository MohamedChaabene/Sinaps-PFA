import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ConversationStatus } from '../types/chat';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

interface Props {
  status: ConversationStatus;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  const { colors } = useTheme();

  let label = 'En cours';
  let bgColor = colors.infoLight;
  let textColor = colors.info;
  let dotColor = colors.info;

  if (status === 'en_attente') {
    label = 'En attente';
    bgColor = colors.warningLight;
    textColor = colors.warning;
    dotColor = colors.warning;
  } else if (status === 'resolu') {
    label = 'Résolu';
    bgColor = colors.successLight;
    textColor = colors.success;
    dotColor = colors.success;
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
