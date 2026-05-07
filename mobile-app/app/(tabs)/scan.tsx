/**
 * GuinéaManager Mobile - Scan QR Screen
 * Scanner de QR codes pour paiements Mobile Money
 */

import { View, Text, TouchableOpacity, Vibration, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { QrCode, Flashlight, FlashlightOff, Image, X, CheckCircle, AlertCircle, WifiOff } from 'lucide-react-native';
import { PaymentModal } from '@/components/PaymentModal';
import { QRCodeData } from '@/types';
import { useOfflineStore } from '@/stores/offline-store';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanResult, setScanResult] = useState<QRCodeData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { isOnline } = useOfflineStore();

  const parseQRData = (data: string): QRCodeData | null => {
    try {
      // Essayer JSON
      const parsed = JSON.parse(data);
      if (parsed.type && parsed.merchantId && parsed.reference) {
        return parsed as QRCodeData;
      }
    } catch {
      // Pas du JSON
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
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };
    }

    // Format Orange Money: OM|{merchantId}|{amount}|{reference}
    const omMatch = data.match(/OM\|([^|]+)\|(\d+)\|([^|]+)/);
    if (omMatch) {
      return {
        type: 'PAYMENT',
        merchantId: omMatch[1],
        amount: parseInt(omMatch[2], 10),
        reference: omMatch[3],
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };
    }

    return null;
  };

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    
    const qrData = parseQRData(result.data);
    
    if (qrData) {
      // Vérifier l'expiration
      if (new Date(qrData.expiresAt) < new Date()) {
        Alert.alert('QR Code expiré', 'Ce QR code a expiré. Demandez un nouveau code.');
        return;
      }

      setScanned(true);
      Vibration.vibrate(100);
      setScanResult(qrData);
    } else {
      // QR code non reconnu
      setScanned(true);
      Vibration.vibrate([100, 50, 100]);
      Alert.alert(
        'QR Code non reconnu',
        'Ce QR code n\'est pas un code de paiement GuinéaManager valide.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    }
  };

  const handleConfirmPayment = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (transactionId: string) => {
    setShowPaymentModal(false);
    setScanned(false);
    setScanResult(null);
    
    Alert.alert(
      'Paiement réussi!',
      `La transaction a été effectuée avec succès.\nRéf: ${transactionId}`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const resetScan = () => {
    setScanned(false);
    setScanResult(null);
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Demande d'autorisation caméra...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <QrCode size={64} color="white" style={{ marginBottom: 20 }} />
        <Text style={styles.permissionTitle}>Accès à la caméra requis</Text>
        <Text style={styles.permissionDescription}>
          GuinéaManager a besoin d'accéder à votre caméra pour scanner les QR codes de paiement Mobile Money.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        enableTorch={torchEnabled}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Offline indicator */}
          {!isOnline && (
            <View style={styles.offlineBanner}>
              <WifiOff size={16} color="#92400e" />
              <Text style={styles.offlineText}>Mode hors-ligne</Text>
            </View>
          )}

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <X size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scanner QR Code</Text>
            <TouchableOpacity onPress={() => setTorchEnabled(!torchEnabled)} style={styles.headerButton}>
              {torchEnabled ? (
                <FlashlightOff size={24} color="#fbbf24" />
              ) : (
                <Flashlight size={24} color="white" />
              )}
            </TouchableOpacity>
          </View>

          {/* Scan Frame */}
          <View style={styles.scanContainer}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.scanInstruction}>
              Placez le QR code de paiement dans le cadre
            </Text>
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.galleryButton}>
              <Image size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.galleryButtonText}>Importer depuis la galerie</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>

      {/* Scan Result Modal */}
      {scanResult && !showPaymentModal && (
        <View style={styles.resultModal}>
          <View style={styles.resultContent}>
            {/* Success icon */}
            <View style={styles.resultIconContainer}>
              <CheckCircle size={32} color="#059669" />
            </View>
            <Text style={styles.resultTitle}>QR Code détecté!</Text>

            {/* Payment details */}
            <View style={styles.resultDetails}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Type</Text>
                <Text style={styles.resultValue}>
                  {scanResult.type === 'PAYMENT' ? 'Paiement' :
                   scanResult.type === 'INVOICE' ? 'Facture' : 'Client'}
                </Text>
              </View>
              
              {scanResult.amount && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Montant</Text>
                  <Text style={styles.resultAmount}>
                    {scanResult.amount.toLocaleString('fr-GN')} GNF
                  </Text>
                </View>
              )}

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Référence</Text>
                <Text style={styles.resultValue}>{scanResult.reference}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.resultActions}>
              <TouchableOpacity onPress={resetScan} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmPayment} style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>Procéder au paiement</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          resetScan();
        }}
        onSuccess={handlePaymentSuccess}
        initialAmount={scanResult?.amount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    marginTop: 40,
    marginHorizontal: 20,
    borderRadius: 8,
  },
  offlineText: {
    color: '#92400e',
    marginLeft: 8,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  scanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
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
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  scanInstruction: {
    color: 'white',
    marginTop: 24,
    fontSize: 16,
    textAlign: 'center',
  },
  bottomActions: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  galleryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  // Permission styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 20,
  },
  permissionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionDescription: {
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  permissionText: {
    color: 'white',
  },
  // Result modal styles
  resultModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  resultContent: {
    padding: 24,
    alignItems: 'center',
  },
  resultIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  resultDetails: {
    width: '100%',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  resultLabel: {
    color: '#6b7280',
  },
  resultValue: {
    fontWeight: '500',
    color: '#1f2937',
  },
  resultAmount: {
    fontWeight: 'bold',
    color: '#059669',
    fontSize: 16,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '500',
    color: '#1f2937',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontWeight: '500',
    color: 'white',
  },
});
