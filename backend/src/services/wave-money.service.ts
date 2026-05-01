// Service Wave pour GuinéaManager
// Intégration API Wave (Guinée)

import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { cache } from '../utils/redis';
import { config, isFeatureEnabled } from '../utils/config';
import logger from '../utils/logger';
import { NotFoundError, ConflictError, ValidationError } from '../middlewares/errorHandler';

// Types
interface WavePaymentRequest {
  amount: number;
  orderId: string;
  customerPhone: string;
  customerName?: string;
  description?: string;
}

interface WavePaymentResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  client_reference?: string;
  checkout_url?: string;
}

interface WaveTransferResponse {
  id: string;
  status: string;
  amount: number;
  reference: string;
}

// Obtenir un token d'accès Wave
const getAccessToken = async (): Promise<string> => {
  const cacheKey = 'wave:access_token';
  const cached = await cache.get<string>(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    // Wave utilise une API Key pour l'authentification
    const response = await fetch('https://api.wave.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.waveClientId,
        client_secret: config.waveClientSecret,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Wave Token request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache le token avec une marge de sécurité
    const expiresIn = Math.max(data.expires_in - 60, 60);
    await cache.set(cacheKey, data.access_token, expiresIn);

    return data.access_token;
  } catch (error) {
    logger.error('Wave token fetch failed', error);
    throw new Error('Impossible d\'obtenir le token Wave');
  }
};

// Créer une demande de paiement (Checkout Session)
export const creerDemandePaiement = async (
  companyId: string,
  data: WavePaymentRequest
) => {
  if (!isFeatureEnabled('wave')) {
    throw new ValidationError('Service Wave non configuré');
  }

  // Vérifier que le compte Wave existe
  const account = await prisma.waveAccount.findFirst({
    where: { companyId, isActive: true },
  });

  if (!account) {
    throw new NotFoundError('Compte Wave');
  }

  // Normaliser le numéro de téléphone (Wave Guinée: 62X XXX XX XX)
  const phone = data.customerPhone.replace(/\D/g, '');
  const formattedPhone = phone.startsWith('224') ? phone.substring(3) : phone;

  // Les numéros Wave en Guinée commencent généralement par 62
  const reference = data.orderId || `WAVE-${Date.now()}-${uuidv4().substring(0, 8)}`;

  // Créer la transaction en DB
  const transaction = await prisma.waveTransaction.create({
    data: {
      companyId,
      reference,
      amount: data.amount,
      currency: 'GNF',
      customerPhone: `224${formattedPhone}`,
      customerName: data.customerName,
      status: 'PENDING',
      type: 'CHECKOUT',
    },
  });

  try {
    const token = await getAccessToken();

    // Créer une session de checkout Wave
    const response = await fetch('https://api.wave.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': reference,
      },
      body: JSON.stringify({
        amount: data.amount,
        currency: 'GNF',
        error_url: `${config.appUrl}/payment/wave/error`,
        success_url: `${config.appUrl}/payment/wave/success`,
        webhook_url: `${config.apiUrl}/api/paiements-mobile/wave/webhook`,
        client_reference: reference,
        customer_phone: formattedPhone,
        customer_name: data.customerName,
        description: data.description || 'Paiement GuinéaManager',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      await prisma.waveTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          errorMessage: errorData.message || 'Checkout creation failed',
        },
      });

      throw new Error(errorData.message || 'Erreur lors de la création du checkout');
    }

    const result = (await response.json()) as WavePaymentResponse;

    // Mettre à jour avec l'ID de session Wave
    await prisma.waveTransaction.update({
      where: { id: transaction.id },
      data: {
        waveId: result.id,
        checkoutUrl: result.checkout_url,
      },
    });

    return {
      reference,
      waveId: result.id,
      checkoutUrl: result.checkout_url,
      transactionId: transaction.id,
      status: 'PENDING',
      message: 'Session de paiement créée. Partagez le lien avec le client.',
    };
  } catch (error) {
    logger.error('Wave checkout creation failed', error);
    
    await prisma.waveTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
};

// Initier un transfert (envoyer de l'argent)
export const envoyerArgent = async (
  companyId: string,
  data: {
    amount: number;
    recipientPhone: string;
    recipientName?: string;
    description?: string;
  }
) => {
  const account = await prisma.waveAccount.findFirst({
    where: { companyId, isActive: true },
  });

  if (!account) {
    throw new NotFoundError('Compte Wave');
  }

  const phone = data.recipientPhone.replace(/\D/g, '');
  const formattedPhone = phone.startsWith('224') ? phone.substring(3) : phone;
  const reference = `TRF-${Date.now()}-${uuidv4().substring(0, 8)}`;

  const transaction = await prisma.waveTransaction.create({
    data: {
      companyId,
      reference,
      amount: data.amount,
      currency: 'GNF',
      customerPhone: `224${formattedPhone}`,
      customerName: data.recipientName,
      status: 'PENDING',
      type: 'TRANSFER',
    },
  });

  try {
    const token = await getAccessToken();

    const response = await fetch('https://api.wave.com/v1/transfers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': reference,
      },
      body: JSON.stringify({
        amount: data.amount,
        currency: 'GNF',
        receive_amount: data.amount, // Pour les transferts locaux
        recipient: {
          type: 'mobile',
          mobile: formattedPhone,
          name: data.recipientName,
        },
        description: data.description || 'Transfert GuinéaManager',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      await prisma.waveTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          errorMessage: errorData.message || 'Transfer failed',
        },
      });

      throw new Error(errorData.message || 'Erreur lors du transfert');
    }

    const result = (await response.json()) as WaveTransferResponse;

    await prisma.waveTransaction.update({
      where: { id: transaction.id },
      data: {
        waveId: result.id,
        status: result.status === 'pending' ? 'PENDING' : 
                result.status === 'completed' ? 'SUCCESS' : 'PENDING',
      },
    });

    return {
      reference,
      waveId: result.id,
      transactionId: transaction.id,
      status: result.status,
      message: 'Transfert initié avec succès.',
    };
  } catch (error) {
    logger.error('Wave transfer failed', error);
    throw error;
  }
};

