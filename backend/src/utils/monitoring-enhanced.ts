// Système de monitoring amélioré pour GuinéaManager
// Métriques, health checks, et alertes

import prisma from './prisma';
import logger from './logger';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceStatus;
    redis?: ServiceStatus;
    memory: ServiceStatus;
    cpu: ServiceStatus;
  };
  metrics: SystemMetrics;
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  message?: string;
}

export interface SystemMetrics {
  totalUsers: number;
  totalCompanies: number;
  totalClients: number;
  totalFactures: number;
  facturesToday: number;
  caToday: number;
  caMonth: number;
}

// Version de l'application
const APP_VERSION = process.env.npm_package_version || '1.0.0';
const START_TIME = Date.now();

/**
 * Vérifier la santé de la base de données
 */
async function checkDatabase(): Promise<ServiceStatus> {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;
    
    return {
      status: latency < 100 ? 'up' : 'degraded',
      latency,
      message: `Connected (${latency}ms)`
    };
  } catch (error) {
    return {
      status: 'down',
      message: 'Connection failed'
    };
  }
}

/**
 * Vérifier la mémoire système
 */
function checkMemory(): ServiceStatus {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  let status: 'up' | 'down' | 'degraded' = 'up';
  if (usagePercent > 90) status = 'down';
  else if (usagePercent > 75) status = 'degraded';

  return {
    status,
    message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`
  };
}

/**
 * Vérifier le CPU
 */
function checkCpu(): ServiceStatus {
  const cpuUsage = process.cpuUsage();
  const totalCpu = cpuUsage.user + cpuUsage.system;
  
  return {
    status: 'up',
    message: `CPU time: ${Math.round(totalCpu / 1000)}ms`
  };
}

/**
 * Récupérer les métriques système
 */
async function getMetrics(): Promise<SystemMetrics> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalUsers,
      totalCompanies,
      totalClients,
      totalFactures,
      facturesToday,
      caToday,
      caMonth
    ] = await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.client.count(),
      prisma.facture.count(),
      prisma.facture.count({
        where: { createdAt: { gte: today } }
      }),
      prisma.facture.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { total: true }
      }),
      prisma.facture.aggregate({
        where: { createdAt: { gte: firstDayOfMonth } },
        _sum: { total: true }
      })
    ]);

    return {
      totalUsers,
      totalCompanies,
      totalClients,
      totalFactures,
      facturesToday,
      caToday: caToday._sum.total || 0,
      caMonth: caMonth._sum.total || 0
    };
  } catch (error) {
    logger.error('Erreur lors de la récupération des métriques', error);
    return {
      totalUsers: 0,
      totalCompanies: 0,
      totalClients: 0,
      totalFactures: 0,
      facturesToday: 0,
      caToday: 0,
      caMonth: 0
    };
  }
}

/**
 * Endpoint de health check complet
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  const [database, metrics] = await Promise.all([
    checkDatabase(),
    getMetrics()
  ]);

  const memory = checkMemory();
  const cpu = checkCpu();

  // Déterminer le statut global
  const services = { database, memory, cpu };
  const statuses = Object.values(services).map(s => s.status);
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (statuses.includes('down')) status = 'unhealthy';
  else if (statuses.includes('degraded')) status = 'degraded';

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
    version: APP_VERSION,
    services,
    metrics
  };
}

/**
 * Endpoint de health check simple (pour load balancers)
 */
export function getSimpleHealth(): { status: string; uptime: number } {
  return {
    status: 'ok',
    uptime: Math.floor((Date.now() - START_TIME) / 1000)
  };
}

/**
 * Middleware de monitoring des requêtes
 */
export function requestMonitoringMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();
  const originalEnd = res.end;

  res.end = function(...args: any[]) {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent')?.substring(0, 100)
    };

    // Logger les requêtes lentes (> 1000ms) ou erreurs
    if (duration > 1000 || res.statusCode >= 400) {
      if (res.statusCode >= 500) {
        logger.error('Request completed with error', logData);
      } else {
        logger.warn('Slow request or client error', logData);
      }
    } else {
      logger.http('Request completed', logData);
    }

    return originalEnd.apply(res, args);
  };

  next();
}

/**
 * Scheduler pour les vérifications périodiques
 */
export function startHealthMonitoring() {
  // Vérifier la santé toutes les 5 minutes
  setInterval(async () => {
    const health = await getSystemHealth();
    
    if (health.status !== 'healthy') {
      logger.warn('System health check failed', {
        status: health.status,
        services: health.services
      });
    }

    // Logger les métriques importantes
    logger.info('System metrics', {
      users: health.metrics.totalUsers,
      companies: health.metrics.totalCompanies,
      facturesToday: health.metrics.facturesToday,
      caToday: health.metrics.caToday
    });
  }, 5 * 60 * 1000);

  logger.info('Health monitoring started');
}

// Export par défaut
export default {
  getSystemHealth,
  getSimpleHealth,
  requestMonitoringMiddleware,
  startHealthMonitoring
};
