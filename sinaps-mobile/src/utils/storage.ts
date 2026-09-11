import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';

export interface StoredSession {
  user: {
    _id: string;
    id?: string;
    name: string;
    email: string;
    role?: 'client' | 'agent' | 'admin';
    avatar?: string;
    skills?: string[];
  };
  token: string;
  role: 'client' | 'agent' | 'admin';
}

export async function getStoredSession(): Promise<StoredSession | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CLIENT_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.token && parsed.user) {
      return {
        ...parsed,
        role: parsed.role || parsed.user.role || 'client',
      };
    }
    return null;
  } catch (error) {
    console.warn('Failed to load session from storage:', error);
    return null;
  }
}

export async function saveSession(
  user: any,
  token: string,
  role: 'client' | 'agent' | 'admin' = 'client'
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.CLIENT_SESSION,
      JSON.stringify({ user, token, role })
    );
  } catch (error) {
    console.error('Failed to save session to storage:', error);
  }
}

export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.CLIENT_SESSION);
  } catch (error) {
    console.error('Failed to clear session from storage:', error);
  }
}

export async function getCustomBackendUrl(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.BACKEND_URL);
  } catch {
    return null;
  }
}

export async function setCustomBackendUrl(url: string): Promise<void> {
  try {
    if (!url || url.trim().length === 0) {
      await AsyncStorage.removeItem(STORAGE_KEYS.BACKEND_URL);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.BACKEND_URL, url.trim().replace(/\/+$/, ''));
    }
  } catch (error) {
    console.error('Failed to save backend URL:', error);
  }
}
