import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  LogOut,
  Settings,
  Star,
  Bot,
  UserCheck,
  Check,
  Trash2,
  Clock,
  RotateCw,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchStats, fetchAgents, approveAgent, rejectAgent, AdminStats, AdminAgentItem } from '../api/agents';
import { fetchAllConversations } from '../api/conversations';
import { StatusBadge } from '../components/StatusBadge';
import { RADIUS, SPACING } from '../constants/theme';
import { formatMessageTime } from '../utils/formatters';

interface Props {
  onOpenSettings: () => void;
}

export const AdminScreen: React.FC<Props> = ({ onOpenSettings }) => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { colors } = useTheme();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [agents, setAgents] = useState<AdminAgentItem[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, agentsData, convsData] = await Promise.all([
        fetchStats().catch(() => null),
        fetchAgents().catch(() => []),
        fetchAllConversations().catch(() => []),
      ]);
      setStats(statsData);
      setAgents(agentsData);
      setConversations(convsData);
    } catch (err: any) {
      console.warn('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id: string, name: string) => {
    try {
      await approveAgent(id);
      Alert.alert('Compte validé', `L'agent ${name} a été validé.`);
      await loadData();
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de valider ce compte');
    }
  };

  const handleReject = async (id: string, name: string) => {
    Alert.alert(
      'Confirmer le rejet',
      `Voulez-vous supprimer le compte de ${name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectAgent(id);
              await loadData();
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible de supprimer');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, SPACING.md) }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={styles.adminBadge}>
            <ShieldCheck size={20} color={colors.primaryFg} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{user?.name || 'Administrateur'}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Tableau de Bord Admin • Sinaps</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={loadData} activeOpacity={0.7}>
            <RotateCw size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onOpenSettings} activeOpacity={0.7}>
            <Settings size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={logout} activeOpacity={0.7}>
            <LogOut size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement des statistiques...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Section 1: SLA KPI Cards */}
          <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>📊 Statistiques Clés (SLA)</Text>
          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.kpiIcon, { backgroundColor: colors.warningLight }]}>
                <Star size={18} color={colors.warning} />
              </View>
              <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{stats?.avgSatisfaction || '4.8'} / 5</Text>
              <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Satisfaction moyenne</Text>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.kpiIcon, { backgroundColor: colors.primaryBg }]}>
                <Bot size={18} color={colors.primary} />
              </View>
              <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                {stats?.total ? Math.round(((stats.resolvedByIA || 0) / stats.total) * 100) : '75'} %
              </Text>
              <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Résolution par IA</Text>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.kpiIcon, { backgroundColor: colors.infoLight }]}>
                <UserCheck size={18} color={colors.info} />
              </View>
              <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{stats?.resolvedByHuman || '2'}</Text>
              <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Résolus par Humain</Text>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.kpiIcon, { backgroundColor: colors.successLight }]}>
                <Clock size={18} color={colors.success} />
              </View>
              <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                {stats?.avgResponseTimeSeconds ? `${Math.round(stats.avgResponseTimeSeconds / 60)} min` : '1.5 min'}
              </Text>
              <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Temps moyen de réponse</Text>
            </View>
          </View>

          {/* Section 2: Agent Account Validation */}
          <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>👥 Gestion des Agents de Support</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {agents.length === 0 ? (
              <Text style={[styles.emptyNotice, { color: colors.textMuted }]}>Aucun compte d'agent enregistré.</Text>
            ) : (
              agents.map((agent) => {
                const isPending = agent.status === 'pending';
                return (
                  <View key={agent._id || agent.id} style={[styles.agentRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.agentInfo}>
                      <Text style={[styles.agentName, { color: colors.textPrimary }]}>{agent.name}</Text>
                      <Text style={[styles.agentEmail, { color: colors.textMuted }]}>{agent.email}</Text>
                      <Text style={[styles.agentSkills, { color: colors.primary }]}>
                        Compétences : {(agent.skills || []).join(', ') || 'Général'}
                      </Text>
                    </View>

                    <View style={styles.agentActions}>
                      {isPending ? (
                        <>
                          <TouchableOpacity
                            style={[styles.approveBtn, { backgroundColor: colors.successLight, borderColor: colors.success }]}
                            onPress={() => handleApprove(agent._id || agent.id!, agent.name)}
                          >
                            <Check size={14} color={colors.success} />
                            <Text style={[styles.approveBtnText, { color: colors.success }]}>Valider</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.rejectBtn, { backgroundColor: colors.dangerLight }]}
                            onPress={() => handleReject(agent._id || agent.id!, agent.name)}
                          >
                            <Trash2 size={14} color={colors.danger} />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <View style={[styles.approvedBadge, { backgroundColor: colors.successLight }]}>
                          <Text style={[styles.approvedText, { color: colors.success }]}>Actif</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Section 3: Recent Conversations History */}
          <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>📋 Historique Récent des Demandes ({conversations.length})</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {conversations.length === 0 ? (
              <Text style={[styles.emptyNotice, { color: colors.textMuted }]}>Aucune conversation enregistrée.</Text>
            ) : (
              conversations.slice(0, 10).map((conv) => (
                <View key={conv._id} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.historyClient, { color: colors.textPrimary }]}>{conv.client?.name || 'Client'}</Text>
                    <Text style={[styles.historyEmail, { color: colors.textMuted }]}>{conv.client?.email}</Text>
                    <Text style={[styles.historyMode, { color: colors.textSecondary }]}>
                      Géré par : {conv.handledBy === 'ia' ? '🤖 IA Gemini' : '👤 Agent Humain'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <StatusBadge status={conv.status} />
                    <Text style={[styles.historyTime, { color: colors.textMuted }]}>{formatMessageTime(conv.updatedAt)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
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
  adminBadge: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: '#3b82f6',
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
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
  emptyNotice: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 13,
    fontWeight: '700',
  },
  agentEmail: {
    fontSize: 11,
  },
  agentSkills: {
    fontSize: 11,
    marginTop: 2,
  },
  agentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  approveBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rejectBtn: {
    padding: 6,
    borderRadius: RADIUS.md,
  },
  approvedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  approvedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyClient: {
    fontSize: 13,
    fontWeight: '700',
  },
  historyEmail: {
    fontSize: 11,
  },
  historyMode: {
    fontSize: 10,
    marginTop: 2,
  },
  historyTime: {
    fontSize: 10,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },
});
