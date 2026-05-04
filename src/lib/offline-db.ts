/**
 * GuinéaManager - IndexedDB Offline Storage Service
 * Gestion du stockage local pour le mode hors-ligne
 */

const DB_NAME = 'GuineaManagerOffline';
const DB_VERSION = 2;

// Types de données stockées
export type OfflineDataType = 
  | 'clients'
  | 'produits'
  | 'factures'
  | 'commandes'
  | 'depenses'
  | 'employes'
  | 'stock'
  | 'settings'
  | 'draft';

export interface OfflineDataItem {
  key: string;
  data: unknown;
  type: OfflineDataType;
  timestamp: number;
  synced: boolean;
  localId?: string;
}

export interface PendingRequest {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
  retryCount?: number;
}

class OfflineDBService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialiser la connexion IndexedDB
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[OfflineDB] Erreur ouverture:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[OfflineDB] Connexion établie');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store pour les données métier offline
        if (!db.objectStoreNames.contains('offlineData')) {
          const offlineStore = db.createObjectStore('offlineData', { 
            keyPath: 'key' 
          });
          offlineStore.createIndex('type', 'type', { unique: false });
          offlineStore.createIndex('timestamp', 'timestamp', { unique: false });
          offlineStore.createIndex('synced', 'synced', { unique: false });
        }

        // Store pour les requêtes en attente de synchronisation
        if (!db.objectStoreNames.contains('pendingRequests')) {
          const pendingStore = db.createObjectStore('pendingRequests', {
            keyPath: 'id',
            autoIncrement: true
          });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
          pendingStore.createIndex('url', 'url', { unique: false });
        }

        // Store pour les brouillons locaux
        if (!db.objectStoreNames.contains('drafts')) {
          const draftsStore = db.createObjectStore('drafts', {
            keyPath: 'localId'
          });
          draftsStore.createIndex('type', 'type', { unique: false });
          draftsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        console.log('[OfflineDB] Stores créés/mis à jour');
      };
    });

    return this.initPromise;
  }

  /**
   * Sauvegarder des données offline
   */
  async saveData<T>(
    key: string, 
    data: T, 
    type: OfflineDataType,
    synced: boolean = true
  ): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      
      const item: OfflineDataItem = {
        key,
        data,
        type,
        timestamp: Date.now(),
        synced
      };

      const request = store.put(item);
      
      request.onsuccess = () => {
        console.log(`[OfflineDB] Données sauvegardées: ${key}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error('[OfflineDB] Erreur sauvegarde:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Récupérer des données offline
   */
  async getData<T>(key: string): Promise<T | null> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as OfflineDataItem | undefined;
        resolve(result?.data as T ?? null);
      };

      request.onerror = () => {
        console.error('[OfflineDB] Erreur récupération:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Récupérer toutes les données d'un type
   */
  async getDataByType<T>(type: OfflineDataType): Promise<T[]> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      const index = store.index('type');
      const request = index.getAll(type);

      request.onsuccess = () => {
        const results = request.result as OfflineDataItem[];
        resolve(results.map(r => r.data as T));
      };

      request.onerror = () => {
        console.error('[OfflineDB] Erreur récupération par type:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Supprimer des données
   */
  async deleteData(key: string): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Ajouter une requête en attente de synchronisation
   */
  async addPendingRequest(
    url: string,
    method: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<number> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingRequests'], 'readwrite');
      const store = transaction.objectStore('pendingRequests');
      
      const request: PendingRequest = {
        url,
        method,
        headers: headers || { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        timestamp: Date.now(),
        retryCount: 0
      };

      const addRequest = store.add(request);
      
      addRequest.onsuccess = () => {
        console.log('[OfflineDB] Requête en attente ajoutée:', url);
        resolve(addRequest.result as number);
      };
      
      addRequest.onerror = () => {
        console.error('[OfflineDB] Erreur ajout requête:', addRequest.error);
        reject(addRequest.error);
      };
    });
  }

  /**
   * Récupérer toutes les requêtes en attente
   */
  async getPendingRequests(): Promise<PendingRequest[]> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingRequests'], 'readonly');
      const store = transaction.objectStore('pendingRequests');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Supprimer une requête synchronisée
   */
  async removePendingRequest(id: number): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingRequests'], 'readwrite');
      const store = transaction.objectStore('pendingRequests');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Compter les requêtes en attente
   */
  async getPendingCount(): Promise<number> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingRequests'], 'readonly');
      const store = transaction.objectStore('pendingRequests');
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sauvegarder un brouillon
   */
  async saveDraft<T>(type: OfflineDataType, data: T): Promise<string> {
    const db = await this.init();
    const localId = `draft_${type}_${Date.now()}`;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      
      const draft = {
        localId,
        type,
        data,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const request = store.add(draft);
      
      request.onsuccess = () => {
        console.log('[OfflineDB] Brouillon sauvegardé:', localId);
        resolve(localId);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Récupérer les brouillons par type
   */
  async getDraftsByType<T>(type: OfflineDataType): Promise<Array<{ localId: string; data: T; createdAt: number }>> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['drafts'], 'readonly');
      const store = transaction.objectStore('drafts');
      const index = store.index('type');
      const request = index.getAll(type);

      request.onsuccess = () => {
        const results = request.result;
        resolve(results.map(r => ({
          localId: r.localId,
          data: r.data as T,
          createdAt: r.createdAt
        })));
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Supprimer un brouillon
   */
  async deleteDraft(localId: string): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.delete(localId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Vider toutes les données offline
   */
  async clearAll(): Promise<void> {
    const db = await this.init();
    
    const storeNames = ['offlineData', 'pendingRequests', 'drafts'];
    
    await Promise.all(storeNames.map(name => {
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([name], 'readwrite');
        const store = transaction.objectStore(name);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }));

    console.log('[OfflineDB] Toutes les données effacées');
  }

  /**
   * Obtenir les statistiques du stockage
   */
  async getStats(): Promise<{
    offlineDataCount: number;
    pendingRequestsCount: number;
    draftsCount: number;
  }> {
    const db = await this.init();
    
    const getCount = (storeName: string): Promise<number> => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    };

    const [offlineDataCount, pendingRequestsCount, draftsCount] = await Promise.all([
      getCount('offlineData'),
      getCount('pendingRequests'),
      getCount('drafts')
    ]);

    return { offlineDataCount, pendingRequestsCount, draftsCount };
  }
}

// Singleton
export const offlineDB = new OfflineDBService();
