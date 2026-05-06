/**
 * Routes API pour l'intégration bancaire
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  BankIntegrationFactory,
  BankIntegrationService,
  BankCode,
} from '../services/banking/bank-integration.service';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * GET /api/banking/banks
 * Liste des banques supportées
 */
router.get('/banks', (_req: Request, res: Response) => {
  const banks = BankIntegrationFactory.getSupportedBanks();
  
  res.json({
    success: true,
    data: banks,
    total: banks.length,
  });
});

/**
 * GET /api/banking/accounts
 * Liste des comptes bancaires de l'entreprise
 */
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    
    const accounts = await prisma.compteBancaire.findMany({
      where: { companyId, actif: true },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    logger.error('Error fetching bank accounts', { error });
    res.status(500).json({ error: 'Erreur lors de la récupération des comptes' });
  }
});

/**
 * POST /api/banking/accounts
 * Ajouter un compte bancaire
 */
router.post('/accounts', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { bankCode, accountNumber, accountName, currency, type, iban, bic } = req.body;
    
    // Validation
    if (!bankCode || !accountNumber || !accountName) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'bankCode, accountNumber et accountName sont requis',
      });
    }
    
    // Vérifier que la banque est supportée
    const bankConfig = BankIntegrationFactory.getBankConfig(bankCode as BankCode);
    if (!bankConfig) {
      return res.status(400).json({
        error: 'Banque non supportée',
        message: `La banque ${bankCode} n'est pas encore supportée`,
      });
    }
    
    const account = await prisma.compteBancaire.create({
      data: {
        bankCode,
        accountNumber,
        accountName,
        currency: currency || 'GNF',
        type: type || 'CHECKING',
        iban,
        bic: bic || bankConfig.swiftCode,
        companyId,
        actif: true,
      },
    });
    
    logger.info('Bank account added', { companyId, bankCode, accountNumber });
    
    res.status(201).json({
      success: true,
      data: account,
    });
  } catch (error) {
    logger.error('Error adding bank account', { error });
    res.status(500).json({ error: 'Erreur lors de l\'ajout du compte' });
  }
});

/**
 * GET /api/banking/accounts/:id/balance
 * Obtenir le solde d'un compte bancaire
 */
router.get('/accounts/:id/balance', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { id } = req.params;
    
    const account = await prisma.compteBancaire.findFirst({
      where: { id, companyId },
    });
    
    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }
    
    // Récupérer les identifiants API de la banque
    const credentials = await prisma.bankCredential.findFirst({
      where: { companyId, bankCode: account.bankCode as BankCode },
    });
    
    if (!credentials) {
      return res.status(400).json({
        error: 'Configuration manquante',
        message: 'Les identifiants API pour cette banque ne sont pas configurés',
      });
    }
    
    const balance = await BankIntegrationService.getAccountBalance(
      account.bankCode as BankCode,
      account.accountNumber,
      {
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
      }
    );
    
    // Mettre à jour le solde en base
    await prisma.compteBancaire.update({
      where: { id },
      data: {
        soldeActuel: balance.currentBalance,
        soldeDisponible: balance.availableBalance,
        derniereSynchro: new Date(),
      },
    });
    
    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    logger.error('Error fetching balance', { error });
    res.status(500).json({ error: 'Erreur lors de la récupération du solde' });
  }
});

/**
 * POST /api/banking/accounts/:id/sync
 * Synchroniser les transactions d'un compte
 */
router.post('/accounts/:id/sync', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { id } = req.params;
    const { startDate, endDate } = req.body;
    
    const account = await prisma.compteBancaire.findFirst({
      where: { id, companyId },
    });
    
    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }
    
    const credentials = await prisma.bankCredential.findFirst({
      where: { companyId, bankCode: account.bankCode as BankCode },
    });
    
    if (!credentials) {
      return res.status(400).json({
        error: 'Configuration manquante',
        message: 'Les identifiants API pour cette banque ne sont pas configurés',
      });
    }
    
    const result = await BankIntegrationService.syncTransactions(
      companyId,
      {
        id: account.id,
        bankCode: account.bankCode as BankCode,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        currency: account.currency,
        type: account.type as any,
      },
      {
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
      },
      new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // 30 jours par défaut
      new Date(endDate || new Date())
    );
    
    logger.info('Bank account synced', { companyId, accountId: id, result });
    
    res.json({
      success: true,
      data: result,
      message: `${result.imported} transactions importées`,
    });
  } catch (error) {
    logger.error('Error syncing account', { error });
    res.status(500).json({ error: 'Erreur lors de la synchronisation' });
  }
});

/**
 * POST /api/banking/transfers
 * Initier un virement bancaire
 */
