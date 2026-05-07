// @ts-nocheck
// Service MTN Mobile Money pour GuinéaManager
// Intégration API MTN MoMo (Collection & Disbursement)

import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { cache } from '../utils/redis';
import { config, isFeatureEnabled } from '../utils/config';
import logger from '../utils/logger';
import { NotFoundError, ConflictError, ValidationError } from '../middlewares/errorHandler';

// Types
interface MTNPaymentRequest {
  amount: number;
  orderId: string;
  customerPhone: string;
  customerName?: string;
  description?: string;
  currency?: string;
}

interface MTNTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface MTNPaymentResponse {
  reference: string;
  status: string;
  financialTransactionId?: string;
  reason?: {
    type: string;
    message: string;
  };
}

interface MTNCollectionRequest {
  amount: string;
  currency: string;
  externalId: string;
  payer: {
    partyIdType: 'MSISDN';
    partyId: string;
  };
  payerMessage: string;
  payeeNote: string;
}

// Obtenir un token d'accès MTN MoMo
const getAccessToken = async (subscriptionKey: string): Promise<string> => {
  const cacheKey = 'mtn_money:access_token';
  const cached = await cache.get<string>(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    // MTN MoMo utilise Basic Auth pour obtenir le token
    const credentials = Buffer.from(
      `${config.mtnMoneyUserId}:${config.mtnMoneyApiKey}`
    ).toString('base64');

    const response = await fetch('https://proxy.momoapi.mtn.com/collection/token/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`MTN Token request failed: ${response.status}`);
    }

    const data = (await response.json()) as MTNTokenResponse;
    
    // Cache le token avec une marge de sécurité
    const expiresIn = Math.max(data.expires_in - 60, 60);
    await cache.set(cacheKey, data.access_token, expiresIn);

    return data.access_token;
  } catch (error) {
    logger.error('MTN Money token fetch failed', error);
    throw new Error('Impossible d\'obtenir le token MTN Money');
  }
};

// Initier une demande de paiement (Collection) - Le client paie
export const demanderPaiement = async (
  companyId: string,
  data: MTNPaymentRequest
) => {
  if (!isFeatureEnabled('mtnMoney')) {
    throw new ValidationError('Service MTN Money non configuré');
  }

  // Vérifier que le compte MTN existe
  const account = await prisma.mtnMoneyAccount.findFirst({
    where: { companyId, isActive: true },
  });

  if (!account) {
    throw new NotFoundError('Compte MTN Money');
  }

  // Normaliser le numéro de téléphone (format MTN Guinée: 66XXXXXX)
  const phone = data.customerPhone.replace(/\D/g, '');
  const formattedPhone = phone.startsWith('224') ? phone.substring(3) : phone;

  // Vérifier que c'est un numéro MTN (préfixe 66 en Guinée)
  if (!formattedPhone.startsWith('66')) {
    throw new ValidationError('Le numéro doit être un numéro MTN Guinée (préfixe 66)');
  }

  const currency = data.currency || 'GNF';
  const externalId = data.orderId || `MTN-${Date.now()}-${uuidv4().substring(0, 8)}`;

  // Créer la transaction en DB
  const transaction = await prisma.mtnMoneyTransaction.create({
    data: {
      companyId,
      externalId,
      amount: data.amount,
      currency,
      customerPhone: `224${formattedPhone}`,
      customerName: data.customerName,
      status: 'PENDING',
      type: 'COLLECTION',
    },
  });

  try {
    const token = await getAccessToken(account.subscriptionKey);

    // Créer la demande de paiement (Collection)
    const response = await fetch('https://proxy.momoapi.mtn.com/collection/v1_0/requesttopay', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Reference-Id': externalId,
        'X-Target-Environment': 'mtnguineaconakry', // Environnement MTN Guinée
        'Ocp-Apim-Subscription-Key': account.subscriptionKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: data.amount.toString(),
        currency,
        externalId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: formattedPhone,
        },
        payerMessage: data.description || 'Paiement GuinéaManager',
        payeeNote: `Facture ${externalId}`,
      } as MTNCollectionRequest),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      await prisma.mtnMoneyTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          errorMessage: errorData.message || 'Payment request failed',
        },
      });

      throw new Error(errorData.message || 'Erreur lors de la demande de paiement');
    }

    // La requête est acceptée (202), le paiement est en attente
    await prisma.mtnMoneyTransaction.update({
      where: { id: transaction.id },
      data: {
        reference: externalId,
      },
    });

    return {
      reference: externalId,
      transactionId: transaction.id,
      status: 'PENDING',
      message: 'Demande de paiement envoyée. Le client doit confirmer sur son téléphone.',
    };
  } catch (error) {
    logger.error('MTN Money payment request failed', error);
    
    await prisma.mtnMoneyTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
};

