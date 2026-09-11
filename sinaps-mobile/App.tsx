import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ConfigProvider } from './src/context/ConfigContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';

import { LoginScreen } from './src/screens/LoginScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { AgentScreen } from './src/screens/AgentScreen';
import { AdminScreen } from './src/screens/AdminScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

function MainNavigator() {
  const { isAuthenticated, isLoading, role } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (showSettings) {
    return <SettingsScreen onBack={() => setShowSettings(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onOpenSettings={() => setShowSettings(true)} />;
  }

  // Admin Dashboard
  if (role === 'admin') {
    return <AdminScreen onOpenSettings={() => setShowSettings(true)} />;
  }

  // Agent Support Portal
  if (role === 'agent') {
    return <AgentScreen onOpenSettings={() => setShowSettings(true)} />;
  }

  // Customer Chat Experience
  return (
    <ChatProvider>
      <ChatScreen onOpenSettings={() => setShowSettings(true)} />
    </ChatProvider>
  );
}

function AppWithTheme() {
  const { isDarkMode } = useTheme();
  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <MainNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ConfigProvider>
          <AuthProvider>
            <AppWithTheme />
          </AuthProvider>
        </ConfigProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
