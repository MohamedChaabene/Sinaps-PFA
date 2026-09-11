import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Headphones,
  LogOut,
  Settings,
  RefreshCw,
  Send,
  CheckCircle,
  X,
  User,
  Clock,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchAllConversations, assignAgent, closeConversation, fetchConversationById } from '../api/conversations';
import { sendMessage } from '../api/messages';
import { getSocket } from '../socket/socket';
import { StatusBadge } from '../components/StatusBadge';
import { RADIUS, SPACING } from '../constants/theme';
import { formatMessageTime } from '../utils/formatters';

interface Props {
  onOpenSettings: () => void;
}

export const AgentScreen: React.FC<Props> = ({ onOpenSettings }) => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { colors } = useTheme();

  const [conversations, setConversations] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'en_attente' | 'en_cours' | 'resolu'>('en_attente');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active chat modal
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchAllConversations(filterStatus);
      setConversations(data || []);
    } catch (err: any) {
      console.warn('Error loading agent conversations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    setLoading(true);
    loadConversations();
  }, [loadConversations]);

  // Real-time socket listeners for agent queue
  useEffect(() => {
    let socketInstance: any = null;
    getSocket().then((s) => {
      socketInstance = s;
      const handleUpdate = () => {
        loadConversations();
      };
      s.on('conversation_created', handleUpdate);
      s.on('conversation_updated', handleUpdate);
      s.on('message_received', handleUpdate);
    });

    return () => {
      if (socketInstance) {
        socketInstance.off('conversation_created');
        socketInstance.off('conversation_updated');
        socketInstance.off('message_received');
      }
    };
  }, [loadConversations]);

  const handleAssign = async (convId: string) => {
    if (!user?._id) return;
    try {
      await assignAgent(convId, user._id);
      Alert.alert('Pris en charge', 'Vous avez pris en charge ce ticket.');
      await loadConversations();
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de prendre en charge ce ticket');
    }
  };

  const openConversationModal = async (conv: any) => {
    try {
      const details = await fetchConversationById(conv._id);
      setActiveConv(details.conversation);
      setMessages(details.messages || []);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || "Impossible d'ouvrir la conversation");
    }
  };

  const handleSendAgentMessage = async () => {
    if (!inputText.trim() || !activeConv?._id) return;
    setSending(true);
    try {
      const res = await sendMessage(
        activeConv._id,
        inputText.trim(),
        [],
        'humain',
        user?.name || 'Agent Support'
      );
      if (res?.message) {
        setMessages((prev) => [...prev, res.message]);
      }
      setInputText('');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || "Échec de l'envoi du message");
    } finally {
      setSending(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!activeConv?._id) return;
    try {
      await closeConversation(activeConv._id, 5, "Résolu par l'agent");
      Alert.alert('Ticket résolu', 'La conversation a été marquée comme résolue.');
      setActiveConv(null);
      await loadConversations();
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Échec de la résolution');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, SPACING.md) }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.agentBadge, { backgroundColor: colors.primary }]}>
            <Headphones size={18} color={colors.primaryFg} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{user?.name || 'Agent Support'}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Espace Agent • Sinaps</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={onOpenSettings} activeOpacity={0.7}>
            <Settings size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={logout} activeOpacity={0.7}>
            <LogOut size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.tabRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, { backgroundColor: filterStatus === 'en_attente' ? colors.primaryBg : colors.background }]}
          onPress={() => setFilterStatus('en_attente')}
        >
          <Text style={[styles.tabText, { color: filterStatus === 'en_attente' ? colors.primary : colors.textSecondary }]}>
            En attente ({conversations.length && filterStatus === 'en_attente' ? conversations.length : '0'})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, { backgroundColor: filterStatus === 'en_cours' ? colors.primaryBg : colors.background }]}
          onPress={() => setFilterStatus('en_cours')}
        >
          <Text style={[styles.tabText, { color: filterStatus === 'en_cours' ? colors.primary : colors.textSecondary }]}>
            En cours
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, { backgroundColor: filterStatus === 'resolu' ? colors.primaryBg : colors.background }]}
          onPress={() => setFilterStatus('resolu')}
        >
          <Text style={[styles.tabText, { color: filterStatus === 'resolu' ? colors.primary : colors.textSecondary }]}>
            Résolus
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conversation list */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement des tickets...</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          onRefresh={() => {
            setRefreshing(true);
            loadConversations();
          }}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CheckCircle size={40} color={colors.success} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Aucun ticket dans cette catégorie</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Les demandes des clients escaladées apparaîtront ici en direct.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <View style={styles.clientInfo}>
                  <User size={16} color={colors.primary} />
                  <Text style={[styles.clientName, { color: colors.textPrimary }]}>{item.client?.name || 'Client Sinaps'}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              <Text style={[styles.clientEmail, { color: colors.textMuted }]}>{item.client?.email || ''}</Text>

              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <View style={styles.timeInfo}>
                  <Clock size={12} color={colors.textMuted} />
                  <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatMessageTime(item.updatedAt)}</Text>
                </View>

                <View style={styles.cardBtnRow}>
                  {item.status === 'en_attente' && (
                    <TouchableOpacity
                      style={[styles.claimBtn, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}
                      onPress={() => handleAssign(item._id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.claimBtnText, { color: colors.warning }]}>Prendre en charge</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.openBtn, { backgroundColor: colors.primary }]}
                    onPress={() => openConversationModal(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.openBtnText, { color: colors.primaryFg }]}>Ouvrir le chat</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Chat Sub-modal for Agent */}
      <Modal visible={!!activeConv} animationType="slide" onRequestClose={() => setActiveConv(null)}>
        <KeyboardAvoidingView
          style={[styles.modalScreen, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, SPACING.md) }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Chat avec {activeConv?.client?.name || 'Client'}</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>{activeConv?.client?.email}</Text>
            </View>
            <View style={styles.modalActions}>
              {activeConv?.status !== 'resolu' && (
                <TouchableOpacity
                  style={[styles.resolveBtn, { backgroundColor: colors.successLight, borderColor: colors.success }]}
                  onPress={handleResolveTicket}
                >
                  <CheckCircle size={14} color={colors.success} />
                  <Text style={[styles.resolveBtnText, { color: colors.success }]}>Résoudre</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setActiveConv(null)} style={styles.closeBtn}>
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages Feed */}
          <FlatList
            data={messages}
            keyExtractor={(m) => m._id || m.id || `${Math.random()}`}
            contentContainerStyle={styles.modalMessagesList}
            renderItem={({ item }) => {
              const isAgent = item.sender === 'humain';
              const isIA = item.sender === 'ia';
              return (
                <View style={[styles.msgRow, isAgent ? styles.msgRowRight : styles.msgRowLeft]}>
                  <View
                    style={[
                      styles.msgBubble,
                      isAgent
                        ? { backgroundColor: colors.primary, borderBottomRightRadius: 2 }
                        : isIA
                        ? { backgroundColor: colors.aiBubble, borderBottomLeftRadius: 2 }
                        : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 2 },
                    ]}
                  >
                    <Text style={[styles.msgSenderTag, { color: colors.textMuted }]}>
                      {isAgent ? '👤 Vous (Agent)' : isIA ? '🤖 Assistant IA' : `💬 ${activeConv?.client?.name || 'Client'}`}
                    </Text>
                    <Text style={[styles.msgText, { color: isAgent ? colors.primaryFg : colors.textPrimary }]}>{item.content}</Text>
                    <Text style={[styles.msgTime, { color: colors.textMuted }]}>{formatMessageTime(item.createdAt)}</Text>
                  </View>
                </View>
              );
            }}
          />

          {/* Input Bar */}
          <View style={[styles.modalInputBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, SPACING.sm) }]}>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.inputBorder, color: colors.textPrimary }]}
              placeholder="Écrivez votre réponse en tant qu'agent..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity
              style={[styles.modalSendBtn, { backgroundColor: !inputText.trim() ? colors.inputBorder : colors.primary }]}
              onPress={handleSendAgentMessage}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.primaryFg} />
              ) : (
                <Send size={16} color={colors.primaryFg} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  agentBadge: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 8,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    gap: 6,
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '700',
  },
  clientEmail: {
    fontSize: 12,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
  },
  cardBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  claimBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  claimBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  openBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  openBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  modalScreen: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  resolveBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
  },
  modalMessagesList: {
    padding: SPACING.md,
    gap: 8,
  },
  msgRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  msgRowRight: {
    justifyContent: 'flex-end',
  },
  msgRowLeft: {
    justifyContent: 'flex-start',
  },
  msgBubble: {
    maxWidth: '80%',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  msgSenderTag: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  msgTime: {
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  modalInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  modalInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    fontSize: 13,
  },
  modalSendBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
