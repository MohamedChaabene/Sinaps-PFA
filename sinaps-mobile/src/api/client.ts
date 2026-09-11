import { getDefaultBackendUrl } from '../constants/config';
import { getCustomBackendUrl, getStoredSession } from '../utils/storage';

let cachedBaseUrl: string | null = null;

export async function getApiBaseUrl(): Promise<string> {
  if (cachedBaseUrl) return cachedBaseUrl;
  const custom = await getCustomBackendUrl();
  if (custom) {
    cachedBaseUrl = custom;
    return custom;
  }
  const defaultUrl = getDefaultBackendUrl();
  cachedBaseUrl = defaultUrl;
  return defaultUrl;
}

export function resetCachedBaseUrl() {
  cachedBaseUrl = null;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl.replace(/\/+$/, '')}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const session = await getStoredSession();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (session?.token && !headers.Authorization) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  // Only add Content-Type: application/json if body is not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data?.error || `Erreur serveur (${response.status})`;
      const error: any = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data as T;
  } catch (err: any) {
    if (err.message && err.message.includes('Network request failed')) {
      throw new Error(
        `Impossible de contacter le serveur (${baseUrl}). Vérifiez votre connexion et l'adresse du backend dans les Paramètres.`
      );
    }
    throw err;
  }
}

export async function checkBackendHealth(testUrl?: string): Promise<{ ok: boolean; message: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const base = testUrl || (await getApiBaseUrl());
    const target = `${base.replace(/\/+$/, '')}/api/health`;
    const res = await fetch(target, { method: 'GET', signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: true, message: data.message || 'Serveur Sinaps opérationnel' };
    }
    return { ok: false, message: `Réponse HTTP ${res.status}` };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      return { ok: false, message: 'Délai d\'attente dépassé (timeout 5s). Vérifiez l\'adresse IP.' };
    }
    return { ok: false, message: error.message || 'Hôte injoignable' };
  }
}
