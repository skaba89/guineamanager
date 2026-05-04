// Tests de calcul de paie pour Guin�aManager ERP
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import prisma from '../src/utils/prisma';

// Fonctions de calcul de paie (Guin�e)
function calculerCNSS(salaireBase: number, tauxEmploye: number = 0.05, tauxEmployeur: number = 0.18): {
  cnssEmploye: number;
  cnssEmployeur: number;
  baseCNSS: number;
} {
  const baseCNSS = Math.min(salaireBase, 5000000); // Plafond CNSS
  const cnssEmploye = Math.round(baseCNSS * tauxEmploye);
  const cnssEmployeur = Math.round(baseCNSS * tauxEmployeur);
  
  return { cnssEmploye, cnssEmployeur, baseCNSS };
}

function calculerIPR(brutImposable: number, parts: number = 1): number {
  // Bar�me IPR Guin�e (simplifi�)
  // Tranches: 0-500k: 0%, 500k-2M: 10%, 2M-5M: 15%, 5M-10M: 20%, >10M: 30%
  // Avec abattement pour charges de famille
  
  const abattementParPart = 50000;
  const baseImposable = Math.max(0, brutImposable - (parts * abattementParPart));
  
  let ipr = 0;
  
  if (baseImposable <= 500000) {
    ipr = 0;
  } else if (baseImposable <= 2000000) {
    ipr = (baseImposable - 500000) * 0.10;
  } else if (baseImposable <= 5000000) {
    ipr = 150000 + (baseImposable - 2000000) * 0.15;
  } else if (baseImposable <= 10000000) {
    ipr = 600000 + (baseImposable - 5000000) * 0.20;
  } else {
    ipr = 1600000 + (baseImposable - 10000000) * 0.30;
  }
  
  return Math.round(ipr);
}

function calculerBulletinPaie(params: {
  salaireBase: number;
  heuresSup?: number;
  tauxHoraireSup?: number;
  primes?: number;
  indemnites?: number;
  autresAvantages?: number;
  acomptes?: number;
  autresRetenues?: number;
  partsFiscales?: number;
}): {
  brutTotal: number;
  baseCNSS: number;
  cnssEmploye: number;
  cnssEmployeur: number;
  baseImposable: number;
  ipr: number;
  totalRetenues: number;
  netAPayer: number;
  netImposable: number;
  coutTotalEmployeur: number;
} {
  const {
    salaireBase,
    heuresSup = 0,
    tauxHoraireSup = 0,
    primes = 0,
    indemnites = 0,
    autresAvantages = 0,
    acomptes = 0,
    autresRetenues = 0,
    partsFiscales = 1
  } = params;

  // Calcul du brut
  const montantHeuresSup = heuresSup * tauxHoraireSup;
  const brutTotal = salaireBase + montantHeuresSup + primes + indemnites + autresAvantages;

  // CNSS
  const { cnssEmploye, cnssEmployeur, baseCNSS } = calculerCNSS(salaireBase);

  // Base imposable
  const baseImposable = brutTotal - cnssEmploye;

  // IPR
  const ipr = calculerIPR(baseImposable, partsFiscales);

  // Total retenues
  const totalRetenues = cnssEmploye + ipr + acomptes + autresRetenues;

  // Nets
  const netAPayer = brutTotal - totalRetenues;
  const netImposable = baseImposable - ipr;

  // Co�t total employeur
  const coutTotalEmployeur = brutTotal + cnssEmployeur;

  return {
    brutTotal,
    baseCNSS,
    cnssEmploye,
    cnssEmployeur,
    baseImposable,
    ipr,
    totalRetenues,
    netAPayer,
    netImposable,
    coutTotalEmployeur
  };
}