// Vérifier le statut d'une transaction
export const verifierStatutTransaction = async (
  companyId: string,
  reference: string
) => {
  const transaction = await prisma.mtnMoneyTransaction.findFirst({
    where: { externalId: reference, companyId },
  });

  if (!transaction) {
    throw new NotFoundError('Transaction');
  }

  // Si déjà terminée, retourner le statut
  if (['SUCCESSFUL', 'FAILED', 'CANCELLED'].includes(transaction.status)) {
    return transaction;
  }

  // Sinon, interroger l'API MTN
  const account = await prisma.mtnMoneyAccount.findFirst({
    where: { companyId, isActive: true },
  });

  if (!account) {
    return transaction;
  }

  try {
    const token = await getAccessToken(account.subscriptionKey);

    const response = await fetch(
      `https://proxy.momoapi.mtn.com/collection/v1_0/requesttopay/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': 'mtnguineaconakry',
          'Ocp-Apim-Subscription-Key': account.subscriptionKey,
        },
      }
    );

    if (response.ok) {
      const result = (await response.json()) as MTNPaymentResponse;
      
      const newStatus = result.status === 'SUCCESSFUL' ? 'SUCCESSFUL' : 
                        result.status === 'FAILED' ? 'FAILED' : 
                        result.status === 'CANCELLED' ? 'CANCELLED' : 
                        transaction.status;

      if (newStatus !== transaction.status) {
        await prisma.mtnMoneyTransaction.update({
          where: { id: transaction.id },
          data: {
            status: newStatus,
            financialTransactionId: result.financialTransactionId,
            completedAt: newStatus === 'SUCCESSFUL' ? new Date() : undefined,
          },
        });

        // Si succès, mettre à jour la facture si associée
        if (newStatus === 'SUCCESSFUL') {
          await handleSuccessfulPayment(transaction.id, result.financialTransactionId || '');
        }
      }

      return prisma.mtnMoneyTransaction.findUnique({
        where: { id: transaction.id },
      });
    }
  } catch (error) {
    logger.error('MTN Money status check failed', error);
  }

  return transaction;
};

// Traiter un paiement réussi
const handleSuccessfulPayment = async (transactionId: string, financialTxId: string) => {
  const transaction = await prisma.mtnMoneyTransaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) return;

  const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : null;
  
  if (metadata?.factureId) {
    // Enregistrer le paiement
    await prisma.paiement.create({
      data: {
        factureId: metadata.factureId,
        montant: transaction.amount,
        mode: 'MTN_MONEY',
        reference: financialTxId,
        referenceMobile: transaction.customerPhone,
        mtnTransactionId: transaction.id,
      },
    });

    // Mettre à jour la facture
    const facture = await prisma.facture.findUnique({
      where: { id: metadata.factureId },
    });

    if (facture) {
      const nouveauMontantPaye = facture.montantPaye + transaction.amount;
      let nouveauStatut = facture.statut;

      if (nouveauMontantPaye >= facture.totalTtc) {
        nouveauStatut = 'PAYEE';
      } else {
        nouveauStatut = 'PARTIELLEMENT_PAYEE';
      }

      await prisma.facture.update({
        where: { id: metadata.factureId },
        data: {
          montantPaye: nouveauMontantPaye,
          statut: nouveauStatut,
        },
      });
    }
  }
};

// Envoyer de l'argent (Disbursement) - L'entreprise paie
export const envoyerArgent = async (
  companyId: string,
  data: {
    amount: number;
    recipientPhone: string;
    recipientName?: string;
    description?: string;
  }
) => {
  const account = await prisma.mtnMoneyAccount.findFirst({
    where: { companyId, isActive: true },
  });

  if (!account) {
    throw new NotFoundError('Compte MTN Money');
  }

  const phone = data.recipientPhone.replace(/\D/g, '');
  const formattedPhone = phone.startsWith('224') ? phone.substring(3) : phone;
  const externalId = `DISB-${Date.now()}-${uuidv4().substring(0, 8)}`;

  const transaction = await prisma.mtnMoneyTransaction.create({
    data: {
      companyId,
      externalId,
      amount: data.amount,
      currency: 'GNF',
      customerPhone: `224${formattedPhone}`,
      customerName: data.recipientName,
      status: 'PENDING',
      type: 'DISBURSEMENT',
    },
  });

  try {
    const credentials = Buffer.from(
      `${config.mtnMoneyDisbursementUserId}:${config.mtnMoneyDisbursementApiKey}`
    ).toString('base64');

    const tokenResponse = await fetch('https://proxy.momoapi.mtn.com/disbursement/token/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': account.disbursementKey || account.subscriptionKey,
      },
    });

    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;

    const response = await fetch('https://proxy.momoapi.mtn.com/disbursement/v1_0/transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Reference-Id': externalId,
        'X-Target-Environment': 'mtnguineaconakry',
        'Ocp-Apim-Subscription-Key': account.disbursementKey || account.subscriptionKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: data.amount.toString(),
        currency: 'GNF',
        externalId,
        payee: {
          partyIdType: 'MSISDN',
          partyId: formattedPhone,
        },
        payerMessage: data.description || 'Transfert GuinéaManager',
        payeeNote: `Transfert ${externalId}`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      await prisma.mtnMoneyTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          errorMessage: errorData.message || 'Transfer failed',
        },
      });

      throw new Error(errorData.message || 'Erreur lors du transfert');
    }

    return {
      reference: externalId,
      transactionId: transaction.id,
      status: 'PENDING',
      message: 'Transfert initié avec succès.',
    };
  } catch (error) {
    logger.error('MTN Money disbursement failed', error);
    throw error;
  }
};

// Obtenir le solde du compte MTN
export const obtenirSolde = async (companyId: string) => {
  const account = await prisma.mtnMoneyAccount.findFirst({
    where: { companyId, isActive: true },
  });

  if (!account) {
    throw new NotFoundError('Compte MTN Money');
  }

  try {
    const token = await getAccessToken(account.subscriptionKey);

    const response = await fetch(
      'https://proxy.momoapi.mtn.com/collection/v1_0/account/balance',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': 'mtnguineaconakry',
          'Ocp-Apim-Subscription-Key': account.subscriptionKey,
        },
      }
    );

    if (response.ok) {
      const result = await response.json();
      return {
        availableBalance: result.availableBalance,
        currency: result.currency,
      };
    }
  } catch (error) {
    logger.error('MTN Money balance check failed', error);
  }

  return null;
};

// Lister les transactions
export const listTransactions = async (
  companyId: string,
  options?: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }
) => {
  const { status, type, limit = 20, offset = 0 } = options || {};

  return prisma.mtnMoneyTransaction.findMany({
    where: {
      companyId,
      ...(status && { status: status as any }),
      ...(type && { type: type as any }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
};

// Configurer le compte MTN
export const configurerCompte = async (
  companyId: string,
  data: {
    subscriptionKey: string;
    disbursementKey?: string;
    accountNumber: string;
  }
) => {
  const existing = await prisma.mtnMoneyAccount.findFirst({
    where: { companyId },
  });

  if (existing) {
    return prisma.mtnMoneyAccount.update({
      where: { id: existing.id },
      data: {
        subscriptionKey: data.subscriptionKey,
        disbursementKey: data.disbursementKey,
        accountNumber: data.accountNumber,
      },
    });
  }

  return prisma.mtnMoneyAccount.create({
    data: {
      companyId,
      subscriptionKey: data.subscriptionKey,
      disbursementKey: data.disbursementKey,
      accountNumber: data.accountNumber,
    },
  });
};

export default {
  demanderPaiement,
  verifierStatutTransaction,
  envoyerArgent,
  obtenirSolde,
  listTransactions,
  configurerCompte,
};
