// Routes pour la gestion des modules
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as modulesService from '../services/modules.service';
import { AuthenticatedRequest } from '../types';

const router = Router();

// GET /api/modules - Obtenir tous les modules disponibles
router.get('/', authMiddleware, async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: modulesService.AVAILABLE_MODULES
    });
  } catch (error) {
    console.error('Error getting modules:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des modules'
    });
  }
});

// GET /api/modules/company - Obtenir les modules configurés pour l'entreprise
router.get('/company', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;

    const modules = await modulesService.getCompanyModules(companyId);

    res.json({
      success: true,
      data: modules
    });
  } catch (error) {
    console.error('Error getting company modules:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des modules de l\'entreprise'
    });
  }
});

// PUT /api/modules/:moduleCode - Mettre à jour un module
router.put('/:moduleCode', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;
    const { moduleCode } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Le champ "enabled" doit être un booléen'
      });
    }

    const config = await modulesService.updateModuleConfiguration(
      companyId,
      moduleCode,
      enabled
    );

    res.json({
      success: true,
      data: config,
      message: `Module ${moduleCode} ${enabled ? 'activé' : 'désactivé'}`
    });
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du module'
    });
  }
});

// PUT /api/modules/batch - Mettre à jour plusieurs modules
router.put('/batch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;
    const { modules } = req.body;

    if (!Array.isArray(modules)) {
      return res.status(400).json({
        success: false,
        message: 'Le corps de la requête doit contenir un tableau "modules"'
      });
    }

    const results = await modulesService.batchUpdateModules(companyId, modules);

    res.json({
      success: true,
      data: results,
      message: `${results.length} modules mis à jour`
    });
  } catch (error) {
    console.error('Error batch updating modules:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des modules'
    });
  }
});

// GET /api/modules/:moduleCode/enabled - Vérifier si un module est activé
router.get('/:moduleCode/enabled', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.companyId!;
    const { moduleCode } = req.params;

    const enabled = await modulesService.isModuleEnabled(companyId, moduleCode);

    res.json({
      success: true,
      data: { moduleCode, enabled }
    });
  } catch (error) {
    console.error('Error checking module status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du module'
    });
  }
});

export default router;
