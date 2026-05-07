// Contrôleur Produit pour GuinéaManager

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as produitService from '../services/produit.service';
import { AuthenticatedRequest, PaginationInput } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

// Schémas de validation
const createProduitSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  reference: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  prixUnitaire: z.coerce.number().min(0, 'Le prix unitaire doit être positif').default(0),
  unite: z.string().optional().default('Unité'),
  stockActuel: z.coerce.number().int().min(0).optional().default(0),
  stockMin: z.coerce.number().int().min(0).optional().default(0),
  stockMax: z.coerce.number().int().min(0).optional().nullable(),
  categorie: z.string().optional().nullable(),
  tva: z.coerce.number().min(0).max(100).optional().default(18),
  type: z.enum(['PRODUIT', 'SERVICE']).optional().default('PRODUIT'),
});

const updateProduitSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  reference: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  prixUnitaire: z.coerce.number().min(0, 'Le prix unitaire doit être positif').optional(),
  unite: z.string().optional(),
  stockActuel: z.coerce.number().int().min(0).optional(),
  stockMin: z.coerce.number().int().min(0).optional(),
  stockMax: z.coerce.number().int().min(0).optional().nullable(),
  categorie: z.string().optional().nullable(),
  tva: z.coerce.number().min(0).max(100).optional(),
  type: z.enum(['PRODUIT', 'SERVICE']).optional(),
});

const updateStockSchema = z.object({
  quantity: z.number().int(),
  operation: z.enum(['ADD', 'SUBTRACT', 'SET']).optional(),
});

// Créer un produit
export const createProduit = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const validated = createProduitSchema.parse(req.body);
      const { companyId } = req as AuthenticatedRequest;

      const produit = await produitService.createProduit(companyId, validated);

      res.status(201).json({
        success: true,
        data: produit,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        console.error('Validation error:', error.errors);
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Erreur de validation',
            details: error.errors,
          },
        });
        return;
      }
      throw error;
    }
  }
);

// Obtenir un produit
export const getProduit = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const produit = await produitService.getProduit(companyId, id);

    res.json({
      success: true,
      data: produit,
    });
  }
);

// Lister les produits
export const listProduits = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { page, limit, sortBy, sortOrder, search } = req.query;

    const pagination: PaginationInput = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      search: search as string,
    };

    const result = await produitService.listProduits(companyId, pagination);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  }
);

// Mettre à jour un produit
export const updateProduit = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = updateProduitSchema.parse(req.body);
    const { companyId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const produit = await produitService.updateProduit(companyId, id, validated);

    res.json({
      success: true,
      data: produit,
    });
  }
);

// Supprimer un produit
export const deleteProduit = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const result = await produitService.deleteProduit(companyId, id);

    res.json({
      success: true,
      data: result,
    });
  }
);

// Obtenir les produits en alerte de stock
export const getStockAlert = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;

    const produits = await produitService.getStockAlert(companyId);

    res.json({
      success: true,
      data: produits,
    });
  }
);

// Mettre à jour le stock
export const updateStock = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const validated = updateStockSchema.parse(req.body);
    const { companyId } = req as AuthenticatedRequest;
    const { id } = req.params;

    const produit = await produitService.updateStockWithOperation(
      companyId,
      id,
      validated.quantity,
      validated.operation
    );

    res.json({
      success: true,
      data: produit,
    });
  }
);

// Rechercher des produits
export const searchProduits = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;
    const { q, limit } = req.query;

    if (!q) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    const produits = await produitService.searchProduits(
      companyId,
      q as string,
      limit ? parseInt(limit as string) : 10
    );

    res.json({
      success: true,
      data: produits,
    });
  }
);

// Obtenir les statistiques de stock
export const getStockStats = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { companyId } = req as AuthenticatedRequest;

    const stats = await produitService.getStockStats(companyId);

    res.json({
      success: true,
      data: stats,
    });
  }
);

export default {
  createProduit,
  getProduit,
  listProduits,
  updateProduit,
  deleteProduit,
  getStockAlert,
  updateStock,
  searchProduits,
  getStockStats,
};
