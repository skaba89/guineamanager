// @ts-nocheck
// Service d'export pour GuinéaManager - PDF et Excel

import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { Readable } from 'stream';

// Types
interface ExportOptions {
  companyId: string;
  dateDebut?: Date;
  dateFin?: Date;
  format: 'pdf' | 'excel';
}

interface RapportCA {
  periode: string;
  chiffreAffaires: number;
  nbFactures: number;
  marge: number;
}

interface RapportClient {
  nom: string;
  email: string;
  telephone: string;
  totalAchats: number;
  nbFactures: number;
  derniereFacture: Date | null;
}

interface RapportProduit {
  nom: string;
  reference: string;
  stockActuel: number;
  stockMin: number;
  prixUnitaire: number;
  valeurStock: number;
}

interface RapportDepense {
  date: Date;
  description: string;
  categorie: string;
  montant: number;
  beneficiaire: string;
}

// Helper pour formater les montants en GNF
const formatGNF = (montant: number): string => {
  return new Intl.NumberFormat('fr-GN', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant) + ' GNF';
};

// Helper pour formater les dates
const formatDate = (date: Date | string | null): string => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR');
};

// =============================================
// EXPORT PDF
// =============================================

// Générer un rapport PDF - Bilan simplifié
export const genererBilanPDF = async (options: ExportOptions): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    try {
      const company = await prisma.company.findUnique({
        where: { id: options.companyId },
      });

      const bilan = await getBilanData(options.companyId, options.dateDebut, options.dateFin);

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Bilan - ${company?.nom || 'Entreprise'}`,
          Author: 'GuinéaManager ERP',
          Subject: 'Rapport financier',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text(company?.nom || 'Entreprise', { align: 'center' });
      
      doc.fontSize(14)
         .font('Helvetica')
         .text('Bilan Financier Simplifié', { align: 'center' });

      doc.moveDown();
      doc.fontSize(10)
         .text(`Période: ${formatDate(bilan.periode.debut)} - ${formatDate(bilan.periode.fin)}`, { align: 'center' });
      
      doc.moveDown(2);

      // Section Produits
      doc.fontSize(14).font('Helvetica-Bold').text('PRODUITS', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(11).font('Helvetica');
      doc.text(`Chiffre d'affaires: ${formatGNF(bilan.produits.chiffreAffaires)}`);
      doc.moveDown();

      // Section Charges
      doc.fontSize(14).font('Helvetica-Bold').text('CHARGES', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(11).font('Helvetica');
      doc.text(`Dépenses: ${formatGNF(bilan.charges.depenses)}`);
      doc.text(`Salaires: ${formatGNF(bilan.charges.salaires)}`);
      doc.text(`Total charges: ${formatGNF(bilan.charges.totalCharges)}`, { continued: false });
      doc.moveDown();

      // Résultat
      doc.fontSize(14).font('Helvetica-Bold');
      const isPositive = bilan.resultatNet >= 0;
      doc.fillColor(isPositive ? '#10b981' : '#ef4444')
         .text(`RÉSULTAT NET: ${formatGNF(bilan.resultatNet)}`);
      doc.fillColor('black');
      
      doc.fontSize(11).font('Helvetica');
      doc.text(`Rentabilité: ${bilan.rentabilite}%`);
      doc.moveDown(2);

      // Section Actif
      doc.fontSize(14).font('Helvetica-Bold').text('ACTIF', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(11).font('Helvetica');
      doc.text(`Créances clients: ${formatGNF(bilan.actif.creancesClients)}`);
      doc.text(`Valeur du stock: ${formatGNF(bilan.actif.stock)}`);
      doc.moveDown();

      // Pied de page
      doc.fontSize(8)
         .fillColor('#64748b')
         .text(`Généré par GuinéaManager ERP - ${new Date().toLocaleString('fr-FR')}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Générer un rapport PDF - Journal des ventes
export const genererJournalVentesPDF = async (options: ExportOptions): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    try {
      const company = await prisma.company.findUnique({
        where: { id: options.companyId },
      });

      const factures = await prisma.facture.findMany({
        where: {
          companyId: options.companyId,
          dateEmission: {
            gte: options.dateDebut,
            lte: options.dateFin,
          },
        },
        include: {
          client: { select: { nom: true } },
        },
        orderBy: { dateEmission: 'desc' },
      });

      const doc = new PDFDocument({
        size: 'A4',
        margin: 30,
        info: {
          Title: `Journal des ventes - ${company?.nom || 'Entreprise'}`,
          Author: 'GuinéaManager ERP',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc.fontSize(18).font('Helvetica-Bold').text('Journal des Ventes', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(company?.nom || '', { align: 'center' });
      doc.fontSize(10).text(`Période: ${formatDate(options.dateDebut || new Date())} - ${formatDate(options.dateFin || new Date())}`, { align: 'center' });
      doc.moveDown();

      // Tableau
      const tableTop = doc.y;
      const colWidths = [70, 140, 80, 80, 60];
      const headers = ['Date', 'Client', 'Facture', 'Montant TTC', 'Statut'];

      // En-têtes du tableau
      doc.font('Helvetica-Bold').fontSize(9);
      let x = 30;
      headers.forEach((header, i) => {
        doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });
      doc.moveDown(0.5);

      // Ligne de séparation
      doc.moveTo(30, doc.y).lineTo(565, doc.y).stroke();
      doc.moveDown(0.3);

      // Données
      doc.font('Helvetica').fontSize(8);
      let y = doc.y;
      let totalTTC = 0;

      factures.forEach((facture) => {
        if (y > 750) {
          doc.addPage();
          y = 30;
        }

        x = 30;
        doc.text(formatDate(facture.dateEmission), x, y, { width: colWidths[0] });
        x += colWidths[0];
        doc.text(facture.client?.nom || '-', x, y, { width: colWidths[1] });
        x += colWidths[1];
        doc.text(facture.numero, x, y, { width: colWidths[2] });
        x += colWidths[2];
        doc.text(formatGNF(facture.montantTTC), x, y, { width: colWidths[3] });
        x += colWidths[3];
        doc.text(facture.statut, x, y, { width: colWidths[4] });
        
        totalTTC += facture.montantTTC;
        y += 15;
      });

      // Total
      doc.moveDown();
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text(`Total: ${formatGNF(totalTTC)} (${factures.length} factures)`, { align: 'right' });

      // Pied de page
      doc.fontSize(8).fillColor('#64748b')
         .text(`Généré par GuinéaManager ERP - ${new Date().toLocaleString('fr-FR')}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// =============================================
// EXPORT EXCEL
// =============================================

// Générer un rapport Excel - Données clients
export const genererClientsExcel = async (options: ExportOptions): Promise<Buffer> => {
  const clients = await prisma.client.findMany({
    where: { companyId: options.companyId },
    orderBy: { nom: 'asc' },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Clients');

  // En-têtes
  worksheet.columns = [
    { header: 'Nom', key: 'nom', width: 30 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Téléphone', key: 'telephone', width: 15 },
    { header: 'Adresse', key: 'adresse', width: 40 },
    { header: 'Total Achats', key: 'totalAchats', width: 15 },
    { header: 'Statut', key: 'statut', width: 12 },
    { header: 'Date création', key: 'createdAt', width: 15 },
  ];

  // Style des en-têtes
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' },
  };

  // Données
  clients.forEach((client) => {
    worksheet.addRow({
      nom: client.nom,
      email: client.email || '-',
      telephone: client.telephone || '-',
      adresse: client.adresse || '-',
      totalAchats: client.totalAchats,
      statut: client.statut,
      createdAt: formatDate(client.createdAt),
    });
  });

  // Formater les colonnes de montants
  worksheet.getColumn('totalAchats').numFmt = '#,##0 "GNF"';

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
};

// Générer un rapport Excel - Factures
export const genererFacturesExcel = async (options: ExportOptions): Promise<Buffer> => {
  const factures = await prisma.facture.findMany({
    where: {
      companyId: options.companyId,
      ...(options.dateDebut && options.dateFin && {
        dateEmission: {
          gte: options.dateDebut,
          lte: options.dateFin,
        },
      }),
    },
    include: {
      client: { select: { nom: true } },
      lignes: true,
    },
    orderBy: { dateEmission: 'desc' },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Factures');

  // En-têtes
  worksheet.columns = [
    { header: 'Numéro', key: 'numero', width: 18 },
    { header: 'Date émission', key: 'dateEmission', width: 12 },
    { header: 'Client', key: 'client', width: 25 },
    { header: 'Total HT', key: 'totalHt', width: 15 },
    { header: 'TVA', key: 'tva', width: 12 },
    { header: 'Total TTC', key: 'totalTtc', width: 15 },
    { header: 'Montant payé', key: 'montantPaye', width: 15 },
    { header: 'Reste', key: 'reste', width: 15 },
    { header: 'Statut', key: 'statut', width: 15 },
    { header: 'Échéance', key: 'dateEcheance', width: 12 },
  ];

  // Style des en-têtes
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' },
  };

  // Données
  factures.forEach((facture) => {
    const reste = facture.montantTTC - facture.montantPaye;
    worksheet.addRow({
      numero: facture.numero,
      dateEmission: formatDate(facture.dateEmission),
      client: facture.client?.nom || '-',
      totalHt: facture.totalHt,
      tva: facture.tva,
      totalTtc: facture.montantTTC,
      montantPaye: facture.montantPaye,
      reste,
      statut: facture.statut,
      dateEcheance: facture.dateEcheance ? formatDate(facture.dateEcheance) : '-',
    });
  });

  // Formater les colonnes de montants
  ['totalHt', 'tva', 'totalTtc', 'montantPaye', 'reste'].forEach((col) => {
    worksheet.getColumn(col).numFmt = '#,##0 "GNF"';
  });

  // Ligne de total
  worksheet.addRow({});
  const totalRow = worksheet.addRow({
    numero: 'TOTAL',
    totalHt: factures.reduce((sum, f) => sum + f.totalHt, 0),
    tva: factures.reduce((sum, f) => sum + f.tva, 0),
    totalTtc: factures.reduce((sum, f) => sum + f.montantTTC, 0),
    montantPaye: factures.reduce((sum, f) => sum + f.montantPaye, 0),
    reste: factures.reduce((sum, f) => sum + (f.montantTTC - f.montantPaye), 0),
  });
  totalRow.font = { bold: true };

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
};

// Générer un rapport Excel - Stock
export const genererStockExcel = async (options: ExportOptions): Promise<Buffer> => {
  const produits = await prisma.produit.findMany({
    where: { companyId: options.companyId },
    orderBy: { nom: 'asc' },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Stock');

  // En-têtes
  worksheet.columns = [
    { header: 'Référence', key: 'reference', width: 15 },
    { header: 'Nom', key: 'nom', width: 30 },
    { header: 'Catégorie', key: 'categorie', width: 15 },
    { header: 'Stock actuel', key: 'stockActuel', width: 12 },
    { header: 'Stock min', key: 'stockMin', width: 10 },
    { header: 'Prix unitaire', key: 'prixUnitaire', width: 15 },
    { header: 'Valeur stock', key: 'valeurStock', width: 15 },
    { header: 'Alerte', key: 'alerte', width: 10 },
  ];

  // Style des en-têtes
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' },
  };

  // Données
  produits.forEach((produit) => {
    const valeurStock = produit.stockActuel * produit.prixUnitaire;
    const alerte = produit.stockActuel <= produit.stockMin;
    
    const row = worksheet.addRow({
      reference: produit.reference || '-',
      nom: produit.nom,
      categorie: produit.categorie || '-',
      stockActuel: produit.stockActuel,
      stockMin: produit.stockMin,
      prixUnitaire: produit.prixUnitaire,
      valeurStock,
      alerte: alerte ? 'OUI' : 'NON',
    });

    // Colorer les lignes en alerte
    if (alerte) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEE2E2' },
        };
      });
    }
  });

  // Formater les colonnes de montants
  worksheet.getColumn('prixUnitaire').numFmt = '#,##0 "GNF"';
  worksheet.getColumn('valeurStock').numFmt = '#,##0 "GNF"';

  // Ligne de total
  worksheet.addRow({});
  const totalRow = worksheet.addRow({
    nom: 'TOTAL',
    valeurStock: produits.reduce((sum, p) => sum + (p.stockActuel * p.prixUnitaire), 0),
  });
  totalRow.font = { bold: true };

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
};

// Générer un rapport Excel - Dépenses
export const genererDepensesExcel = async (options: ExportOptions): Promise<Buffer> => {
  const depenses = await prisma.depense.findMany({
    where: {
      companyId: options.companyId,
      ...(options.dateDebut && options.dateFin && {
        date: {
          gte: options.dateDebut,
          lte: options.dateFin,
        },
      }),
    },
    orderBy: { date: 'desc' },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Dépenses');

  // En-têtes
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Description', key: 'description', width: 35 },
    { header: 'Catégorie', key: 'categorie', width: 15 },
    { header: 'Montant', key: 'montant', width: 15 },
    { header: 'Bénéficiaire', key: 'beneficiaire', width: 20 },
    { header: 'Mode paiement', key: 'modePaiement', width: 15 },
    { header: 'Référence', key: 'reference', width: 15 },
  ];

  // Style des en-têtes
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' },
  };

  // Données
  depenses.forEach((depense) => {
    worksheet.addRow({
      date: formatDate(depense.date),
      description: depense.description,
      categorie: depense.categorie || '-',
      montant: depense.montant,
      beneficiaire: depense.beneficiaire || '-',
      modePaiement: depense.modePaiement || '-',
      reference: depense.reference || '-',
    });
  });

  // Formater les colonnes de montants
  worksheet.getColumn('montant').numFmt = '#,##0 "GNF"';

  // Ligne de total
  worksheet.addRow({});
  const totalRow = worksheet.addRow({
    description: 'TOTAL',
    montant: depenses.reduce((sum, d) => sum + d.montant, 0),
  });
  totalRow.font = { bold: true };

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
};

// =============================================
// HELPERS
// =============================================

const getBilanData = async (
  companyId: string,
  dateDebut?: Date,
  dateFin?: Date
) => {
  const start = dateDebut || new Date(new Date().getFullYear(), 0, 1);
  const end = dateFin || new Date();

  const [
    caTotal,
    depensesTotal,
    stockValeur,
    masseSalariale,
  ] = await Promise.all([
    prisma.facture.aggregate({
      where: {
        companyId,
        statut: { in: ['PAYEE', 'PARTIELLEMENT_PAYEE'] },
        dateEmission: { gte: start, lte: end },
      },
      _sum: { montantTTC: true },
    }),
    prisma.depense.aggregate({
      where: {
        companyId,
        date: { gte: start, lte: end },
      },
      _sum: { montant: true },
    }),
    prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COALESCE(SUM(stock_actuel * prix_unitaire), 0)::bigint as total
      FROM "Produit"
      WHERE company_id = ${companyId}
    `,
    prisma.bulletinPaie.aggregate({
      where: {
        employe: { companyId },
        statut: 'PAYE',
        datePaiement: { gte: start, lte: end },
      },
      _sum: { netAPayer: true },
    }),
  ]);

  const ca = caTotal._sum.montantTTC || 0;
  const depenses = depensesTotal._sum.montant || 0;
  const salaires = masseSalariale._sum.netAPayer || 0;
  const resultatNet = ca - depenses - salaires;

  return {
    periode: { debut: start, fin: end },
    produits: { chiffreAffaires: ca },
    charges: {
      depenses,
      salaires,
      totalCharges: depenses + salaires,
    },
    resultatNet,
    actif: {
      creancesClients: 0,
      stock: Number(stockValeur[0]?.total || 0),
    },
    rentabilite: ca > 0 ? ((resultatNet / ca) * 100).toFixed(2) : '0',
  };
};

export default {
  genererBilanPDF,
  genererJournalVentesPDF,
  genererClientsExcel,
  genererFacturesExcel,
  genererStockExcel,
  genererDepensesExcel,
};