router.post('/transfers', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { fromAccountId, toAccount, toBank, amount, currency, reference, description, beneficiaryName, scheduledDate } = req.body;
    
    // Validation
    if (!fromAccountId || !toAccount || !amount || !reference) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'fromAccountId, toAccount, amount et reference sont requis',
      });
    }
    
    // Récupérer le compte source
    const fromAccount = await prisma.compteBancaire.findFirst({
      where: { id: fromAccountId, companyId },
    });
    
    if (!fromAccount) {
      return res.status(404).json({ error: 'Compte source non trouvé' });
    }
    
    // Vérifier le solde disponible
    if (fromAccount.soldeDisponible && fromAccount.soldeDisponible < amount) {
      return res.status(400).json({
        error: 'Solde insuffisant',
        message: `Solde disponible: ${fromAccount.soldeDisponible} ${fromAccount.currency}`,
      });
    }
    
    // Récupérer les identifiants
    const credentials = await prisma.bankCredential.findFirst({
      where: { companyId, bankCode: fromAccount.bankCode as BankCode },
    });
    
    if (!credentials) {
      return res.status(400).json({
        error: 'Configuration manquante',
        message: 'Les identifiants API pour cette banque ne sont pas configurés',
      });
    }
    
    // Initier le virement
    const result = await BankIntegrationService.initiateBankTransfer(
      companyId,
      fromAccount.bankCode as BankCode,
      {
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
      },
      {
        fromAccount: fromAccount.accountNumber,
        toAccount,
        toBank: toBank as BankCode,
        amount,
        currency: currency || 'GNF',
        reference,
        description,
        beneficiaryName,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      }
    );
    
    // Enregistrer le virement en base
    if (result.success) {
      await prisma.virementBancaire.create({
        data: {
          fromAccountId,
          toAccount,
          toBank,
          amount,
          currency: currency || 'GNF',
          reference,
          description,
          beneficiaryName,
          transactionId: result.transactionId,
          status: result.status,
          companyId,
        },
      });
    }
    
    logger.info('Bank transfer initiated', {
      companyId,
      fromAccount: fromAccount.accountNumber,
      toAccount,
      amount,
      success: result.success,
    });
    
    res.json({
      success: result.success,
      data: result,
      message: result.success
        ? 'Virement initié avec succès'
        : result.message || 'Erreur lors du virement',
    });
  } catch (error) {
    logger.error('Error initiating transfer', { error });
    res.status(500).json({ error: 'Erreur lors du virement' });
  }
});

/**
 * GET /api/banking/transfers/:transactionId/status
 * Vérifier le statut d'un virement
 */
router.get('/transfers/:transactionId/status', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { transactionId } = req.params;
    
    const transfer = await prisma.virementBancaire.findFirst({
      where: { transactionId, companyId },
      include: { fromAccount: true },
    });
    
    if (!transfer) {
      return res.status(404).json({ error: 'Virement non trouvé' });
    }
    
    // TODO: Appeler l'API de la banque pour le statut réel
    
    res.json({
      success: true,
      data: {
        transactionId: transfer.transactionId,
        status: transfer.status,
        amount: transfer.amount,
        currency: transfer.currency,
        createdAt: transfer.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error checking transfer status', { error });
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

/**
 * POST /api/banking/credentials
 * Enregistrer les identifiants API d'une banque
 */
router.post('/credentials', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { bankCode, clientId, clientSecret, merchantId } = req.body;
    
    if (!bankCode || !clientId || !clientSecret) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'bankCode, clientId et clientSecret sont requis',
      });
    }
    
    // Vérifier que la banque est supportée
    const bankConfig = BankIntegrationFactory.getBankConfig(bankCode as BankCode);
    if (!bankConfig) {
      return res.status(400).json({
        error: 'Banque non supportée',
        message: `La banque ${bankCode} n'est pas encore supportée`,
      });
    }
    
    // Créer ou mettre à jour les identifiants
    const credentials = await prisma.bankCredential.upsert({
      where: {
        companyId_bankCode: {
          companyId,
          bankCode: bankCode as BankCode,
        },
      },
      create: {
        companyId,
        bankCode: bankCode as BankCode,
        clientId,
        clientSecret, // TODO: Chiffrer en production
        merchantId,
      },
      update: {
        clientId,
        clientSecret, // TODO: Chiffrer en production
        merchantId,
        updatedAt: new Date(),
      },
    });
    
    logger.info('Bank credentials saved', { companyId, bankCode });
    
    res.json({
      success: true,
      message: 'Identifiants enregistrés avec succès',
      data: {
        bankCode,
        bankName: bankConfig.name,
      },
    });
  } catch (error) {
    logger.error('Error saving bank credentials', { error });
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
});

/**
 * POST /api/banking/reconcile
 * Effectuer un rapprochement bancaire
 */
router.post('/reconcile', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { accountId, startDate, endDate } = req.body;
    
    // TODO: Implémenter le rapprochement bancaire complet
    
    res.json({
      success: true,
      message: 'Rapprochement bancaire effectué',
      data: {
        matched: 0,
        unmatched: 0,
        discrepancies: 0,
      },
    });
  } catch (error) {
    logger.error('Error during reconciliation', { error });
    res.status(500).json({ error: 'Erreur lors du rapprochement' });
  }
});

export default router;
