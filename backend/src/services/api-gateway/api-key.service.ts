// @ts-nocheck
/**
 * Service de gestion des clés API pour l'API publique GuinéaManager
 * 
 * Ce service gère:
 * - La création et révocation des clés API
 * - La validation des permissions
 * - Le suivi de l'utilisation
 * - La limitation du taux de requêtes (rate limiting)
 */

import prisma from '../../utils/prisma';
import crypto from 'crypto';
import logger from '../../utils/logger';

export interface CreateApiKeyParams {
  companyId: string;
  name: string;
  permissions: string[];
  rateLimit?: number;
  expiresAt?: Date;
}

export interface ApiKeyValidation {
  valid: boolean;
  companyId?: string;
  permissions?: string[];
  rateLimitRemaining?: number;
  error?: string;
}

export interface ApiUsageStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisMonth: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  errors: number;
  averageResponseTime: number;
}

// Permissions disponibles pour l'API publique
export const AVAILABLE_PERMISSIONS = {
  // Facturation
  'invoices:read': 'Lire les factures',
  'invoices:write': 'Créer/modifier les factures',
  
  // Clients
  'clients:read': 'Lire les clients',
  'clients:write': 'Créer/modifier les clients',
  
  // Produits
  'products:read': 'Lire les produits',
  'products:write': 'Créer/modifier les produits',
  
  // Employés (données limitées)
  'employees:read': 'Lire les informations employés de base',
  
  // Rapports
  'reports:read': 'Accéder aux rapports',
  
  // Webhooks
  'webhooks:manage': 'Gérer les webhooks',
  
  // Paiements Mobile Money
  'payments:read': 'Lire les transactions',
  'payments:write': 'Initier des paiements',
  
  // Stock
  'stock:read': 'Lire les mouvements de stock',
  'stock:write': 'Enregistrer des mouvements',
} as const;

export type ApiPermission = keyof typeof AVAILABLE_PERMISSIONS;

/**
 * Génère une clé API sécurisée
 */
function generateApiKey(): { key: string; keyHash: string; keyPrefix: string } {
  // Générer 32 bytes aléatoires
  const randomBytes = crypto.randomBytes(32);
  
  // Préfixe pour identifier la clé (GM = GuinéaManager)
  const prefix = 'gm_live_';
  
  // Encoder en base64url (sans caractères spéciaux)
  const key = prefix + randomBytes.toString('base64url').substring(0, 40);
  
  // Hash pour stockage sécurisé
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  
  // Préfixe visible pour identification (prets 12 chars)
  const keyPrefix = key.substring(0, 12) + '...';
  
  return { key, keyHash, keyPrefix };
}

/**
 * Crée une nouvelle clé API
 */
export async function createApiKey(params: CreateApiKeyParams): Promise<{
  id: string;
  key: string; // Retourné une seule fois à la création
  name: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: Date;
}> {
  const { companyId, name, permissions, rateLimit = 1000, expiresAt } = params;
  
  // Valider les permissions
  const validPermissions = permissions.filter(p => 
    Object.keys(AVAILABLE_PERMISSIONS).includes(p)
  );
  
  if (validPermissions.length === 0) {
    throw new Error('Au moins une permission valide est requise');
  }
  
  // Générer la clé
  const { key, keyHash, keyPrefix } = generateApiKey();
  
  // Stocker en base
  const apiKey = await prisma.apiKey.create({
    data: {
      keyHash,
      keyPrefix,
      name,
      companyId,
      permissions: JSON.stringify(validPermissions),
      rateLimit,
      expiresAt,
      active: true,
    },
  });
  
  logger.info('API Key created', { 
    apiKeyId: apiKey.id, 
    companyId, 
    name,
    permissions: validPermissions 
  });
  
  return {
    id: apiKey.id,
    key, // Seule fois où la clé complète est retournée
    name,
    permissions: validPermissions,
    rateLimit,
    expiresAt,
  };
}

/**
 * Révoque une clé API
 */
export async function revokeApiKey(apiKeyId: string, companyId: string): Promise<boolean> {
  const apiKey = await prisma.apiKey.findFirst({
    where: { id: apiKeyId, companyId },
  });
  
  if (!apiKey) {
    throw new Error('Clé API non trouvée');
  }
  
  await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { active: false },
  });
  
  logger.info('API Key revoked', { apiKeyId, companyId });
  
  return true;
}

/**
 * Régénère une clé API (révoque l'ancienne et crée une nouvelle)
 */
