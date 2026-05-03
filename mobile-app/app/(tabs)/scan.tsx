/**
 * GuinéaManager Mobile - Scan QR Screen
 */

import { View, Text, TouchableOpacity, Alert, Vibration } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { QrCode, Flashlight, Image, X, CheckCircle, AlertCircle } from 'lucide-react-native';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    data?: string;
    type?: string;
    amount?: number;
  } | null>(null);

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    
    setScanned(true);
    Vibration.vibrate(100);

    try {
      // Parser les données du QR code
      const qrData = JSON.parse(result.data);
      
      if (qrData.type === 'ORANGE_MONEY_PAYMENT') {
        setScanResult({
          success: true,
          data: result.data,
          type: 'ORANGE_MONEY',
          amount: qrData.amount,
        });
      } else if (qrData.type === 'INVOICE') {
        setScanResult({
          success: true,
          data: result.data,
          type: 'INVOICE',
          amount: qrData.amount,
        });
      } else {
        setScanResult({
          success: false,
          data: result.data,
        });
      }
    } catch {
      // QR code non JSON, peut-être un lien simple
      setScanResult({
        success: true,
        data: result.data,
        type: 'LINK',
      });
    }
  };

  const handleConfirmPayment = () => {
    if (scanResult?.type === 'ORANGE_MONEY' || scanResult?.type === 'INVOICE') {
      Alert.alert(
        'Paiement confirmé',
        `Paiement de ${scanResult.amount?.toLocaleString('fr-GN')} GNF effectué avec succès`,
        [{ text: 'OK', onPress: () => resetScan() }]
      );
    } else {
      resetScan();
    }
  };

  const resetScan = () => {
    setScanned(false);
    setScanResult(null);
  };

  if (!permission) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1f2937' }}>
        <Text style={{ color: 'white' }}>Demande d'autorisation caméra...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1f2937', padding: 20 }}>
        <QrCode size={64} color="white" style={{ marginBottom: 20 }} />
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 12 }}>
          Accès à la caméra requis
        </Text>
        <Text style={{ color: '#9ca3af', textAlign: 'center', marginBottom: 24 }}>
          GuinéaManager a besoin d'accéder à votre caméra pour scanner les QR codes de paiement.
        </Text>
        <TouchableOpacity 
          onPress={requestPermission}
          style={{ 
            backgroundColor: '#059669', 
            paddingHorizontal: 24, 
            paddingVertical: 12, 
            borderRadius: 12 
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1f2937' }}>
      {/* Camera View */}
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        enableTorch={torchEnabled}
      >
        {/* Overlay */}
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          {/* Header */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 60,
            paddingBottom: 20,
          }}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <X size={24} color="white" />
            </TouchableOpacity>
            
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
              Scanner QR Code
            </Text>

            <TouchableOpacity 
              onPress={() => setTorchEnabled(!torchEnabled)}
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                backgroundColor: torchEnabled ? '#fbbf24' : 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Flashlight size={24} color={torchEnabled ? '#1f2937' : 'white'} />
            </TouchableOpacity>
          </View>

          {/* Scan Frame */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ 
              width: 250, 
              height: 250, 
              borderWidth: 2, 
              borderColor: 'white',
              borderRadius: 16,
              backgroundColor: 'transparent',
              position: 'relative',
            }}>
              {/* Corner decorations */}
              <View style={{ position: 'absolute', top: -2, left: -2, width: 30, height: 30, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#059669', borderTopLeftRadius: 16 }} />
              <View style={{ position: 'absolute', top: -2, right: -2, width: 30, height: 30, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#059669', borderTopRightRadius: 16 }} />
              <View style={{ position: 'absolute', bottom: -2, left: -2, width: 30, height: 30, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#059669', borderBottomLeftRadius: 16 }} />
              <View style={{ position: 'absolute', bottom: -2, right: -2, width: 30, height: 30, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#059669', borderBottomRightRadius: 16 }} />
            </View>
            
            <Text style={{ color: 'white', marginTop: 24, fontSize: 16, textAlign: 'center' }}>
              Placez le QR code dans le cadre
            </Text>
          </View>

          {/* Bottom Actions */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'center', 
            paddingHorizontal: 20,
            paddingBottom: 40,
            gap: 20,
          }}>
            <TouchableOpacity 
              style={{ 
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Image size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: '500' }}>Galerie</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>

      {/* Scan Result Modal */}
      {scanResult && (
        <View style={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        }}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            {scanResult.success ? (
              <>
                <View style={{ 
                  width: 64, 
                  height: 64, 
                  borderRadius: 32, 
                  backgroundColor: '#ecfdf5',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <CheckCircle size={32} color="#059669" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
                  QR Code détecté !
                </Text>
              </>
            ) : (
              <>
                <View style={{ 
                  width: 64, 
                  height: 64, 
                  borderRadius: 32, 
                  backgroundColor: '#fef2f2',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <AlertCircle size={32} color="#dc2626" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
                  QR Code non reconnu
                </Text>
              </>
            )}
          </View>

          {scanResult.type && (
            <View style={{ 
              backgroundColor: '#f3f4f6', 
              borderRadius: 12, 
              padding: 16, 
              marginBottom: 16 
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#6b7280' }}>Type</Text>
                <Text style={{ fontWeight: '500', color: '#1f2937' }}>
                  {scanResult.type === 'ORANGE_MONEY' ? 'Orange Money' :
                   scanResult.type === 'INVOICE' ? 'Facture' : 'Lien'}
                </Text>
              </View>
              {scanResult.amount && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#6b7280' }}>Montant</Text>
                  <Text style={{ fontWeight: 'bold', color: '#059669' }}>
                    {scanResult.amount.toLocaleString('fr-GN')} GNF
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              onPress={resetScan}
              style={{ 
                flex: 1,
                backgroundColor: '#f3f4f6', 
                paddingVertical: 14, 
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontWeight: '500', color: '#1f2937' }}>Annuler</Text>
            </TouchableOpacity>
            
            {scanResult.success && (
              <TouchableOpacity 
                onPress={handleConfirmPayment}
                style={{ 
                  flex: 1,
                  backgroundColor: '#059669', 
                  paddingVertical: 14, 
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontWeight: '500', color: 'white' }}>Confirmer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
