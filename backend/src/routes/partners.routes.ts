// Routes pour le programme Partenaires/Resellers
import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { randomBytes } from 'crypto';

const router = Router();

// ==========================================
// GESTION DES PARTENAIRES
// ==========================================

interface Partner {
  id: string;
  code: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  pays: string;
  type: 'RESELLER' | 'AFFILIATE' | 'INTEGRATOR';
  commission: number;
  status: 'EN_ATTENTE' | 'ACTIF' | 'SUSPENDU' | 'RESILIE';
  logo: string | null;
  website: string | null;
  description: string | null;
  clientsCount: number;
  revenueTotal: number;
  commissionTotal: number;
  createdAt: Date;
}

/**
 * POST /api/partners/apply
 * Candidature partenaire
 */
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const {
      nom,
      email,
      telephone,
      adresse,
      ville,
      pays,
      type,
      website,
      description,
      motivation
    } = req.body;

    // Validation
    if (!nom || !email || !telephone || !type) {
      return res.status(400).json({
        success: false,
        error: 'nom, email, telephone et type sont requis'
      });
    }

    // Vérifier si un partenaire existe déjà avec cet email
    const existing = await prisma.partner.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Un partenaire avec cet email existe déjà'
      });
    }

    // Générer un code partenaire unique
    const code = `GM-${randomBytes(4).toString('hex').toUpperCase()}`;

    const partner = await prisma.partner.create({
      data: {
        code,
        nom,
        email,
        telephone,
        adresse,
        ville,
        pays: pays || 'Guinée',
        type: type || 'AFFILIATE',
        website,
        description,
        motivation,
        commission: type === 'RESELLER' ? 25 : type === 'INTEGRATOR' ? 30 : 15,
        status: 'EN_ATTENTE'
      }
    });

    logger.info('Nouvelle candidature partenaire', { email, type, code });

    res.status(201).json({
      success: true,
      message: 'Votre candidature a été enregistrée. Vous recevrez une réponse sous 48h.',
      data: {
        id: partner.id,
        code: partner.code,
        nom: partner.nom,
        status: partner.status
      }
    });

  } catch (error) {
    logger.error('Erreur candidature partenaire', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'enregistrement de la candidature'
    });
  }
});

/**
 * GET /api/partners
 * Liste des partenaires (admin)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          code: true,
          nom: true,
          email: true,
          telephone: true,
          ville: true,
          pays: true,
          type: true,
          commission: true,
          status: true,
          clientsCount: true,
          revenueTotal: true,
          commissionTotal: true,
          createdAt: true
        }
      }),
      prisma.partner.count({ where })
    ]);

    res.json({
      success: true,
      data: partners,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    logger.error('Erreur liste partenaires', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des partenaires'
    });
  }
});

/**
 * POST /api/partners/:id/approve
 * Approuver un partenaire
 */
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { commissionOverride } = req.body;

    const partner = await prisma.partner.update({
      where: { id },
      data: {
        status: 'ACTIF',
        commission: commissionOverride || undefined,
        approvedAt: new Date()
      }
    });

    logger.info('Partenaire approuvé', { partnerId: id, code: partner.code });

    res.json({
      success: true,
      message: 'Partenaire approuvé avec succès',
      data: partner
    });

  } catch (error) {
    logger.error('Erreur approbation partenaire', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'approbation'
    });
  }
});

/**
 * POST /api/partners/:id/suspend
 * Suspendre un partenaire
 */
router.post('/:id/suspend', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { raison } = req.body;

    const partner = await prisma.partner.update({
      where: { id },
      data: {
        status: 'SUSPENDU',
        suspensionRaison: raison,
        suspendedAt: new Date()
      }
    });

    logger.info('Partenaire suspendu', { partnerId: id, raison });

    res.json({
      success: true,
      message: 'Partenaire suspendu',
      data: partner
    });

  } catch (error) {
    logger.error('Erreur suspension partenaire', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suspension'
    });
  }
});

/**
 * GET /api/partners/:id
 * Détails d'un partenaire
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        clients: {
          select: {
            id: true,
            nom: true,
            email: true,
            planId: true,
            createdAt: true
          },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        commissions: {
          select: {
            id: true,
            montant: true,
            status: true,
            createdAt: true
          },
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partenaire non trouvé'
      });
    }

    // Statistiques
    const stats = await prisma.$transaction([
      prisma.partnerClient.count({ where: { partnerId: id } }),
      prisma.partnerCommission.aggregate({
        where: { partnerId: id },
        _sum: { montant: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        ...partner,
        stats: {
          totalClients: stats[0],
          totalCommissions: stats[1]._sum.montant || 0
        }
      }
    });

  } catch (error) {
    logger.error('Erreur détail partenaire', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du partenaire'
    });
  }
});

/**
 * GET /api/partners/code/:code
 * Vérifier un code partenaire
 */
