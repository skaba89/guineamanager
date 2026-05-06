// Routes API Publique pour intégrations tierces
import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { randomBytes, createHash } from 'crypto';

const router = Router();

// ==========================================
// TYPES
// ==========================================

interface ApiKey {
  id: string;
  key: string;
  name: string;
  companyId: string;
  permissions: string[];
  rateLimit: number;
  lastUsed: Date | null;
  expiresAt: Date | null;
  active: boolean;
  createdAt: Date;
}

interface AuthenticatedApiRequest extends Request {
  apiKey?: ApiKey;
  companyId?: string;
}

// ==========================================
// MIDDLEWARES
// ==========================================

/**
 * Middleware d'authentification par clé API
 */
async function apiKeyAuth(req: AuthenticatedApiRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['x-api-key'] || req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'API key required',
      code: 'MISSING_API_KEY'
    });
  }

  // Extraire la clé (supporte "Bearer xxx" ou directement la clé)
  const key = authHeader.toString().replace('Bearer ', '');
  
  try {
    // Hash de la clé pour la recherche
    const keyHash = createHash('sha256').update(key).digest('hex');
    
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        keyHash,
        active: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired API key',
        code: 'INVALID_API_KEY'
      });
    }

    // Mettre à jour lastUsed
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() }
    });

    req.apiKey = apiKey as any;
    req.companyId = apiKey.companyId;
    
    next();
  } catch (error) {
    logger.error('API key auth error', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Middleware de vérification des permissions
 */
function requirePermission(permission: string) {
  return (req: AuthenticatedApiRequest, res: Response, next: NextFunction) => {
    if (!req.apiKey?.permissions.includes(permission) && !req.apiKey?.permissions.includes('*')) {
      return res.status(403).json({
        success: false,
        error: `Permission '${permission}' required`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
}

// ==========================================
// GESTION DES CLÉS API
// ==========================================

/**
 * POST /api/public/keys
 * Créer une nouvelle clé API
 */
router.post('/keys', async (req: Request, res: Response) => {
  try {
    const { companyId, name, permissions, expiresInDays } = req.body;
    
    if (!companyId || !name) {
      return res.status(400).json({
        success: false,
        error: 'companyId and name are required'
      });
    }

    // Générer une clé API unique
    const rawKey = `gm_${randomBytes(32).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 10) + '...';

    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const apiKey = await prisma.apiKey.create({
      data: {
        keyHash,
        keyPrefix,
        name,
        companyId,
        permissions: permissions || ['read:clients', 'read:products', 'read:invoices'],
        rateLimit: 1000,
        expiresAt
      }
    });

    logger.info('API key created', { companyId, name, keyPrefix });

    // Retourner la clé brute (seule fois)
    res.status(201).json({
      success: true,
      message: 'API key created. Save this key securely, it will not be shown again.',
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: rawKey, // Affiché une seule fois
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt
      }
    });

  } catch (error) {
    logger.error('Error creating API key', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create API key'
    });
  }
});

/**
 * GET /api/public/keys
 * Lister les clés API d'une entreprise
 */
router.get('/keys', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'companyId is required'
      });
    }

    const keys = await prisma.apiKey.findMany({
      where: { companyId: companyId as string },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        permissions: true,
        rateLimit: true,
        lastUsed: true,
        expiresAt: true,
        active: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: keys
    });

  } catch (error) {
    logger.error('Error listing API keys', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list API keys'
    });
  }
});

/**
 * DELETE /api/public/keys/:id
 * Révoquer une clé API
 */
router.delete('/keys/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.apiKey.update({
      where: { id },
      data: { active: false }
    });

    logger.info('API key revoked', { keyId: id });

    res.json({
      success: true,
      message: 'API key revoked successfully'
    });

  } catch (error) {
    logger.error('Error revoking API key', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key'
    });
  }
});

// ==========================================
// API PUBLIQUE - CLIENTS
// ==========================================

/**
 * GET /api/public/clients
 * Liste des clients (API publique)
 */
router.get('/clients', apiKeyAuth, requirePermission('read:clients'), async (req: AuthenticatedApiRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { companyId: req.companyId };
    if (search) {
      where.OR = [
        { nom: { contains: search as string } },
        { email: { contains: search as string } }
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nom: true,
          email: true,
          telephone: true,
          adresse: true,
          ville: true,
          pays: true,
          type: true,
          totalAchats: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.client.count({ where })
    ]);

    res.json({
      success: true,
      data: clients,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    logger.error('Error fetching clients via API', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clients'
    });
  }
});

/**
 * POST /api/public/clients
 * Créer un client (API publique)
 */
router.post('/clients', apiKeyAuth, requirePermission('write:clients'), async (req: AuthenticatedApiRequest, res: Response) => {
  try {
    const { nom, email, telephone, adresse, ville, pays, type } = req.body;

    if (!nom) {
      return res.status(400).json({
        success: false,
        error: 'nom is required'
      });
    }

    const client = await prisma.client.create({
      data: {
        nom,
        email,
        telephone,
        adresse,
        ville,
        pays: pays || 'Guinée',
        type: type || 'PARTICULIER',
        companyId: req.companyId!
      }
    });

    logger.info('Client created via API', { clientId: client.id, companyId: req.companyId });

    res.status(201).json({
      success: true,
      data: client
    });

  } catch (error) {
    logger.error('Error creating client via API', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create client'
    });
  }
});

// ==========================================
// API PUBLIQUE - PRODUITS
// ==========================================

/**
 * GET /api/public/products
 * Liste des produits (API publique)
 */
router.get('/products', apiKeyAuth, requirePermission('read:products'), async (req: AuthenticatedApiRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, category, inStock } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { companyId: req.companyId, actif: true };
    if (category) where.categorie = category;
    if (inStock === 'true') where.stockActuel = { gt: 0 };

    const [products, total] = await Promise.all([
      prisma.produit.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nom: true,
          description: true,
          reference: true,
          prixUnitaire: true,
          stockActuel: true,
          categorie: true,
          unite: true,
          createdAt: true
        }
      }),
      prisma.produit.count({ where })
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    logger.error('Error fetching products via API', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

// ==========================================
// API PUBLIQUE - FACTURES
// ==========================================

/**
 * GET /api/public/invoices
 * Liste des factures (API publique)
 */
router.get('/invoices', apiKeyAuth, requirePermission('read:invoices'), async (req: AuthenticatedApiRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, status, clientId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { companyId: req.companyId };
    if (status) where.statut = status;
    if (clientId) where.clientId = clientId;

    const [invoices, total] = await Promise.all([
      prisma.facture.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          numero: true,
          clientId: true,
          client: { select: { nom: true, email: true } },
          dateEmission: true,
          dateEcheance: true,
          montantHT: true,
          montantTTC: true,
          montantPaye: true,
          statut: true,
          createdAt: true
        }
      }),
      prisma.facture.count({ where })
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    logger.error('Error fetching invoices via API', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices'
    });
  }
});

/**
 * POST /api/public/invoices
 * Créer une facture (API publique)
 */
router.post('/invoices', apiKeyAuth, requirePermission('write:invoices'), async (req: AuthenticatedApiRequest, res: Response) => {
  try {
    const { clientId, lignes, notes, dateEcheance } = req.body;

    if (!clientId || !lignes || !Array.isArray(lignes) || lignes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'clientId and lignes (array) are required'
      });
    }

    // Générer le numéro de facture
    const year = new Date().getFullYear();
    const count = await prisma.facture.count({ where: { companyId: req.companyId } });
    const numero = `FAC-${year}-${String(count + 1).padStart(6, '0')}`;

    // Calculer les montants
    let montantHT = 0;
    let montantTVA = 0;

    const lignesData = lignes.map((ligne: any) => {
      const ht = ligne.quantite * ligne.prixUnitaire;
      const tva = ligne.tauxTVA ? ht * ligne.tauxTVA : ht * 0.18;
      montantHT += ht;
      montantTVA += tva;
      return {
        description: ligne.description,
        quantite: ligne.quantite,
        prixUnitaire: ligne.prixUnitaire,
        tauxTVA: ligne.tauxTVA || 0.18,
        montantHT: ht,
        montantTVA: tva,
        montantTTC: ht + tva
      };
    });

    const facture = await prisma.facture.create({
      data: {
        numero,
        clientId,
        companyId: req.companyId!,
        dateEmission: new Date(),
        dateEcheance: dateEcheance ? new Date(dateEcheance) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        montantHT,
        montantTVA,
        montantTTC: montantHT + montantTVA,
        totalTtc: montantHT + montantTVA,
        notes,
        statut: 'BROUILLON',
        lignes: { create: lignesData }
      },
      include: { lignes: true }
    });

    logger.info('Invoice created via API', { factureId: facture.id, numero, companyId: req.companyId });

    res.status(201).json({
      success: true,
      data: facture
    });

  } catch (error) {
    logger.error('Error creating invoice via API', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice'
    });
  }
});

// ==========================================
// API PUBLIQUE - WEBHOOKS
// ==========================================

/**
 * POST /api/public/webhooks
 * Configurer un webhook
 */
router.post('/webhooks', async (req: Request, res: Response) => {
  try {
    const { companyId, url, events, secret } = req.body;

    if (!companyId || !url || !events || !Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        error: 'companyId, url, and events (array) are required'
      });
    }

    const webhook = await prisma.webhook.create({
      data: {
        companyId,
        url,
        events,
        secret: secret || randomBytes(32).toString('hex'),
        active: true
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        createdAt: webhook.createdAt
      }
    });

  } catch (error) {
    logger.error('Error creating webhook', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create webhook'
    });
  }
});

/**
 * GET /api/public/webhooks
 * Lister les webhooks
 */
router.get('/webhooks', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'companyId is required'
      });
    }

    const webhooks = await prisma.webhook.findMany({
      where: { companyId: companyId as string },
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        lastTriggered: true,
        failureCount: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: webhooks
    });

  } catch (error) {
    logger.error('Error listing webhooks', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list webhooks'
    });
  }
});

export default router;
