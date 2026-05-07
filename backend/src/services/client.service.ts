// Client Service for GuinéaManager ERP

import prisma from '../utils/database';
import { CreateClientInput, UpdateClientInput, clientFilterSchema } from '../utils/validation';
import { NotFoundError, ConflictError } from '../middlewares/error.middleware';
import { ClientFilterParams } from '../types';
import { z } from 'zod';

/**
 * Create a new client
 */
export const createClient = async (
  companyId: string,
  data: CreateClientInput
) => {
  const client = await prisma.client.create({
    data: {
      nom: data.nom,
      email: data.email,
      telephone: data.telephone,
      adresse: data.adresse,
      ville: data.ville,
      pays: data.pays,
      type: data.type?.toUpperCase() || 'PARTICULIER',
      companyId,
    },
  });

  return client;
};

/**
 * Get all clients with pagination and filtering
 */
export const getClients = async (
  companyId: string,
  params: z.infer<typeof clientFilterSchema>
) => {
  const { page, limit, search, type } = params;
  const skip = (page - 1) * limit;

  const where = {
    companyId,
    ...(search && {
      OR: [
        { nom: { contains: search } },
        { email: { contains: search } },
        { telephone: { contains: search } },
      ],
    }),
    ...(type && { type }),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.client.count({ where }),
  ]);

  return {
    data: clients,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get client by ID
 */
export const getClientById = async (companyId: string, clientId: string) => {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      companyId,
    },
    include: {
      factures: {
        select: {
          id: true,
          numero: true,
          dateEmission: true,
          montantTTC: true,
          statut: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: { factures: true },
      },
    },
  });

  if (!client) {
    throw new NotFoundError('Client non trouvé');
  }

  return client;
};

/**
 * Update client
 */
export const updateClient = async (
  companyId: string,
  clientId: string,
  data: UpdateClientInput
) => {
  // Verify client exists and belongs to company
  const existingClient = await prisma.client.findFirst({
    where: { id: clientId, companyId },
  });

  if (!existingClient) {
    throw new NotFoundError('Client non trouvé');
  }

  const client = await prisma.client.update({
    where: { id: clientId },
    data,
  });

  return client;
};

/**
 * Delete client
 */
export const deleteClient = async (companyId: string, clientId: string) => {
  // Verify client exists and belongs to company
  const existingClient = await prisma.client.findFirst({
    where: { id: clientId, companyId },
    include: {
      _count: {
        select: { factures: true },
      },
    },
  });

  if (!existingClient) {
    throw new NotFoundError('Client non trouvé');
  }

  if (existingClient._count.factures > 0) {
    throw new ConflictError(
      'Impossible de supprimer ce client car il a des factures associées'
    );
  }

  await prisma.client.delete({
    where: { id: clientId },
  });

  return true;
};

/**
 * Update client total purchases
 */
export const updateClientTotalAchats = async (clientId: string) => {
  const result = await prisma.facture.aggregate({
    where: {
      clientId,
      statut: 'payee',
    },
    _sum: {
      montantTTC: true,
    },
  });

  await prisma.client.update({
    where: { id: clientId },
    data: {
      totalAchats: result._sum.montantTTC || 0,
    },
  });
};

/**
 * Get client statistics
 */
export const getClientStats = async (companyId: string) => {
  const [totalClients, clientsByType, topClients] = await Promise.all([
    prisma.client.count({ where: { companyId } }),
    prisma.client.groupBy({
      by: ['type'],
      where: { companyId },
      _count: { id: true },
    }),
    prisma.client.findMany({
      where: { companyId },
      orderBy: { totalAchats: 'desc' },
      take: 5,
      select: {
        id: true,
        nom: true,
        totalAchats: true,
      },
    }),
  ]);

  return {
    totalClients,
    clientsByType: clientsByType.map((item) => ({
      type: item.type,
      count: item._count.id,
    })),
    topClients,
  };
};

/**
 * Get clients with outstanding balance
 */
export const getClientsWithBalance = async (companyId: string) => {
  const clients = await prisma.client.findMany({
    where: {
      companyId,
      factures: {
        some: {
          statut: { in: ['envoyee', 'en_retard'] },
        },
      },
    },
    include: {
      _count: {
        select: { factures: true },
      },
      factures: {
        where: {
          statut: { in: ['envoyee', 'en_retard'] },
        },
        select: {
          montantTTC: true,
        },
      },
    },
  });

  return clients.map((client) => ({
    id: client.id,
    nom: client.nom,
    email: client.email,
    telephone: client.telephone,
    totalFactures: client._count.factures,
    soldeDu: client.factures.reduce((sum, f) => sum + (f.montantTTC || 0), 0),
  }));
};

/**
 * Get invoices for a specific client
 */
export const getClientInvoices = async (companyId: string, clientId: string) => {
  const client = await prisma.client.findFirst({
    where: { id: clientId, companyId },
  });

  if (!client) {
    throw new NotFoundError('Client non trouvé');
  }

  const factures = await prisma.facture.findMany({
    where: { clientId, companyId },
    orderBy: { createdAt: 'desc' },
    include: {
      lignes: {
        select: {
          description: true,
          quantite: true,
          prixUnitaire: true,
          tauxTVA: true,
        },
      },
    },
  });

  return factures;
};
