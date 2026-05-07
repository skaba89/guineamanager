/**
 * Routes de l'API Publique GuinéaManager
 * 
 * Ces endpoints sont accessibles avec une clé API et permettent
 * aux développeurs tiers d'intégrer leurs applications.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { 
  validateApiKey, 
  logApiUsage, 
  AVAILABLE_PERMISSIONS,
  createApiKey,
  getCompanyApiKeys,
  revokeApiKey,
  getApiUsageStats
} from '../services/api-gateway/api-key.service';
import { publicApiRateLimiter } from '../middlewares/api-gateway/rate-limiter';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

const router = Router();

// ============================================
// MIDDLEWARE D'AUTHENTIFICATION API KEY
// ============================================

async function apiKeyAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  try {
    // Récupérer la clé API du header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentification requise',
        message: 'Incluez une clé API valide dans le header Authorization: Bearer <votre_clé>',
      });
    }
    
    const apiKey = authHeader.substring(7);
    
    // Valider la clé
    const validation = await validateApiKey(apiKey);
    
    if (!validation.valid) {
      return res.status(401).json({
        error: 'Clé API invalide',
        message: validation.error,
      });
    }
    
    // Attacher les infos à la requête
    (req as any).companyId = validation.companyId;
    (req as any).permissions = validation.permissions;
    (req as any).rateLimit = validation.rateLimitRemaining;
    (req as any).apiKey = apiKey;
    
    next();
  } catch (error) {
    logger.error('API key auth error', { error });
    return res.status(500).json({
      error: 'Erreur d\'authentification',
    });
  }
}

// Middleware pour vérifier les permissions
function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const permissions = (req as any).permissions as string[];
    
    const hasPermission = requiredPermissions.some(p => permissions.includes(p));
    
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Permission refusée',
        message: `Cette action nécessite l'une des permissions: ${requiredPermissions.join(', ')}`,
        requiredPermissions,
        yourPermissions: permissions,
      });
    }
    
    next();
  };
}

// Middleware pour logger l'utilisation
async function logApiUsageMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Intercepter la fin de la réponse
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const responseTime = Date.now() - startTime;
    
    // Logger l'utilisation (async, ne bloque pas la réponse)
    logApiUsage({
      apiKeyId: (req as any).apiKeyId || 'unknown',
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
    }).catch(err => logger.error('Failed to log API usage', { err }));
    
    return originalEnd.call(this, chunk, encoding, cb);
  };
  
  next();
}

// ============================================
// ROUTES PUBLIQUES (SANS AUTH)
// ============================================

/**
 * GET /api/public/info
 * Informations sur l'API publique
 */
router.get('/info', (_req: Request, res: Response) => {
  res.json({
    name: 'GuinéaManager Public API',
    version: '1.0.0',
    description: 'API publique pour intégrer vos applications avec GuinéaManager ERP',
    documentation: 'https://docs.guineamanager.com/api',
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <api_key>',
    },
    rateLimits: {
      free: '60 requêtes/minute',
      standard: '300 requêtes/minute',
      premium: '1000 requêtes/minute',
      enterprise: '5000 requêtes/minute',
    },
    permissions: AVAILABLE_PERMISSIONS,
  });
});

/**
 * GET /api/public/health
 * Health check de l'API
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================
// ROUTES PROTÉGÉES (AVEC API KEY)
// ============================================

// Appliquer l'authentification et le rate limiting à toutes les routes suivantes
router.use(apiKeyAuthMiddleware);
router.use(publicApiRateLimiter());

// ============================================
// INVOICES (FACTURES)
// ============================================

/**
 * GET /api/public/v1/invoices
 * Liste des factures
 */
