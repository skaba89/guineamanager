// Routes Export pour GuinéaManager - PDF et Excel

import { Router, Request, Response } from 'express';
import { authMiddleware, asyncHandler } from '../middlewares';
import * as exportService from '../services/export.service';
import logger from '../utils/logger';

const router = Router();

// Appliquer l'authentification à toutes les routes
router.use(authMiddleware);

// GET /api/exports/bilan/pdf - Exporter le bilan en PDF
router.get(
  '/bilan/pdf',
  asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.user?.companyId;
    const { dateDebut, dateFin } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const options = {
      companyId,
      dateDebut: dateDebut ? new Date(dateDebut as string) : undefined,
      dateFin: dateFin ? new Date(dateFin as string) : undefined,
      format: 'pdf' as const,
    };

    const pdfBuffer = await exportService.genererBilanPDF(options);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bilan-${Date.now()}.pdf"`);
    res.send(pdfBuffer);

    logger.info('Bilan PDF exported', { companyId });
  })
);

// GET /api/exports/journal-ventes/pdf - Exporter le journal des ventes en PDF
router.get(
  '/journal-ventes/pdf',
  asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.user?.companyId;
    const { dateDebut, dateFin } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const options = {
      companyId,
      dateDebut: dateDebut ? new Date(dateDebut as string) : undefined,
      dateFin: dateFin ? new Date(dateFin as string) : undefined,
      format: 'pdf' as const,
    };

    const pdfBuffer = await exportService.genererJournalVentesPDF(options);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="journal-ventes-${Date.now()}.pdf"`);
    res.send(pdfBuffer);

    logger.info('Journal ventes PDF exported', { companyId });
  })
);

// GET /api/exports/clients/excel - Exporter les clients en Excel
router.get(
  '/clients/excel',
  asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const excelBuffer = await exportService.genererClientsExcel({
      companyId,
      format: 'excel',
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="clients-${Date.now()}.xlsx"`);
    res.send(excelBuffer);

    logger.info('Clients Excel exported', { companyId });
  })
);

// GET /api/exports/factures/excel - Exporter les factures en Excel
router.get(
  '/factures/excel',
  asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.user?.companyId;
    const { dateDebut, dateFin } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const excelBuffer = await exportService.genererFacturesExcel({
      companyId,
      dateDebut: dateDebut ? new Date(dateDebut as string) : undefined,
      dateFin: dateFin ? new Date(dateFin as string) : undefined,
      format: 'excel',
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="factures-${Date.now()}.xlsx"`);
    res.send(excelBuffer);

    logger.info('Factures Excel exported', { companyId });
  })
);

// GET /api/exports/stock/excel - Exporter le stock en Excel
router.get(
  '/stock/excel',
  asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const excelBuffer = await exportService.genererStockExcel({
      companyId,
      format: 'excel',
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="stock-${Date.now()}.xlsx"`);
    res.send(excelBuffer);

    logger.info('Stock Excel exported', { companyId });
  })
);

// GET /api/exports/depenses/excel - Exporter les dépenses en Excel
router.get(
  '/depenses/excel',
  asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.user?.companyId;
    const { dateDebut, dateFin } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const excelBuffer = await exportService.genererDepensesExcel({
      companyId,
      dateDebut: dateDebut ? new Date(dateDebut as string) : undefined,
      dateFin: dateFin ? new Date(dateFin as string) : undefined,
      format: 'excel',
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="depenses-${Date.now()}.xlsx"`);
    res.send(excelBuffer);

    logger.info('Dépenses Excel exported', { companyId });
  })
);

export default router;