describe('Calculs de Paie - Guin�e', () => {
  describe('Calcul CNSS', () => {
    it('devrait calculer la CNSS employ� (5%)', () => {
      const salaire = 2000000;
      const { cnssEmploye } = calculerCNSS(salaire);
      
      expect(cnssEmploye).toBe(100000); // 5% de 2M
    });

    it('devrait calculer la CNSS employeur (18%)', () => {
      const salaire = 2000000;
      const { cnssEmployeur } = calculerCNSS(salaire);
      
      expect(cnssEmployeur).toBe(360000); // 18% de 2M
    });

    it('devrait appliquer le plafond CNSS', () => {
      const salaire = 10000000; // 10 millions
      const { baseCNSS, cnssEmploye } = calculerCNSS(salaire);
      
      expect(baseCNSS).toBe(5000000); // Plafond
      expect(cnssEmploye).toBe(250000); // 5% du plafond
    });

    it('devrait calculer correctement pour un salaire minimum', () => {
      const salaire = 500000;
      const { cnssEmploye, cnssEmployeur } = calculerCNSS(salaire);
      
      expect(cnssEmploye).toBe(25000); // 5% de 500k
      expect(cnssEmployeur).toBe(90000); // 18% de 500k
    });
  });

  describe('Calcul IPR', () => {
    it('devrait �tre 0 pour un salaire bas', () => {
      const ipr = calculerIPR(400000, 1);
      expect(ipr).toBe(0);
    });

    it('devrait appliquer le taux de 10% pour la tranche 500k-2M', () => {
      const brut = 1000000;
      const ipr = calculerIPR(brut, 1);
      
      // Base imposable apr�s abattement: 1000000 - 50000 = 950000
      // (950000 - 500000) * 0.10 = 45000
      expect(ipr).toBe(45000);
    });

    it('devrait appliquer le taux de 15% pour la tranche 2M-5M', () => {
      const brut = 3000000;
      const ipr = calculerIPR(brut, 1);
      
      // Base: 3000000 - 50000 = 2950000
      // 0-500k: 0
      // 500k-2M: 150000 (10%)
      // 2M-2950k: 142500 (15% de 950k)
      // Total: 292500
      expect(ipr).toBe(292500);
    });

    it('devrait r�duire l\'IPR avec plus de parts fiscales', () => {
      const brut = 2000000;
      const ipr1Part = calculerIPR(brut, 1);
      const ipr2Parts = calculerIPR(brut, 2);
      
      expect(ipr2Parts).toBeLessThan(ipr1Part);
    });
  });

  describe('Bulletin de paie complet', () => {
    it('devrait calculer un bulletin complet pour un salaire standard', () => {
      const bulletin = calculerBulletinPaie({
        salaireBase: 2500000,
        partsFiscales: 1
      });

      expect(bulletin.brutTotal).toBe(2500000);
      expect(bulletin.cnssEmploye).toBe(125000); // 5% de 2.5M
      expect(bulletin.cnssEmployeur).toBe(450000); // 18% de 2.5M
      expect(bulletin.netAPayer).toBeGreaterThan(0);
      expect(bulletin.coutTotalEmployeur).toBe(2950000); // 2.5M + 450k
    });

    it('devrait inclure les heures suppl�mentaires', () => {
      const bulletin = calculerBulletinPaie({
        salaireBase: 2000000,
        heuresSup: 10,
        tauxHoraireSup: 15000,
        partsFiscales: 1
      });

      expect(bulletin.brutTotal).toBe(2150000); // 2M + 150k
    });

    it('devrait inclure les primes et indemnit�s', () => {
      const bulletin = calculerBulletinPaie({
        salaireBase: 2000000,
        primes: 200000,
        indemnites: 100000,
        partsFiscales: 1
      });

      expect(bulletin.brutTotal).toBe(2300000); // 2M + 200k + 100k
    });

    it('devrait d�duire les acomptes', () => {
      const bulletin = calculerBulletinPaie({
        salaireBase: 2000000,
        acomptes: 300000,
        partsFiscales: 1
      });

      expect(bulletin.totalRetenues).toBeGreaterThan(100000); // CNSS + IPR + acompte
    });

    it('devrait g�n�rer un bulletin pour un cadre', () => {
      const bulletin = calculerBulletinPaie({
        salaireBase: 8000000,
        primes: 500000,
        autresAvantages: 200000,
        partsFiscales: 3 // Mari� avec enfants
      });

      expect(bulletin.brutTotal).toBe(8700000);
      expect(bulletin.cnssEmploye).toBe(250000); // Plafonn� � 5M
      expect(bulletin.netAPayer).toBeGreaterThan(6000000);
    });
  });

  describe('Cas particuliers', () => {
    it('devrait g�rer un salaire au SMIG', () => {
      const smigGuinee = 440000;
      const bulletin = calculerBulletinPaie({
        salaireBase: smigGuinee,
        partsFiscales: 1
      });

      expect(bulletin.cnssEmploye).toBe(22000);
      expect(bulletin.ipr).toBe(0);
      expect(bulletin.netAPayer).toBe(418000);
    });

    it('devrait g�rer un salaire tr�s �lev�', () => {
      const bulletin = calculerBulletinPaie({
        salaireBase: 15000000,
        partsFiscales: 4
      });

      expect(bulletin.cnssEmploye).toBe(250000); // Plafonn�
      expect(bulletin.ipr).toBeGreaterThan(3000000);
      expect(bulletin.coutTotalEmployeur).toBeGreaterThan(15000000);
    });

    it('devrait valider la coh�rence des calculs', () => {
      const bulletin = calculerBulletinPaie({
        salaireBase: 3000000,
        partsFiscales: 2
      });

      // V�rifications de coh�rence
      expect(bulletin.baseImposable).toBe(bulletin.brutTotal - bulletin.cnssEmploye);
      expect(bulletin.netAPayer).toBe(bulletin.brutTotal - bulletin.totalRetenues);
      expect(bulletin.coutTotalEmployeur).toBe(bulletin.brutTotal + bulletin.cnssEmployeur);
    });
  });
});