export async function regenerateApiKey(
  apiKeyId: string, 
  companyId: string
): Promise<{ id: string; key: string }> {
  const oldKey = await prisma.apiKey.findFirst({
    where: { id: apiKeyId, companyId },
  });
  
  if (!oldKey) {
    throw new Error('Clé API non trouvée');
  }
  
  // Générer nouvelle clé
  const { key, keyHash, keyPrefix } = generateApiKey();
  
  // Mettre à jour
  const updated = await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: {
      keyHash,
      keyPrefix,
      active: true,
      lastUsed: null,
    },
  });
  
  logger.info('API Key regenerated', { apiKeyId, companyId });
  
  return { id: updated.id, key };
}

/**
 * Valide une clé API et retourne les informations associées
 */
export async function validateApiKey(
  apiKey: string
): Promise<ApiKeyValidation> {
  try {
    // Hasher la clé fournie
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Rechercher en base
    const keyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { company: true },
    });
    
    if (!keyRecord) {
      return { valid: false, error: 'Clé API invalide' };
    }
    
    if (!keyRecord.active) {
      return { valid: false, error: 'Clé API révoquée' };
    }
    
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return { valid: false, error: 'Clé API expirée' };
    }
    
    // Mettre à jour lastUsed
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsed: new Date() },
    });
    
    return {
      valid: true,
      companyId: keyRecord.companyId,
      permissions: JSON.parse(keyRecord.permissions),
      rateLimitRemaining: keyRecord.rateLimit, // Sera calculé par le rate limiter
    };
  } catch (error) {
    logger.error('Error validating API key', { error });
    return { valid: false, error: 'Erreur de validation' };
  }
}

/**
 * Récupère les clés API d'une entreprise
 */
export async function getCompanyApiKeys(companyId: string): Promise<Array<{
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  lastUsed: Date | null;
  expiresAt: Date | null;
  active: boolean;
  createdAt: Date;
}>> {
  const keys = await prisma.apiKey.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  });
  
  return keys.map(k => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    permissions: JSON.parse(k.permissions),
    rateLimit: k.rateLimit,
    lastUsed: k.lastUsed,
    expiresAt: k.expiresAt,
    active: k.active,
    createdAt: k.createdAt,
  }));
}

/**
 * Enregistre l'utilisation de l'API
 */
export async function logApiUsage(params: {
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await prisma.apiUsageLog.create({
      data: {
        apiKeyId: params.apiKeyId,
        endpoint: params.endpoint,
        method: params.method,
        statusCode: params.statusCode,
        responseTime: params.responseTime,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    logger.error('Failed to log API usage', { error });
  }
}

/**
 * Récupère les statistiques d'utilisation d'une clé API
 */
export async function getApiUsageStats(
  apiKeyId: string,
  companyId: string
): Promise<ApiUsageStats> {
  // Vérifier que la clé appartient à l'entreprise
  const apiKey = await prisma.apiKey.findFirst({
    where: { id: apiKeyId, companyId },
  });
  
  if (!apiKey) {
    throw new Error('Clé API non trouvée');
  }
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Total des requêtes
  const totalRequests = await prisma.apiUsageLog.count({
    where: { apiKeyId },
  });
  
  // Requêtes aujourd'hui
  const requestsToday = await prisma.apiUsageLog.count({
    where: { apiKeyId, createdAt: { gte: todayStart } },
  });
  
  // Requêtes ce mois
  const requestsThisMonth = await prisma.apiUsageLog.count({
    where: { apiKeyId, createdAt: { gte: monthStart } },
  });
  
  // Top endpoints
  const endpointStats = await prisma.apiUsageLog.groupBy({
    by: ['endpoint'],
    where: { apiKeyId },
    _count: { endpoint: true },
    orderBy: { _count: { endpoint: 'desc' } },
    take: 10,
  });
  
  // Erreurs
  const errors = await prisma.apiUsageLog.count({
    where: { apiKeyId, statusCode: { gte: 400 } },
  });
  
  // Temps de réponse moyen
  const avgResponse = await prisma.apiUsageLog.aggregate({
    where: { apiKeyId },
    _avg: { responseTime: true },
  });
  
  return {
    totalRequests,
    requestsToday,
    requestsThisMonth,
    topEndpoints: endpointStats.map(e => ({
      endpoint: e.endpoint,
      count: e._count.endpoint,
    })),
    errors,
    averageResponseTime: Math.round(avgResponse._avg.responseTime || 0),
  };
}

export default {
  createApiKey,
  revokeApiKey,
  regenerateApiKey,
  validateApiKey,
  getCompanyApiKeys,
  logApiUsage,
  getApiUsageStats,
  AVAILABLE_PERMISSIONS,
};
