/**
 * Syst�me de Cache pour Guin�aManager ERP
 * 
 * Am�liore les performances du dashboard et des requ�tes fr�quentes
 * en mettant en cache les donn�es avec expiration.
 */

import NodeCache from 'node-cache';

// Types
type CacheKey = string;
type CacheValue = any;

// Configuration du cache
const DEFAULT_TTL = 300; // 5 minutes
const CHECK_PERIOD = 600; // V�rifier les cl�s expir�es toutes les 10 minutes

// Instance du cache principal
const mainCache = new NodeCache({
  stdTTL: DEFAULT_TTL,
  checkperiod: CHECK_PERIOD,
  useClones: false, // Pour de meilleures performances
});

// Cache sp�cifique pour le dashboard (TTL plus court)
const dashboardCache = new NodeCache({
  stdTTL: 60, // 1 minute
  checkperiod: 120,
  useClones: false,
});

// Cache pour les donn�es de r�f�rence (TTL plus long)
const referenceCache = new NodeCache({
  stdTTL: 3600, // 1 heure
  checkperiod: 600,
  useClones: false,
});

/**
 * Cl�s de cache pr�d�finies
 */
export const CacheKeys = {
  // Dashboard
  DASHBOARD_STATS: (companyId: string) => `dashboard:stats:${companyId}`,
  DASHBOARD_ALERTS: (companyId: string) => `dashboard:alerts:${companyId}`,
  DASHBOARD_RECENT_INVOICES: (companyId: string) => `dashboard:invoices:${companyId}`,
  DASHBOARD_CHARTS: (companyId: string) => `dashboard:charts:${companyId}`,
  
  // Donn�es de r�f�rence
  CLIENTS_LIST: (companyId: string) => `clients:list:${companyId}`,
  PRODUCTS_LIST: (companyId: string) => `products:list:${companyId}`,
  EMPLOYEES_LIST: (companyId: string) => `employees:list:${companyId}`,
  SUPPLIERS_LIST: (companyId: string) => `suppliers:list:${companyId}`,
  
  // Param�tres
  COMPANY_SETTINGS: (companyId: string) => `company:settings:${companyId}`,
  USER_PREFERENCES: (userId: string) => `user:prefs:${userId}`,
  
  // Mobile Money
  MM_TRANSACTIONS: (companyId: string, operator: string) => `mm:tx:${companyId}:${operator}`,
  
  // Carte interactive
  MAP_DATA: (companyId: string) => `map:data:${companyId}`,
} as const;

/**
 * Fonctions utilitaires du cache
 */
export const Cache = {
  /**
   * R�cup�rer une valeur du cache
   */
  get<T>(key: CacheKey): T | undefined {
    return mainCache.get<T>(key);
  },

  /**
   * Stocker une valeur dans le cache
   */
  set(key: CacheKey, value: CacheValue, ttl?: number): boolean {
    if (ttl) {
      return mainCache.set(key, value, ttl);
    }
    return mainCache.set(key, value);
  },

  /**
   * Supprimer une valeur du cache
   */
  del(key: CacheKey | CacheKey[]): number {
    return mainCache.del(key);
  },

  /**
   * V�rifier si une cl� existe
   */
  has(key: CacheKey): boolean {
    return mainCache.has(key);
  },

  /**
   * Vider tout le cache
   */
  flush(): void {
    mainCache.flushAll();
    dashboardCache.flushAll();
    referenceCache.flushAll();
  },

  /**
   * Obtenir les statistiques du cache
   */
  stats(): {
    main: NodeCache.Stats;
    dashboard: NodeCache.Stats;
    reference: NodeCache.Stats;
  } {
    return {
      main: mainCache.getStats(),
      dashboard: dashboardCache.getStats(),
      reference: referenceCache.getStats(),
    };
  },

  /**
   * Invalider le cache d'une entreprise
   */
  invalidateCompany(companyId: string): void {
    const keys = mainCache.keys().filter(k => k.includes(companyId));
    mainCache.del(keys);
    
    const dashKeys = dashboardCache.keys().filter(k => k.includes(companyId));
    dashboardCache.del(dashKeys);
    
    const refKeys = referenceCache.keys().filter(k => k.includes(companyId));
    referenceCache.del(refKeys);
  },
};

