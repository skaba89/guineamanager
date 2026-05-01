// Service Worker - Unregister any existing service workers
// This file exists to clear old cached service workers

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Unregister this service worker
  self.registration.unregister();
});

// Immediately unregister
self.registration?.unregister();
