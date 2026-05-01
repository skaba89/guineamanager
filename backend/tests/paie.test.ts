// Tests pour les calculs de paie - GuinéaManager

import { describe, it, expect } from 'vitest';
import { 
  calculerCNSS, 
  calculerIPR, 
  calculerPaieComplete,
  calculerMasseSalariale,
  formatGNF
} from '../src/utils/payroll';

describe('Calculs de Paie Guinée', () => {
  describe('calculerCNSS', () => {
    it('devrait calculer la CNSS employé à 5%', () => {
      const salaire = 2_000_000_00; // 2M GNF en centimes
      const result = calculerCNSS(salaire);
      
      expect(result.employe).toBe(100_000_00); // 5% de 2M
      expect(result.employeur).toBe(360_000_00); // 18% de 2M
    });

    it('devrait plafonner la base de calcul à 5M GNF', () => {
      const salaire = 10_000_000_00; // 10M GNF en centimes
      const result = calculerCNSS(salaire);
      
      // CNSS calculée sur 5M max
      expect(result.employe).toBe(250_000_00); // 5% de 5M
      expect(result.employeur).toBe(900_000_00); // 18% de 5M
    });

    it('devrait gérer un salaire nul', () => {
      const result = calculerCNSS(0);
      
      expect(result.employe).toBe(0);
      expect(result.employeur).toBe(0);
    });
  });

  describe('calculerIPR', () => {
    it('devrait retourner 0 pour une base imposable <= 3M GNF', () => {
      const baseImposable = 3_000_000_00;
      const ipr = calculerIPR(baseImposable);
      
      expect(ipr).toBe(0);
    });

    it('devrait appliquer 10% pour la tranche 3M-5M', () => {
      const baseImposable = 4_000_000_00; // 4M GNF
      const ipr = calculerIPR(baseImposable);
      
      // 4M - 3M = 1M dans la tranche à 10%
      // IPR = 1M * 10% = 100K
      expect(ipr).toBe(100_000_00);
    });

    it('devrait appliquer le barème progressif pour 6.65M GNF', () => {
      const baseImposable = 6_650_000_00; // 6.65M GNF
      const ipr = calculerIPR(baseImposable);
      
      // 0-3M: 0%
      // 3M-5M: 2M * 10% = 200K
      // 5M-6.65M: 1.65M * 15% = 247.5K
      // Total = 447.5K
      expect(ipr).toBe(447_500_00);
    });

    it('devrait appliquer 20% pour la tranche > 10M', () => {
      const baseImposable = 14_750_000_00; // 14.75M GNF
      const ipr = calculerIPR(baseImposable);
      
      // 0-3M: 0%
      // 3M-5M: 2M * 10% = 200K
      // 5M-10M: 5M * 15% = 750K
      // 10M-14.75M: 4.75M * 20% = 950K
      // Total = 1.9M
      expect(ipr).toBe(1_900_000_00);
    });
  });

  describe('calculerPaieComplete', () => {
    it('devrait calculer une paie complète correctement', () => {
      const result = calculerPaieComplete({
        salaireBase: 5_000_000_00 // 5M GNF en centimes
      });
      
      // Salaire brut = 5M
      expect(result.brutTotal).toBe(5_000_000_00);
      
      // CNSS Employé = 5% de 5M = 250K
      expect(result.cnssEmploye).toBe(250_000_00);
      
      // CNSS Employeur = 18% de 5M = 900K
      expect(result.cnssEmployeur).toBe(900_000_00);
      
      // Base imposable = 5M - 250K = 4.75M
      // IPR = (4.75M - 3M) * 10% = 175K
      expect(result.ipr).toBe(175_000_00);
      
      // Net = 5M - 250K - 175K = 4.575M
      expect(result.netAPayer).toBe(4_575_000_00);
    });

    it('devrait inclure les indemnités et primes', () => {
      const result = calculerPaieComplete({
        salaireBase: 3_000_000_00,
        indemnites: 500_000_00,
        primes: 200_000_00
      });
      
      // Brut = 3M + 500K + 200K = 3.7M
      expect(result.brutTotal).toBe(3_700_000_00);
      
      // CNSS Employé = 5% de 3.7M = 185K
      expect(result.cnssEmploye).toBe(185_000_00);
    });

    it('devrait déduire les acomptes', () => {
      const result = calculerPaieComplete({
        salaireBase: 4_000_000_00,
        acomptes: 100_000_00
      });
      
      // Net = Brut - CNSS - IPR - Acomptes
      const expectedNet = result.brutTotal - result.cnssEmploye - result.ipr - 100_000_00;
      expect(result.netAPayer).toBe(expectedNet);
    });
  });

  describe('calculerMasseSalariale', () => {
    it('devrait calculer la masse salariale pour plusieurs bulletins', () => {
      const bulletins = [
        { netAPayer: 2_850_000_00, coutTotalEmployeur: 3_400_000_00 },
        { netAPayer: 3_200_000_00, coutTotalEmployeur: 3_800_000_00 },
        { netAPayer: 4_100_000_00, coutTotalEmployeur: 4_900_000_00 }
      ];
      
      const result = calculerMasseSalariale(bulletins);
      
      // Total net = 2.85M + 3.2M + 4.1M = 10.15M
      expect(result.totalNet).toBe(10_150_000_00);
      
      // Total coût employeur = 3.4M + 3.8M + 4.9M = 12.1M
      expect(result.totalCoutEmployeur).toBe(12_100_000_00);
    });
  });

  describe('formatGNF', () => {
    it('devrait formater un montant en GNF', () => {
      const result = formatGNF(1_500_000_00);
      expect(result).toContain('GNF');
      expect(result).toMatch(/1[\s\u202f]?500[\s\u202f]?000/);
    });
  });

  describe('Cas limites', () => {
    it('devrait gérer un salaire très élevé', () => {
      const result = calculerPaieComplete({
        salaireBase: 50_000_000_00 // 50M GNF
      });
      
      // CNSS plafonnée à 5M
      expect(result.cnssEmploye).toBe(250_000_00);
      expect(result.cnssEmployeur).toBe(900_000_00);
      
      // IPR sur la base imposable complète
      expect(result.ipr).toBeGreaterThan(0);
    });

    it('devrait gérer un salaire minimum', () => {
      const result = calculerPaieComplete({
        salaireBase: 500_000_00 // 500K GNF
      });
      
      // CNSS = 5% de 500K = 25K
      expect(result.cnssEmploye).toBe(25_000_00);
      
      // IPR = 0 (base imposable < 3M)
      expect(result.ipr).toBe(0);
      
      // Net = 500K - 25K = 475K
      expect(result.netAPayer).toBe(475_000_00);
    });
  });
});
