// Routes API pour la Comptabilité OHADA

import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import ComptabiliteService from '../services/comptabilite.service';
import prisma from '../utils/database';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Initialiser le plan comptable OHADA (admin uniquement)
router.post('/initialiser', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    await ComptabiliteService.initialiserPlanComptable();
    res.json({ success: true, message: 'Plan comptable OHADA initialisé avec succès' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// Obtenir le plan comptable
router.get('/plan-comptable', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const planComptable = await prisma.planComptableOHADA.findMany({
      where: { actif: true },
      orderBy: { numero: 'asc' },
    });
    res.json({ success: true, data: planComptable });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// ==================== EXERCICES ====================

// Lister les exercices comptables
router.get('/exercices', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { companyId } = req as AuthenticatedRequest;
    const exercices = await prisma.exerciceComptable.findMany({
      where: { companyId },
      orderBy: { annee: 'desc' },
    });
    res.json({ success: true, data: exercices });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// Créer un exercice comptable
router.post('/exercices', authMiddleware, requireRole(['ADMIN', 'COMPTABLE']), async (req: Request, res: Response) => {
  try {
    const { companyId } = req as AuthenticatedRequest;
    const { annee, dateDebut, dateFin } = req.body;

    const exercice = await ComptabiliteService.creerExercice(
      companyId,
      annee,
      new Date(dateDebut),
      new Date(dateFin)
    );
    res.status(201).json({ success: true, data: exercice });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
});

// Obtenir un exercice
router.get('/exercices/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { companyId } = req as AuthenticatedRequest;
    const exercice = await prisma.exerciceComptable.findFirst({
      where: { id: req.params.id, companyId },
      include: {
        journaux: { where: { actif: true } },
        _count: { select: { journaux: true } },
      },
    });
    if (!exercice) {
      return res.status(404).json({ success: false, error: { message: 'Exercice non trouvé' } });
    }
    res.json({ success: true, data: exercice });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// Clôturer un exercice
router.post('/exercices/:id/cloturer', authMiddleware, requireRole(['ADMIN', 'COMPTABLE']), async (req: Request, res: Response) => {
  try {
    const { companyId, userId } = req as AuthenticatedRequest;
    const result = await ComptabiliteService.cloturerExercice(
      companyId,
      req.params.id,
      userId
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
});

// ==================== JOURNAUX ====================

// Lister les journaux
router.get('/journaux', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { companyId } = req as AuthenticatedRequest;
    const journaux = await prisma.journalComptable.findMany({
      where: { companyId, actif: true },
      orderBy: { code: 'asc' },
    });
    res.json({ success: true, data: journaux });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// ==================== ÉCRITURES ====================

// Enregistrer une écriture comptable
router.post('/ecritures', authMiddleware, requireRole(['ADMIN', 'COMPTABLE']), async (req: Request, res: Response) => {
  try {
    const { companyId } = req as AuthenticatedRequest;
    const { journalCode, exerciceId, dateEcriture, lignes, reference, sourceType, sourceId } = req.body;

    const ecritures = await ComptabiliteService.enregistrerEcriture({
      companyId,
      journalCode,
      exerciceId,
      dateEcriture: new Date(dateEcriture),
      lignes,
      reference,
      sourceType,
      sourceId,
    });
    res.status(201).json({ success: true, data: ecritures });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
});

// Lister les écritures
router.get('/ecritures', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { companyId } = req as AuthenticatedRequest;
    const { journalId, exerciceId, dateDebut, dateFin, compte } = req.query;

    const where: any = { companyId };
    if (journalId) where.journalId = journalId;
    if (exerciceId) where.exerciceId = exerciceId;
    if (compte) where.compteNumero = { startsWith: compte as string };
    if (dateDebut || dateFin) {
      where.dateEcriture = {};
      if (dateDebut) where.dateEcriture.gte = new Date(dateDebut as string);
      if (dateFin) where.dateEcriture.lte = new Date(dateFin as string);
    }

    const ecritures = await prisma.ecritureComptable.findMany({
      where,
      orderBy: [{ dateEcriture: 'desc' }, { numeroPiece: 'asc' }],
      take: 500,
    });
    res.json({ success: true, data: ecritures });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// ==================== GRAND LIVRE ====================

router.get('/grand-livre', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { companyId } = req as AuthenticatedRequest;
    const { exerciceId, compteDebut, compteFin, dateDebut, dateFin } = req.query;

    const grandLivre = await ComptabiliteService.getGrandLivre(
      companyId,
      exerciceId as string,
      compteDebut as string,
      compteFin as string,
      dateDebut ? new Date(dateDebut as string) : undefined,
      dateFin ? new Date(dateFin as string) : undefined
    );
    res.json({ success: true, data: grandLivre });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// ==================== BALANCE ====================

router.get('/balance', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { companyId } = req as AuthenticatedRequest;
    const { exerciceId, periode } = req.query;

    const balance = await ComptabiliteService.getBalance(
      companyId,
      exerciceId as string,
      periode as string
    );
    res.json({ success: true, data: balance });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// ==================== BILAN ====================

router.get('/bilan', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { companyId } = req as AuthenticatedRequest;
    const { exerciceId } = req.query;

    const bilan = await ComptabiliteService.genererBilan(
      companyId,
      exerciceId as string
    );
    res.json({ success: true, data: bilan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// ==================== COMPTE DE RÉSULTAT ====================

router.get('/compte-resultat', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { companyId } = req as AuthenticatedRequest;
    const { exerciceId } = req.query;

    const compteResultat = await ComptabiliteService.genererCompteResultat(
      companyId,
      exerciceId as string
    );
    res.json({ success: true, data: compteResultat });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// ==================== LETTRAGE ====================

// Lettrer des écritures
router.post('/lettrage', authMiddleware, requireRole(['ADMIN', 'COMPTABLE']), async (req: Request, res: Response) => {
  try {
    const { companyId } = req as AuthenticatedRequest;
    const { ecritureIds, code } = req.body;

    const codeLettrage = code || `L${Date.now().toString(36).toUpperCase()}`;

    await prisma.ecritureComptable.updateMany({
      where: {
        id: { in: ecritureIds },
        companyId,
      },
      data: {
        lettrage: codeLettrage,
        dateLettrage: new Date(),
      },
    });

    res.json({ success: true, message: 'Lettrage effectué', code: codeLettrage });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
});

export default router;
