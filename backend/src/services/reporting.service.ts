// @ts-nocheck
// Service de Reporting Avancé pour GuinéaManager
import prisma from '../utils/prisma';
import logger from '../utils/logger';

export interface ReportConfig {
  type: 'revenue' | 'clients' | 'products' | 'expenses' | 'payroll' | 'cashflow' | 'profit';
  period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: Date;
  endDate?: Date;
  companyId: string;
  comparePrevious?: boolean;
  groupBy?: 'day' | 'week' | 'month' | 'category' | 'client' | 'product';
}

export interface ReportData {
  title: string;
  period: string;
  generatedAt: Date;
  summary: Record<string, number>;
  data: any[];
  comparison?: {
    previousPeriod: string;
    changes: Record<string, { value: number; percentage: number }>;
  };
  charts?: {
    type: string;
    data: any[];
  }[];
}

/**
 * Générer un rapport de revenus
 */
export async function generateRevenueReport(config: ReportConfig): Promise<ReportData> {
  const { companyId, startDate, endDate, comparePrevious, groupBy } = config;

  // Définir les dates
  const start = startDate || getStartDate(config.period);
  const end = endDate || new Date();

  // Récupérer les factures de la période
  const factures = await prisma.facture.findMany({
    where: {
      companyId,
      createdAt: { gte: start, lte: end }
    },
    include: {
      client: { select: { nom: true } }
    }
  });

  // Calculer les totaux
  const totalHT = factures.reduce((sum, f) => sum + f.montantHT, 0);
  const totalTTC = factures.reduce((sum, f) => sum + f.montantTTC, 0);
  const totalPaye = factures.reduce((sum, f) => sum + f.montantPaye, 0);
  const totalImpaye = totalTTC - totalPaye;

  // Grouper par période
  const groupedData = groupByPeriod(factures, groupBy || 'month', 'createdAt');

  // Comparaison avec la période précédente
  let comparison = undefined;
  if (comparePrevious) {
    const previousStart = getPreviousPeriodStart(start, config.period);
    const previousFactures = await prisma.facture.findMany({
      where: {
        companyId,
        createdAt: { gte: previousStart, lt: start }
      }
    });

    const previousTotal = previousFactures.reduce((sum, f) => sum + f.montantTTC, 0);
    const revenueChange = totalTTC - previousTotal;
    const percentageChange = previousTotal > 0 ? (revenueChange / previousTotal) * 100 : 0;

    comparison = {
      previousPeriod: `${previousStart.toISOString().split('T')[0]} - ${start.toISOString().split('T')[0]}`,
      changes: {
        revenue: { value: revenueChange, percentage: percentageChange }
      }
    };
  }

  return {
    title: 'Rapport des Revenus',
    period: `${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`,
    generatedAt: new Date(),
    summary: {
      totalFactures: factures.length,
      totalHT,
      totalTTC,
      totalPaye,
      totalImpaye,
      tauxRecouvrement: totalTTC > 0 ? (totalPaye / totalTTC) * 100 : 0
    },
    data: groupedData,
    comparison,
    charts: [
      {
        type: 'line',
        data: groupedData.map(d => ({ x: d.period, y: d.totalTTC }))
      }
    ]
  };
}

/**
 * Générer un rapport des clients
 */
export async function generateClientsReport(config: ReportConfig): Promise<ReportData> {
  const { companyId, startDate, endDate } = config;

  const start = startDate || getStartDate(config.period);
  const end = endDate || new Date();

  // Récupérer les clients
  const clients = await prisma.client.findMany({
    where: { companyId },
    include: {
      factures: {
        where: { createdAt: { gte: start, lte: end } },
        select: { montantTTC: true, statut: true }
      }
    }
  });

  // Calculer les métriques
  const totalClients = clients.length;
  const nouveauxClients = clients.filter(c => c.createdAt >= start && c.createdAt <= end).length;
  const clientsActifs = clients.filter(c => c.factures.length > 0).length;

  // Top clients par chiffre d'affaires
  const clientsCA = clients.map(c => ({
    nom: c.nom,
    email: c.email,
    totalAchats: c.factures.reduce((sum, f) => sum + f.montantTTC, 0),
    nombreFactures: c.factures.length
  })).sort((a, b) => b.totalAchats - a.totalAchats);

  const topClients = clientsCA.slice(0, 10);

  return {
    title: 'Rapport des Clients',
    period: `${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`,
    generatedAt: new Date(),
    summary: {
      totalClients,
      nouveauxClients,
      clientsActifs,
      tauxRetention: totalClients > 0 ? (clientsActifs / totalClients) * 100 : 0
    },
    data: clientsCA,
    charts: [
      {
        type: 'bar',
        data: topClients.map(c => ({ x: c.nom, y: c.totalAchats }))
      }
    ]
  };
}

/**
 * Générer un rapport des produits
 */
