import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Check, AlertCircle, RefreshCw, Smartphone, Monitor } from 'lucide-react-native';
import { useConfig } from '../context/ConfigContext';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

interface Props {
  onBack: () => void;
}

export const SettingsScreen: React.FC<Props> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const { backendUrl, updateBackendUrl, resetToDefaultUrl, testConnection, isCheckingHealth } = useConfig();
  const { colors } = useTheme();

  const [inputUrl, setInputUrl] = useState(backendUrl);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleApply = async () => {
    if (!inputUrl.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner une adresse backend valide.');
      return;
    }

    const ok = await updateBackendUrl(inputUrl);
    if (ok) {
      setTestResult({ ok: true, message: 'Serveur connecté avec succès !' });
      Alert.alert('Configuration enregistrée', 'La nouvelle adresse backend a été enregistrée.');
    } else {
      setTestResult({ ok: false, message: 'Serveur injoignable à cette adresse' });
      Alert.alert(
        'Attention',
        "Le serveur n'a pas répondu au test de santé (/api/health). Vérifiez que le backend Sinaps est bien lancé."
      );
    }
  };

  const handleTest = async () => {
    const res = await testConnection(inputUrl);
    setTestResult(res);
  };

  const handleReset = async () => {
    await resetToDefaultUrl();
    setInputUrl(backendUrl);
    setTestResult(null);
    Alert.alert('Réinitialisé', "L'adresse a été réinitialisée sur la valeur par défaut de la plateforme.");
  };

  const setPreset = (presetUrl: string) => {
    setInputUrl(presetUrl);
    setTestResult(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, SPACING.md) }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={20} color={colors.textPrimary} />
          <Text style={[styles.backBtnText, { color: colors.textPrimary }]}>Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Configuration Réseau</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Intro */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Adresse du serveur Sinaps</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            Configurez l'URL du backend (`sinaps-backend`). Selon votre environnement de test
            (émulateur, simulateur ou smartphone physique), `localhost` peut ne pas fonctionner directement.
          </Text>

          {/* Quick Presets */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Raccourcis rapides :</Text>
          <View style={styles.presetsGrid}>
            <TouchableOpacity
              style={[styles.presetBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setPreset('http://10.0.2.2:5000')}
              activeOpacity={0.7}
            >
              <Smartphone size={15} color={colors.primary} />
              <View style={styles.presetCol}>
                <Text style={[styles.presetName, { color: colors.textPrimary }]}>Émulateur Android</Text>
                <Text style={[styles.presetUrl, { color: colors.textMuted }]}>http://10.0.2.2:5000</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setPreset('http://localhost:5000')}
              activeOpacity={0.7}
            >
              <Monitor size={15} color={colors.info} />
              <View style={styles.presetCol}>
                <Text style={[styles.presetName, { color: colors.textPrimary }]}>Simulateur iOS / Web</Text>
                <Text style={[styles.presetUrl, { color: colors.textMuted }]}>http://localhost:5000</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* URL Input */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Adresse active :</Text>
          <TextInput
            style={[styles.urlInput, { backgroundColor: colors.background, borderColor: colors.inputBorder, color: colors.textPrimary }]}
            value={inputUrl}
            onChangeText={(t) => {
              setInputUrl(t);
              setTestResult(null);
            }}
            placeholder="http://192.168.1.X:5000"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Test Status Banner */}
          {testResult && (
            <View
              style={[
                styles.statusBanner,
                { backgroundColor: testResult.ok ? colors.successLight : colors.dangerLight },
              ]}
            >
              {testResult.ok ? (
                <Check size={16} color={colors.success} />
              ) : (
                <AlertCircle size={16} color={colors.danger} />
              )}
              <Text
                style={[
                  styles.statusText,
                  { color: testResult.ok ? colors.success : colors.danger },
                ]}
              >
                {testResult.message}
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.testBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleTest}
              disabled={isCheckingHealth}
              activeOpacity={0.7}
            >
              {isCheckingHealth ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <>
                  <RefreshCw size={14} color={colors.textPrimary} />
                  <Text style={[styles.testBtnText, { color: colors.textPrimary }]}>Tester</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleApply}
              disabled={isCheckingHealth}
              activeOpacity={0.8}
            >
              <Text style={[styles.saveBtnText, { color: colors.primaryFg }]}>Enregistrer</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.resetLink} onPress={handleReset}>
            <Text style={[styles.resetLinkText, { color: colors.textMuted }]}>Réinitialiser la configuration par défaut</Text>
          </TouchableOpacity>
        </View>

        {/* Documentation notice */}
        <View style={[styles.docCard, { backgroundColor: colors.primaryBg, borderColor: colors.primaryLight }]}>
          <Text style={[styles.docTitle, { color: colors.primaryDark }]}>💡 Conseils pour smartphone physique</Text>
          <Text style={[styles.docParagraph, { color: colors.primaryDark }]}>
            1. Connectez votre smartphone au même réseau Wi-Fi que votre ordinateur.
          </Text>
          <Text style={[styles.docParagraph, { color: colors.primaryDark }]}>
            2. Trouvez l'adresse IP locale de votre machine (ex: <Text style={styles.codeText}>ipconfig</Text> sous Windows → ex: <Text style={styles.codeText}>192.168.1.45</Text>).
          </Text>
          <Text style={[styles.docParagraph, { color: colors.primaryDark }]}>
            3. Entrez <Text style={styles.codeText}>http://192.168.1.45:5000</Text> ci-dessus et cliquez sur Tester.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 4,
  },
  presetsGrid: {
    gap: 8,
    marginBottom: SPACING.md,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  presetCol: {
    flex: 1,
  },
  presetName: {
    fontSize: 12,
    fontWeight: '600',
  },
  presetUrl: {
    fontSize: 11,
  },
  urlInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: SPACING.md,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resetLink: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  resetLinkText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  docCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  docParagraph: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
  },
});
