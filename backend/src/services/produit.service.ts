// Produit Service for GuinéaManager ERP

import prisma from '../utils/database';
import { CreateProduitInput, UpdateProduitInput, produitFilterSchema } from '../utils/validation';
import { NotFoundError, ConflictError } from '../middlewares/error.middleware';
import { z } from 'zod';

/**
 * Create a new product
 */
export const createProduit = async (
  companyId: string,
  data: CreateProduitInput
) => {
  const produit = await prisma.produit.create({
    data: {
      nom: data.nom,
      description: data.description,
      prixUnitaire: data.prixUnitaire ?? 0,
      unite: data.unite ?? 'Unité',
      stockActuel: data.stockActuel ?? 0,
      stockMin: data.stockMin ?? 0,
      categorie: data.categorie,
      type: data.type ?? 'PRODUIT',
      tva: data.tva ?? 18,
      reference: data.reference,
      actif: data.actif ?? true,
      company: {
        connect: { id: companyId },
      },
    },
  });

  return produit;
};

/**
 * Get all products with pagination and filtering
 */
export const getProduits = async (
  companyId: string,
  params: z.infer<typeof produitFilterSchema>
) => {
  const { page, limit, search, categorie, actif } = params;
  const skip = (page - 1) * limit;

  const where = {
    companyId,
    ...(search && {
      OR: [
        { nom: { contains: search } },
        { description: { contains: search } },
      ],
    }),
    ...(categorie && { categorie }),
    ...(actif !== undefined && { actif }),
  };

  const [produits, total] = await Promise.all([
    prisma.produit.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.produit.count({ where }),
  ]);

  return {
    data: produits,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get product by ID
 */
export const getProduitById = async (companyId: string, produitId: string) => {
  const produit = await prisma.produit.findFirst({
    where: {
      id: produitId,
      companyId,
    },
  });

  if (!produit) {
    throw new NotFoundError('Produit non trouvé');
  }

  return produit;
};

/**
 * Update product
 */
export const updateProduit = async (
  companyId: string,
  produitId: string,
  data: UpdateProduitInput
) => {
  // Verify product exists and belongs to company
  const existingProduit = await prisma.produit.findFirst({
    where: { id: produitId, companyId },
  });

  if (!existingProduit) {
    throw new NotFoundError('Produit non trouvé');
  }

  // Build update data, filtering out null/undefined values
  const updateData: any = {};
  if (data.nom !== undefined && data.nom !== null) updateData.nom = data.nom;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.reference !== undefined) updateData.reference = data.reference;
  if (data.prixUnitaire !== undefined && data.prixUnitaire !== null) updateData.prixUnitaire = data.prixUnitaire;
  if (data.unite !== undefined && data.unite !== null) updateData.unite = data.unite;
  if (data.stockActuel !== undefined && data.stockActuel !== null) updateData.stockActuel = data.stockActuel;
  if (data.stockMin !== undefined && data.stockMin !== null) updateData.stockMin = data.stockMin;
  if (data.stockMax !== undefined) updateData.stockMax = data.stockMax;
  if (data.categorie !== undefined) updateData.categorie = data.categorie;
  if (data.tva !== undefined && data.tva !== null) updateData.tva = data.tva;
  if (data.type !== undefined && data.type !== null) updateData.type = data.type;

  const produit = await prisma.produit.update({
    where: { id: produitId },
    data: updateData,
  });

  return produit;
};

/**
 * Delete product
 */
export const deleteProduit = async (companyId: string, produitId: string) => {
  // Verify product exists and belongs to company
  const existingProduit = await prisma.produit.findFirst({
    where: { id: produitId, companyId },
    include: {
      _count: {
        select: { lignesFacture: true },
      },
    },
  });

  if (!existingProduit) {
    throw new NotFoundError('Produit non trouvé');
  }

  if (existingProduit._count.lignesFacture > 0) {
    throw new ConflictError(
      'Impossible de supprimer ce produit car il est utilisé dans des factures'
    );
  }

  await prisma.produit.delete({
    where: { id: produitId },
  });

  return true;
};

/**
 * Get products with low stock
 */
export const getProduitsStockBas = async (companyId: string) => {
  const produits = await prisma.produit.findMany({
    where: {
      companyId,
      actif: true,
      stockActuel: { lte: prisma.produit.fields.stockMin },
    },
    orderBy: { stockActuel: 'asc' },
  });

  return produits;
};

/**
 * Update product stock
 */
export const updateStock = async (
  produitId: string,
  quantite: number,
  operation: 'add' | 'subtract'
) => {
  const produit = await prisma.produit.findUnique({
    where: { id: produitId },
    select: { stockActuel: true },
  });

  if (!produit) {
    throw new NotFoundError('Produit non trouvé');
  }

  const newStock =
    operation === 'add'
      ? produit.stockActuel + quantite
      : produit.stockActuel - quantite;

  if (newStock < 0) {
    throw new ConflictError('Stock insuffisant');
  }

  await prisma.produit.update({
    where: { id: produitId },
    data: { stockActuel: newStock },
  });
};

/**
 * Get product categories
 */
export const getCategories = async (companyId: string) => {
  const categories = await prisma.produit.groupBy({
    by: ['categorie'],
    where: {
      companyId,
      categorie: { not: null },
    },
    _count: { id: true },
  });

  return categories
    .filter((c) => c.categorie)
    .map((item) => ({
      nom: item.categorie,
      count: item._count.id,
    }));
};

/**
 * Get product statistics
 */
export const getProduitStats = async (companyId: string) => {
  const [totalProduits, produitsActifs, produitsStockBas, categories] =
    await Promise.all([
      prisma.produit.count({ where: { companyId } }),
      prisma.produit.count({ where: { companyId, actif: true } }),
      prisma.produit.count({
        where: {
          companyId,
          actif: true,
          stockActuel: { lte: prisma.produit.fields.stockMin },
        },
      }),
      getCategories(companyId),
    ]);

  return {
    totalProduits,
    produitsActifs,
    produitsInactifs: totalProduits - produitsActifs,
    produitsStockBas,
    categories,
  };
};

// ============ ALIASES FOR CONTROLLER COMPATIBILITY ============
export const listProduits = getProduits;
export const getProduit = getProduitById;
export const getStockAlert = getProduitsStockBas;
export const getStockStats = getProduitStats;

/**
 * Search products
 */
export const searchProduits = async (
  companyId: string,
  query: string,
  limit: number = 10
) => {
  return prisma.produit.findMany({
    where: {
      companyId,
      actif: true,
      OR: [
        { nom: { contains: query } },
        { reference: { contains: query } },
        { description: { contains: query } },
      ],
    },
    take: limit,
    orderBy: { nom: 'asc' },
  });
};

/**
 * Update stock with operation
 */
export const updateStockWithOperation = async (
  companyId: string,
  produitId: string,
  quantity: number,
  operation: 'ADD' | 'SUBTRACT' | 'SET' = 'ADD'
) => {
  const produit = await prisma.produit.findFirst({
    where: { id: produitId, companyId },
  });

  if (!produit) {
    throw new NotFoundError('Produit non trouvé');
  }

  let newStock = produit.stockActuel;
  switch (operation) {
    case 'ADD':
      newStock = produit.stockActuel + quantity;
      break;
    case 'SUBTRACT':
      newStock = Math.max(0, produit.stockActuel - quantity);
      break;
    case 'SET':
      newStock = quantity;
      break;
  }

  return prisma.produit.update({
    where: { id: produitId },
    data: { stockActuel: newStock },
  });
};
