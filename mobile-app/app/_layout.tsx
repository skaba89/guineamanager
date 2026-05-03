/**
 * GuinéaManager Mobile - Root Layout
 * Configuration principale de l'application
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/stores/auth-store';
import { useOfflineStore } from '@/stores/offline-store';
import { syncService } from '@/lib/sync-service';

// Empêcher le splash screen de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { loadAll, updateSyncStatus } = useOfflineStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // 1. Vérifier l'authentification
        await checkAuth();
        
        // 2. Charger les données locales
        await loadAll();
        
        // 3. Initialiser le service de synchronisation
        await syncService.init();
        
        // 4. S'abonner aux changements de statut de sync
        const unsubscribe = syncService.subscribe((status) => {
          updateSyncStatus({
            isOnline: status.isOnline,
            isSyncing: status.isSyncing,
            lastSync: status.lastSync,
            pendingCount: status.pendingCount,
            syncError: status.error,
          });
        });
        
        setIsReady(true);
        
        // Nettoyage
        return () => {
          unsubscribe();
          syncService.destroy();
        };
      } catch (error) {
        console.error('Erreur initialisation:', error);
        setIsReady(true);
      }
    };

    prepare();
  }, [checkAuth, loadAll, updateSyncStatus]);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen 
            name="payment/[id]" 
            options={{ 
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Détails du paiement',
              headerStyle: { backgroundColor: '#059669' },
              headerTintColor: 'white',
            }} 
          />
          <Stack.Screen 
            name="invoice/[id]" 
            options={{ 
              headerShown: true,
              headerTitle: 'Détails de la facture',
              headerStyle: { backgroundColor: '#059669' },
              headerTintColor: 'white',
            }} 
          />
          <Stack.Screen 
            name="scan-qr" 
            options={{ 
              presentation: 'fullScreenModal',
              headerShown: false,
            }} 
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