router.get('/v1/invoices', 
  requirePermission('invoices:read'),
  async (req: Request, res: Response) => {
    try {
      const companyId = (req as any).companyId;
      const { page = 1, limit = 20, status, startDate, endDate } = req.query;
      
      const where: any = { companyId };
      if (status) where.statut = status;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }
      
      const [invoices, total] = await Promise.all([
        prisma.facture.findMany({
          where,
          include: {
            client: { select: { id: true, nom: true, email: true } },
            lignes: { 
              include: { produit: { select: { nom: true, reference: true } } }
            }
          },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.facture.count({ where }),
      ]);
      
      res.json({
        success: true,
        data: invoices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching invoices', { error });
      res.status(500).json({ error: 'Erreur lors de la récupération des factures' });
    }
  }
);

/**
 * GET /api/public/v1/invoices/:id
 * Détails d'une facture
 */
router.get('/v1/invoices/:id',
  requirePermission('invoices:read'),
  async (req: Request, res: Response) => {
    try {
      const companyId = (req as any).companyId;
      const { id } = req.params;
      
      const invoice = await prisma.facture.findFirst({
        where: { id, companyId },
        include: {
          client: true,
          lignes: { 
            include: { produit: true }
          },
          paiements: true,
        },
      });
      
      if (!invoice) {
        return res.status(404).json({ error: 'Facture non trouvée' });
      }
      
      res.json({ success: true, data: invoice });
    } catch (error) {
      logger.error('Error fetching invoice', { error });
      res.status(500).json({ error: 'Erreur lors de la récupération de la facture' });
    }
  }
);

/**
 * POST /api/public/v1/invoices
 * Créer une nouvelle facture
 */
router.post('/v1/invoices',
  requirePermission('invoices:write'),
  async (req: Request, res: Response) => {
    try {
      const companyId = (req as any).companyId;
      const { clientId, lignes, echeance, notes } = req.body;
      
      // Validation
      if (!clientId || !lignes || !Array.isArray(lignes) || lignes.length === 0) {
        return res.status(400).json({
          error: 'Données invalides',
          message: 'clientId et lignes (array) sont requis',
        });
      }
      
      // Vérifier que le client existe
      const client = await prisma.client.findFirst({
        where: { id: clientId, companyId },
      });
      
      if (!client) {
        return res.status(400).json({ error: 'Client non trouvé' });
      }
      
      // Calculer les totaux
      let montantHT = 0;
      const lignesData = [];
      
      for (const ligne of lignes) {
        const montantLigne = ligne.quantite * ligne.prixUnitaire;
        montantHT += montantLigne;
        lignesData.push({
          description: ligne.description,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          montantHT: montantLigne,
          produitId: ligne.produitId,
        });
      }
      
      // TVA 18% en Guinée
      const tva = montantHT * 0.18;
      const montantTTC = montantHT + tva;
      
      // Générer le numéro de facture
      const count = await prisma.facture.count({ where: { companyId } });
      const numero = `FAC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
      
      const invoice = await prisma.facture.create({
        data: {
          numero,
          clientId,
          companyId,
          montantHT,
          tva,
          montantTTC,
          montantPaye: 0,
          statut: 'BROUILLON',
          echeance: echeance ? new Date(echeance) : undefined,
          notes,
          lignes: {
            create: lignesData,
          },
        },
        include: {
          client: true,
          lignes: true,
        },
      });
      
      logger.info('Invoice created via API', { 
        invoiceId: invoice.id, 
        companyId,
        montant: montantTTC 
      });
      
      res.status(201).json({ success: true, data: invoice });
    } catch (error) {
      logger.error('Error creating invoice', { error });
      res.status(500).json({ error: 'Erreur lors de la création de la facture' });
    }
  }
);

// ============================================
// CLIENTS
// ============================================

/**
 * GET /api/public/v1/clients
 * Liste des clients
 */
router.get('/v1/clients',
  requirePermission('clients:read'),
  async (req: Request, res: Response) => {
    try {
      const companyId = (req as any).companyId;
      const { page = 1, limit = 20, search } = req.query;
      
      const where: any = { companyId };
      if (search) {
        where.OR = [
          { nom: { contains: search as string } },
          { email: { contains: search as string } },
        ];
      }
      
      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
            adresse: true,
            ville: true,
            pays: true,
            createdAt: true,
            _count: { select: { factures: true } },
          },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { nom: 'asc' },
        }),
        prisma.client.count({ where }),
      ]);
      
      res.json({
        success: true,
        data: clients,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching clients', { error });
      res.status(500).json({ error: 'Erreur lors de la récupération des clients' });
    }
  }
);

/**
 * POST /api/public/v1/clients
 * Créer un client
 */
router.post('/v1/clients',
  requirePermission('clients:write'),
  async (req: Request, res: Response) => {
    try {
      const companyId = (req as any).companyId;
      const { nom, email, telephone, adresse, ville, pays } = req.body;
      
      if (!nom) {
        return res.status(400).json({ error: 'Le nom du client est requis' });
      }
      
      const client = await prisma.client.create({
        data: {
          nom,
          email,
          telephone,
          adresse,
          ville,
          pays: pays || 'Guinée',
          companyId,
        },
      });
      
      res.status(201).json({ success: true, data: client });
    } catch (error) {
      logger.error('Error creating client', { error });
      res.status(500).json({ error: 'Erreur lors de la création du client' });
    }
  }
);

// ============================================
// PRODUCTS (PRODUITS)
// ============================================

/**
 * GET /api/public/v1/products
 * Liste des produits
 */
router.get('/v1/products',
  requirePermission('products:read'),
  async (req: Request, res: Response) => {
    try {
      const companyId = (req as any).companyId;
      const { page = 1, limit = 20, categorie, search } = req.query;
      
      const where: any = { companyId, actif: true };
      if (categorie) where.categorie = categorie;
      if (search) {
        where.OR = [
          { nom: { contains: search as string } },
          { reference: { contains: search as string } },
        ];
      }
      
      const [products, total] = await Promise.all([
        prisma.produit.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { nom: 'asc' },
        }),
        prisma.produit.count({ where }),
      ]);
      
      res.json({
        success: true,
        data: products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching products', { error });
      res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
    }
  }
);

// ============================================
// PAYMENTS (PAIEMENTS MOBILE MONEY)
// ============================================

/**
 * GET /api/public/v1/payments
 * Liste des transactions
 */
router.get('/v1/payments',
  requirePermission('payments:read'),
  async (req: Request, res: Response) => {
    try {
      const companyId = (req as any).companyId;
      const { page = 1, limit = 20, status, operateur } = req.query;
      
      const where: any = { companyId };
      if (status) where.statut = status;
      if (operateur) where.operateur = operateur;
      
      const [payments, total] = await Promise.all([
        prisma.paiementMobileMoney.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.paiementMobileMoney.count({ where }),
      ]);
      
      res.json({
        success: true,
        data: payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching payments', { error });
      res.status(500).json({ error: 'Erreur lors de la récupération des paiements' });
    }
  }
);

// ============================================
// WEBHOOKS
// ============================================

/**
 * GET /api/public/v1/webhooks
 * Liste des webhooks configurés
 */
router.get('/v1/webhooks',
  requirePermission('webhooks:manage'),
  async (req: Request, res: Response) => {
    try {
      const companyId = (req as any).companyId;
      
      const webhooks = await prisma.webhook.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      });
      
      res.json({ success: true, data: webhooks });
    } catch (error) {
      logger.error('Error fetching webhooks', { error });
      res.status(500).json({ error: 'Erreur lors de la récupération des webhooks' });
    }
  }
);

/**
 * POST /api/public/v1/webhooks
 * Créer un webhook
 */
router.post('/v1/webhooks',
  requirePermission('webhooks:manage'),
  async (req: Request, res: Response) => {
    try {
      const companyId = (req as any).companyId;
      const { url, events, secret } = req.body;
      
      if (!url || !events || !Array.isArray(events)) {
        return res.status(400).json({
          error: 'Données invalides',
          message: 'url et events (array) sont requis',
        });
      }
      
      const webhook = await prisma.webhook.create({
        data: {
          companyId,
          url,
          events: JSON.stringify(events),
          secret: secret || crypto.randomUUID(),
          active: true,
        },
      });
      
      res.status(201).json({ success: true, data: webhook });
    } catch (error) {
      logger.error('Error creating webhook', { error });
      res.status(500).json({ error: 'Erreur lors de la création du webhook' });
    }
  }
);

// ============================================
// API KEY MANAGEMENT
// ============================================

/**
 * GET /api/public/v1/api-keys
 * Liste des clés API de l'entreprise
 */
router.get('/v1/api-keys', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const keys = await getCompanyApiKeys(companyId);
    res.json({ success: true, data: keys });
  } catch (error) {
    logger.error('Error fetching API keys', { error });
    res.status(500).json({ error: 'Erreur lors de la récupération des clés API' });
  }
});

/**
 * POST /api/public/v1/api-keys
 * Créer une nouvelle clé API
 */
router.post('/v1/api-keys', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { name, permissions, rateLimit, expiresAt } = req.body;
    
    if (!name || !permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'name et permissions (array) sont requis',
      });
    }
    
    const result = await createApiKey({
      companyId,
      name,
      permissions,
      rateLimit,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
    
    res.status(201).json({ 
      success: true, 
      data: result,
      warning: 'Conservez cette clé en lieu sûr. Elle ne sera plus jamais affichée.'
    });
  } catch (error) {
    logger.error('Error creating API key', { error });
    res.status(500).json({ error: 'Erreur lors de la création de la clé API' });
  }
});

/**
 * GET /api/public/v1/api-keys/:id/stats
 * Statistiques d'utilisation d'une clé API
 */
router.get('/v1/api-keys/:id/stats', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { id } = req.params;
    
    const stats = await getApiUsageStats(id, companyId);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching API key stats', { error });
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

/**
 * DELETE /api/public/v1/api-keys/:id
 * Révoquer une clé API
 */
router.delete('/v1/api-keys/:id', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { id } = req.params;
    
    await revokeApiKey(id, companyId);
    res.json({ success: true, message: 'Clé API révoquée' });
  } catch (error) {
    logger.error('Error revoking API key', { error });
    res.status(500).json({ error: 'Erreur lors de la révocation de la clé API' });
  }
});

export default router;
