import { Platform } from 'react-native';

// Automatically choose the best default host for local dev depending on runtime platform:
// - Android emulator maps host 127.0.0.1 to 10.0.2.2
// - iOS simulator shares host network, so localhost works
// - Physical devices should point to the developer's LAN IP (e.g. 192.168.1.X) or remote URL
export function getDefaultBackendUrl(): string {
  // Check if an explicit env var is set
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/api\/?$/, '');
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  return 'http://localhost:5000';
}

export const STORAGE_KEYS = {
  CLIENT_SESSION: 'sinaps_mobile_client_session',
  BACKEND_URL: 'sinaps_mobile_backend_url',
};
