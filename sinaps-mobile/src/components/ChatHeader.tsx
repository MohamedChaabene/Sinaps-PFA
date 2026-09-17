import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hash, Bot, UserRound, CheckCircle2, Settings, LogOut, Sparkles, Sun, Moon } from 'lucide-react-native';
import { Conversation } from '../types/chat';
import { StatusBadge } from './StatusBadge';
import { ConnectionIndicator } from './ConnectionIndicator';
import { SocketConnectionState } from '../socket/socket';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

interface Props {
  conversation: Conversation | null;
  onEscalate: () => void;
  onSwitchToAI: () => void;
  onCloseConversation: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  socketState: SocketConnectionState;
}

export const ChatHeader: React.FC<Props> = ({
  conversation,
  onEscalate,
  onSwitchToAI,
  onCloseConversation,
  onOpenSettings,
  onLogout,
  socketState,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const isHumanMode = conversation?.handledBy === 'humain';
  const isResolved = conversation?.status === 'resolu';
  const assignedAgentName = conversation?.assignedAgent?.name;

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          paddingTop: Math.max(insets.top, SPACING.md),
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left Section: Channel info & status */}
        <View style={styles.titleCol}>
          <View style={styles.channelRow}>
            <Hash size={16} color={colors.primary} />
            <Text style={[styles.channelTitle, { color: colors.textPrimary }]}>support-sinaps</Text>
            <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
          </View>

          <View style={styles.subRow}>
            {conversation && <StatusBadge status={conversation.status} />}
            <View style={styles.modeIndicator}>
              {isHumanMode ? (
                <>
                  <UserRound size={12} color={colors.info} />
                  <Text style={[styles.modeText, { color: colors.info }]}>
                    {assignedAgentName ? `Agent : ${assignedAgentName}` : 'Agent demandé'}
                  </Text>
                </>
              ) : (
                <>
                  <Sparkles size={12} color={colors.primary} />
                  <Text style={[styles.modeText, { color: colors.primary }]}>
                    Assistant IA avec RAG
                  </Text>
                </>
              )}
            </View>
            <ConnectionIndicator state={socketState} />
          </View>
        </View>

        {/* Right Section: Action buttons */}
        <View style={styles.actionsRow}>
          {/* Dark Mode Toggle */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={toggleTheme}
            activeOpacity={0.7}
            accessibilityLabel="Basculer thème sombre / clair"
          >
            {isDarkMode ? (
              <Sun size={18} color="#facc15" />
            ) : (
              <Moon size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {!isResolved && (
            isHumanMode ? (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { borderColor: colors.success, backgroundColor: colors.successLight },
                ]}
                onPress={onSwitchToAI}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Revenir au mode IA"
              >
                <Bot size={14} color={colors.success} />
                <Text style={[styles.aiModeBtnText, { color: colors.success }]}>Mode IA</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { borderColor: colors.primaryLight, backgroundColor: colors.primaryBg },
                ]}
                onPress={onEscalate}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Demander l'aide d'un agent humain"
              >
                <UserRound size={14} color={colors.primary} />
                <Text style={[styles.humanModeBtnText, { color: colors.primary }]}>Humain</Text>
              </TouchableOpacity>
            )
          )}

          {!isResolved && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.closeBtn,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
              onPress={onCloseConversation}
              activeOpacity={0.7}
              accessibilityLabel="Clôturer la conversation"
            >
              <CheckCircle2 size={15} color={colors.success} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onOpenSettings}
            activeOpacity={0.7}
            accessibilityLabel="Paramètres de connexion"
          >
            <Settings size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onLogout}
            activeOpacity={0.7}
            accessibilityLabel="Se déconnecter"
          >
            <LogOut size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: 1,
    paddingBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  titleCol: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  channelTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 2,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 4,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  humanModeBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  aiModeBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    paddingHorizontal: 6,
  },
  iconBtn: {
    padding: 6,
    borderRadius: RADIUS.md,
  },
});
