/**
 * Rate Limiter pour l'API Publique GuinéaManager
 * 
 * Implémente un rate limiting par clé API avec:
 * - Limites configurables par clé
 * - Sliding window pour plus de précision
 * - Headers standard X-RateLimit-*
 * - Support Redis pour la production
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Interface pour le stockage du rate limiting
interface RateLimitStore {
  get(key: string): Promise<RateLimitInfo | null>;
  set(key: string, value: RateLimitInfo, ttl: number): Promise<void>;
  increment(key: string): Promise<number>;
}

interface RateLimitInfo {
  remaining: number;
  resetAt: Date;
  total: number;
}

// Stockage en mémoire (pour le développement)
class MemoryStore implements RateLimitStore {
  private store: Map<string, { count: number; resetAt: Date; total: number }> = new Map();
  
  async get(key: string): Promise<RateLimitInfo | null> {
    const data = this.store.get(key);
    if (!data) return null;
    
    // Vérifier si la fenêtre a expiré
    if (data.resetAt < new Date()) {
      this.store.delete(key);
      return null;
    }
    
    return {
      remaining: Math.max(0, data.total - data.count),
      resetAt: data.resetAt,
      total: data.total,
    };
  }
  
  async set(key: string, value: RateLimitInfo, ttl: number): Promise<void> {
    this.store.set(key, {
      count: value.total - value.remaining,
      resetAt: value.resetAt,
      total: value.total,
    });
  }
  
  async increment(key: string): Promise<number> {
    const data = this.store.get(key);
    if (!data) return 0;
    
    data.count++;
    return data.count;
  }
}

// Configuration du rate limiter
interface RateLimiterConfig {
  windowMs: number;        // Fenêtre de temps en ms
  maxRequests: number;     // Maximum de requêtes par fenêtre
  keyGenerator?: (req: Request) => string;
  skipFailedRequests?: boolean;
  headers?: boolean;
}

// Instance globale du store
let store: RateLimitStore = new MemoryStore();

// Configuration par défaut des limites
const DEFAULT_LIMITS = {
  // Limites par type de plan
  free: { windowMs: 60000, maxRequests: 60 },        // 60 req/min
  standard: { windowMs: 60000, maxRequests: 300 },   // 300 req/min
  premium: { windowMs: 60000, maxRequests: 1000 },   // 1000 req/min
  enterprise: { windowMs: 60000, maxRequests: 5000 }, // 5000 req/min
};

/**
 * Configure le store (utile pour Redis en production)
 */
export function configureRateLimiterStore(newStore: RateLimitStore): void {
  store = newStore;
}

/**
 * Génère une clé unique pour le rate limiting
 */
function generateRateLimitKey(req: Request): string {
  // Utiliser l'ID de la clé API si disponible
  const apiKeyId = (req as any).apiKeyId;
  if (apiKeyId) {
    return `ratelimit:api:${apiKeyId}`;
  }
  
  // Sinon, utiliser l'IP + User-Agent
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || '';
  const hash = crypto
    .createHash('sha256')
    .update(`${ip}:${userAgent}`)
    .digest('hex')
    .substring(0, 16);
  
  return `ratelimit:ip:${hash}`;
}

/**
 * Middleware de rate limiting pour l'API publique
 */
export function publicApiRateLimiter(config?: Partial<RateLimiterConfig>) {
  const defaultConfig: RateLimiterConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    keyGenerator: generateRateLimitKey,
    skipFailedRequests: false,
    headers: true,
    ...config,
  };
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Générer la clé
      const key = defaultConfig.keyGenerator!(req);
      
      // Récupérer la limite personnalisée depuis la clé API
      const customLimit = (req as any).rateLimit || defaultConfig.maxRequests;
      
      // Calculer le temps de reset
      const now = Date.now();
      const resetAt = new Date(now + defaultConfig.windowMs);
      
      // Récupérer les infos actuelles
      let info = await store.get(key);
      
      if (!info) {
        // Première requête dans cette fenêtre
        info = {
          remaining: customLimit - 1,
          resetAt,
          total: customLimit,
        };
        await store.set(key, info, defaultConfig.windowMs);
      } else {
        // Incrémenter le compteur
        const currentCount = await store.increment(key);
        info.remaining = Math.max(0, customLimit - currentCount);
      }
      
      // Ajouter les headers standard
      if (defaultConfig.headers) {
        res.setHeader('X-RateLimit-Limit', info.total.toString());
        res.setHeader('X-RateLimit-Remaining', info.remaining.toString());
        res.setHeader('X-RateLimit-Reset', Math.ceil(info.resetAt.getTime() / 1000).toString());
      }
      
      // Vérifier si la limite est atteinte
      if (info.remaining <= 0) {
        const retryAfter = Math.ceil(defaultConfig.windowMs / 1000);
        res.setHeader('Retry-After', retryAfter.toString());
        
        res.status(429).json({
          error: 'Trop de requêtes',
          message: `Limite de ${info.total} requêtes par minute atteinte. Réessayez dans ${retryAfter} secondes.`,
          retryAfter,
          limit: info.total,
          resetAt: info.resetAt.toISOString(),
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // En cas d'erreur, laisser passer la requête
      next();
    }
  };
}

/**
 * Middleware de rate limiting strict pour les endpoints sensibles
 */
export function strictRateLimiter(maxRequests: number = 10) {
  return publicApiRateLimiter({
    windowMs: 60000,
    maxRequests,
    headers: true,
  });
}

/**
 * Rate limiter spécifique pour les tentatives d'authentification
 */
export function authRateLimiter() {
  const attempts = new Map<string, { count: number; blockedUntil: Date | null }>();
  
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `auth:${ip}`;
    
    const attempt = attempts.get(key);
    
    // Vérifier si bloqué
    if (attempt?.blockedUntil && attempt.blockedUntil > new Date()) {
      const remaining = Math.ceil((attempt.blockedUntil.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        error: 'Compte temporairement bloqué',
        message: `Trop de tentatives. Réessayez dans ${remaining} secondes.`,
        retryAfter: remaining,
      });
    }
    
    next();
  };
}

/**
 * Enregistre une tentative d'authentification échouée
 */
export function recordFailedAuthAttempt(ip: string): void {
  const key = `auth:${ip}`;
  let attempt = attemptsStore.get(key);
  
  if (!attempt) {
    attempt = { count: 0, blockedUntil: null };
  }
  
  attempt.count++;
  
  // Bloquer après 5 tentatives
  if (attempt.count >= 5) {
    attempt.blockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }
  
  attemptsStore.set(key, attempt);
}

/**
 * Réinitialise les tentatives après une authentification réussie
 */
export function resetAuthAttempts(ip: string): void {
  attemptsStore.delete(`auth:${ip}`);
}

// Store pour les tentatives d'auth
const attemptsStore = new Map<string, { count: number; blockedUntil: Date | null }>();

export default {
  publicApiRateLimiter,
  strictRateLimiter,
  authRateLimiter,
  recordFailedAuthAttempt,
  resetAuthAttempts,
  configureRateLimiterStore,
  DEFAULT_LIMITS,
};
