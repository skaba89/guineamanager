// @ts-nocheck
// Routes API pour le Reporting Avancé
import { Router, Request, Response } from 'express';
import { 
  generateRevenueReport, 
  generateClientsReport, 
  generateProductsReport,
  generateCashflowReport,
  generateProfitReport
} from '../services/reporting.service';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * GET /api/reports/revenue
 * Rapport des revenus
 */
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const { period, startDate, endDate, comparePrevious, groupBy } = req.query;
    const companyId = (req as any).companyId;

    const report = await generateRevenueReport({
      type: 'revenue',
      period: (period as string) || 'month',
      companyId,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      comparePrevious: comparePrevious === 'true',
      groupBy: groupBy as any
    });

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error generating revenue report:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du rapport'
    });
  }
});

/**
 * GET /api/reports/clients
 * Rapport des clients
 */
router.get('/clients', async (req: Request, res: Response) => {
  try {
    const { period, startDate, endDate } = req.query;
    const companyId = (req as any).companyId;

    const report = await generateClientsReport({
      type: 'clients',
      period: (period as string) || 'month',
      companyId,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error generating clients report:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du rapport'
    });
  }
});

/**
 * GET /api/reports/products
 * Rapport des produits
 */
router.get('/products', async (req: Request, res: Response) => {
  try {
    const { period, startDate, endDate } = req.query;
    const companyId = (req as any).companyId;

    const report = await generateProductsReport({
      type: 'products',
      period: (period as string) || 'month',
      companyId,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error generating products report:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du rapport'
    });
  }
});

/**
 * GET /api/reports/cashflow
 * Rapport de trésorerie
 */
router.get('/cashflow', async (req: Request, res: Response) => {
  try {
    const { period, startDate, endDate } = req.query;
    const companyId = (req as any).companyId;

    const report = await generateCashflowReport({
      type: 'cashflow',
      period: (period as string) || 'month',
      companyId,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error generating cashflow report:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du rapport'
    });
  }
});

/**
 * GET /api/reports/profit
 * Rapport de profit/rentabilité
 */
router.get('/profit', async (req: Request, res: Response) => {
  try {
    const { period, startDate, endDate } = req.query;
    const companyId = (req as any).companyId;

    const report = await generateProfitReport({
      type: 'profit',
      period: (period as string) || 'month',
      companyId,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error generating profit report:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du rapport'
    });
  }
});

/**
 * GET /api/reports/dashboard
 * Dashboard consolidé
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;

    // Générer tous les rapports en parallèle
    const [revenue, clients, cashflow] = await Promise.all([
      generateRevenueReport({ type: 'revenue', period: 'month', companyId }),
      generateClientsReport({ type: 'clients', period: 'month', companyId }),
      generateCashflowReport({ type: 'cashflow', period: 'month', companyId })
    ]);

    res.json({
      success: true,
      data: {
        revenue: revenue.summary,
        clients: clients.summary,
        cashflow: cashflow.summary,
        charts: {
          revenue: revenue.charts,
          cashflow: cashflow.charts
        }
      }
    });

  } catch (error) {
    console.error('Error generating dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du dashboard'
    });
  }
});

export default router;
