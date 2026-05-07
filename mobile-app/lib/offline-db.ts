/**
 * GuinéaManager Mobile - Offline Database
 * Base de données locale pour le mode hors-ligne
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, Facture, Produit, TransactionMobile } from '@/types';

// Clés de stockage
const STORAGE_KEYS = {
  CLIENTS: '@clients',
  FACTURES: '@factures',
  PRODUITS: '@produits',
  TRANSACTIONS: '@transactions',
  PENDING_SYNC: '@pending_sync',
  LAST_SYNC: '@last_sync',
  DRAFTS: '@drafts',
};

// Types pour les opérations en attente
export interface PendingOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'client' | 'facture' | 'produit' | 'transaction';
  data: unknown;
  timestamp: number;
  retryCount: number;
}

// Types pour les brouillons
export interface Draft {
  id: string;
  type: 'facture' | 'client' | 'transaction';
  data: unknown;
  createdAt: number;
  updatedAt: number;
}

/**
 * Service de base de données offline
 * Utilise AsyncStorage pour la persistance locale
 */
class OfflineDatabase {
  // === CLIENTS ===
  
  async getClients(): Promise<Client[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CLIENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur récupération clients:', error);
      return [];
    }
  }

  async saveClients(clients: Client[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }

  async addClient(client: Client): Promise<void> {
    const clients = await this.getClients();
    clients.push(client);
    await this.saveClients(clients);
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<void> {
    const clients = await this.getClients();
    const index = clients.findIndex(c => c.id === id);
    if (index !== -1) {
      clients[index] = { ...clients[index], ...updates };
      await this.saveClients(clients);
    }
  }

  async deleteClient(id: string): Promise<void> {
    const clients = await this.getClients();
    const filtered = clients.filter(c => c.id !== id);
    await this.saveClients(filtered);
  }

  // === FACTURES ===

  async getFactures(): Promise<Facture[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FACTURES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur récupération factures:', error);
      return [];
    }
  }

  async saveFactures(factures: Facture[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.FACTURES, JSON.stringify(factures));
  }

  async addFacture(facture: Facture): Promise<void> {
    const factures = await this.getFactures();
    factures.push(facture);
    await this.saveFactures(factures);
  }

  async updateFacture(id: string, updates: Partial<Facture>): Promise<void> {
    const factures = await this.getFactures();
    const index = factures.findIndex(f => f.id === id);
    if (index !== -1) {
      factures[index] = { ...factures[index], ...updates };
      await this.saveFactures(factures);
    }
  }

  async deleteFacture(id: string): Promise<void> {
    const factures = await this.getFactures();
    const filtered = factures.filter(f => f.id !== id);
    await this.saveFactures(filtered);
  }

  // === PRODUITS ===

  async getProduits(): Promise<Produit[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PRODUITS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur récupération produits:', error);
      return [];
    }
  }

  async saveProduits(produits: Produit[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUITS, JSON.stringify(produits));
  }

  async addProduit(produit: Produit): Promise<void> {
    const produits = await this.getProduits();
    produits.push(produit);
    await this.saveProduits(produits);
  }

  async updateProduit(id: string, updates: Partial<Produit>): Promise<void> {
    const produits = await this.getProduits();
    const index = produits.findIndex(p => p.id === id);
    if (index !== -1) {
      produits[index] = { ...produits[index], ...updates };
      await this.saveProduits(produits);
    }
  }

  async deleteProduit(id: string): Promise<void> {
    const produits = await this.getProduits();
    const filtered = produits.filter(p => p.id !== id);
    await this.saveProduits(filtered);
  }

  // === TRANSACTIONS ===

  async getTransactions(): Promise<TransactionMobile[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur récupération transactions:', error);
      return [];
    }
  }

  async saveTransactions(transactions: TransactionMobile[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  async addTransaction(transaction: TransactionMobile): Promise<void> {
    const transactions = await this.getTransactions();
    transactions.unshift(transaction); // Ajouter au début
    await this.saveTransactions(transactions);
  }

  // === OPERATIONS EN ATTENTE ===

  async getPendingOperations(): Promise<PendingOperation[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur récupération opérations en attente:', error);
      return [];
    }
  }

  async addPendingOperation(operation: PendingOperation): Promise<void> {
    const operations = await this.getPendingOperations();
    operations.push(operation);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(operations));
  }

  async removePendingOperation(id: string): Promise<void> {
    const operations = await this.getPendingOperations();
    const filtered = operations.filter(op => op.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(filtered));
  }

  async incrementRetryCount(id: string): Promise<void> {
    const operations = await this.getPendingOperations();
    const index = operations.findIndex(op => op.id === id);
    if (index !== -1) {
      operations[index].retryCount++;
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(operations));
    }
  }

  // === BROUILLONS ===

  async getDrafts(): Promise<Draft[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DRAFTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur récupération brouillons:', error);
      return [];
    }
  }

  async saveDraft(draft: Draft): Promise<void> {
    const drafts = await this.getDrafts();
    const index = drafts.findIndex(d => d.id === draft.id);
    if (index !== -1) {
      drafts[index] = { ...draft, updatedAt: Date.now() };
    } else {
      drafts.push(draft);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
  }

  async deleteDraft(id: string): Promise<void> {
    const drafts = await this.getDrafts();
    const filtered = drafts.filter(d => d.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(filtered));
  }

  // === SYNC ===

  async getLastSync(): Promise<number | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return data ? parseInt(data, 10) : null;
    } catch {
      return null;
    }
  }

  async setLastSync(timestamp: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
  }

  // === UTILITAIRES ===

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  }

  async getStorageInfo(): Promise<{ key: string; size: number }[]> {
    const info: { key: string; size: number }[] = [];
    for (const key of Object.values(STORAGE_KEYS)) {
      const data = await AsyncStorage.getItem(key);
      info.push({
        key,
        size: data ? new Blob([data]).size : 0,
      });
    }
    return info;
  }
}

export const offlineDB = new OfflineDatabase();
