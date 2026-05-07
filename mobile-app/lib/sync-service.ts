/**
 * GuinéaManager Mobile - Sync Service
 * Service de synchronisation avec le backend
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { offlineDB, PendingOperation } from './offline-db';
import { api } from './api';

// Types
interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: number | null;
  pendingCount: number;
  error: string | null;
}

type SyncListener = (status: SyncStatus) => void;

/**
 * Service de synchronisation
 * Gère la synchronisation automatique des données
 */
class SyncService {
  private status: SyncStatus = {
    isOnline: false,
    isSyncing: false,
    lastSync: null,
    pendingCount: 0,
    error: null,
  };
  
  private listeners: Set<SyncListener> = new Set();
  private unsubscribeNetInfo: (() => void) | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Initialiser le service de synchronisation
   */
  async init(): Promise<void> {
    // Charger le dernier sync
    this.status.lastSync = await offlineDB.getLastSync();
    
    // Charger le nombre d'opérations en attente
    const pending = await offlineDB.getPendingOperations();
    this.status.pendingCount = pending.length;

    // Écouter les changements de connexion
    this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleConnectionChange);

    // Vérifier la connexion initiale
    const state = await NetInfo.fetch();
    this.status.isOnline = state.isConnected ?? false;

    // Si en ligne, synchroniser
    if (this.status.isOnline) {
      await this.sync();
    }

    // Démarrer la synchronisation périodique (toutes les 5 minutes)
    this.syncInterval = setInterval(() => {
      if (this.status.isOnline && !this.status.isSyncing) {
        this.sync();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Arrêter le service
   */
  destroy(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.listeners.clear();
  }

  /**
   * Gérer les changements de connexion
   */
  private handleConnectionChange = async (state: NetInfoState): Promise<void> => {
    const wasOffline = !this.status.isOnline;
    this.status.isOnline = state.isConnected ?? false;
    this.notifyListeners();

    // Si on revient en ligne, synchroniser
    if (wasOffline && this.status.isOnline) {
      await this.sync();
    }
  };

  /**
   * Synchroniser les données
   */
  async sync(): Promise<void> {
    if (!this.status.isOnline || this.status.isSyncing) {
      return;
    }

    this.status.isSyncing = true;
    this.status.error = null;
    this.notifyListeners();

    try {
      // 1. Envoyer les opérations en attente
      await this.processPendingOperations();

      // 2. Récupérer les données du serveur
      await this.fetchServerData();

      // 3. Mettre à jour le timestamp
      const now = Date.now();
      await offlineDB.setLastSync(now);
      this.status.lastSync = now;

      // 4. Mettre à jour le compteur
      const pending = await offlineDB.getPendingOperations();
      this.status.pendingCount = pending.length;

    } catch (error) {
      console.error('Erreur synchronisation:', error);
      this.status.error = error instanceof Error ? error.message : 'Erreur de synchronisation';
    } finally {
      this.status.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Traiter les opérations en attente
   */
  private async processPendingOperations(): Promise<void> {
    const operations = await offlineDB.getPendingOperations();
    
    for (const operation of operations) {
      try {
        await this.executeOperation(operation);
        await offlineDB.removePendingOperation(operation.id);
      } catch (error) {
        // Incrémenter le compteur de retry
        await offlineDB.incrementRetryCount(operation.id);
        
        // Si trop de tentatives, abandonner
        if (operation.retryCount >= 3) {
          console.warn(`Opération abandonnée après 3 tentatives: ${operation.id}`);
          await offlineDB.removePendingOperation(operation.id);
        }
      }
    }
  }

  /**
   * Exécuter une opération
   */
  private async executeOperation(operation: PendingOperation): Promise<void> {
    const { type, entity, data } = operation;
    const endpoints: Record<string, string> = {
      client: '/api/clients',
      facture: '/api/factures',
      produit: '/api/produits',
      transaction: '/api/mobile-money',
    };

    const endpoint = endpoints[entity];
    if (!endpoint) return;

    switch (type) {
      case 'CREATE':
        await api.post(endpoint, data);
        break;
      case 'UPDATE':
        const updateData = data as { id: string };
        await api.put(`${endpoint}/${updateData.id}`, data);
        break;
      case 'DELETE':
        const deleteData = data as { id: string };
        await api.delete(`${endpoint}/${deleteData.id}`);
        break;
    }
  }

  /**
   * Récupérer les données du serveur
   */
  private async fetchServerData(): Promise<void> {
    try {
      // Récupérer les clients
      const clientsResponse = await api.get('/api/clients');
      if (clientsResponse.success && clientsResponse.data) {
        await offlineDB.saveClients(clientsResponse.data);
      }

      // Récupérer les factures
      const facturesResponse = await api.get('/api/factures');
      if (facturesResponse.success && facturesResponse.data) {
        await offlineDB.saveFactures(facturesResponse.data);
      }

      // Récupérer les produits
      const produitsResponse = await api.get('/api/produits');
      if (produitsResponse.success && produitsResponse.data) {
        await offlineDB.saveProduits(produitsResponse.data);
      }

      // Récupérer les transactions
      const transactionsResponse = await api.get('/api/mobile-money/transactions');
      if (transactionsResponse.success && transactionsResponse.data) {
        await offlineDB.saveTransactions(transactionsResponse.data);
      }
    } catch (error) {
      console.error('Erreur récupération données serveur:', error);
      throw error;
    }
  }

  /**
   * Ajouter une opération en attente
   */
  async addPendingOperation(operation: PendingOperation): Promise<void> {
    await offlineDB.addPendingOperation(operation);
    this.status.pendingCount++;
    this.notifyListeners();
  }

  /**
   * Obtenir le statut actuel
   */
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * S'abonner aux changements de statut
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Appeler immédiatement avec le statut actuel
    listener(this.getStatus());
    // Retourner une fonction de désabonnement
    return () => this.listeners.delete(listener);
  }

  /**
   * Notifier tous les abonnés
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }
}

export const syncService = new SyncService();
