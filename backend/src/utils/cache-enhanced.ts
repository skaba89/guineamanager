// Utilitaire de cache pour GuinéaManager
// Amélioration des performances avec mise en cache

import NodeCache from 'node-cache';

// Instance de cache par défaut (TTL: 5 minutes)
const defaultCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  useClones: false
});

// Cache pour les données fréquemment accédées
const statsCache = new NodeCache({
  stdTTL: 60, // 1 minute pour les stats
  checkperiod: 30,
  useClones: false
});

// Cache pour les sessions utilisateur (15 minutes)
const sessionCache = new NodeCache({
  stdTTL: 900,
  checkperiod: 120,
  useClones: false
});

/**
 * Obtenir une valeur du cache
 */
export function get<T>(key: string): T | undefined {
  return defaultCache.get<T>(key);
}

/**
 * Définir une valeur dans le cache
 */
export function set<T>(key: string, value: T, ttl?: number): boolean {
  if (ttl) {
    return defaultCache.set(key, value, ttl);
  }
  return defaultCache.set(key, value);
}

/**
 * Supprimer une valeur du cache
 */
export function del(key: string): number {
  return defaultCache.del(key);
}

/**
 * Vider le cache
 */
export function flush(): void {
  defaultCache.flushAll();
  statsCache.flushAll();
  sessionCache.flushAll();
}

/**
 * Obtenir les statistiques du cache
 */
export function getStats() {
  return {
    default: defaultCache.getStats(),
    stats: statsCache.getStats(),
    sessions: sessionCache.getStats()
  };
}

/**
 * Cache pour les statistiques du dashboard
 */
export const StatsCache = {
  get: <T>(companyId: string): T | undefined => {
    return statsCache.get<T>(`stats:${companyId}`);
  },
  
  set: <T>(companyId: string, value: T): boolean => {
    return statsCache.set(`stats:${companyId}`, value);
  },
  
  del: (companyId: string): number => {
    return statsCache.del(`stats:${companyId}`);
  },
  
  invalidate: (companyId: string): void => {
    // Invalider tous les caches liés à l'entreprise
    statsCache.del(`stats:${companyId}`);
    statsCache.del(`dashboard:${companyId}`);
    defaultCache.del(`clients:${companyId}`);
    defaultCache.del(`produits:${companyId}`);
    defaultCache.del(`factures:${companyId}`);
  }
};

/**
 * Cache pour les sessions utilisateur
 */
export const SessionCache = {
  get: <T>(userId: string): T | undefined => {
    return sessionCache.get<T>(`session:${userId}`);
  },
  
  set: <T>(userId: string, value: T): boolean => {
    return sessionCache.set(`session:${userId}`, value);
  },
  
  del: (userId: string): number => {
    return sessionCache.del(`session:${userId}`);
  }
};

/**
 * Middleware de cache pour les requêtes GET
 */
export function cacheMiddleware(ttl: number = 300) {
  return (req: any, res: any, next: any) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `route:${req.originalUrl}`;
    const cached = defaultCache.get(key);

    if (cached) {
      return res.json(cached);
    }

    // Intercepter la réponse
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode === 200) {
        defaultCache.set(key, body, ttl);
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Décorateur pour mettre en cache le résultat d'une fonction
 */
export function cached(ttl: number = 300) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;
      const cachedResult = defaultCache.get(cacheKey);

      if (cachedResult !== undefined) {
        return cachedResult;
      }

      const result = await originalMethod.apply(this, args);
      defaultCache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Préchargement des données fréquemment utilisées
 */
export async function warmupCache() {
  console.log('🔄 Warming up cache...');
  
  // Le préchargement peut être fait ici pour les données critiques
  // Par exemple, les plans d'abonnement, les paramètres système, etc.
  
  console.log('✅ Cache warmed up');
}

export default {
  get,
  set,
  del,
  flush,
  getStats,
  StatsCache,
  SessionCache,
  cacheMiddleware,
  cached,
  warmupCache
};
