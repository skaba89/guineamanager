// Tests de gestion des produits pour Guin�aManager ERP
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import prisma from '../src/utils/prisma';

describe('Gestion des Produits', () => {
  let testCompany: any;
  let testProduct: any;

  beforeEach(async () => {
    // Cr�er une entreprise de test
    testCompany = await prisma.company.create({
      data: {
        nom: 'Test Products Company',
        email: 'products@test.com',
        pays: 'Guin�e',
        devise: 'GNF'
      }
    });
  });

  afterEach(async () => {
    // Nettoyer les donn�es de test
    try {
      if (testProduct) {
        await prisma.produit.delete({ where: { id: testProduct.id } });
      }
      if (testCompany) {
        await prisma.company.delete({ where: { id: testCompany.id } });
      }
    } catch (error) {
      // Ignorer les erreurs de nettoyage
    }
  });

  describe('Cr�ation de produits', () => {
    it('devrait cr�er un produit avec tous les champs requis', async () => {
      testProduct = await prisma.produit.create({
        data: {
          nom: 'Riz Import�',
          description: 'Riz de haute qualit�',
          prixUnitaire: 500000,
          unite: 'sac 50kg',
          type: 'PRODUIT',
          stockActuel: 100,
          stockMin: 20,
          categorie: 'Alimentation',
          companyId: testCompany.id
        }
      });

      expect(testProduct.nom).toBe('Riz Import�');
      expect(testProduct.prixUnitaire).toBe(500000);
      expect(testProduct.stockActuel).toBe(100);
      expect(testProduct.actif).toBe(true);
    });

    it('devrait cr�er un service sans stock', async () => {
      const service = await prisma.produit.create({
        data: {
          nom: 'Consultation',
          description: 'Service de consultation',
          prixUnitaire: 150000,
          unite: 'heure',
          type: 'SERVICE',
          companyId: testCompany.id
        }
      });

      expect(service.type).toBe('SERVICE');
      expect(service.stockActuel).toBe(0);
      
      await prisma.produit.delete({ where: { id: service.id } });
    });

    it('devrait appliquer la TVA par d�faut de 18%', async () => {
      testProduct = await prisma.produit.create({
        data: {
          nom: 'Produit TVA Test',
          prixUnitaire: 100000,
          unite: 'unit�',
          companyId: testCompany.id
        }
      });

      expect(testProduct.tva).toBe(0.18);
    });

    it('devrait d�finir le type PRODUIT par d�faut', async () => {
      testProduct = await prisma.produit.create({
        data: {
          nom: 'Produit Test',
          prixUnitaire: 50000,
          unite: 'unit�',
          companyId: testCompany.id
        }
      });

      expect(testProduct.type).toBe('PRODUIT');
    });
  });

  describe('Gestion du stock', () => {
    beforeEach(async () => {
      testProduct = await prisma.produit.create({
        data: {
          nom: 'Produit Stock Test',
          prixUnitaire: 25000,
          unite: 'unit�',
          stockActuel: 50,
          stockMin: 10,
          stockMax: 200,
          companyId: testCompany.id
        }
      });
    });

    it('devrait d�tecter un stock bas', () => {
      const isLowStock = testProduct.stockActuel <= testProduct.stockMin;
      expect(isLowStock).toBe(false);
    });

    it('devrait alerter quand le stock est sous le seuil', async () => {
      const lowStockProduct = await prisma.produit.create({
        data: {
          nom: 'Produit Stock Bas',
          prixUnitaire: 15000,
          unite: 'unit�',
          stockActuel: 5,
          stockMin: 10,
          companyId: testCompany.id
        }
      });

      const needsReorder = lowStockProduct.stockActuel < lowStockProduct.stockMin;
      expect(needsReorder).toBe(true);
      
      await prisma.produit.delete({ where: { id: lowStockProduct.id } });
    });

    it('devrait mettre � jour le stock apr�s une entr�e', async () => {
      const updatedProduct = await prisma.produit.update({
        where: { id: testProduct.id },
        data: { stockActuel: testProduct.stockActuel + 20 }
      });

      expect(updatedProduct.stockActuel).toBe(70);
    });

    it('devrait mettre � jour le stock apr�s une sortie', async () => {
      const updatedProduct = await prisma.produit.update({
        where: { id: testProduct.id },
        data: { stockActuel: testProduct.stockActuel - 15 }
      });

      expect(updatedProduct.stockActuel).toBe(35);
    });
  });

  describe('Recherche et filtrage', () => {
    beforeEach(async () => {
      // Cr�er plusieurs produits pour les tests
      await prisma.produit.createMany({
        data: [
          {
            nom: 'Caf� Robusta',
            prixUnitaire: 30000,
            unite: 'kg',
            categorie: 'Boissons',
            companyId: testCompany.id
          },
          {
            nom: 'Th� Vert',
            prixUnitaire: 25000,
            unite: 'paquet',
            categorie: 'Boissons',
            companyId: testCompany.id
          },
          {
            nom: 'Sucre',
            prixUnitaire: 15000,
            unite: 'kg',
            categorie: 'Alimentation',
            companyId: testCompany.id
          }
        ]
      });
    });

    afterEach(async () => {
      await prisma.produit.deleteMany({
        where: { companyId: testCompany.id }
      });
    });

    it('devrait filtrer par cat�gorie', async () => {
      const produitsBoissons = await prisma.produit.findMany({
        where: {
          companyId: testCompany.id,
          categorie: 'Boissons'
        }
      });

      expect(produitsBoissons.length).toBe(2);
      expect(produitsBoissons.every(p => p.categorie === 'Boissons')).toBe(true);
    });

    it('devrait rechercher par nom', async () => {
      const produits = await prisma.produit.findMany({
        where: {
          companyId: testCompany.id,
          nom: { contains: 'Caf�' }
        }
      });

      expect(produits.length).toBe(1);
      expect(produits[0].nom).toContain('Caf�');
    });

    it('devrait filtrer les produits actifs', async () => {
      const produitsActifs = await prisma.produit.findMany({
        where: {
          companyId: testCompany.id,
          actif: true
        }
      });

      expect(produitsActifs.length).toBe(3);
    });
  });

  describe('Calculs de prix', () => {
    it('devrait calculer le prix TTC correctement', async () => {
      testProduct = await prisma.produit.create({
        data: {
          nom: 'Produit TTC Test',
          prixUnitaire: 100000,
          unite: 'unit�',
          tva: 0.18,
          companyId: testCompany.id
        }
      });

      const prixHT = testProduct.prixUnitaire;
      const tauxTVA = testProduct.tva ?? 0.18;
      const prixTTC = prixHT * (1 + tauxTVA);

      expect(prixTTC).toBe(118000);
    });

    it('devrait calculer la valeur totale du stock', async () => {
      testProduct = await prisma.produit.create({
        data: {
          nom: 'Produit Valorisation',
          prixUnitaire: 50000,
          unite: 'unit�',
          stockActuel: 100,
          companyId: testCompany.id
        }
      });

      const valeurStock = testProduct.prixUnitaire * testProduct.stockActuel;
      expect(valeurStock).toBe(5000000);
    });
  });
});