export async function generateProductsReport(config: ReportConfig): Promise<ReportData> {
  const { companyId, startDate, endDate } = config;

  const start = startDate || getStartDate(config.period);
  const end = endDate || new Date();

  // Récupérer les produits
  const produits = await prisma.produit.findMany({
    where: { companyId },
    include: {
      lignesFacture: {
        where: { facture: { createdAt: { gte: start, lte: end } } },
        select: { quantite: true, montantHT: true }
      }
    }
  });

  // Calculer les métriques
  const totalProduits = produits.length;
  const produitsActifs = produits.filter(p => p.actif).length;
  const produitsStockBas = produits.filter(p => p.stockActuel <= p.stockMin).length;
  const produitsRupture = produits.filter(p => p.stockActuel === 0).length;

  // Top produits vendus
  const produitsVentes = produits.map(p => {
    const quantiteVendue = p.lignesFacture.reduce((sum, l) => sum + l.quantite, 0);
    const chiffreAffaire = p.lignesFacture.reduce((sum, l) => sum + l.montantHT, 0);
    return {
      nom: p.nom,
      reference: p.reference,
      categorie: p.categorie,
      stockActuel: p.stockActuel,
      quantiteVendue,
      chiffreAffaire
    };
  }).sort((a, b) => b.chiffreAffaire - a.chiffreAffaire);

  const topProduits = produitsVentes.slice(0, 10);

  // Valeur du stock
  const valeurStock = produits.reduce((sum, p) => sum + (p.stockActuel * p.prixUnitaire), 0);

  return {
    title: 'Rapport des Produits',
    period: `${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`,
    generatedAt: new Date(),
    summary: {
      totalProduits,
      produitsActifs,
      produitsStockBas,
      produitsRupture,
      valeurStock
    },
    data: produitsVentes,
    charts: [
      {
        type: 'bar',
        data: topProduits.map(p => ({ x: p.nom, y: p.chiffreAffaire }))
      },
      {
        type: 'pie',
        data: produitsVentes.filter(p => p.categorie).reduce((acc, p) => {
          const cat = p.categorie || 'Autre';
          acc[cat] = (acc[cat] || 0) + p.chiffreAffaire;
          return acc;
        }, {} as Record<string, number>)
      }
    ]
  };
}

/**
 * Générer un rapport de trésorerie
 */
export async function generateCashflowReport(config: ReportConfig): Promise<ReportData> {
  const { companyId, startDate, endDate } = config;

  const start = startDate || getStartDate(config.period);
  const end = endDate || new Date();

  // Récupérer les données
  const [factures, depenses, paiementsPaie] = await Promise.all([
    // Factures
    prisma.facture.findMany({
      where: { companyId, createdAt: { gte: start, lte: end } },
      select: { montantPaye: true, createdAt: true }
    }),
    // Dépenses
    prisma.depense.findMany({
      where: { companyId, date: { gte: start, lte: end } },
      select: { montant: true, categorie: true, date: true }
    }),
    // Paie
    prisma.bulletinPaie.findMany({
      where: { companyId, datePaiement: { gte: start, lte: end } },
      select: { netAPayer: true, datePaiement: true }
    })
  ]);

  // Calculer les flux
  const entrees = factures.reduce((sum, f) => sum + f.montantPaye, 0);
  const depensesTotal = depenses.reduce((sum, d) => sum + d.montant, 0);
  const paieTotal = paiementsPaie.reduce((sum, p) => sum + p.netAPayer, 0);
  const sorties = depensesTotal + paieTotal;
  const fluxNet = entrees - sorties;

  // Grouper par mois
  const fluxParMois: Record<string, { entrees: number; sorties: number }> = {};

  factures.forEach(f => {
    const mois = f.createdAt.toISOString().substring(0, 7);
    if (!fluxParMois[mois]) fluxParMois[mois] = { entrees: 0, sorties: 0 };
    fluxParMois[mois].entrees += f.montantPaye;
  });

  depenses.forEach(d => {
    const mois = d.date.toISOString().substring(0, 7);
    if (!fluxParMois[mois]) fluxParMois[mois] = { entrees: 0, sorties: 0 };
    fluxParMois[mois].sorties += d.montant;
  });

  paiementsPaie.forEach(p => {
    if (p.datePaiement) {
      const mois = p.datePaiement.toISOString().substring(0, 7);
      if (!fluxParMois[mois]) fluxParMois[mois] = { entrees: 0, sorties: 0 };
      fluxParMois[mois].sorties += p.netAPayer;
    }
  });

  // Dépenses par catégorie
  const depensesParCategorie = depenses.reduce((acc, d) => {
    acc[d.categorie] = (acc[d.categorie] || 0) + d.montant;
    return acc;
  }, {} as Record<string, number>);

  return {
    title: 'Rapport de Trésorerie',
    period: `${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`,
    generatedAt: new Date(),
    summary: {
      entrees,
      sorties,
      fluxNet,
      depenses: depensesTotal,
      paie: paieTotal
    },
    data: Object.entries(fluxParMois).map(([mois, flux]) => ({
      mois,
      entrees: flux.entrees,
      sorties: flux.sorties,
      fluxNet: flux.entrees - flux.sorties
    })),
    charts: [
      {
        type: 'line',
        data: Object.entries(fluxParMois).map(([mois, flux]) => ({
          x: mois,
          y: flux.entrees - flux.sorties
        }))
      },
      {
        type: 'pie',
        data: depensesParCategorie
      }
    ]
  };
}

