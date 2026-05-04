/**
 * M�triques de Performance et Monitoring pour Guin�aManager ERP
 * 
 * Ce module fournit des fonctions pour mesurer et surveiller les performances
 * de l'application backend.
 */

import { Request, Response, NextFunction } from 'express';
import logger from './logger';

// Interface pour les m�triques
interface PerformanceMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  memoryUsage?: NodeJS.MemoryUsage;
}

// Stockage des m�triques en m�moire (pour production, utiliser Redis ou une DB)
const metricsStore: PerformanceMetrics[] = [];
const MAX_METRICS_STORED = 10000;

/**
 * Middleware de monitoring des performances
 */
export function performanceMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  // Intercepter la fin de la r�ponse
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const responseTimeNs = endTime - startTime;
    const responseTimeMs = Number(responseTimeNs) / 1_000_000;

    const metric: PerformanceMetrics = {
      endpoint: req.route?.path || req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime: responseTimeMs,
      timestamp: new Date(),
      memoryUsage: startMemory,
    };

    // Stocker la m�trique
    storeMetric(metric);

    // Logger si lent
    if (responseTimeMs > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.path} took ${responseTimeMs.toFixed(2)}ms`);
    }

    // Ajouter les headers de performance
    res.setHeader('X-Response-Time', `${responseTimeMs.toFixed(2)}ms`);
  });

  next();
}

/**
 * Stocker une m�trique
 */
function storeMetric(metric: PerformanceMetrics): void {
  if (metricsStore.length >= MAX_METRICS_STORED) {
    metricsStore.shift();
  }
  metricsStore.push(metric);
}

/**
 * Obtenir les statistiques de performance
 */
export function getPerformanceStats(): {
  totalRequests: number;
  averageResponseTime: number;
  slowRequests: number;
  errorRate: number;
  requestsPerMinute: number;
  endpointStats: Record<string, { count: number; avgTime: number; errors: number }>;
} {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60000);

  const recentMetrics = metricsStore.filter(m => m.timestamp > oneMinuteAgo);
  const totalRequests = metricsStore.length;
  
  const avgResponseTime = metricsStore.length > 0
    ? metricsStore.reduce((sum, m) => sum + m.responseTime, 0) / metricsStore.length
    : 0;

  const slowRequests = metricsStore.filter(m => m.responseTime > 1000).length;
  const errorRequests = metricsStore.filter(m => m.statusCode >= 400).length;
  const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
  const requestsPerMinute = recentMetrics.length;

  // Statistiques par endpoint
  const endpointStats: Record<string, { count: number; avgTime: number; errors: number }> = {};
  
  metricsStore.forEach(m => {
    const key = `${m.method} ${m.endpoint}`;
    if (!endpointStats[key]) {
      endpointStats[key] = { count: 0, avgTime: 0, errors: 0 };
    }
    endpointStats[key].count++;
    endpointStats[key].avgTime += m.responseTime;
    if (m.statusCode >= 400) {
      endpointStats[key].errors++;
    }
  });

  // Calculer les moyennes
  Object.keys(endpointStats).forEach(key => {
    endpointStats[key].avgTime = endpointStats[key].avgTime / endpointStats[key].count;
  });

  return {
    totalRequests,
    averageResponseTime: Math.round(avgResponseTime * 100) / 100,
    slowRequests,
    errorRate: Math.round(errorRate * 100) / 100,
    requestsPerMinute,
    endpointStats,
  };
}

/**
 * Obtenir les m�triques de m�moire
 */
export function getMemoryMetrics(): {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  heapUsagePercent: number;
} {
  const mem = process.memoryUsage();
  
  return {
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    external: mem.external,
    rss: mem.rss,
    heapUsagePercent: (mem.heapUsed / mem.heapTotal) * 100,
  };
}

/**
 * Obtenir les m�triques du syst�me
 */
export function getSystemMetrics(): {
  uptime: number;
  nodeVersion: string;
  platform: string;
  cpuUsage: NodeJS.CpuUsage;
  memory: ReturnType<typeof getMemoryMetrics>;
} {
  return {
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform,
    cpuUsage: process.cpuUsage(),
    memory: getMemoryMetrics(),
  };
}

/**
 * Middleware pour exposer les m�triques (endpoint /metrics)
 */
export function metricsHandler(req: Request, res: Response): void {
  const performance = getPerformanceStats();
  const memory = getMemoryMetrics();
  const system = getSystemMetrics();

  res.json({
    timestamp: new Date().toISOString(),
    performance,
    memory,
    system,
  });
}

/**
 * Middleware pour health check
 */
export function healthCheckHandler(req: Request, res: Response): void {
  const memory = getMemoryMetrics();
  const isHealthy = memory.heapUsagePercent < 90;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
      usagePercent: Math.round(memory.heapUsagePercent),
    },
  });
}

/**
 * Alertes de performance
 */
export function checkPerformanceAlerts(): string[] {
  const alerts: string[] = [];
  const stats = getPerformanceStats();
  const memory = getMemoryMetrics();

  // Alerte si taux d'erreur > 5%
  if (stats.errorRate > 5) {
    alerts.push(`Taux d'erreur �lev�: ${stats.errorRate.toFixed(2)}%`);
  }

  // Alerte si temps de r�ponse moyen > 500ms
  if (stats.averageResponseTime > 500) {
    alerts.push(`Temps de r�ponse moyen �lev�: ${stats.averageResponseTime.toFixed(2)}ms`);
  }

  // Alerte si utilisation m�moire > 80%
  if (memory.heapUsagePercent > 80) {
    alerts.push(`Utilisation m�moire �lev�e: ${memory.heapUsagePercent.toFixed(2)}%`);
  }

  // Alerte si beaucoup de requ�tes lentes
  if (stats.slowRequests > stats.totalRequests * 0.1) {
    alerts.push(`Nombre �lev� de requ�tes lentes: ${stats.slowRequests}`);
  }

  return alerts;
}

/**
 * D�marrer la surveillance p�riodique
 */
export function startMonitoring(intervalMs: number = 60000): NodeJS.Timeout {
  return setInterval(() => {
    const alerts = checkPerformanceAlerts();
    
    if (alerts.length > 0) {
      logger.warn('Alertes de performance:', { alerts });
    }

    const stats = getPerformanceStats();
    logger.info('Statistiques de performance:', {
      totalRequests: stats.totalRequests,
      avgResponseTime: stats.averageResponseTime,
      errorRate: stats.errorRate,
      requestsPerMinute: stats.requestsPerMinute,
    });

    const memory = getMemoryMetrics();
    logger.info('Utilisation m�moire:', {
      heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
      usagePercent: Math.round(memory.heapUsagePercent),
    });
  }, intervalMs);
}

// Export par d�faut
export default {
  performanceMiddleware,
  getPerformanceStats,
  getMemoryMetrics,
  getSystemMetrics,
  metricsHandler,
  healthCheckHandler,
  checkPerformanceAlerts,
  startMonitoring,
};
