// Routes Orange Money pour GuinéaManager

import { Router } from 'express';
import * as orangeMoneyController from '../controllers/orange-money.controller';
import * as orangeMoneyExtendedController from '../controllers/orange-money-extended.controller';
import { authMiddleware, requireAdmin } from '../middlewares/auth';
import { paymentRateLimiter, publicApiRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// ==================== ROUTES PUBLIQUES ====================

// Webhook Orange Money (route publique)
router.post('/orange-money/callback', publicApiRateLimiter, orangeMoneyController.handleCallback);

// ==================== ROUTES PROTÉGÉES ====================

router.use(authMiddleware);

// --- Paiements standards ---

// POST /api/paiements-mobile/orange-money/initier - Initier un paiement
router.post('/orange-money/initier', paymentRateLimiter, orangeMoneyController.initierPaiement);

// GET /api/paiements-mobile/orange-money/statut/:transactionId - Vérifier le statut
router.get('/orange-money/statut/:transactionId', orangeMoneyController.verifierStatut);

// GET /api/paiements-mobile/orange-money/transactions - Lister les transactions
router.get('/orange-money/transactions', orangeMoneyController.listTransactions);

// POST /api/paiements-mobile/orange-money/configurer - Configurer le compte
router.post('/orange-money/configurer', requireAdmin, orangeMoneyController.configurerCompte);

// --- QR Code ---

// POST /api/paiements-mobile/orange-money/qrcode - Générer un QR Code de paiement
router.post('/orange-money/qrcode', orangeMoneyExtendedController.generateQRCode);

// POST /api/paiements-mobile/orange-money/qrcode/:qrCodeId/pay - Payer via QR Code
router.post('/orange-money/qrcode/:qrCodeId/pay', paymentRateLimiter, orangeMoneyExtendedController.scanQRCode);

// GET /api/paiements-mobile/orange-money/qrcode - Lister les QR Codes actifs
router.get('/orange-money/qrcode', orangeMoneyExtendedController.listQRCodes);

// --- Validation ---

// GET /api/paiements-mobile/orange-money/validate/:phone - Valider un numéro
router.get('/orange-money/validate/:phone', orangeMoneyExtendedController.validatePhone);

// GET /api/paiements-mobile/orange-money/eligibility/:phone - Vérifier l'éligibilité
router.get('/orange-money/eligibility/:phone', orangeMoneyExtendedController.checkEligibility);

// --- Transferts P2P ---

// POST /api/paiements-mobile/orange-money/transfer - Transfert P2P
router.post('/orange-money/transfer', paymentRateLimiter, orangeMoneyExtendedController.transferP2P);

// --- Solde et Stats ---

// GET /api/paiements-mobile/orange-money/balance - Vérifier le solde
router.get('/orange-money/balance', orangeMoneyExtendedController.getBalance);

// GET /api/paiements-mobile/orange-money/stats - Statistiques
router.get('/orange-money/stats', orangeMoneyExtendedController.getStats);

export default router;
