/**
 * GuinéaManager Mobile - Offline Indicator Component
 * Indicateur d'état de connexion et synchronisation
 */

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Cloud, CloudOff } from 'lucide-react-native';
import { syncService } from '@/lib/sync-service';

interface OfflineIndicatorProps {
  compact?: boolean;
  showSyncButton?: boolean;
}

export function OfflineIndicator({ compact = false, showSyncButton = true }: OfflineIndicatorProps) {
  const [status, setStatus] = useState(syncService.getStatus());
  const [spinAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = syncService.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  // Animation de rotation pour le sync
  useEffect(() => {
    if (status.isSyncing) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [status.isSyncing, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleSync = async () => {
    if (!status.isSyncing && status.isOnline) {
      await syncService.sync();
    }
  };

  const formatLastSync = (timestamp: number | null): string => {
    if (!timestamp) return 'Jamais';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `Il y a ${hours}h`;
    if (minutes > 0) return `Il y a ${minutes}min`;
    return 'À l\'instant';
  };

  // Version compacte (pour le header)
  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactContainer}
        onPress={handleSync}
        disabled={!status.isOnline || status.isSyncing}
      >
        {status.isSyncing ? (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <RefreshCw size={16} color="#059669" />
          </Animated.View>
        ) : status.isOnline ? (
          <Cloud size={16} color="#059669" />
        ) : (
          <CloudOff size={16} color="#dc2626" />
        )}
        {status.pendingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{status.pendingCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Version complète
  return (
    <View style={[
      styles.container,
      status.isOnline ? styles.containerOnline : styles.containerOffline
    ]}>
      <View style={styles.content}>
        {/* Status icon */}
        <View style={styles.iconContainer}>
          {status.isSyncing ? (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <RefreshCw size={20} color="#059669" />
            </Animated.View>
          ) : status.isOnline ? (
            <CheckCircle size={20} color="#059669" />
          ) : (
            <AlertCircle size={20} color="#d97706" />
          )}
        </View>

        {/* Status text */}
        <View style={styles.textContainer}>
          <Text style={styles.statusText}>
            {status.isSyncing 
              ? 'Synchronisation...' 
              : status.isOnline 
                ? 'En ligne' 
                : 'Mode hors-ligne'}
          </Text>
          {!status.isSyncing && (
            <Text style={styles.subText}>
              {status.isOnline 
                ? `Dernière sync: ${formatLastSync(status.lastSync)}`
                : 'Les données seront synchronisées automatiquement'}
            </Text>
          )}
        </View>

        {/* Pending count or sync button */}
        {status.pendingCount > 0 && (
          <View style={styles.pendingContainer}>
            <Text style={styles.pendingText}>
              {status.pendingCount} en attente
            </Text>
          </View>
        )}

        {showSyncButton && status.isOnline && !status.isSyncing && (
          <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
            <RefreshCw size={18} color="#059669" />
          </TouchableOpacity>
        )}
      </View>

      {/* Error message */}
      {status.error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={14} color="#dc2626" />
          <Text style={styles.errorText}>{status.error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  containerOnline: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  containerOffline: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  subText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  pendingContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400e',
  },
  syncButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#fecaca',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginLeft: 6,
    flex: 1,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f97316',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
