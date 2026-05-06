// Routes pour le programme Beta Testers
import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

const router = Router();

// ==========================================
// BETA SIGNUP
// ==========================================

interface BetaSignupRequest {
  email: string;
  nom: string;
  prenom: string;
  entreprise?: string;
  telephone?: string;
  secteur?: string;
  tailleEntreprise?: string;
  fonction?: string;
  besoins?: string[];
  source?: string;
}

/**
 * POST /api/beta/signup
 * Inscription au programme beta
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const data: BetaSignupRequest = req.body;

    // Validation
    if (!data.email || !data.nom || !data.prenom) {
      return res.status(400).json({
        success: false,
        error: 'Email, nom et prénom sont requis'
      });
    }

    // Vérifier si l'email existe déjà
    const existing = await prisma.betaTester.findUnique({
      where: { email: data.email }
    });

    if (existing) {
      // Mettre à jour si déjà inscrit
      const updated = await prisma.betaTester.update({
        where: { email: data.email },
        data: {
          nom: data.nom,
          prenom: data.prenom,
          entreprise: data.entreprise,
          telephone: data.telephone,
          secteur: data.secteur,
          tailleEntreprise: data.tailleEntreprise,
          fonction: data.fonction,
          besoins: data.besoins || [],
          source: data.source,
          updatedAt: new Date()
        }
      });

      return res.json({
        success: true,
        message: 'Votre inscription a été mise à jour !',
        data: updated
      });
    }

    // Créer nouveau beta tester
    const betaTester = await prisma.betaTester.create({
      data: {
        email: data.email,
        nom: data.nom,
        prenom: data.prenom,
        entreprise: data.entreprise,
        telephone: data.telephone,
        secteur: data.secteur,
        tailleEntreprise: data.tailleEntreprise,
        fonction: data.fonction,
        besoins: data.besoins || [],
        source: data.source,
        status: 'EN_ATTENTE'
      }
    });

    logger.info('Nouveau beta tester inscrit', { email: data.email, entreprise: data.entreprise });

    res.status(201).json({
      success: true,
      message: 'Merci pour votre inscription au programme Beta ! Vous recevrez un email de confirmation sous 24h.',
      data: betaTester
    });

  } catch (error) {
    logger.error('Erreur inscription beta', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'inscription'
    });
  }
});

/**
 * GET /api/beta/status
 * Vérifier le statut d'un beta tester
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email requis'
      });
    }

    const betaTester = await prisma.betaTester.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        status: true,
        createdAt: true,
        codeAcces: true
      }
    });

    if (!betaTester) {
      return res.json({
        success: true,
        found: false,
        message: 'Email non trouvé dans le programme beta'
      });
    }

    res.json({
      success: true,
      found: true,
      data: betaTester
    });

  } catch (error) {
    logger.error('Erreur vérification statut beta', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification'
    });
  }
});

/**
 * POST /api/beta/activate
 * Activer un compte beta (admin)
 */
router.post('/activate', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email requis'
      });
    }

    // Générer un code d'accès unique
    const codeAcces = `BETA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const betaTester = await prisma.betaTester.update({
      where: { email },
      data: {
        status: 'ACTIF',
        codeAcces,
        activatedAt: new Date()
      }
    });

    logger.info('Beta tester activé', { email, codeAcces });

    res.json({
      success: true,
      message: 'Compte beta activé',
      data: {
        email: betaTester.email,
        codeAcces,
        status: betaTester.status
      }
    });

  } catch (error) {
    logger.error('Erreur activation beta', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'activation'
    });
  }
});

/**
 * GET /api/beta/stats
 * Statistiques du programme beta (admin)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [total, enAttente, actifs, convertis] = await Promise.all([
      prisma.betaTester.count(),
      prisma.betaTester.count({ where: { status: 'EN_ATTENTE' } }),
      prisma.betaTester.count({ where: { status: 'ACTIF' } }),
      prisma.betaTester.count({ where: { status: 'CONVERTI' } })
    ]);

    // Secteurs les plus représentés
    const secteurs = await prisma.betaTester.groupBy({
      by: ['secteur'],
      where: { secteur: { not: null } },
      _count: true,
      orderBy: { _count: { secteur: 'desc' } },
      take: 5
    });

    // Tailles d'entreprise
    const tailles = await prisma.betaTester.groupBy({
      by: ['tailleEntreprise'],
      where: { tailleEntreprise: { not: null } },
      _count: true,
      orderBy: { _count: { tailleEntreprise: 'desc' } }
    });

    // Inscriptions par jour (7 derniers jours)
    const inscriptionsParJour = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM beta_testers
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    res.json({
      success: true,
      data: {
        total,
        enAttente,
        actifs,
        convertis,
        secteurs,
        tailles,
        inscriptionsParJour
      }
    });

  } catch (error) {
    logger.error('Erreur stats beta', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

/**
 * GET /api/beta/list
 * Liste des beta testers (admin)
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [testers, total] = await Promise.all([
      prisma.betaTester.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          entreprise: true,
          telephone: true,
          secteur: true,
          tailleEntreprise: true,
          fonction: true,
          status: true,
          codeAcces: true,
          createdAt: true,
          activatedAt: true
        }
      }),
      prisma.betaTester.count({ where })
    ]);

    res.json({
      success: true,
      data: testers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    logger.error('Erreur liste beta', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la liste'
    });
  }
});

export default router;
