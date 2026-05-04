/**
 * GuinéaManager - Offline Hook
 * Hook React pour gérer l'état offline et la synchronisation
 */

'use client';

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { offlineDB, type OfflineDataType } from '@/lib/offline-db';

export interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  syncErrors: string[];
}

export interface UseOfflineOptions {
  autoSync?: boolean;
  syncInterval?: number;
  onOnline?: () => void;
  onOffline?: () => void;
  onSyncComplete?: (synced: number, failed: number) => void;
}

// Store externe pour l'état online
const onlineCallbacks = new Set<() => void>();
const getOnlineSnapshot = () => navigator.onLine;
const subscribeToOnline = (callback: () => void) => {
  onlineCallbacks.add(callback);
  return () => onlineCallbacks.delete(callback);
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => onlineCallbacks.forEach(cb => cb()));
  window.addEventListener('offline', () => onlineCallbacks.forEach(cb => cb()));
}

export function useOffline(options: UseOfflineOptions = {}) {
  const {
    autoSync = true,
    syncInterval = 60000,
    onOnline,
    onOffline,
    onSyncComplete
  } = options;

  // Utiliser useSyncExternalStore pour l'état online (pas de setState dans useEffect)
  const isOnline = useSyncExternalStore(
    subscribeToOnline,
    getOnlineSnapshot,
    () => true // SSR fallback
  );

  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncingRef = useRef(false);

  // Mettre à jour le compteur de requêtes en attente
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await offlineDB.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('[useOffline] Erreur mise à jour compteur:', error);
    }
  }, []);

  // Synchroniser les requêtes en attente
  const syncPendingRequests = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    
    syncingRef.current = true;
    setIsSyncing(true);
    setSyncErrors([]);

    try {
      const pendingRequests = await offlineDB.getPendingRequests();
      
      if (pendingRequests.length === 0) {
        setIsSyncing(false);
        setLastSyncTime(Date.now());
        syncingRef.current = false;
        return;
      }

      let synced = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const request of pendingRequests) {
        try {
          const response = await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body
          });

          if (response.ok) {
            await offlineDB.removePendingRequest(request.id!);
            synced++;
          } else {
            failed++;
            errors.push(`${request.method} ${request.url}: ${response.status}`);
          }
        } catch {
          failed++;
          errors.push(`${request.method} ${request.url}: Erreur réseau`);
        }
      }

      setIsSyncing(false);
      setLastSyncTime(Date.now());
      setSyncErrors(errors);
      setPendingCount(prev => prev - synced);

      onSyncComplete?.(synced, failed);
      
    } catch (error) {
      console.error('[useOffline] Erreur synchronisation:', error);
      setIsSyncing(false);
      setSyncErrors(['Erreur lors de la synchronisation']);
    } finally {
      syncingRef.current = false;
    }
  }, [onSyncComplete]);

  // Sauvegarder des données pour usage offline
  const saveOfflineData = useCallback(async <T,>(
    key: string,
    data: T,
    type: OfflineDataType
  ): Promise<void> => {
    await offlineDB.saveData(key, data, type);
  }, []);

  // Récupérer des données offline
  const getOfflineData = useCallback(async <T,>(key: string): Promise<T | null> => {
    return offlineDB.getData<T>(key);
  }, []);

  // Ajouter une requête en attente
  const queueRequest = useCallback(async (
    url: string,
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    body?: unknown
  ): Promise<number> => {
    const id = await offlineDB.addPendingRequest(url, method, body);
    setPendingCount(prev => prev + 1);
    return id;
  }, []);

  // Effectuer une requête avec fallback offline
  const fetchWithOffline = useCallback(async <T,>(
    url: string,
    options: RequestInit = {},
    offlineKey?: string,
    offlineType?: OfflineDataType
  ): Promise<{ data: T | null; offline: boolean; error?: string }> => {
    try {
      if (navigator.onLine) {
        const response = await fetch(url, options);
        
        if (response.ok) {
          const data = await response.json();
          
          if (offlineKey && offlineType) {
            await saveOfflineData(offlineKey, data, offlineType);
          }
          
          return { data, offline: false };
        }
        
        return { data: null, offline: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.warn('[useOffline] Erreur fetch:', error);
    }

    if (offlineKey) {
      const offlineData = await getOfflineData<T>(offlineKey);
      if (offlineData) {
        return { data: offlineData, offline: true };
      }
    }

    return { data: null, offline: true, error: 'Données non disponibles hors-ligne' };
  }, [saveOfflineData, getOfflineData]);

  // Sauvegarder un brouillon
  const saveDraft = useCallback(async <T,>(
    type: OfflineDataType,
    data: T
  ): Promise<string> => {
    return offlineDB.saveDraft(type, data);
  }, []);

  // Récupérer les brouillons
  const getDrafts = useCallback(async <T,>(
    type: OfflineDataType
  ): Promise<Array<{ localId: string; data: T; createdAt: number }>> => {
    return offlineDB.getDraftsByType<T>(type);
  }, []);

  // Supprimer un brouillon
  const deleteDraft = useCallback(async (localId: string): Promise<void> => {
    return offlineDB.deleteDraft(localId);
  }, []);

  // Obtenir les statistiques
  const getStats = useCallback(async () => {
    return offlineDB.getStats();
  }, []);

  // Effacer toutes les données offline
  const clearOfflineData = useCallback(async (): Promise<void> => {
    await offlineDB.clearAll();
    setPendingCount(0);
  }, []);

  // Gestion des événements online/offline avec callbacks
  useEffect(() => {
    if (isOnline) {
      console.log('[useOffline] Connexion rétablie');
      onOnline?.();
      
      if (autoSync) {
        // Sync en arrière-plan (pas de await pour éviter le blocage)
        void syncPendingRequests();
      }
    } else {
      console.log('[useOffline] Connexion perdue');
      onOffline?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // Mise à jour initiale du compteur (après le montage)
  useEffect(() => {
    const initCount = async () => {
      await updatePendingCount();
    };
    initCount();
  }, [updatePendingCount]);

  // Sync automatique périodique
  useEffect(() => {
    if (!autoSync || !isOnline) return;

    syncIntervalRef.current = setInterval(() => {
      if (navigator.onLine) {
        updatePendingCount();
        if (pendingCount > 0) {
          syncPendingRequests();
        }
      }
    }, syncInterval);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSync, syncInterval, pendingCount, syncPendingRequests, updatePendingCount, isOnline]);

  // Écouter les messages du Service Worker
  useEffect(() => {
    const handleServiceWorkerMessage = () => {
      updatePendingCount();
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [updatePendingCount]);

  return {
    // État
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncErrors,
    
    // Actions
    syncPendingRequests,
    saveOfflineData,
    getOfflineData,
    queueRequest,
    fetchWithOffline,
    saveDraft,
    getDrafts,
    deleteDraft,
    getStats,
    clearOfflineData,
    updatePendingCount
  };
}

// Hook simplifié pour l'indicateur de statut
export function useOnlineStatus() {
  return useSyncExternalStore(
    subscribeToOnline,
    getOnlineSnapshot,
    () => true
  );
}
