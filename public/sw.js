/// <reference lib="webworker" />

const CACHE_NAME = 'guineamanager-v2';
const OFFLINE_URL = '/offline.html';

// Resources to cache immediately
const PRECACHE_RESOURCES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API routes to cache with network-first strategy
const API_CACHE_ROUTES = [
  '/api/clients',
  '/api/produits',
  '/api/factures',
  '/api/employes',
  '/api/mobile-money',
];

// Install event - cache core resources
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Precaching resources');
      return cache.addAll(PRECACHE_RESOURCES);
    })
  );
  // Force activation
  (self as any).skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[ServiceWorker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages
  (self as any).clients.claim();
});

// Fetch event - network-first with offline fallback
self.addEventListener('fetch', (event: any) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Handle API requests - network-first
  if (isApiRequest(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response: Response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets - cache-first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Update cache in background
        fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response);
            });
          }
        });
        return cachedResponse;
      }

      // Not in cache - fetch from network
      return fetch(request).then((response) => {
        // Cache static assets
        if (response.ok && isCacheableAsset(url.pathname)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Background sync for offline operations
self.addEventListener('sync', (event: any) => {
  console.log('[ServiceWorker] Sync event:', event.tag);

  if (event.tag === 'sync-sales') {
    event.waitUntil(syncPendingSales());
  }

  if (event.tag === 'sync-payments') {
    event.waitUntil(syncPendingPayments());
  }
});

// Push notification handler
self.addEventListener('push', (event: any) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' },
    ],
  };

  event.waitUntil(
    (self as any).registration.showNotification(data.title || 'GuinéaManager', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    (self as any).clients.matchAll({ type: 'window' }).then((clients: any[]) => {
      // Check if there's already a window open
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if ((self as any).clients.openWindow) {
        return (self as any).clients.openWindow(url);
      }
    })
  );
});

// Helper functions
function isApiRequest(pathname: string): boolean {
  return API_CACHE_ROUTES.some(route => pathname.startsWith(route));
}

function isCacheableAsset(pathname: string): boolean {
  const cacheableExtensions = ['.js', '.css', '.png', '.jpg', '.svg', '.woff', '.woff2'];
  return cacheableExtensions.some(ext => pathname.endsWith(ext));
}

async function syncPendingSales() {
  try {
    // Get pending sales from IndexedDB
    const pendingSales = await getPendingSales();
    
    for (const sale of pendingSales) {
      try {
        const response = await fetch('/api/ventes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sale),
        });

        if (response.ok) {
          await markSaleAsSynced(sale.id);
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync sale:', sale.id);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
  }
}

async function syncPendingPayments() {
  try {
    const pendingPayments = await getPendingPayments();
    
    for (const payment of pendingPayments) {
      try {
        const response = await fetch('/api/mobile-money', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'confirm_payment',
            ...payment
          }),
        });

        if (response.ok) {
          await markPaymentAsSynced(payment.id);
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync payment:', payment.id);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Payment sync failed:', error);
  }
}

// IndexedDB helpers (simplified)
async function getPendingSales() {
  // In production, use IndexedDB
  return [];
}

async function markSaleAsSynced(id: string) {
  // Update IndexedDB
}

async function getPendingPayments() {
  return [];
}

async function markPaymentAsSynced(id: string) {
  // Update IndexedDB
}

export {};
