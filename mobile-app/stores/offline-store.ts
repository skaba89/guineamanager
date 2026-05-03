/**
 * GuinéaManager Mobile - Offline Store
 * Gestion de l'état offline avec Zustand
 */

import { create } from 'zustand';
import { Client, Facture, Produit, TransactionMobile } from '@/types';
import { offlineDB, PendingOperation, Draft } from '@/lib/offline-db';
import { syncService } from '@/lib/sync-service';

interface OfflineState {
  // Données locales
  clients: Client[];
  factures: Facture[];
  produits: Produit[];
  transactions: TransactionMobile[];
  
  // État de sync
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: number | null;
  pendingCount: number;
  syncError: string | null;
  
  // Brouillons
  drafts: Draft[];
  
  // Actions - Chargement
  loadClients: () => Promise<void>;
  loadFactures: () => Promise<void>;
  loadProduits: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  loadDrafts: () => Promise<void>;
  loadAll: () => Promise<void>;
  
  // Actions - Clients
  addClient: (client: Client) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  // Actions - Factures
  addFacture: (facture: Facture) => Promise<void>;
  updateFacture: (id: string, updates: Partial<Facture>) => Promise<void>;
  deleteFacture: (id: string) => Promise<void>;
  
  // Actions - Produits
  addProduit: (produit: Produit) => Promise<void>;
  updateProduit: (id: string, updates: Partial<Produit>) => Promise<void>;
  deleteProduit: (id: string) => Promise<void>;
  
  // Actions - Transactions
  addTransaction: (transaction: TransactionMobile) => Promise<void>;
  
  // Actions - Brouillons
  saveDraft: (draft: Draft) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  
  // Actions - Sync
  sync: () => Promise<void>;
  updateSyncStatus: (status: Partial<Pick<OfflineState, 'isOnline' | 'isSyncing' | 'lastSync' | 'pendingCount' | 'syncError'>>) => void;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  // État initial
  clients: [],
  factures: [],
  produits: [],
  transactions: [],
  isOnline: false,
  isSyncing: false,
  lastSync: null,
  pendingCount: 0,
  syncError: null,
  drafts: [],

  // === Chargement ===
  
  loadClients: async () => {
    const clients = await offlineDB.getClients();
    set({ clients });
  },

  loadFactures: async () => {
    const factures = await offlineDB.getFactures();
    set({ factures });
  },

  loadProduits: async () => {
    const produits = await offlineDB.getProduits();
    set({ produits });
  },

  loadTransactions: async () => {
    const transactions = await offlineDB.getTransactions();
    set({ transactions });
  },

  loadDrafts: async () => {
    const drafts = await offlineDB.getDrafts();
    set({ drafts });
  },

  loadAll: async () => {
    const [clients, factures, produits, transactions, drafts] = await Promise.all([
      offlineDB.getClients(),
      offlineDB.getFactures(),
      offlineDB.getProduits(),
      offlineDB.getTransactions(),
      offlineDB.getDrafts(),
    ]);
    set({ clients, factures, produits, transactions, drafts });
  },

  // === Clients ===

  addClient: async (client: Client) => {
    await offlineDB.addClient(client);
    set(state => ({ clients: [...state.clients, client] }));
    
    if (!get().isOnline) {
      await get().addPendingOperation('client', 'CREATE', client);
    }
  },

  updateClient: async (id: string, updates: Partial<Client>) => {
    await offlineDB.updateClient(id, updates);
    set(state => ({
      clients: state.clients.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
    
    if (!get().isOnline) {
      await get().addPendingOperation('client', 'UPDATE', { id, ...updates });
    }
  },

  deleteClient: async (id: string) => {
    await offlineDB.deleteClient(id);
    set(state => ({ clients: state.clients.filter(c => c.id !== id) }));
    
    if (!get().isOnline) {
      await get().addPendingOperation('client', 'DELETE', { id });
    }
  },

  // === Factures ===

  addFacture: async (facture: Facture) => {
    await offlineDB.addFacture(facture);
    set(state => ({ factures: [...state.factures, facture] }));
    
    if (!get().isOnline) {
      await get().addPendingOperation('facture', 'CREATE', facture);
    }
  },

  updateFacture: async (id: string, updates: Partial<Facture>) => {
    await offlineDB.updateFacture(id, updates);
    set(state => ({
      factures: state.factures.map(f => f.id === id ? { ...f, ...updates } : f),
    }));
    
    if (!get().isOnline) {
      await get().addPendingOperation('facture', 'UPDATE', { id, ...updates });
    }
  },

  deleteFacture: async (id: string) => {
    await offlineDB.deleteFacture(id);
    set(state => ({ factures: state.factures.filter(f => f.id !== id) }));
    
    if (!get().isOnline) {
      await get().addPendingOperation('facture', 'DELETE', { id });
    }
  },

  // === Produits ===

  addProduit: async (produit: Produit) => {
    await offlineDB.addProduit(produit);
    set(state => ({ produits: [...state.produits, produit] }));
    
    if (!get().isOnline) {
      await get().addPendingOperation('produit', 'CREATE', produit);
    }
  },

  updateProduit: async (id: string, updates: Partial<Produit>) => {
    await offlineDB.updateProduit(id, updates);
    set(state => ({
      produits: state.produits.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
    
    if (!get().isOnline) {
      await get().addPendingOperation('produit', 'UPDATE', { id, ...updates });
    }
  },

  deleteProduit: async (id: string) => {
    await offlineDB.deleteProduit(id);
    set(state => ({ produits: state.produits.filter(p => p.id !== id) }));
    
    if (!get().isOnline) {
      await get().addPendingOperation('produit', 'DELETE', { id });
    }
  },

  // === Transactions ===

  addTransaction: async (transaction: TransactionMobile) => {
    await offlineDB.addTransaction(transaction);
    set(state => ({ transactions: [transaction, ...state.transactions] }));
  },

  // === Brouillons ===

  saveDraft: async (draft: Draft) => {
    await offlineDB.saveDraft(draft);
    set(state => {
      const index = state.drafts.findIndex(d => d.id === draft.id);
      if (index !== -1) {
        const drafts = [...state.drafts];
        drafts[index] = { ...draft, updatedAt: Date.now() };
        return { drafts };
      }
      return { drafts: [...state.drafts, draft] };
    });
  },

  deleteDraft: async (id: string) => {
    await offlineDB.deleteDraft(id);
    set(state => ({ drafts: state.drafts.filter(d => d.id !== id) }));
  },

  // === Sync ===

  sync: async () => {
    await syncService.sync();
  },

  updateSyncStatus: (status) => {
    set(state => ({ ...state, ...status }));
  },

  // Helper privé pour ajouter une opération en attente
  addPendingOperation: async (entity: PendingOperation['entity'], type: PendingOperation['type'], data: unknown) => {
    const operation: PendingOperation = {
      id: `${entity}_${type}_${Date.now()}`,
      type,
      entity,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };
    await syncService.addPendingOperation(operation);
    set(state => ({ pendingCount: state.pendingCount + 1 }));
  },
}));
