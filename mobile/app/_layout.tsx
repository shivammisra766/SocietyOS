import { SplashScreen, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';
import { AuthProvider } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { IncomingVisitorProvider } from '../context/IncomingVisitorContext';
import IncomingVisitorAlert from '../components/IncomingVisitorAlert';

import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

SplashScreen.preventAutoHideAsync();

import Toast from 'react-native-toast-message';

/**
 * AppShell — mounted inside IncomingVisitorProvider + AuthProvider.
 * useNotifications can now call useIncomingVisitor() to surface the call modal.
 */
function AppShell() {
  useNotifications();
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)"     options={{ headerShown: false }} />
        <Stack.Screen name="(resident)" options={{ headerShown: false }} />
        <Stack.Screen name="(guard)"    options={{ headerShown: false }} />
        <Stack.Screen name="(service)"  options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" backgroundColor="transparent" translucent />

      {/* Global call-style overlay — renders on top of every screen */}
      <IncomingVisitorAlert />
      
      {/* Toast overlay */}
      <Toast />
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Inter-Light':    Inter_300Light,
    'Inter-Regular':  Inter_400Regular,
    'Inter-Medium':   Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold':     Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <IncomingVisitorProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </IncomingVisitorProvider>
  );
}
