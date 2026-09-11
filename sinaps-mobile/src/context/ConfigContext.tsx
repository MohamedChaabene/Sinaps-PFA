import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiBaseUrl, resetCachedBaseUrl, checkBackendHealth } from '../api/client';
import { setCustomBackendUrl } from '../utils/storage';
import { disconnectSocket } from '../socket/socket';

interface ConfigContextType {
  backendUrl: string;
  updateBackendUrl: (url: string) => Promise<boolean>;
  resetToDefaultUrl: () => Promise<void>;
  testConnection: (url?: string) => Promise<{ ok: boolean; message: string }>;
  isCheckingHealth: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backendUrl, setBackendUrlState] = useState<string>('http://localhost:5000');
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);

  useEffect(() => {
    getApiBaseUrl().then((url) => {
      setBackendUrlState(url);
    });
  }, []);

  const updateBackendUrl = async (newUrl: string): Promise<boolean> => {
    setIsCheckingHealth(true);
    try {
      const cleanUrl = newUrl.trim().replace(/\/+$/, '');
      const health = await checkBackendHealth(cleanUrl);
      if (health.ok) {
        await setCustomBackendUrl(cleanUrl);
        resetCachedBaseUrl();
        disconnectSocket();
        setBackendUrlState(cleanUrl);
        setIsCheckingHealth(false);
        return true;
      }
      setIsCheckingHealth(false);
      return false;
    } catch {
      setIsCheckingHealth(false);
      return false;
    }
  };

  const resetToDefaultUrl = async (): Promise<void> => {
    await setCustomBackendUrl('');
    resetCachedBaseUrl();
    disconnectSocket();
    const defaultUrl = await getApiBaseUrl();
    setBackendUrlState(defaultUrl);
  };

  const testConnection = async (url?: string) => {
    setIsCheckingHealth(true);
    try {
      const result = await checkBackendHealth(url || backendUrl);
      setIsCheckingHealth(false);
      return result;
    } catch (e: any) {
      setIsCheckingHealth(false);
      return { ok: false, message: e.message || 'Erreur de test réseau' };
    }
  };

  return (
    <ConfigContext.Provider
      value={{
        backendUrl,
        updateBackendUrl,
        resetToDefaultUrl,
        testConnection,
        isCheckingHealth,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export function useConfig(): ConfigContextType {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return ctx;
}
