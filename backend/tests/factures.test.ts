// Tests de gestion des factures pour Guin�aManager ERP
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import prisma from '../src/utils/prisma';

describe('Gestion des Factures', () => {
  let testCompany: any;
  let testClient: any;
  let testProduct: any;
  let testFacture: any;

  beforeEach(async () => {
    // Cr�er une entreprise de test
    testCompany = await prisma.company.create({
      data: {
        nom: 'Test Factures Company',
        email: 'factures@test.com',
        pays: 'Guin�e',
        devise: 'GNF'
      }
    });

    // Cr�er un client de test
    testClient = await prisma.client.create({
      data: {
        nom: 'Client Test',
        email: 'client@test.com',
        telephone: '+224620000000',
        type: 'PARTICULIER',
        companyId: testCompany.id
      }
    });

    // Cr�er un produit de test
    testProduct = await prisma.produit.create({
      data: {
        nom: 'Produit Facture Test',
        prixUnitaire: 100000,
        unite: 'unit�',
        companyId: testCompany.id
      }
    });
  });

  afterEach(async () => {
    // Nettoyer les donn�es de test
    try {
      if (testFacture) {
        await prisma.ligneFacture.deleteMany({ where: { factureId: testFacture.id } });
        await prisma.facture.delete({ where: { id: testFacture.id } });
      }
      if (testProduct) await prisma.produit.delete({ where: { id: testProduct.id } });
      if (testClient) await prisma.client.delete({ where: { id: testClient.id } });
      if (testCompany) await prisma.company.delete({ where: { id: testCompany.id } });
    } catch (error) {
      // Ignorer les erreurs de nettoyage
    }
  });

  describe('Cr�ation de factures', () => {
    it('devrait cr�er une facture avec lignes', async () => {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 30);

      testFacture = await prisma.facture.create({
        data: {
          numero: 'FAC-2024-0001',
          clientId: testClient.id,
          dateEmission: today,
          dateEcheance: dueDate,
          montantHT: 200000,
          montantTVA: 36000,
          montantTTC: 236000,
          statut: 'BROUILLON',
          companyId: testCompany.id,
          lignes: {
            create: [
              {
                description: 'Produit A',
                quantite: 2,
                prixUnitaire: 100000,
                tauxTVA: 0.18,
                montantHT: 200000,
                montantTVA: 36000,
                montantTTC: 236000
              }
            ]
          }
        },
        include: { lignes: true }
      });

      expect(testFacture.numero).toBe('FAC-2024-0001');
      expect(testFacture.lignes.length).toBe(1);
      expect(testFacture.statut).toBe('BROUILLON');
    });

    it('devrait g�n�rer un num�ro de facture unique', async () => {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 30);

      const facture1 = await prisma.facture.create({
        data: {
          numero: 'FAC-2024-0002',
          clientId: testClient.id,
          dateEmission: today,
          dateEcheance: dueDate,
          montantHT: 100000,
          montantTVA: 18000,
          montantTTC: 118000,
          companyId: testCompany.id
        }
      });

      // Tenter de cr�er une facture avec le m�me num�ro devrait �chouer
      await expect(async () => {
        await prisma.facture.create({
          data: {
            numero: 'FAC-2024-0002',
            clientId: testClient.id,
            dateEmission: today,
            dateEcheance: dueDate,
            montantHT: 50000,
            montantTVA: 9000,
            montantTTC: 59000,
            companyId: testCompany.id
          }
        });
      }).rejects.toThrow();

      await prisma.facture.delete({ where: { id: facture1.id } });
    });

    it('devrait calculer les totaux correctement', async () => {
      const lignes = [
        { quantite: 2, prixUnitaire: 50000, tauxTVA: 0.18 },
        { quantite: 1, prixUnitaire: 100000, tauxTVA: 0.18 }
      ];

      const montantHT = lignes.reduce((sum, l) => sum + (l.quantite * l.prixUnitaire), 0);
      const montantTVA = lignes.reduce((sum, l) => sum + (l.quantite * l.prixUnitaire * l.tauxTVA), 0);
      const montantTTC = montantHT + montantTVA;

      expect(montantHT).toBe(200000);
      expect(montantTVA).toBe(36000);
      expect(montantTTC).toBe(236000);
    });
  });

  describe('Cycle de vie des factures', () => {
    beforeEach(async () => {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 30);

      testFacture = await prisma.facture.create({
        data: {
          numero: 'FAC-2024-0003',
          clientId: testClient.id,
          dateEmission: today,
          dateEcheance: dueDate,
          montantHT: 100000,
          montantTVA: 18000,
          montantTTC: 118000,
          statut: 'BROUILLON',
          companyId: testCompany.id
        }
      });
    });

    it('devrait passer du statut BROUILLON � ENVOYEE', async () => {
      const updated = await prisma.facture.update({
        where: { id: testFacture.id },
        data: { statut: 'ENVOYEE' }
      });

      expect(updated.statut).toBe('ENVOYEE');
    });

    it('devrait passer du statut ENVOYEE � PAYEE', async () => {
      await prisma.facture.update({
        where: { id: testFacture.id },
        data: { statut: 'ENVOYEE' }
      });

      const updated = await prisma.facture.update({
        where: { id: testFacture.id },
        data: { 
          statut: 'PAYEE',
          montantPaye: 118000,
          modePaiement: 'ORANGE_MONEY'
        }
      });

      expect(updated.statut).toBe('PAYEE');
      expect(updated.montantPaye).toBe(118000);
    });

    it('devrait d�tecter les factures en retard', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const overdueFacture = await prisma.facture.create({
        data: {
          numero: 'FAC-2024-0004',
          clientId: testClient.id,
          dateEmission: new Date(pastDate.getTime() - 40 * 24 * 60 * 60 * 1000),
          dateEcheance: pastDate,
          montantHT: 50000,
          montantTVA: 9000,
          montantTTC: 59000,
          statut: 'ENVOYEE',
          companyId: testCompany.id
        }
      });

      const today = new Date();
      const isOverdue = overdueFacture.dateEcheance < today && overdueFacture.statut === 'ENVOYEE';

      expect(isOverdue).toBe(true);

      await prisma.facture.delete({ where: { id: overdueFacture.id } });
    });

    it('devrait pouvoir annuler une facture', async () => {
      const updated = await prisma.facture.update({
        where: { id: testFacture.id },
        data: { statut: 'ANNULEE' }
      });

      expect(updated.statut).toBe('ANNULEE');
    });
  });

  describe('Paiements partiels', () => {
    beforeEach(async () => {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 30);

      testFacture = await prisma.facture.create({
        data: {
          numero: 'FAC-2024-0005',
          clientId: testClient.id,
          dateEmission: today,
          dateEcheance: dueDate,
          montantHT: 100000,
          montantTVA: 18000,
          montantTTC: 118000,
          montantPaye: 0,
          statut: 'ENVOYEE',
          companyId: testCompany.id
        }
      });
    });

    it('devrait enregistrer un paiement partiel', async () => {
      const paiement = await prisma.paiement.create({
        data: {
          factureId: testFacture.id,
          montant: 50000,
          mode: 'ORANGE_MONEY',
          reference: 'OM123456'
        }
      });

      expect(paiement.montant).toBe(50000);

      await prisma.facture.update({
        where: { id: testFacture.id },
        data: { montantPaye: 50000 }
      });

      const updatedFacture = await prisma.facture.findUnique({
        where: { id: testFacture.id }
      });

      expect(updatedFacture?.montantPaye).toBe(50000);

      await prisma.paiement.delete({ where: { id: paiement.id } });
    });

    it('devrait calculer le reste � payer', async () => {
      const resteAPayer = testFacture.montantTTC - (testFacture.montantPaye ?? 0);
      expect(resteAPayer).toBe(118000);
    });
  });

  describe('Statistiques', () => {
    it('devrait calculer le total des factures par statut', async () => {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 30);

      // Cr�er plusieurs factures avec diff�rents statuts
      await prisma.facture.createMany({
        data: [
          {
            numero: 'FAC-STAT-001',
            clientId: testClient.id,
            dateEmission: today,
            dateEcheance: dueDate,
            montantHT: 100000,
            montantTVA: 18000,
            montantTTC: 118000,
            statut: 'PAYEE',
            companyId: testCompany.id
          },
          {
            numero: 'FAC-STAT-002',
            clientId: testClient.id,
            dateEmission: today,
            dateEcheance: dueDate,
            montantHT: 50000,
            montantTVA: 9000,
            montantTTC: 59000,
            statut: 'PAYEE',
            companyId: testCompany.id
          },
          {
            numero: 'FAC-STAT-003',
            clientId: testClient.id,
            dateEmission: today,
            dateEcheance: dueDate,
            montantHT: 75000,
            montantTVA: 13500,
            montantTTC: 88500,
            statut: 'ENVOYEE',
            companyId: testCompany.id
          }
        ]
      });

      const facturesPayees = await prisma.facture.findMany({
        where: {
          companyId: testCompany.id,
          statut: 'PAYEE'
        }
      });

      const totalPaye = facturesPayees.reduce((sum, f) => sum + f.montantTTC, 0);

      expect(facturesPayees.length).toBe(2);
      expect(totalPaye).toBe(177000);

      await prisma.facture.deleteMany({
        where: { companyId: testCompany.id }
      });
    });
  });
});
