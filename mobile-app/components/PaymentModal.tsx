/**
 * GuinéaManager Mobile - Payment Modal Component
 * Interface de paiement Mobile Money
 */

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { X, CheckCircle, AlertCircle, Phone, DollarSign } from 'lucide-react-native';
import { mobileMoneyService } from '@/lib/api';
import { useOfflineStore } from '@/stores/offline-store';

type Operateur = 'ORANGE' | 'MTN' | 'WAVE';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (transactionId: string) => void;
  initialAmount?: number;
  clientPhone?: string;
}

export function PaymentModal({ 
  visible, 
  onClose, 
  onSuccess,
  initialAmount,
  clientPhone 
}: PaymentModalProps) {
  const [step, setStep] = useState<'amount' | 'confirm' | 'processing' | 'success' | 'error'>('amount');
  const [amount, setAmount] = useState(initialAmount?.toString() || '');
  const [phone, setPhone] = useState(clientPhone || '');
  const [operateur, setOperateur] = useState<Operateur>('ORANGE');
  const [motif, setMotif] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { isOnline, addTransaction } = useOfflineStore();

  const operateurs: { id: Operateur; name: string; color: string; bgColor: string }[] = [
    { id: 'ORANGE', name: 'Orange Money', color: '#f97316', bgColor: '#fff7ed' },
    { id: 'MTN', name: 'MTN Mobile Money', color: '#ffcc00', bgColor: '#fefce8' },
    { id: 'WAVE', name: 'Wave', color: '#00b8c8', bgColor: '#ecfeff' },
  ];

  const formatGNF = (value: number) => {
    return new Intl.NumberFormat('fr-GN').format(value) + ' GNF';
  };

  const validatePhone = (phoneNumber: string, op: Operateur): boolean => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Patterns Guinée
    const patterns: Record<Operateur, RegExp> = {
      ORANGE: /^(622|623|624|625|626)/,
      MTN: /^(664|665|666|667|668|669)/,
      WAVE: /^(620|621|627|628)/,
    };

    return cleaned.length === 9 && patterns[op].test(cleaned);
  };

  const handleContinue = () => {
    const amountNum = parseInt(amount.replace(/\D/g, ''), 10);
    
    if (!amountNum || amountNum < 100) {
      Alert.alert('Erreur', 'Le montant minimum est de 100 GNF');
      return;
    }

    if (!validatePhone(phone, operateur)) {
      Alert.alert('Erreur', `Numéro ${operateur} invalide. Vérifiez le préfixe.`);
      return;
    }

    setStep('confirm');
  };

  const handleConfirm = async () => {
    setStep('processing');
    setError(null);

    const amountNum = parseInt(amount.replace(/\D/g, ''), 10);

    try {
      if (isOnline) {
        // Appel API réel
        const response = await mobileMoneyService.initierPaiement({
          operateur,
          montant: amountNum,
          telephone: phone.replace(/\D/g, ''),
          motif: motif || `Paiement via GuinéaManager - ${new Date().toLocaleDateString('fr-GN')}`,
        });

        if (response.success && response.data) {
          // Ajouter à la base locale
          await addTransaction({
            id: response.data.transactionId || `tx_${Date.now()}`,
            type: 'RECU',
            operateur,
            montant: amountNum,
            frais: 0, // TODO: récupérer les frais de l'API
            reference: response.data.reference || `REF_${Date.now()}`,
            statut: 'CONFIRME',
            date: new Date().toISOString(),
            destinataire: phone,
            motif,
          });

          setTransactionId(response.data.transactionId || `tx_${Date.now()}`);
          setStep('success');
          onSuccess?.(response.data.transactionId || `tx_${Date.now()}`);
        } else {
          throw new Error(response.error || 'Erreur lors du paiement');
        }
      } else {
        // Mode offline - créer une transaction en attente
        const pendingTx = {
          id: `pending_tx_${Date.now()}`,
          type: 'RECU' as const,
          operateur,
          montant: amountNum,
          frais: 0,
          reference: `PENDING_${Date.now()}`,
          statut: 'EN_ATTENTE' as const,
          date: new Date().toISOString(),
          destinataire: phone,
          motif: motif || 'Paiement hors-ligne',
        };

        await addTransaction(pendingTx);
        setTransactionId(pendingTx.id);
        setStep('success');
        
        Alert.alert(
          'Mode hors-ligne',
          'La transaction a été enregistrée localement. Elle sera synchronisée lorsque vous serez en ligne.'
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setStep('error');
    }
  };

  const handleReset = () => {
    setStep('amount');
    setError(null);
    setTransactionId(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const formatAmountInput = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    if (!numeric) return '';
    return new Intl.NumberFormat('fr-GN').format(parseInt(numeric, 10));
  };

  const selectedOp = operateurs.find(o => o.id === operateur)!;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Paiement Mobile Money</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {/* Offline indicator */}
            {!isOnline && (
              <View style={styles.offlineBanner}>
                <AlertCircle size={16} color="#d97706" />
                <Text style={styles.offlineText}>Mode hors-ligne</Text>
              </View>
            )}

            {/* Step: Amount */}
            {step === 'amount' && (
              <>
                {/* Operateur selection */}
                <Text style={styles.label}>Opérateur</Text>
                <View style={styles.operateurContainer}>
                  {operateurs.map((op) => (
                    <TouchableOpacity
                      key={op.id}
                      style={[
                        styles.operateurButton,
                        { backgroundColor: operateur === op.id ? op.bgColor : '#f3f4f6' },
                        operateur === op.id && { borderColor: op.color, borderWidth: 2 },
                      ]}
                      onPress={() => setOperateur(op.id)}
                    >
                      <Text style={[
                        styles.operateurText,
                        { color: operateur === op.id ? op.color : '#6b7280' }
                      ]}>
                        {op.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Amount input */}
                <Text style={styles.label}>Montant (GNF)</Text>
                <View style={styles.inputContainer}>
                  <DollarSign size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={(v) => setAmount(formatAmountInput(v))}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                {/* Quick amounts */}
                <View style={styles.quickAmounts}>
                  {[50000, 100000, 250000, 500000, 1000000].map((quickAmount) => (
                    <TouchableOpacity
                      key={quickAmount}
                      style={styles.quickAmountButton}
                      onPress={() => setAmount(formatAmountInput(quickAmount.toString()))}
                    >
                      <Text style={styles.quickAmountText}>
                        {new Intl.NumberFormat('fr-GN', { notation: 'compact' }).format(quickAmount)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Phone input */}
                <Text style={styles.label}>Téléphone client</Text>
                <View style={styles.inputContainer}>
                  <Phone size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="622 00 00 00"
                    keyboardType="phone-pad"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                {/* Motif input */}
                <Text style={styles.label}>Motif (optionnel)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={motif}
                  onChangeText={setMotif}
                  placeholder="Description du paiement..."
                  multiline
                  numberOfLines={2}
                  placeholderTextColor="#9ca3af"
                />

                <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                  <Text style={styles.continueButtonText}>Continuer</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Step: Confirm */}
            {step === 'confirm' && (
              <View style={styles.confirmContainer}>
                <Text style={styles.confirmTitle}>Confirmer le paiement</Text>
                
                <View style={styles.confirmCard}>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Montant</Text>
                    <Text style={styles.confirmValue}>{formatGNF(parseInt(amount.replace(/\D/g, ''), 10))}</Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Opérateur</Text>
                    <Text style={[styles.confirmValue, { color: selectedOp.color }]}>{selectedOp.name}</Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Téléphone</Text>
                    <Text style={styles.confirmValue}>{phone}</Text>
                  </View>
                  {motif && (
                    <View style={styles.confirmRow}>
                      <Text style={styles.confirmLabel}>Motif</Text>
                      <Text style={styles.confirmValue}>{motif}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.confirmButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleReset}>
                    <Text style={styles.cancelButtonText}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.confirmButton, { backgroundColor: selectedOp.color }]} 
                    onPress={handleConfirm}
                  >
                    <Text style={styles.confirmButtonText}>Confirmer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Step: Processing */}
            {step === 'processing' && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={selectedOp.color} />
                <Text style={styles.processingText}>Traitement en cours...</Text>
                <Text style={styles.processingSubtext}>Ne fermez pas l'application</Text>
              </View>
            )}

            {/* Step: Success */}
            {step === 'success' && (
              <View style={styles.resultContainer}>
                <View style={[styles.resultIcon, { backgroundColor: '#ecfdf5' }]}>
                  <CheckCircle size={48} color="#059669" />
                </View>
                <Text style={styles.resultTitle}>Paiement réussi!</Text>
                <Text style={styles.resultAmount}>{formatGNF(parseInt(amount.replace(/\D/g, ''), 10))}</Text>
                {transactionId && (
                  <Text style={styles.resultRef}>Réf: {transactionId}</Text>
                )}
                <TouchableOpacity style={styles.resultButton} onPress={handleClose}>
                  <Text style={styles.resultButtonText}>Terminer</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step: Error */}
            {step === 'error' && (
              <View style={styles.resultContainer}>
                <View style={[styles.resultIcon, { backgroundColor: '#fef2f2' }]}>
                  <AlertCircle size={48} color="#dc2626" />
                </View>
                <Text style={styles.resultTitle}>Échec du paiement</Text>
                <Text style={styles.resultError}>{error}</Text>
                <View style={styles.errorButtons}>
                  <TouchableOpacity style={styles.retryButton} onPress={handleReset}>
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeTextButton} onPress={handleClose}>
                    <Text style={styles.closeText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  offlineText: {
    color: '#92400e',
    marginLeft: 8,
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  operateurContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  operateurButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  operateurText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  quickAmountButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  quickAmountText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmContainer: {
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 24,
  },
  confirmCard: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  confirmLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  confirmValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  resultIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  resultAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
  },
  resultRef: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 24,
  },
  resultButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  resultButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultError: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  errorButtons: {
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginBottom: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeTextButton: {
    padding: 8,
  },
  closeText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