// Traiter le webhook Wave
export const traiterWebhook = async (data: {
  event: string;
  data: {
    id: string;
    client_reference: string;
    status: string;
    amount: number;
    currency: string;
    timestamp: string;
  };
}) => {
  const transaction = await prisma.waveTransaction.findFirst({
    where: { 
      OR: [
        { reference: data.data.client_reference },
        { waveId: data.data.id }
      ]
    },
  });

  if (!transaction) {
    logger.warn('Wave webhook for unknown transaction', { 
      reference: data.data.client_reference,
      waveId: data.data.id 
    });
    return { success: false, message: 'Transaction non trouvée' };
  }

  const newStatus = data.data.status === 'succeeded' ? 'SUCCESS' : 
                    data.data.status === 'failed' ? 'FAILED' : 
                    data.data.status === 'cancelled' ? 'CANCELLED' : 
                    data.data.status === 'expired' ? 'EXPIRED' : 'PENDING';

  await prisma.waveTransaction.update({
    where: { id: transaction.id },
    data: {
      status: newStatus,
      completedAt: newStatus === 'SUCCESS' ? new Date() : undefined,
    },
  });

  // Si succès, mettre à jour la facture si associée
  if (newStatus === 'SUCCESS') {
    const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : null;
    
    if (metadata?.factureId) {
      // Enregistrer le paiement
      await prisma.paiement.create({
        data: {
          factureId: metadata.factureId,
          montant: transaction.amount,
          mode: 'WAVE',
          reference: data.data.id,
          referenceMobile: transaction.customerPhone,
          waveTransactionId: transaction.id,
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
  }

  logger.info('Wave webhook processed', {
    reference: data.data.client_reference,
    status: newStatus,
  });

  return { success: true, status: newStatus };
};

// Vérifier le statut d'une transaction
export const verifierStatut = async (transactionId: string) => {
  const transaction = await prisma.waveTransaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw new NotFoundError('Transaction');
  }

  // Si déjà terminée, retourner le statut
  if (['SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(transaction.status)) {
    return transaction;
  }

  // Sinon, interroger l'API Wave
  try {
    const token = await getAccessToken();

    const response = await fetch(
      `https://api.wave.com/v1/checkout/sessions/${transaction.waveId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const result = await response.json();
      
      const newStatus = result.payment_status === 'succeeded' ? 'SUCCESS' : 
                        result.payment_status === 'failed' ? 'FAILED' : 
                        result.payment_status === 'cancelled' ? 'CANCELLED' : 
                        transaction.status;

      if (newStatus !== transaction.status) {
        await traiterWebhook({
          event: 'checkout.session.completed',
          data: {
            id: result.id,
            client_reference: transaction.reference,
            status: result.payment_status,
            amount: result.amount,
            currency: result.currency,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return prisma.waveTransaction.findUnique({
        where: { id: transactionId },
      });
    }
  } catch (error) {
    logger.error('Wave status check failed', error);
  }

  return transaction;
};

// Obtenir le solde du compte Wave
export const obtenirSolde = async (companyId: string) => {
  const account = await prisma.waveAccount.findFirst({
    where: { companyId, isActive: true },
  });

  if (!account) {
    throw new NotFoundError('Compte Wave');
  }

  try {
    const token = await getAccessToken();

    const response = await fetch('https://api.wave.com/v1/balances', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      return {
        availableBalance: result.available_balance,
        pendingBalance: result.pending_balance,
        currency: result.currency || 'GNF',
      };
    }
  } catch (error) {
    logger.error('Wave balance check failed', error);
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

  return prisma.waveTransaction.findMany({
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

// Configurer le compte Wave
export const configurerCompte = async (
  companyId: string,
  data: {
    apiKey: string;
    apiSecret: string;
    accountNumber: string;
  }
) => {
  const existing = await prisma.waveAccount.findFirst({
    where: { companyId },
  });

  if (existing) {
    return prisma.waveAccount.update({
      where: { id: existing.id },
      data: {
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        accountNumber: data.accountNumber,
      },
    });
  }

  return prisma.waveAccount.create({
    data: {
      companyId,
      apiKey: data.apiKey,
      apiSecret: data.apiSecret,
      accountNumber: data.accountNumber,
    },
  });
};

export default {
  creerDemandePaiement,
  envoyerArgent,
  traiterWebhook,
  verifierStatut,
  obtenirSolde,
  listTransactions,
  configurerCompte,
};
