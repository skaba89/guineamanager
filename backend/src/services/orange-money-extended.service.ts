// @ts-nocheck
/**
 * GuinéaManager - Service Orange Money Étendu
 * Fonctionnalités avancées : QR Code, validation, transferts P2P
 */

import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { cache } from '../utils/redis';
import { config, isFeatureEnabled } from '../utils/config';
import logger from '../utils/logger';
import { NotFoundError, ValidationError } from '../middlewares/errorHandler';

// Placeholder for getAccessToken - in production, this would come from orange-money.service
const getAccessToken = async () => { return ''; };

// ==================== TYPES ====================

interface QRCodePaymentRequest {
  amount: number;
  description?: string;
  expiresInMinutes?: number;
  metadata?: Record<string, unknown>;
}

interface QRCodeResponse {
  qrCodeId: string;
  qrCodeData: string;
  deepLink: string;
  amount: number;
  expiresAt: Date;
}

interface PhoneValidationResult {
  valid: boolean;
  formatted: string;
  operator: 'ORANGE' | 'MTN' | 'CELLCOM' | 'UNKNOWN';
  country: string;
}

interface TransferP2PRequest {
  fromPhone: string;
  toPhone: string;
  amount: number;
  description?: string;
  pin: string;
}

interface BalanceCheckResult {
  available: number;
  currency: string;
  lastUpdated: Date;
}

// ==================== QR CODE SERVICE ====================

/**
 * Générer un QR Code pour paiement Orange Money
 * Le client scanne le QR et paie directement
 */
export const generatePaymentQRCode = async (
  companyId: string,
  data: QRCodePaymentRequest
): Promise<QRCodeResponse> => {
  if (!isFeatureEnabled('orangeMoney')) {
    throw new ValidationError('Service Orange Money non configuré');
  }

  // Vérifier le compte Orange Money
  const account = await prisma.orangeMoneyAccount.findFirst({
    where: { companyId, isActive: true },
  });

  if (!account) {
    throw new NotFoundError('Compte Orange Money actif non trouvé');
  }

  // Générer un ID unique pour le QR Code
  const qrCodeId = `QR-${uuidv4().substring(0, 8).toUpperCase()}`;
  const expiresInMinutes = data.expiresInMinutes || 30;
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  // Créer l'entrée en base
  const qrRecord = await prisma.orangeMoneyQRCode.create({
    data: {
      id: qrCodeId,
      companyId,
      merchantCode: account.merchantCode,
      amount: data.amount,
      currency: 'GNF',
      description: data.description || 'Paiement GuinéaManager',
      status: 'ACTIVE',
      expiresAt,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    },
  });

  // Générer les données du QR Code
  // Format Orange Money Guinée
  const qrData = JSON.stringify({
    type: 'ORANGE_MONEY_PAYMENT',
    merchant: account.merchantCode,
    amount: data.amount,
    currency: 'GNF',
    ref: qrCodeId,
    desc: data.description || 'Paiement',
    exp: expiresAt.getTime(),
  });

  // Deep Link pour l'app Orange Money
  const deepLink = `orangemoney://pay?merchant=${account.merchantCode}&amount=${data.amount}&ref=${qrCodeId}`;

  logger.info('QR Code généré', { qrCodeId, amount: data.amount });

  return {
    qrCodeId,
    qrCodeData: qrData,
    deepLink,
    amount: data.amount,
    expiresAt,
  };
};

/**
 * Scanner et traiter un paiement par QR Code
 */
export const processQRCodePayment = async (
  qrCodeId: string,
  customerPhone: string,
  customerName?: string
) => {
  const qrRecord = await prisma.orangeMoneyQRCode.findUnique({
    where: { id: qrCodeId },
  });

  if (!qrRecord) {
    throw new NotFoundError('QR Code');
  }

  if (qrRecord.status !== 'ACTIVE') {
    throw new ValidationError('Ce QR Code a déjà été utilisé ou est expiré');
  }

  if (new Date() > qrRecord.expiresAt) {
    await prisma.orangeMoneyQRCode.update({
      where: { id: qrCodeId },
      data: { status: 'EXPIRED' },
    });
    throw new ValidationError('Ce QR Code a expiré');
  }

  // Initier le paiement via le service existant
  const { initierPaiement } = await import('./orange-money.service');
  
  const result = await initierPaiement(qrRecord.companyId, {
    amount: qrRecord.amount,
    orderId: `QR-${qrCodeId}-${Date.now()}`,
    customerPhone,
    customerName,
    description: qrRecord.description || undefined,
  });

  // Marquer le QR Code comme utilisé
  await prisma.orangeMoneyQRCode.update({
    where: { id: qrCodeId },
    data: { 
      status: 'USED',
      usedAt: new Date(),
      usedBy: customerPhone,
    },
  });

  return result;
};

