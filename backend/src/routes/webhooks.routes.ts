// Routes Webhook Mobile Money (non authentifiées)

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middlewares';
import * as waveService from '../services/wave-money.service';
import * as orangeMoneyService from '../services/orange-money.service';
import logger from '../utils/logger';

const router = Router();

// POST /api/webhooks/wave - Webhook Wave
router.post(
  '/wave',
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['wave-signature'];
    
    logger.info('Wave webhook received', { 
      event: req.body?.event,
      signature: signature ? 'present' : 'missing'
    });

    try {
      // Vérifier la signature (en production, implémenter la vérification)
      // const isValid = verifyWaveSignature(req.body, signature);
      // if (!isValid) return res.status(401).json({ error: 'Invalid signature' });

      const result = await waveService.traiterWebhook(req.body);
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Wave webhook processing failed', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  })
);

// POST /api/webhooks/orange-money - Webhook Orange Money
router.post(
  '/orange-money',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Orange Money webhook received', { body: req.body });

    try {
      const { status, order_id, txid, notif_token } = req.body;

      const result = await orangeMoneyService.traiterCallback({
        status,
        order_id,
        txid,
        notif_token,
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error('Orange Money webhook processing failed', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  })
);

// POST /api/webhooks/mtn - Webhook MTN
router.post(
  '/mtn',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('MTN webhook received', { body: req.body });

    try {
      // MTN utilise un système de callback différent
      // Le statut est généralement vérifié par polling
      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('MTN webhook processing failed', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  })
);

export default router;
