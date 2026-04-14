/**
 * SocietyOS Mobile — API Client
 *
 * Axios wrapper that auto-attaches JWT tokens from SecureStore.
 * Handles 401 responses globally to trigger logout.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { setItem, getItem, removeItem } from './storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolve the API base URL automatically:
 * 1. EXPO_PUBLIC_API_URL env var (production / manual override)
 * 2. Expo dev-server host — works on physical devices & emulators
 *    without ever hardcoding your machine's IP.
 * 3. Platform fallbacks (last resort).
 */
function resolveBaseUrl(): string {
  // Manual override always wins
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // Expo exposes the dev-server host so we can derive the backend IP
  const expoHost: string | undefined =
    Constants.expoConfig?.hostUri ||
    (Constants.manifest2 as any)?.extra?.expoClient?.hostUri ||
    (Constants.manifest as any)?.debuggerHost;

  if (expoHost) {
    // hostUri is "192.168.x.x:8081" — strip the port and use 5000
    const ip = expoHost.split(':')[0];
    return `http://${ip}:5000`;
  }

  // Fallback: Android emulator alias / localhost for iOS sim
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
}

const BASE_URL = resolveBaseUrl();

const TOKEN_KEY = 'societyos-token';
const USER_KEY = 'societyos-user';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getItem(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // SecureStore unavailable (e.g. web) — skip
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(handler: () => void) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

// Token helpers
export async function storeToken(token: string): Promise<void> {
  await setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await removeItem(TOKEN_KEY);
}

// User helpers
export async function storeUser(user: Record<string, unknown>): Promise<void> {
  await setItem(USER_KEY, JSON.stringify(user));
}

export async function getStoredUser(): Promise<Record<string, unknown> | null> {
  const raw = await getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function removeUser(): Promise<void> {
  await removeItem(USER_KEY);
}

export { TOKEN_KEY, USER_KEY, BASE_URL };
export default api;
