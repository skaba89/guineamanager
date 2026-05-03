/**
 * GuinéaManager - Offline Status Indicator
 * Indicateur visuel du statut de connexion
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, CloudOff, Cloud, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOffline } from '@/hooks/use-offline';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  showPendingCount?: boolean;
  compact?: boolean;
  className?: string;
}

export function OfflineIndicator({ 
  showPendingCount = true, 
  compact = false,
  className 
}: OfflineIndicatorProps) {
  const { 
    isOnline, 
    isSyncing, 
    pendingCount, 
    lastSyncTime,
    syncErrors,
    syncPendingRequests 
  } = useOffline({ autoSync: true });

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-1', className)}>
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-orange-500" />
              )}
              {showPendingCount && pendingCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOnline ? 'En ligne' : 'Hors-ligne'}</p>
            {pendingCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {pendingCount} requête(s) en attente
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Indicateur de statut */}
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <div className="flex items-center gap-1.5">
              <Cloud className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600 font-medium">En ligne</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <CloudOff className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-orange-600 font-medium">Hors-ligne</span>
          </div>
        )}
      </div>

      {/* Compteur de requêtes en attente */}
      {showPendingCount && pendingCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <RefreshCw className={cn(
              'h-3 w-3',
              isSyncing && 'animate-spin'
            )} />
            {pendingCount} en attente
          </Badge>
          
          {isOnline && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => syncPendingRequests()}
              disabled={isSyncing}
              className="h-7 px-2"
            >
              {isSyncing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              <span className="ml-1 text-xs">Sync</span>
            </Button>
          )}
        </div>
      )}

      {/* Dernière synchronisation */}
      {lastSyncTime && !isSyncing && pendingCount === 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CheckCircle className="h-3 w-3 text-green-500" />
          Synchronisé
        </div>
      )}

      {/* Erreurs de sync */}
      {syncErrors.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive" className="text-xs">
                {syncErrors.length} erreur(s)
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <ul className="space-y-1">
                {syncErrors.slice(0, 5).map((error, i) => (
                  <li key={i} className="text-xs">{error}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

// Bannière d'avertissement offline
export function OfflineBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const { isOnline, pendingCount } = useOffline();
  const prevOnlineRef = useRef(isOnline);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Détecter le changement d'état
    if (prevOnlineRef.current !== isOnline) {
      if (!isOnline) {
        // On vient de passer hors-ligne
        setShowBanner(true);
      } else if (pendingCount === 0) {
        // On vient de passer en ligne et tout est synchronisé
        timeoutId = setTimeout(() => setShowBanner(false), 3000);
      }
      prevOnlineRef.current = isOnline;
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, pendingCount]);

  if (!showBanner) return null;

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm font-medium',
      isOnline 
        ? 'bg-green-500 text-white' 
        : 'bg-orange-500 text-white'
    )}>
      {isOnline ? (
        <div className="flex items-center justify-center gap-2">
          <Wifi className="h-4 w-4" />
          Connexion rétablie - Synchronisation en cours...
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          Vous êtes hors-ligne - Les données seront synchronisées automatiquement
        </div>
      )}
    </div>
  );
}

// Composant pour wrapper les actions nécessitant une connexion
interface RequireOnlineProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  message?: string;
}

export function RequireOnline({ 
  children, 
  fallback,
  message = 'Cette action nécessite une connexion internet' 
}: RequireOnlineProps) {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return fallback || (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <WifiOff className="h-4 w-4" />
        {message}
      </div>
    );
  }

  return <>{children}</>;
}

// Hook exporté pour l'usage direct
export { useOnlineStatus } from '@/hooks/use-offline';