router.get('/code/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const partner = await prisma.partner.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        nom: true,
        type: true,
        status: true,
        commission: true
      }
    });

    if (!partner || partner.status !== 'ACTIF') {
      return res.json({
        success: false,
        valid: false,
        message: 'Code partenaire invalide ou inactif'
      });
    }

    res.json({
      success: true,
      valid: true,
      data: {
        code: partner.code,
        nom: partner.nom,
        type: partner.type,
        reduction: partner.commission
      }
    });

  } catch (error) {
    logger.error('Erreur vérification code partenaire', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification'
    });
  }
});

/**
 * POST /api/partners/:id/clients
 * Associer un client à un partenaire
 */
router.post('/:id/clients', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'companyId est requis'
      });
    }

    // Vérifier que le partenaire est actif
    const partner = await prisma.partner.findUnique({
      where: { id }
    });

    if (!partner || partner.status !== 'ACTIF') {
      return res.status(400).json({
        success: false,
        error: 'Partenaire inactif ou inexistant'
      });
    }

    // Créer l'association
    const association = await prisma.partnerClient.create({
      data: {
        partnerId: id,
        companyId,
        commission: partner.commission
      }
    });

    // Mettre à jour les compteurs du partenaire
    await prisma.partner.update({
      where: { id },
      data: {
        clientsCount: { increment: 1 }
      }
    });

    logger.info('Client associé au partenaire', { partnerId: id, companyId });

    res.status(201).json({
      success: true,
      message: 'Client associé avec succès',
      data: association
    });

  } catch (error) {
    logger.error('Erreur association client', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'association'
    });
  }
});

/**
 * GET /api/partners/:id/dashboard
 * Dashboard partenaire
 */
router.get('/:id/dashboard', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Statistiques globales
    const [
      totalClients,
      clientsActifs,
      revenusTotal,
      commissionsTotal,
      commissionsEnAttente,
      commissionsPayees,
      clientsParMois,
      revenusParMois
    ] = await Promise.all([
      // Total clients
      prisma.partnerClient.count({ where: { partnerId: id } }),
      // Clients actifs
      prisma.partnerClient.count({
        where: {
          partnerId: id,
          company: { actif: true }
        }
      }),
      // Revenus total
      prisma.partnerClient.aggregate({
        where: { partnerId: id },
        _sum: { revenue: true }
      }),
      // Commissions total
      prisma.partnerCommission.aggregate({
        where: { partnerId: id },
        _sum: { montant: true }
      }),
      // Commissions en attente
      prisma.partnerCommission.aggregate({
        where: { partnerId: id, status: 'EN_ATTENTE' },
        _sum: { montant: true }
      }),
      // Commissions payées
      prisma.partnerCommission.aggregate({
        where: { partnerId: id, status: 'PAYE' },
        _sum: { montant: true }
      }),
      // Clients par mois (12 derniers mois)
      prisma.$queryRaw`
        SELECT strftime('%Y-%m', created_at) as mois, COUNT(*) as count
        FROM partner_clients
        WHERE partner_id = ${id}
        AND created_at >= datetime('now', '-12 months')
        GROUP BY mois
        ORDER BY mois
      `,
      // Revenus par mois
      prisma.$queryRaw`
        SELECT strftime('%Y-%m', created_at) as mois, SUM(montant) as total
        FROM partner_commissions
        WHERE partner_id = ${id}
        AND created_at >= datetime('now', '-12 months')
        GROUP BY mois
        ORDER BY mois
      `
    ]);

    res.json({
      success: true,
      data: {
        resume: {
          totalClients,
          clientsActifs,
          revenusTotal: revenusTotal._sum.revenue || 0,
          commissionsTotal: commissionsTotal._sum.montant || 0,
          commissionsEnAttente: commissionsEnAttente._sum.montant || 0,
          commissionsPayees: commissionsPayees._sum.montant || 0
        },
        graphiques: {
          clientsParMois,
          revenusParMois
        }
      }
    });

  } catch (error) {
    logger.error('Erreur dashboard partenaire', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du dashboard'
    });
  }
});

export default router;
