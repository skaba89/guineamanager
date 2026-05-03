/**
 * GuinéaManager Mobile - Root Layout
 * Configuration principale de l'application
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/stores/auth-store';

// Empêcher le splash screen de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    const prepare = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Erreur initialisation:', error);
      } finally {
        await SplashScreen.hideAsync();
      }
    };
    prepare();
  }, [checkAuth]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="payment/[id]" />
          <Stack.Screen name="invoice/[id]" />
          <Stack.Screen name="scan-qr" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