/**
 * Générer un rapport de profit
 */
export async function generateProfitReport(config: ReportConfig): Promise<ReportData> {
  const { companyId, startDate, endDate } = config;

  const start = startDate || getStartDate(config.period);
  const end = endDate || new Date();

  // Récupérer toutes les données
  const [factures, depenses, bulletinsPaie] = await Promise.all([
    prisma.facture.findMany({
      where: { companyId, createdAt: { gte: start, lte: end } }
    }),
    prisma.depense.findMany({
      where: { companyId, date: { gte: start, lte: end } }
    }),
    prisma.bulletinPaie.findMany({
      where: { companyId, createdAt: { gte: start, lte: end } }
    })
  ]);

  // Calculs
  const chiffreAffaires = factures.reduce((sum, f) => sum + f.montantHT, 0);
  const coutAchat = 0; // À calculer selon les achats
  const margeBrute = chiffreAffaires - coutAchat;
  
  const chargesExploitation = depenses.reduce((sum, d) => sum + d.montant, 0);
  const chargesPersonnel = bulletinsPaie.reduce((sum, b) => sum + b.coutTotalEmployeur, 0);
  const chargesTotales = chargesExploitation + chargesPersonnel;
  
  const resultatExploitation = margeBrute - chargesTotales;

  return {
    title: 'Rapport de Rentabilité',
    period: `${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`,
    generatedAt: new Date(),
    summary: {
      chiffreAffaires,
      margeBrute,
      tauxMarge: chiffreAffaires > 0 ? (margeBrute / chiffreAffaires) * 100 : 0,
      chargesExploitation,
      chargesPersonnel,
      chargesTotales,
      resultatExploitation,
      tauxRentabilite: chiffreAffaires > 0 ? (resultatExploitation / chiffreAffaires) * 100 : 0
    },
    data: [{
      categorie: 'Chiffre d\'affaires',
      montant: chiffreAffaires
    }, {
      categorie: 'Marge brute',
      montant: margeBrute
    }, {
      categorie: 'Charges d\'exploitation',
      montant: -chargesExploitation
    }, {
      categorie: 'Charges de personnel',
      montant: -chargesPersonnel
    }, {
      categorie: 'Résultat d\'exploitation',
      montant: resultatExploitation
    }],
    charts: [
      {
        type: 'waterfall',
        data: [
          { x: 'CA', y: chiffreAffaires },
          { x: 'Marge', y: margeBrute },
          { x: 'Charges', y: -chargesTotales },
          { x: 'Résultat', y: resultatExploitation }
        ]
      }
    ]
  };
}

// ==========================================
// UTILITAIRES
// ==========================================

function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case 'day':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return weekStart;
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      return new Date(now.getFullYear(), quarter * 3, 1);
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}

function getPreviousPeriodStart(currentStart: Date, period: string): Date {
  const previous = new Date(currentStart);
  switch (period) {
    case 'day':
      previous.setDate(previous.getDate() - 1);
      break;
    case 'week':
      previous.setDate(previous.getDate() - 7);
      break;
    case 'month':
      previous.setMonth(previous.getMonth() - 1);
      break;
    case 'quarter':
      previous.setMonth(previous.getMonth() - 3);
      break;
    case 'year':
      previous.setFullYear(previous.getFullYear() - 1);
      break;
  }
  return previous;
}

function groupByPeriod(data: any[], groupBy: string, dateField: string): any[] {
  const grouped: Record<string, any> = {};

  data.forEach(item => {
    const date = new Date(item[dateField]);
    let key: string;

    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = date.toISOString().substring(0, 7);
        break;
      default:
        key = date.toISOString().substring(0, 7);
    }

    if (!grouped[key]) {
      grouped[key] = {
        period: key,
        count: 0,
        totalHT: 0,
        totalTTC: 0
      };
    }

    grouped[key].count++;
    grouped[key].totalHT += item.montantHT || 0;
    grouped[key].totalTTC += item.montantTTC || 0;
  });

  return Object.values(grouped).sort((a: any, b: any) => a.period.localeCompare(b.period));
}

export default {
  generateRevenueReport,
  generateClientsReport,
  generateProductsReport,
  generateCashflowReport,
  generateProfitReport
};
