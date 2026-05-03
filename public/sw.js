// GuinéaManager Service Worker - Offline First Strategy
// Version: 2.0.0

const CACHE_NAME = 'guineamanager-v2';
const STATIC_CACHE = 'guineamanager-static-v2';
const DYNAMIC_CACHE = 'guineamanager-dynamic-v2';
const API_CACHE = 'guineamanager-api-v2';

// Fichiers à mettre en cache immédiatement
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// APIs à mettre en cache avec stratégie Network First
const API_ROUTES = [
  '/api/auth/me',
  '/api/clients',
  '/api/produits',
  '/api/factures',
  '/api/commandes',
  '/api/stock',
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache statique
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting pour activation immédiate
      self.skipWaiting()
    ])
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Nettoyer les anciens caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== STATIC_CACHE && 
                     name !== DYNAMIC_CACHE && 
                     name !== API_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Prendre le contrôle immédiatement
      self.clients.claim()
    ])
  );
});

// Stratégie de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    // Pour les requêtes POST/PUT/DELETE, on utilise le Background Sync
    if (!navigator.onLine) {
      event.respondWith(
        storeRequestForSync(request).then(() => {
          return new Response(
            JSON.stringify({ 
              success: false, 
              offline: true, 
              message: 'Requête enregistrée pour synchronisation ultérieure' 
            }),
            { 
              status: 202,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
      );
      return;
    }
    return;
  }

  // Stratégie selon le type de ressource
  if (isApiRequest(url)) {
    // API: Network First avec fallback cache
    event.respondWith(networkFirst(request));
  } else if (isStaticAsset(url)) {
    // Assets statiques: Cache First
    event.respondWith(cacheFirst(request));
  } else {
    // Autres: Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Vérifier si c'est une requête API
function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

// Vérifier si c'est un asset statique
function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/);
}

// Stratégie Cache First
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Stratégie Network First
async function networkFirst(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Fallback au cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Retourner une réponse offline standardisée
    return new Response(
      JSON.stringify({ 
        error: 'offline', 
        message: 'Données non disponibles hors-ligne' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Stratégie Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Stocker les requêtes pour synchronisation ultérieure
async function storeRequestForSync(request) {
  const db = await openIndexedDB();
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.clone().text(),
    timestamp: Date.now()
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingRequests'], 'readwrite');
    const store = transaction.objectStore('pendingRequests');
    const request = store.add(requestData);
    
    request.onsuccess = () => {
      console.log('[SW] Request stored for sync:', requestData.url);
      resolve();
    };
    
    request.onerror = () => {
      console.error('[SW] Failed to store request');
      reject();
    };
  });
}

// Ouvrir IndexedDB
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GuineaManagerOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store pour les requêtes en attente
      if (!db.objectStoreNames.contains('pendingRequests')) {
        db.createObjectStore('pendingRequests', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
      }
      
      // Store pour les données offline
      if (!db.objectStoreNames.contains('offlineData')) {
        const offlineStore = db.createObjectStore('offlineData', { 
          keyPath: 'key' 
        });
        offlineStore.createIndex('type', 'type', { unique: false });
        offlineStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

// Synchroniser les requêtes en attente
async function syncPendingRequests() {
  const db = await openIndexedDB();
  const transaction = db.transaction(['pendingRequests'], 'readwrite');
  const store = transaction.objectStore('pendingRequests');
  
  const requests = await getAllFromStore(store);
  
  for (const requestData of requests) {
    try {
      const response = await fetch(requestData.url, {
        method: requestData.method,
        headers: requestData.headers,
        body: requestData.body
      });
      
      if (response.ok) {
        // Supprimer la requête synchronisée
        store.delete(requestData.id);
        console.log('[SW] Synced request:', requestData.url);
        
        // Notifier le client
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_COMPLETE',
              data: requestData
            });
          });
        });
      }
    } catch (error) {
      console.error('[SW] Failed to sync request:', requestData.url);
    }
  }
}

// Récupérer tous les éléments d'un store
function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let notificationData = {
    title: 'GuinéaManager',
    body: 'Nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png'
  };
  
  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: [100, 50, 100],
      data: notificationData.data || {},
      actions: notificationData.actions || []
    })
  );
});

// Gestion des clics sur notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si une fenêtre est déjà ouverte, la focaliser
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => client.navigate(urlToOpen));
          }
        }
        // Sinon, ouvrir une nouvelle fenêtre
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handler pour communication avec l'app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_DATA') {
    cacheOfflineData(event.data.key, event.data.data, event.data.type_data);
  }
  
  if (event.data.type === 'GET_OFFLINE_DATA') {
    getOfflineData(event.data.key).then((data) => {
      event.ports[0].postMessage({ data });
    });
  }
  
  if (event.data.type === 'GET_PENDING_COUNT') {
    getPendingRequestsCount().then((count) => {
      event.ports[0].postMessage({ count });
    });
  }
});

// Cache des données offline
async function cacheOfflineData(key, data, type = 'general') {
  const db = await openIndexedDB();
  const transaction = db.transaction(['offlineData'], 'readwrite');
  const store = transaction.objectStore('offlineData');
  
  return store.put({
    key,
    data,
    type,
    timestamp: Date.now()
  });
}

// Récupérer les données offline
async function getOfflineData(key) {
  const db = await openIndexedDB();
  const transaction = db.transaction(['offlineData'], 'readonly');
  const store = transaction.objectStore('offlineData');
  
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.data);
    request.onerror = () => reject(request.error);
  });
}

// Compter les requêtes en attente
async function getPendingRequestsCount() {
  const db = await openIndexedDB();
  const transaction = db.transaction(['pendingRequests'], 'readonly');
  const store = transaction.objectStore('pendingRequests');
  
  return new Promise((resolve, reject) => {
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

console.log('[SW] Service Worker loaded - GuinéaManager v2.0');
