import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { SocketConnectionState } from '../socket/socket';

interface Props {
  state: SocketConnectionState;
}

const labels: Record<SocketConnectionState, string> = {
  connected: 'Temps réel connecté',
  connecting: 'Connexion en cours',
  disconnected: 'Temps réel indisponible',
  error: 'Erreur de connexion temps réel',
};

export const ConnectionIndicator: React.FC<Props> = ({ state }) => {
  const { colors } = useTheme();
  const isConnected = state === 'connected';
  const isConnecting = state === 'connecting';
  const color = isConnected ? colors.success : isConnecting ? colors.warning : colors.danger;
  const Icon = isConnected ? CheckCircle2 : isConnecting ? LoaderCircle : CircleAlert;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityLabel={labels[state]}
      accessibilityLiveRegion="polite"
    >
      <Icon size={12} color={color} />
      <Text style={[styles.label, { color }]}>{isConnected ? 'En direct' : labels[state]}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: 999,
    marginTop: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
});
