/**
 * GuinéaManager - Offline Data Manager Page
 * Page de gestion des données stockées hors-ligne
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  HardDrive, 
  RefreshCw, 
  Trash2, 
  Wifi, 
  WifiOff,
  Clock,
  Database,
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useOffline } from '@/hooks/use-offline';
import { offlineDB } from '@/lib/offline-db';
import { cn } from '@/lib/utils';

interface OfflineStats {
  offlineDataCount: number;
  pendingRequestsCount: number;
  draftsCount: number;
}

export function OfflineDataManager() {
  const [stats, setStats] = useState<OfflineStats>({
    offlineDataCount: 0,
    pendingRequestsCount: 0,
    draftsCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    isOnline, 
    isSyncing, 
    pendingCount, 
    syncPendingRequests, 
    clearOfflineData 
  } = useOffline();

  // Charger les statistiques
  const loadStats = async () => {
    setIsLoading(true);
    try {
      const dbStats = await offlineDB.getStats();
      setStats(dbStats);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const dbStats = await offlineDB.getStats();
        setStats(dbStats);
      } catch (error) {
        console.error('Erreur chargement stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Effacer toutes les données
  const handleClearAll = async () => {
    await clearOfflineData();
    await loadStats();
  };

  // Calculer l'utilisation estimée
  const totalItems = stats.offlineDataCount + stats.pendingRequestsCount + stats.draftsCount;
  const storagePercentage = Math.min(100, Math.round((totalItems / 1000) * 100)); // Estimation

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Données hors-ligne</h2>
          <p className="text-muted-foreground">
            Gérez les données stockées localement pour l'utilisation hors-ligne
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge variant="default" className="bg-green-500">
              <Wifi className="h-3 w-3 mr-1" />
              En ligne
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-orange-500 text-white">
              <WifiOff className="h-3 w-3 mr-1" />
              Hors-ligne
            </Badge>
          )}
        </div>
      </div>

      {/* Carte de statut */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            État du stockage
          </CardTitle>
          <CardDescription>
            {totalItems} éléments stockés localement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Utilisation estimée</span>
              <span>{storagePercentage}%</span>
            </div>
            <Progress value={storagePercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <Database className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{stats.offlineDataCount}</div>
              <div className="text-xs text-muted-foreground">Données cache</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <RefreshCw className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{stats.pendingRequestsCount}</div>
              <div className="text-xs text-muted-foreground">En attente</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <FileText className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{stats.draftsCount}</div>
              <div className="text-xs text-muted-foreground">Brouillons</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Synchronisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className={cn('h-5 w-5', isSyncing && 'animate-spin')} />
            Synchronisation
          </CardTitle>
          <CardDescription>
            Synchronisez les données en attente avec le serveur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingCount > 0 ? (
            <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-900">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">{pendingCount} requête(s) en attente</p>
                  <p className="text-sm text-muted-foreground">
                    Ces données seront synchronisées automatiquement
                  </p>
                </div>
              </div>
              <Button
                onClick={() => syncPendingRequests()}
                disabled={!isOnline || isSyncing}
                className="gap-2"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Sync...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Synchroniser
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Toutes les données sont synchronisées</p>
                <p className="text-sm text-muted-foreground">
                  Aucune action requise
                </p>
              </div>
            </div>
          )}

          {!isOnline && (
            <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-4 w-4" />
              Connectez-vous à internet pour synchroniser les données
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Gérez les données stockées localement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={loadStats}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              Actualiser
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Effacer tout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Effacer toutes les données ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action va supprimer toutes les données stockées localement,
                    y compris les brouillons et les requêtes en attente. Cette action
                    est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Tout effacer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Informations */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <strong>Données cache:</strong> Copies locales des données pour l'accès hors-ligne
            </p>
            <p className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <strong>En attente:</strong> Requêtes qui seront synchronisées quand vous serez en ligne
            </p>
            <p className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <strong>Brouillons:</strong> Formulaires sauvegardés localement non encore soumis
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default OfflineDataManager;