/**
 * Fonctions sp�cifiques au dashboard
 */
export const DashboardCache = {
  get<T>(key: CacheKey): T | undefined {
    return dashboardCache.get<T>(key);
  },

  set(key: CacheKey, value: CacheValue): boolean {
    return dashboardCache.set(key, value);
  },

  del(key: CacheKey): number {
    return dashboardCache.del(key);
  },
};

/**
 * Fonctions pour les donn�es de r�f�rence
 */
export const ReferenceCache = {
  get<T>(key: CacheKey): T | undefined {
    return referenceCache.get<T>(key);
  },

  set(key: CacheKey, value: CacheValue): boolean {
    return referenceCache.set(key, value);
  },

  del(key: CacheKey): number {
    return referenceCache.del(key);
  },
};

/**
 * D�corateur pour mettre en cache le r�sultat d'une fonction
 */
export function Cached(ttl: number = DEFAULT_TTL): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Cr�er une cl� de cache bas�e sur la fonction et ses arguments
      const cacheKey = `${String(propertyKey)}:${JSON.stringify(args)}`;
      
      // V�rifier le cache
      const cached = Cache.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      // Ex�cuter la fonction
      const result = await originalMethod.apply(this, args);
      
      // Mettre en cache
      Cache.set(cacheKey, result, ttl);
      
      return result;
    };

    return descriptor;
  };
}

/**
 * Middleware Express pour mettre en cache les r�ponses
 */
export function cacheMiddleware(ttl: number = DEFAULT_TTL) {
  return (req: any, res: any, next: any) => {
    // Ignorer les requ�tes non-GET
    if (req.method !== 'GET') {
      return next();
    }

    // Cr�er la cl� de cache
    const cacheKey = `route:${req.originalUrl}`;
    
    // V�rifier le cache
    const cached = Cache.get(cacheKey);
    if (cached !== undefined) {
      return res.json(cached);
    }

    // Intercepter la r�ponse
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Mettre en cache si la r�ponse est un succ�s
      if (res.statusCode >= 200 && res.statusCode < 300) {
        Cache.set(cacheKey, body, ttl);
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Middleware pour invalider le cache apr�s une mutation
 */
export function invalidateCacheMiddleware(keyPattern: string) {
  return (req: any, res: any, next: any) => {
    // Ex�cuter la requ�te
    const originalEnd = res.end.bind(res);
    res.end = (...args: any[]) => {
      // Invalider le cache si succ�s
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const companyId = req.user?.companyId || req.headers['companyid'];
        if (companyId) {
          const keys = mainCache.keys().filter(k => 
            k.includes(keyPattern) && k.includes(companyId)
          );
          mainCache.del(keys);
        }
      }
      return originalEnd(...args);
    };

    next();
  };
}

/**
 * Pr�chargement du cache
 */
export async function warmupCache(companyId: string, loaders: {
  loadClients: () => Promise<any[]>;
  loadProducts: () => Promise<any[]>;
  loadEmployees: () => Promise<any[]>;
}): Promise<void> {
  try {
    const [clients, products, employees] = await Promise.all([
      loaders.loadClients(),
      loaders.loadProducts(),
      loaders.loadEmployees(),
    ]);

    ReferenceCache.set(CacheKeys.CLIENTS_LIST(companyId), clients);
    ReferenceCache.set(CacheKeys.PRODUCTS_LIST(companyId), products);
    ReferenceCache.set(CacheKeys.EMPLOYEES_LIST(companyId), employees);
  } catch (error) {
    console.error('Erreur lors du pr�chargement du cache:', error);
  }
}

// Export par d�faut
export default {
  Cache,
  DashboardCache,
  ReferenceCache,
  CacheKeys,
  Cached,
  cacheMiddleware,
  invalidateCacheMiddleware,
  warmupCache,
};