describe('Int�gration Base de Donn�es Paie', () => {
  let testCompany: any;
  let testEmploye: any;

  beforeEach(async () => {
    testCompany = await prisma.company.create({
      data: {
        nom: 'Test Paie Company',
        email: 'paie@test.com',
        pays: 'Guin�e',
        configTauxCNSSEmploye: 0.05,
        configTauxCNSSEmployeur: 0.18
      }
    });

    testEmploye = await prisma.employe.create({
      data: {
        matricule: 'EMP-001',
        nom: 'Diallo',
        prenom: 'Mamadou',
        email: 'mamadou@test.com',
        poste: 'Comptable',
        departement: 'Finance',
        salaireBase: 2500000,
        dateEmbauche: new Date('2023-01-15'),
        typeContrat: 'CDI',
        nombrePartsFiscales: 2,
        companyId: testCompany.id
      }
    });
  });

  afterEach(async () => {
    try {
      await prisma.bulletinPaie.deleteMany({ where: { employeId: testEmploye.id } });
      await prisma.employe.delete({ where: { id: testEmploye.id } });
      await prisma.company.delete({ where: { id: testCompany.id } });
    } catch (error) {
      // Ignorer
    }
  });

  it('devrait cr�er un bulletin de paie', async () => {
    const bulletin = await prisma.bulletinPaie.create({
      data: {
        employeId: testEmploye.id,
        mois: 5,
        annee: 2026,
        salaireBase: 2500000,
        brutTotal: 2500000,
        baseCNSS: 2500000,
        cnssEmploye: 125000,
        cnssEmployeur: 450000,
        baseImposable: 2375000,
        ipr: 272500,
        totalRetenues: 397500,
        netAPayer: 2102500,
        netImposable: 2102500,
        coutTotalEmployeur: 2950000,
        statut: 'BROUILLON',
        companyId: testCompany.id
      }
    });

    expect(bulletin.mois).toBe(5);
    expect(bulletin.annee).toBe(2026);
    expect(bulletin.statut).toBe('BROUILLON');
  });

  it('devrait emp�cher les bulletins en double pour le m�me mois', async () => {
    await prisma.bulletinPaie.create({
      data: {
        employeId: testEmploye.id,
        mois: 6,
        annee: 2026,
        salaireBase: 2500000,
        brutTotal: 2500000,
        baseCNSS: 2500000,
        cnssEmploye: 125000,
        cnssEmployeur: 450000,
        baseImposable: 2375000,
        ipr: 272500,
        totalRetenues: 397500,
        netAPayer: 2102500,
        netImposable: 2102500,
        coutTotalEmployeur: 2950000,
        statut: 'BROUILLON',
        companyId: testCompany.id
      }
    });

    await expect(async () => {
      await prisma.bulletinPaie.create({
        data: {
          employeId: testEmploye.id,
          mois: 6,
          annee: 2026,
          salaireBase: 2500000,
          brutTotal: 2500000,
          baseCNSS: 2500000,
          cnssEmploye: 125000,
          cnssEmployeur: 450000,
          baseImposable: 2375000,
          ipr: 272500,
          totalRetenues: 397500,
          netAPayer: 2102500,
          netImposable: 2102500,
          coutTotalEmployeur: 2950000,
          statut: 'BROUILLON',
          companyId: testCompany.id
        }
      });
    }).rejects.toThrow();
  });

  it('devrait calculer la masse salariale', async () => {
    // Cr�er un deuxi�me employ�
    const employe2 = await prisma.employe.create({
      data: {
        matricule: 'EMP-002',
        nom: 'Cond�',
        prenom: 'Fatou',
        email: 'fatou@test.com',
        poste: 'Secr�taire',
        salaireBase: 1500000,
        dateEmbauche: new Date('2023-06-01'),
        typeContrat: 'CDI',
        nombrePartsFiscales: 1,
        companyId: testCompany.id
      }
    });

    const masseSalariale = await prisma.employe.aggregate({
      where: { companyId: testCompany.id, actif: true },
      _sum: { salaireBase: true }
    });

    expect(masseSalariale._sum.salaireBase).toBe(4000000);

    await prisma.employe.delete({ where: { id: employe2.id } });
  });
});
