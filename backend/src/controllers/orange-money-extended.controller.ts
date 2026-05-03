/**
 * GuinéaManager - Contrôleur Orange Money Étendu
 */

import { Request, Response } from 'express';
import * as orangeMoneyExtended from '../services/orange-money-extended.service';
import logger from '../utils/logger';

// ==================== QR CODE ====================

export const generateQRCode = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { amount, description, expiresInMinutes, metadata } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le montant doit être supérieur à 0',
      });
    }

    const result = await orangeMoneyExtended.generatePaymentQRCode(companyId, {
      amount,
      description,
      expiresInMinutes,
      metadata,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Erreur génération QR Code', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur serveur',
    });
  }
};

export const scanQRCode = async (req: Request, res: Response) => {
  try {
    const { qrCodeId } = req.params;
    const { customerPhone, customerName } = req.body;

    if (!customerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de téléphone requis',
      });
    }

    const result = await orangeMoneyExtended.processQRCodePayment(
      qrCodeId,
      customerPhone,
      customerName
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Erreur scan QR Code', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur serveur',
    });
  }
};

export const listQRCodes = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    const qrCodes = await orangeMoneyExtended.listActiveQRCodes(companyId);

    res.json({
      success: true,
      data: qrCodes,
    });
  } catch (error) {
    logger.error('Erreur liste QR Codes', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ==================== VALIDATION ====================

export const validatePhone = async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;

    const result = orangeMoneyExtended.validatePhoneNumber(phone);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Erreur validation téléphone', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

export const checkEligibility = async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;

    const result = await orangeMoneyExtended.checkOrangeMoneyEligibility(phone);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Erreur vérification éligibilité', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ==================== TRANSFERT P2P ====================

export const transferP2P = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { fromPhone, toPhone, amount, description, pin } = req.body;

    if (!fromPhone || !toPhone || !amount || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis: fromPhone, toPhone, amount, pin',
      });
    }

    const result = await orangeMoneyExtended.initierTransfertP2P(companyId, {
      fromPhone,
      toPhone,
      amount,
      description,
      pin,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Erreur transfert P2P', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur serveur',
    });
  }
};

// ==================== SOLDE ====================

export const getBalance = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    const result = await orangeMoneyExtended.verifierSolde(companyId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Erreur vérification solde', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur serveur',
    });
  }
};

// ==================== STATISTIQUES ====================

export const getStats = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { period } = req.query;

    const result = await orangeMoneyExtended.getStatistiques(
      companyId,
      (period as 'day' | 'week' | 'month') || 'month'
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Erreur statistiques Orange Money', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};
