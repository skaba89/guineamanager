/**
 * GuinéaManager - Service Worker Registration
 * Enregistrement et gestion du Service Worker
 */

'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          
          console.log('[SW] Service Worker enregistré:', registration.scope);
          
          // Vérifier les mises à jour
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nouvelle version disponible
                  console.log('[SW] Nouvelle version disponible');
                  
                  // Optionnel: notifier l'utilisateur
                  if (confirm('Une nouvelle version est disponible. Voulez-vous l\'installer ?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
          
        } catch (error) {
          console.error('[SW] Erreur enregistrement:', error);
        }
      });
      
      // Écouter les messages du Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[SW] Message du Service Worker:', event.data);
        
        if (event.data?.type === 'SYNC_COMPLETE') {
          // Notifier l'utilisateur de la synchronisation
          window.dispatchEvent(new CustomEvent('offline-sync-complete', {
            detail: event.data
          }));
        }
      });
    }
  }, []);
  
  return null;
}
