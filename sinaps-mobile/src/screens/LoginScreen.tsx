import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, Sparkles, User, Headphones, ShieldCheck, Lock, Mail } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

WebBrowser.maybeCompleteAuthSession();

// Google issues ID tokens for the OAuth client used by the current platform.
// Native builds therefore need their own Android/iOS OAuth client IDs; a web
// client ID is only valid in the browser.
const googleAuthConfig = {
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  // Keep the previous name working for existing web deployments.
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  selectAccount: true,
};

// Google OAuth redirects cannot return to Expo Go. It must be tested in a
// development or production build whose package/bundle identifier is registered
// in Google Cloud.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Constants = require('expo-constants').default;
const isExpoGo = Constants.appOwnership === 'expo';

interface Props {
  onOpenSettings: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onOpenSettings }) => {
  const insets = useSafeAreaInsets();
  const { login, loginAgent } = useAuth();
  const { colors } = useTheme();

  // Role selector: 'client' | 'agent' | 'admin'
  const [selectedRole, setSelectedRole] = useState<'client' | 'agent' | 'admin'>('client');

  // Client form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Agent / Admin form
  const [agentEmail, setAgentEmail] = useState('');
  const [agentPassword, setAgentPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Google Auth Session — Expo Go deliberately has no usable request.
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    isExpoGo
      ? { clientId: '' } // dummy config, won't be used
      : googleAuthConfig
  );

  useEffect(() => {
    if (response?.type === 'success' && response.params?.id_token) {
      const idToken = response.params.id_token;
      login('Utilisateur Google', '', idToken).catch((err: any) => {
        Alert.alert('Erreur Google', err.message || 'Échec de la validation Google');
      });
    }
  }, [response, login]);

  const handleDirectSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert('Champs requis', 'Veuillez saisir votre adresse e-mail.');
      return;
    }

    setSubmitting(true);
    try {
      await login(trimmedName || trimmedEmail.split('@')[0], trimmedEmail);
    } catch (err: any) {
      Alert.alert('Erreur de connexion', err.message || 'Impossible de se connecter au serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGooglePress = async () => {
    setSubmitting(true);
    try {
      if (isExpoGo) {
        Alert.alert(
          'Build de développement requis',
          'Google Sign-In ne fonctionne pas dans Expo Go. Ouvrez une build de développement ou la version publiée de l’application.'
        );
      } else if (request) {
        await promptAsync();
      } else {
        Alert.alert(
          'Google non configuré',
          'Ajoutez l’identifiant OAuth Google correspondant à cette plateforme, puis reconstruisez l’application.'
        );
      }
    } catch (err: any) {
      Alert.alert('Erreur Google', err?.message || 'La connexion Google a été annulée ou a échoué.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAgentLogin = async () => {
    if (!agentEmail.trim() || !agentPassword.trim()) {
      Alert.alert('Champs requis', 'Veuillez renseigner votre email et mot de passe.');
      return;
    }

    setSubmitting(true);
    try {
      await loginAgent(agentEmail.trim(), agentPassword.trim());
    } catch (err: any) {
      Alert.alert('Erreur de connexion', err.message || 'Email ou mot de passe incorrect.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickAgent = (emailVal: string) => {
    setAgentEmail(emailVal);
    setAgentPassword('password123');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, SPACING.lg),
            paddingBottom: Math.max(insets.bottom, SPACING.lg),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top bar with settings */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={onOpenSettings}
            activeOpacity={0.7}
            accessibilityLabel="Configurer le backend"
          >
            <Settings size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Logo badge */}
          <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.logoText, { color: colors.primaryFg }]}>S</Text>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>Sinaps</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Support client assisté par IA &amp; plateforme de gestion
          </Text>

          {/* Role Selector Tabs */}
          <View style={[styles.roleTabs, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.roleTab, selectedRole === 'client' && { backgroundColor: colors.card }]}
              onPress={() => setSelectedRole('client')}
            >
              <User size={14} color={selectedRole === 'client' ? colors.primary : colors.textMuted} />
              <Text style={[styles.roleTabText, { color: selectedRole === 'client' ? colors.primary : colors.textMuted }]}>
                Client
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleTab, selectedRole === 'agent' && { backgroundColor: colors.card }]}
              onPress={() => setSelectedRole('agent')}
            >
              <Headphones size={14} color={selectedRole === 'agent' ? colors.primary : colors.textMuted} />
              <Text style={[styles.roleTabText, { color: selectedRole === 'agent' ? colors.primary : colors.textMuted }]}>
                Agent
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleTab, selectedRole === 'admin' && { backgroundColor: colors.card }]}
              onPress={() => setSelectedRole('admin')}
            >
              <ShieldCheck size={14} color={selectedRole === 'admin' ? colors.primary : colors.textMuted} />
              <Text style={[styles.roleTabText, { color: selectedRole === 'admin' ? colors.primary : colors.textMuted }]}>
                Admin
              </Text>
            </TouchableOpacity>
          </View>

          {/* CLIENT LOGIN */}
          {selectedRole === 'client' && (
            <View>
              <TouchableOpacity
                style={[styles.googleBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={handleGooglePress}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <Path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <Path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <Path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </Svg>
                <Text style={[styles.googleBtnText, { color: colors.textPrimary }]}>Continuer avec Google</Text>
              </TouchableOpacity>

              {/* Separator */}
              <View style={styles.separatorRow}>
                <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.separatorText, { color: colors.textMuted }]}>OU MODE DIRECT</Text>
                <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Direct Form */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nom complet</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                  placeholder="Ex. Mohamed Chaabene"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!submitting}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Adresse e-mail *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                  placeholder="votre.email@exemple.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!submitting}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }, submitting && styles.submitBtnDisabled]}
                onPress={handleDirectSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.primaryFg} />
                ) : (
                  <Text style={[styles.submitBtnText, { color: colors.primaryFg }]}>Démarrer le support</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* AGENT OR ADMIN LOGIN */}
          {(selectedRole === 'agent' || selectedRole === 'admin') && (
            <View>
              <Text style={[styles.roleHint, { color: colors.textSecondary }]}>
                {selectedRole === 'agent'
                  ? 'Connectez-vous avec votre compte agent pour répondre aux tickets escaladés.'
                  : "Connectez-vous pour superviser les SLA, les agents et l'historique."}
              </Text>

              {/* Quick-fill Demo Accounts */}
              <Text style={[styles.quickFillLabel, { color: colors.textMuted }]}>Comptes de démonstration :</Text>
              <View style={styles.quickFillRow}>
                {selectedRole === 'agent' ? (
                  <>
                    <TouchableOpacity
                      style={[styles.quickFillBtn, { backgroundColor: colors.primaryBg }]}
                      onPress={() => fillQuickAgent('sarah.benali@sinaps.com')}
                    >
                      <Text style={[styles.quickFillBtnText, { color: colors.primary }]}>Sarah (Commandes)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickFillBtn, { backgroundColor: colors.primaryBg }]}
                      onPress={() => fillQuickAgent('karim.mansouri@sinaps.com')}
                    >
                      <Text style={[styles.quickFillBtnText, { color: colors.primary }]}>Karim (Technique)</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={[styles.quickFillBtn, { flex: 1, backgroundColor: colors.primaryBg }]}
                    onPress={() => fillQuickAgent('admin@sinaps.com')}
                  >
                    <Text style={[styles.quickFillBtnText, { color: colors.primary }]}>admin@sinaps.com (Admin)</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Form */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Adresse e-mail</Text>
                <View style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.inputBorder }]}>
                  <Mail size={16} color={colors.textMuted} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.inputField, { color: colors.textPrimary }]}
                    placeholder={selectedRole === 'agent' ? 'sarah.benali@sinaps.com' : 'admin@sinaps.com'}
                    placeholderTextColor={colors.textMuted}
                    value={agentEmail}
                    onChangeText={setAgentEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!submitting}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Mot de passe</Text>
                <View style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.inputBorder }]}>
                  <Lock size={16} color={colors.textMuted} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.inputField, { color: colors.textPrimary }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    value={agentPassword}
                    onChangeText={setAgentPassword}
                    secureTextEntry
                    editable={!submitting}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: selectedRole === 'admin' ? '#2563eb' : colors.primary },
                  submitting && styles.submitBtnDisabled,
                ]}
                onPress={handleAgentLogin}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.primaryFg} />
                ) : (
                  <Text style={[styles.submitBtnText, { color: colors.primaryFg }]}>
                    {selectedRole === 'agent' ? "Accéder à l'espace Agent" : 'Accéder au Dashboard Admin'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  topBar: {
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
  },
  settingsBtn: {
    padding: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  roleTabs: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    gap: 4,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  separatorLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  separatorText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
  },
  roleHint: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  quickFillLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  quickFillRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.md,
  },
  quickFillBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  quickFillBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  fieldIcon: {
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  submitBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
