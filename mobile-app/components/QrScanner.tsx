/**
 * GuinéaManager Mobile - QR Code Scanner Component
 * Scanner de QR codes pour les paiements Mobile Money
 */

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { X, Flashlight, FlashlightOff, CheckCircle, AlertCircle } from 'lucide-react-native';
import { QRCodeData } from '@/types';

interface QrScannerProps {
  onScan: (data: QRCodeData) => void;
  onClose: () => void;
  type?: 'PAYMENT' | 'INVOICE' | 'CLIENT';
}

export function QrScanner({ onScan, onClose, type = 'PAYMENT' }: QrScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Demander la permission au montage
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    try {
      // Parser les données du QR code
      const qrData = parseQRData(data);
      
      // Vérifier le type si spécifié
      if (type && qrData.type !== type) {
        setError(`Ce QR code n'est pas valide pour cette action. Type attendu: ${type}`);
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Vérifier l'expiration
      if (new Date(qrData.expiresAt) < new Date()) {
        setError('Ce QR code a expiré');
        setTimeout(() => setError(null), 3000);
        return;
      }

      setScanned(true);
      Vibration.vibrate(100);
      onScan(qrData);
    } catch (err) {
      setError('QR code invalide');
      setTimeout(() => setError(null), 3000);
    }
  };

  const parseQRData = (data: string): QRCodeData => {
    // Essayer de parser en JSON
    try {
      const parsed = JSON.parse(data);
      if (parsed.type && parsed.merchantId && parsed.reference) {
        return parsed as QRCodeData;
      }
    } catch {
      // Pas du JSON, essayer d'autres formats
    }

    // Format URL: guineamanager://pay/{merchantId}/{amount}/{reference}
    const urlMatch = data.match(/guineamanager:\/\/(pay|invoice|client)\/([^/]+)(?:\/(\d+))?(?:\/([^/]+))?/);
    if (urlMatch) {
      const [, typeStr, merchantId, amount, reference] = urlMatch;
      return {
        type: typeStr.toUpperCase() as 'PAYMENT' | 'INVOICE' | 'CLIENT',
        merchantId,
        amount: amount ? parseInt(amount, 10) : undefined,
        reference: reference || `${Date.now()}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min
      };
    }

    // Format simple: montant|reference|merchantId
    const simpleMatch = data.split('|');
    if (simpleMatch.length >= 2) {
      return {
        type: 'PAYMENT',
        merchantId: simpleMatch[2] || 'unknown',
        amount: parseFloat(simpleMatch[0]) || undefined,
        reference: simpleMatch[1],
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };
    }

    throw new Error('Format non reconnu');
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Demande de permission caméra...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionCard}>
          <AlertCircle size={48} color="#dc2626" />
          <Text style={styles.permissionTitle}>Accès caméra requis</Text>
          <Text style={styles.permissionText}>
            Pour scanner les QR codes de paiement, GuinéaManager a besoin d'accéder à votre caméra.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        flashMode={flashOn ? 'on' : 'off'}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.iconButton} onPress={onClose}>
              <X size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>
              {type === 'PAYMENT' && 'Scanner pour paiement'}
              {type === 'INVOICE' && 'Scanner la facture'}
              {type === 'CLIENT' && 'Scanner le client'}
            </Text>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => setFlashOn(!flashOn)}
            >
              {flashOn ? (
                <FlashlightOff size={24} color="white" />
              ) : (
                <Flashlight size={24} color="white" />
              )}
            </TouchableOpacity>
          </View>

          {/* Scan area */}
          <View style={styles.scanAreaContainer}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              {!scanned && <View style={styles.scanLine} />}
            </View>
            <Text style={styles.instruction}>
              Placez le QR code dans le cadre
            </Text>
          </View>

          {/* Error message */}
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Success indicator */}
          {scanned && (
            <View style={styles.successContainer}>
              <CheckCircle size={48} color="#059669" />
              <Text style={styles.successText}>QR code scanné!</Text>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanAreaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#059669',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    top: '50%',
  },
  instruction: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -40 }],
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  successText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  permissionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    margin: 20,
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 10,
  },
  closeButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
