// Routes MTN Mobile Money pour GuinéaManager

import { Router, Request, Response } from 'express';
import { authMiddleware, requireRoles, asyncHandler } from '../middlewares';
import * as mtnMoneyService from '../services/mtn-money.service';
import logger from '../utils/logger';

const router = Router();

// Appliquer l'authentification à toutes les routes
router.use(authMiddleware);

// POST /api/mtn-money/demander-paiement - Créer une demande de paiement
router.post(
  '/demander-paiement',
  asyncHandler(async (req: Request, res: Response) => {
    const { amount, orderId, customerPhone, customerName, description, factureId } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const result = await mtnMoneyService.demanderPaiement(companyId, {
      amount,
      orderId,
      customerPhone,
      customerName,
      description,
    });

    // Si factureId fourni, stocker dans metadata
    if (factureId && result.transactionId) {
      // Update transaction metadata
      const prisma = (await import('../utils/prisma')).default;
      await prisma.mTNMoneyTransaction.update({
        where: { id: result.transactionId },
        data: { metadata: JSON.stringify({ factureId }) },
      });
    }

    logger.info('MTN payment request created', { 
      companyId, 
      reference: result.reference 
    });

    res.status(201).json(result);
  })
);

// GET /api/mtn-money/transactions - Lister les transactions
router.get(
  '/transactions',
  asyncHandler(async (req: Request, res: Response) => {
    const { status, type, limit, offset } = req.query;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const transactions = await mtnMoneyService.listTransactions(companyId, {
      status: status as string,
      type: type as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(transactions);
  })
);

// GET /api/mtn-money/transactions/:reference - Vérifier le statut
router.get(
  '/transactions/:reference',
  asyncHandler(async (req: Request, res: Response) => {
    const { reference } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const transaction = await mtnMoneyService.verifierStatutTransaction(companyId, reference);
    res.json(transaction);
  })
);

// POST /api/mtn-money/transfert - Envoyer de l'argent
router.post(
  '/transfert',
  asyncHandler(async (req: Request, res: Response) => {
    const { amount, recipientPhone, recipientName, description } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const result = await mtnMoneyService.envoyerArgent(companyId, {
      amount,
      recipientPhone,
      recipientName,
      description,
    });

    logger.info('MTN transfer initiated', { 
      companyId, 
      reference: result.reference 
    });

    res.status(201).json(result);
  })
);

// GET /api/mtn-money/solde - Obtenir le solde
router.get(
  '/solde',
  asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const balance = await mtnMoneyService.obtenirSolde(companyId);
    res.json(balance);
  })
);

// POST /api/mtn-money/configurer - Configurer le compte MTN
router.post(
  '/configurer',
  requireRoles('ADMIN', 'OWNER'),
  asyncHandler(async (req: Request, res: Response) => {
    const { subscriptionKey, disbursementKey, accountNumber } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const account = await mtnMoneyService.configurerCompte(companyId, {
      subscriptionKey,
      disbursementKey,
      accountNumber,
    });

    logger.info('MTN account configured', { companyId });

    res.json({ 
      success: true, 
      message: 'Compte MTN Money configuré avec succès',
      accountNumber: account.accountNumber 
    });
  })
);

// POST /api/mtn-money/callback - Webhook MTN (non authentifié)
router.post(
  '/callback',
  asyncHandler(async (req: Request, res: Response) => {
    // MTN callback handler - vérifier la signature
    logger.info('MTN callback received', { body: req.body });
    
    // Traiter le callback
    // Dans une vraie implémentation, vérifier la signature MTN
    
    res.status(200).json({ received: true });
  })
);

export default router;
