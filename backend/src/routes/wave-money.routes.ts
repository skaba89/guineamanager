// @ts-nocheck
// Routes Wave pour GuinéaManager

import { Router, Request, Response } from 'express';
import { authMiddleware, requireRoles, asyncHandler } from '../middlewares';
import * as waveService from '../services/wave-money.service';
import logger from '../utils/logger';

const router = Router();

// Appliquer l'authentification à toutes les routes (sauf webhook)
router.use(authMiddleware);

// POST /api/wave/checkout - Créer une session de paiement
router.post(
  '/checkout',
  asyncHandler(async (req: Request, res: Response) => {
    const { amount, orderId, customerPhone, customerName, description, factureId } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const result = await waveService.creerDemandePaiement(companyId, {
      amount,
      orderId,
      customerPhone,
      customerName,
      description,
    });

    // Si factureId fourni, stocker dans metadata
    if (factureId && result.transactionId) {
      const prisma = (await import('../utils/prisma')).default;
      await prisma.waveTransaction.update({
        where: { id: result.transactionId },
        data: { metadata: JSON.stringify({ factureId }) },
      });
    }

    logger.info('Wave checkout created', { 
      companyId, 
      reference: result.reference 
    });

    res.status(201).json(result);
  })
);

// GET /api/wave/transactions - Lister les transactions
router.get(
  '/transactions',
  asyncHandler(async (req: Request, res: Response) => {
    const { status, type, limit, offset } = req.query;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const transactions = await waveService.listTransactions(companyId, {
      status: status as string,
      type: type as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(transactions);
  })
);

// GET /api/wave/transactions/:id - Vérifier le statut
router.get(
  '/transactions/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const transaction = await waveService.verifierStatut(id);
    res.json(transaction);
  })
);

// POST /api/wave/transfert - Envoyer de l'argent
router.post(
  '/transfert',
  asyncHandler(async (req: Request, res: Response) => {
    const { amount, recipientPhone, recipientName, description } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const result = await waveService.envoyerArgent(companyId, {
      amount,
      recipientPhone,
      recipientName,
      description,
    });

    logger.info('Wave transfer initiated', { 
      companyId, 
      reference: result.reference 
    });

    res.status(201).json(result);
  })
);

// GET /api/wave/solde - Obtenir le solde
router.get(
  '/solde',
  asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const balance = await waveService.obtenirSolde(companyId);
    res.json(balance);
  })
);

// POST /api/wave/configurer - Configurer le compte Wave
router.post(
  '/configurer',
  requireRoles('ADMIN', 'OWNER'),
  asyncHandler(async (req: Request, res: Response) => {
    const { apiKey, apiSecret, accountNumber } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const account = await waveService.configurerCompte(companyId, {
      apiKey,
      apiSecret,
      accountNumber,
    });

    logger.info('Wave account configured', { companyId });

    res.json({ 
      success: true, 
      message: 'Compte Wave configuré avec succès',
      accountNumber: account.accountNumber 
    });
  })
);

export default router;