/**
 * Lister les QR Codes actifs
 */
export const listActiveQRCodes = async (companyId: string) => {
  return prisma.orangeMoneyQRCode.findMany({
    where: {
      companyId,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// ==================== VALIDATION TÉLÉPHONE ====================

/**
 * Valider et formater un numéro de téléphone guinéen
 */
export const validatePhoneNumber = (phone: string): PhoneValidationResult => {
  // Nettoyer le numéro
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
  
  // Patterns pour les opérateurs guinéens
  const patterns = {
    ORANGE: /^(?:\+224|224)?(62[0-9]{2}|66[0-9]{2}|64[0-9]{2}|65[0-9]{2})[0-9]{4}$/,
    MTN: /^(?:\+224|224)?(66[0-9]{2}|67[0-9]{2}|68[0-9]{2})[0-9]{4}$/,
    CELLCOM: /^(?:\+224|224)?(62[0-9]{2}|65[0-9]{2})[0-9]{4}$/,
  };

  // Extraire les 9 derniers chiffres
  const match = cleaned.match(/(\d{9})$/);
  if (!match) {
    return { valid: false, formatted: '', operator: 'UNKNOWN', country: '' };
  }

  const localNumber = match[1];
  const formatted = `+224${localNumber}`;

  // Identifier l'opérateur par le préfixe
  const prefix = localNumber.substring(0, 2);
  
  let operator: PhoneValidationResult['operator'] = 'UNKNOWN';
  
  if (['62', '64', '65'].includes(prefix)) {
    operator = 'ORANGE';
  } else if (['66', '67', '68'].includes(prefix)) {
    operator = 'MTN';
  } else if (prefix === '63') {
    operator = 'CELLCOM';
  }

  return {
    valid: true,
    formatted,
    operator,
    country: 'Guinée',
  };
};

/**
 * Vérifier si un numéro est éligible pour Orange Money
 */
export const checkOrangeMoneyEligibility = async (
  phone: string
): Promise<{ eligible: boolean; reason?: string }> => {
  const validation = validatePhoneNumber(phone);

  if (!validation.valid) {
    return { eligible: false, reason: 'Numéro de téléphone invalide' };
  }

  if (validation.operator !== 'ORANGE') {
    return { 
      eligible: false, 
      reason: `Ce numéro appartient à ${validation.operator}. Orange Money nécessite un numéro Orange.` 
    };
  }

  // Optionnel: Vérifier via l'API Orange si le compte est actif
  // Pour l'instant, on retourne true si c'est un numéro Orange
  return { eligible: true };
};

// ==================== TRANSFERTS P2P ====================

/**
 * Initier un transfert P2P (Person to Person) via Orange Money
 */
export const initierTransfertP2P = async (
  companyId: string,
  data: TransferP2PRequest
) => {
  if (!isFeatureEnabled('orangeMoney')) {
    throw new ValidationError('Service Orange Money non configuré');
  }

  // Valider les numéros
  const fromValidation = validatePhoneNumber(data.fromPhone);
  const toValidation = validatePhoneNumber(data.toPhone);

  if (!fromValidation.valid || fromValidation.operator !== 'ORANGE') {
    throw new ValidationError('Le numéro émetteur doit être un numéro Orange valide');
  }

  if (!toValidation.valid || toValidation.operator !== 'ORANGE') {
    throw new ValidationError('Le numéro destinataire doit être un numéro Orange valide');
  }

  // Vérifier le compte marchand
  const account = await prisma.orangeMoneyAccount.findFirst({
    where: { companyId, isActive: true },
  });

  if (!account) {
    throw new NotFoundError('Compte Orange Money');
  }

  // Créer la transaction en base
  const transferId = `TRF-${uuidv4().substring(0, 8).toUpperCase()}`;
  
  const transaction = await prisma.orangeMoneyTransaction.create({
    data: {
      companyId,
      orderId: transferId,
      amount: data.amount,
      currency: 'GNF',
      customerPhone: fromValidation.formatted,
      customerName: data.description,
      type: 'TRANSFER_P2P',
      status: 'PENDING',
      metadata: JSON.stringify({
        toPhone: toValidation.formatted,
        description: data.description,
      }),
    },
  });

  try {
    const token = await getAccessToken();

    // Appel API Orange Money pour transfert
    const response = await fetch(`${config.orangeMoneyApiUrl}/transfer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant_key: account.merchantCode,
        from_msisdn: fromValidation.formatted.replace('+', ''),
        to_msisdn: toValidation.formatted.replace('+', ''),
        amount: data.amount,
        currency: 'GNF',
        description: data.description || 'Transfert GuinéaManager',
        pin: data.pin, // En production, utiliser un système sécurisé
        reference: transferId,
      }),
    });

    const result = await response.json() as { message?: string; txid?: string };

    if (!response.ok) {
      await prisma.orangeMoneyTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          errorMessage: result.message || 'Transfer failed',
        },
      });

      throw new Error(result.message || 'Erreur lors du transfert');
    }

    await prisma.orangeMoneyTransaction.update({
      where: { id: transaction.id },
      data: {
        orangeTxId: result.txid || '',
        status: 'SUCCESS',
        completedAt: new Date(),
      },
    });

    return {
      transferId,
      txId: result.txid || '',
      status: 'SUCCESS',
      from: fromValidation.formatted,
      to: toValidation.formatted,
      amount: data.amount,
    };
  } catch (error) {
    logger.error('Transfert P2P échoué', error);
    throw error;
  }
};

// ==================== VÉRIFICATION SOLDE ====================

/**
 * Vérifier le solde du compte Orange Money
 */
export const verifierSolde = async (
  companyId: string
): Promise<BalanceCheckResult> => {
  if (!isFeatureEnabled('orangeMoney')) {
    throw new ValidationError('Service Orange Money non configuré');
  }

  const account = await prisma.orangeMoneyAccount.findFirst({
    where: { companyId, isActive: true },
  });

  if (!account) {
    throw new NotFoundError('Compte Orange Money');
  }

  // Vérifier le cache d'abord
  const cacheKey = `orange_money:balance:${companyId}`;
  const cached = await cache.get<BalanceCheckResult>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const token = await getAccessToken();

    const response = await fetch(`${config.orangeMoneyApiUrl}/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Merchant-Key': account.merchantCode,
      },
    });

    if (!response.ok) {
      throw new Error('Impossible de récupérer le solde');
    }

    const result = await response.json() as { available?: number; currency?: string };

    const balance: BalanceCheckResult = {
      available: result.available || 0,
      currency: result.currency || 'GNF',
      lastUpdated: new Date(),
    };

    // Cache pour 5 minutes
    await cache.set(cacheKey, balance, 300);

    return balance;
  } catch (error) {
    logger.error('Vérification solde échouée', error);
    throw error;
  }
};

// ==================== STATISTIQUES ====================

/**
 * Obtenir les statistiques Orange Money
 */
export const getStatistiques = async (
  companyId: string,
  period: 'day' | 'week' | 'month' = 'month'
) => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'day':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  const transactions = await prisma.orangeMoneyTransaction.findMany({
    where: {
      companyId,
      createdAt: { gte: startDate },
    },
    select: {
      status: true,
      amount: true,
      type: true,
      createdAt: true,
    },
  });

  const stats = {
    total: transactions.length,
    success: transactions.filter(t => t.status === 'SUCCESS').length,
    failed: transactions.filter(t => t.status === 'FAILED').length,
    pending: transactions.filter(t => t.status === 'PENDING').length,
    totalAmount: transactions
      .filter(t => t.status === 'SUCCESS')
      .reduce((sum, t) => sum + t.amount, 0),
    byType: {
      payment: transactions.filter(t => t.type === 'PAYMENT' || !t.type).length,
      transfer: transactions.filter(t => t.type === 'TRANSFER_P2P').length,
      qrcode: transactions.filter(t => t.type === 'QRCODE').length,
    },
    period,
    startDate,
    endDate: new Date(),
  };

  return stats;
};

export default {
  generatePaymentQRCode,
  processQRCodePayment,
  listActiveQRCodes,
  validatePhoneNumber,
  checkOrangeMoneyEligibility,
  initierTransfertP2P,
  verifierSolde,
  getStatistiques,
};
