/**
 * SocietyOS Mobile — Auth Context
 *
 * Provides login, logout, and session restore across the app.
 * Stores JWT + user payload in expo-secure-store.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import api, {
  storeToken,
  storeUser,
  removeToken,
  removeUser,
  getToken,
  getStoredUser,
  setOnUnauthorized,
} from '../lib/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'RESIDENT' | 'SECURITY' | 'SERVICE';
  flatId?: string | null;
  societyId: string;
  profilePicture?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

/** Map backend role to expo-router route group */
function roleToRoute(role: AuthUser['role']): string {
  switch (role) {
    case 'RESIDENT':
      return '/(resident)';
    case 'SECURITY':
      return '/(guard)';
    case 'SERVICE':
      return '/(service)';
    case 'ADMIN':
      return '/(resident)'; // Admin uses resident view for now
    default:
      return '/(auth)';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Logout handler
  const logout = useCallback(async () => {
    await removeToken();
    await removeUser();
    setUser(null);
    setToken(null);
    router.replace('/(auth)' as any);
  }, [router]);

  // Register 401 handler
  useEffect(() => {
    setOnUnauthorized(() => {
      logout();
    });
  }, [logout]);

  // Session restore on app launch
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await getToken();
        const storedUser = await getStoredUser();

        if (storedToken && storedUser) {
          const userObj = storedUser as unknown as AuthUser;

          // Biometric check for Resident on Android
          if (userObj.role === 'RESIDENT' && Platform.OS === 'android') {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (hasHardware && isEnrolled) {
              const authResult = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Login to SocietyOS',
                fallbackLabel: 'Use Password',
              });

              if (authResult.success) {
                setToken(storedToken);
                setUser(userObj);
              } else {
                await removeToken();
                await removeUser();
              }
            } else {
              setToken(storedToken);
              setUser(userObj);
            }
          } else {
            setToken(storedToken);
            setUser(userObj);
          }
        }
      } catch {
        // Corrupted storage — clear
        await removeToken();
        await removeUser();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Route protection — redirect when auth state changes
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Not logged in, but trying to access protected route
      router.replace('/(auth)' as any);
    } else if (user && inAuthGroup) {
      // Logged in, but still on auth screen — redirect to role
      const dest = roleToRoute(user.role);
      router.replace(dest as any);
    }
  }, [user, segments, isLoading, router]);

  // Login handler
  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: newUser } = response.data.data;

      // Persist securely
      await storeToken(newToken);
      await storeUser(newUser);

      setToken(newToken);
      setUser(newUser);

      // Navigate to role-specific area
      const dest = roleToRoute(newUser.role);
      router.replace(dest as any);
    },
    [router]
  );

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
