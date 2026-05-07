// @ts-nocheck
// Routes Mobile Money Dashboard pour GuinéaManager
import { Router, Request, Response } from 'express';
import { authMiddleware, asyncHandler } from '../middlewares';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

const router = Router();

// Appliquer l'authentification à toutes les routes
router.use(authMiddleware);

// GET /api/mobile-money/dashboard - Dashboard complet Mobile Money
router.get(
  '/dashboard',
  asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    // Récupérer les soldes et transactions pour chaque opérateur
    const [orangeTransactions, mtnTransactions, waveTransactions] = await Promise.all([
      prisma.orangeMoneyTransaction.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.mtnMoneyTransaction.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.waveTransaction.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    // Calculer les statistiques
    const orangeStats = {
      totalTransactions: orangeTransactions.length,
      successfulTransactions: orangeTransactions.filter(t => t.status === 'SUCCESS').length,
      pendingTransactions: orangeTransactions.filter(t => t.status === 'PENDING').length,
      totalAmount: orangeTransactions.filter(t => t.status === 'SUCCESS').reduce((acc, t) => acc + t.amount, 0),
      lastSync: orangeTransactions[0]?.createdAt || null,
    };

    const mtnStats = {
      totalTransactions: mtnTransactions.length,
      successfulTransactions: mtnTransactions.filter(t => t.status === 'SUCCESSFUL').length,
      pendingTransactions: mtnTransactions.filter(t => t.status === 'PENDING').length,
      totalAmount: mtnTransactions.filter(t => t.status === 'SUCCESSFUL').reduce((acc, t) => acc + t.amount, 0),
      lastSync: mtnTransactions[0]?.createdAt || null,
    };

    const waveStats = {
      totalTransactions: waveTransactions.length,
      successfulTransactions: waveTransactions.filter(t => t.status === 'SUCCESS').length,
      pendingTransactions: waveTransactions.filter(t => t.status === 'PENDING').length,
      totalAmount: waveTransactions.filter(t => t.status === 'SUCCESS').reduce((acc, t) => acc + t.amount, 0),
      lastSync: waveTransactions[0]?.createdAt || null,
    };

    // Combiner les transactions récentes
    const recentTransactions = [
      ...orangeTransactions.slice(0, 10).map(t => ({
        ...t,
        operateur: 'ORANGE' as const,
      })),
      ...mtnTransactions.slice(0, 10).map(t => ({
        ...t,
        operateur: 'MTN' as const,
      })),
      ...waveTransactions.slice(0, 10).map(t => ({
        ...t,
        operateur: 'WAVE' as const,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);

    res.json({
      orangeMoney: orangeStats,
      mtnMoney: mtnStats,
      wave: waveStats,
      totalBalance: orangeStats.totalAmount + mtnStats.totalAmount + waveStats.totalAmount,
      totalTransactions: orangeStats.totalTransactions + mtnStats.totalTransactions + waveStats.totalTransactions,
      recentTransactions,
    });
  })
);

// GET /api/mobile-money/stats - Statistiques agrégées
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.user?.companyId;
    const { startDate, endDate } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Transactions par jour
    const dailyStats = await getDailyTransactions(companyId, start, end);

    // Répartition par opérateur
    const operatorDistribution = await getOperatorDistribution(companyId, start, end);

    // Top clients par volume Mobile Money
    const topClients = await getTopMobileMoneyClients(companyId, 10);

    res.json({
      period: { start, end },
      dailyStats,
      operatorDistribution,
      topClients,
    });
  })
);

// GET /api/mobile-money/transactions/all - Toutes les transactions combinées
router.get(
  '/transactions/all',
  asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.user?.companyId;
    const { status, operateur, limit = 50, offset = 0 } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    // Récupérer les transactions de tous les opérateurs
    const [orangeTx, mtnTx, waveTx] = await Promise.all([
      prisma.orangeMoneyTransaction.findMany({
        where: {
          companyId,
          ...(status && { status: status as string }),
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: offsetNum,
      }),
      prisma.mtnMoneyTransaction.findMany({
        where: {
          companyId,
          ...(status && { status: status as string }),
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: offsetNum,
      }),
      prisma.waveTransaction.findMany({
        where: {
          companyId,
          ...(status && { status: status as string }),
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: offsetNum,
      }),
    ]);

    // Combiner et filtrer par opérateur si spécifié
    let allTransactions = [
      ...orangeTx.map(t => ({ ...t, operateur: 'ORANGE' as const, id: `orange_${t.id}` })),
      ...mtnTx.map(t => ({ ...t, operateur: 'MTN' as const, id: `mtn_${t.id}` })),
      ...waveTx.map(t => ({ ...t, operateur: 'WAVE' as const, id: `wave_${t.id}` })),
    ];

    if (operateur) {
      allTransactions = allTransactions.filter(t => t.operateur === operateur);
    }

    // Trier par date
    allTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(allTransactions.slice(0, limitNum));
  })
);

// Helper functions
async function getDailyTransactions(companyId: string, start: Date, end: Date) {
  const [orangeTx, mtnTx, waveTx] = await Promise.all([
    prisma.orangeMoneyTransaction.findMany({
      where: {
        companyId,
        createdAt: { gte: start, lte: end },
        status: 'SUCCESS',
      },
    }),
    prisma.mtnMoneyTransaction.findMany({
      where: {
        companyId,
        createdAt: { gte: start, lte: end },
        status: 'SUCCESSFUL',
      },
    }),
    prisma.waveTransaction.findMany({
      where: {
        companyId,
        createdAt: { gte: start, lte: end },
        status: 'SUCCESS',
      },
    }),
  ]);

  // Grouper par jour
  const dailyMap = new Map<string, { date: string; orange: number; mtn: number; wave: number; total: number }>();

  const processTransactions = (transactions: any[], operateur: 'orange' | 'mtn' | 'wave') => {
    transactions.forEach(tx => {
      const date = tx.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { date, orange: 0, mtn: 0, wave: 0, total: 0 };
      existing[operateur] += tx.amount;
      existing.total += tx.amount;
      dailyMap.set(date, existing);
    });
  };

  processTransactions(orangeTx, 'orange');
  processTransactions(mtnTx, 'mtn');
  processTransactions(waveTx, 'wave');

  return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

async function getOperatorDistribution(companyId: string, start: Date, end: Date) {
  const [orangeTotal, mtnTotal, waveTotal] = await Promise.all([
    prisma.orangeMoneyTransaction.aggregate({
      where: { companyId, createdAt: { gte: start, lte: end }, status: 'SUCCESS' },
      _sum: { amount: true },
    }),
    prisma.mtnMoneyTransaction.aggregate({
      where: { companyId, createdAt: { gte: start, lte: end }, status: 'SUCCESSFUL' },
      _sum: { amount: true },
    }),
    prisma.waveTransaction.aggregate({
      where: { companyId, createdAt: { gte: start, lte: end }, status: 'SUCCESS' },
      _sum: { amount: true },
    }),
  ]);

  const orange = orangeTotal._sum.amount || 0;
  const mtn = mtnTotal._sum.amount || 0;
  const wave = waveTotal._sum.amount || 0;
  const total = orange + mtn + wave;

  return [
    { operateur: 'Orange Money', amount: orange, percentage: total > 0 ? Math.round((orange / total) * 100) : 0 },
    { operateur: 'MTN Money', amount: mtn, percentage: total > 0 ? Math.round((mtn / total) * 100) : 0 },
    { operateur: 'Wave', amount: wave, percentage: total > 0 ? Math.round((wave / total) * 100) : 0 },
  ];
}

async function getTopMobileMoneyClients(companyId: string, limit: number) {
  // Agréger par numéro de téléphone
  const [orangeByPhone, mtnByPhone, waveByPhone] = await Promise.all([
    prisma.orangeMoneyTransaction.groupBy({
      by: ['customerPhone'],
      where: { companyId, status: 'SUCCESS' },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    }),
    prisma.mtnMoneyTransaction.groupBy({
      by: ['customerPhone'],
      where: { companyId, status: 'SUCCESSFUL' },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    }),
    prisma.waveTransaction.groupBy({
      by: ['customerPhone'],
      where: { companyId, status: 'SUCCESS' },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    }),
  ]);

  // Combiner les résultats
  const clientMap = new Map<string, { phone: string; totalAmount: number; transactions: number }>();

  const processGrouped = (data: any[], operateur: string) => {
    data.forEach(item => {
      const phone = item.customerPhone;
      const existing = clientMap.get(phone) || { phone, totalAmount: 0, transactions: 0 };
      existing.totalAmount += item._sum.amount || 0;
      existing.transactions += item._count;
      clientMap.set(phone, existing);
    });
  };

  processGrouped(orangeByPhone, 'orange');
  processGrouped(mtnByPhone, 'mtn');
  processGrouped(waveByPhone, 'wave');

  return Array.from(clientMap.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit);
}

export default router;
