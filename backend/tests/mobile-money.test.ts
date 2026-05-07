// Tests de paiements Mobile Money pour Guin�aManager ERP
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import prisma from '../src/utils/prisma';

describe('Paiements Mobile Money', () => {
  let testCompany: any;

  beforeEach(async () => {
    testCompany = await prisma.company.create({
      data: {
        nom: 'Test Mobile Money Company',
        email: 'mobilemoney@test.com',
        pays: 'Guin�e'
      }
    });
  });

  afterEach(async () => {
    try {
      await prisma.orangeMoneyTransaction.deleteMany({ where: { companyId: testCompany.id } });
      await prisma.mtnMoneyTransaction.deleteMany({ where: { companyId: testCompany.id } });
      await prisma.waveTransaction.deleteMany({ where: { companyId: testCompany.id } });
      await prisma.company.delete({ where: { id: testCompany.id } });
    } catch (error) {
      // Ignorer
    }
  });

  describe('Orange Money', () => {
    it('devrait cr�er une transaction Orange Money', async () => {
      const transaction = await prisma.orangeMoneyTransaction.create({
        data: {
          companyId: testCompany.id,
          orderId: `OM-${Date.now()}`,
          amount: 150000,
          currency: 'GNF',
          customerPhone: '+224620000001',
          customerName: 'Client Orange Test',
          status: 'PENDING'
        }
      });

      expect(transaction.status).toBe('PENDING');
      expect(transaction.amount).toBe(150000);
      expect(transaction.currency).toBe('GNF');
    });

    it('devrait mettre � jour le statut de la transaction', async () => {
      const transaction = await prisma.orangeMoneyTransaction.create({
        data: {
          companyId: testCompany.id,
          orderId: `OM-UPDATE-${Date.now()}`,
          amount: 75000,
          currency: 'GNF',
          customerPhone: '+224620000002',
          status: 'PENDING'
        }
      });

      const updated = await prisma.orangeMoneyTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESS',
          orangeTxId: 'ORANGE-TX-12345',
          completedAt: new Date()
        }
      });

      expect(updated.status).toBe('SUCCESS');
      expect(updated.orangeTxId).toBe('ORANGE-TX-12345');
    });

    it('devrait enregistrer les �checs de transaction', async () => {
      const transaction = await prisma.orangeMoneyTransaction.create({
        data: {
          companyId: testCompany.id,
          orderId: `OM-FAIL-${Date.now()}`,
          amount: 50000,
          currency: 'GNF',
          customerPhone: '+224620000003',
          status: 'FAILED',
          errorMessage: 'Solde insuffisant'
        }
      });

      expect(transaction.status).toBe('FAILED');
      expect(transaction.errorMessage).toBe('Solde insuffisant');
    });

    it('devrait g�rer les transactions expir�es', async () => {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      const transaction = await prisma.orangeMoneyTransaction.create({
        data: {
          companyId: testCompany.id,
          orderId: `OM-EXP-${Date.now()}`,
          amount: 25000,
          currency: 'GNF',
          customerPhone: '+224620000004',
          status: 'PENDING',
          expiresAt
        }
      });

      expect(transaction.expiresAt).toBeDefined();
    });
  });

  describe('MTN Money', () => {
    it('devrait cr�er une transaction MTN Money', async () => {
      const transaction = await prisma.mtnMoneyTransaction.create({
        data: {
          companyId: testCompany.id,
          externalId: `MTN-${Date.now()}`,
          amount: 200000,
          currency: 'GNF',
          customerPhone: '+224662000001',
          customerName: 'Client MTN Test',
          type: 'COLLECTION',
          status: 'PENDING'
        }
      });

      expect(transaction.status).toBe('PENDING');
      expect(transaction.type).toBe('COLLECTION');
    });

    it('devrait g�rer les diff�rents types de transactions', async () => {
      const types = ['COLLECTION', 'DISBURSEMENT', 'REMITTANCE'];

      for (const type of types) {
        const transaction = await prisma.mtnMoneyTransaction.create({
          data: {
            companyId: testCompany.id,
            externalId: `MTN-${type}-${Date.now()}`,
            amount: 100000,
            currency: 'GNF',
            customerPhone: '+224662000002',
            type,
            status: 'PENDING'
          }
        });

        expect(transaction.type).toBe(type);
      }
    });

    it('devrait stocker l\'ID financier de la transaction', async () => {
      const transaction = await prisma.mtnMoneyTransaction.create({
        data: {
          companyId: testCompany.id,
          externalId: `MTN-FIN-${Date.now()}`,
          amount: 300000,
          currency: 'GNF',
          customerPhone: '+224662000003',
          status: 'SUCCESS',
          financialTransactionId: 'MTN-FIN-ID-789'
        }
      });

      expect(transaction.financialTransactionId).toBe('MTN-FIN-ID-789');
    });
  });

  describe('Wave', () => {
    it('devrait cr�er une transaction Wave', async () => {
      const transaction = await prisma.waveTransaction.create({
        data: {
          companyId: testCompany.id,
          reference: `WAVE-${Date.now()}`,
          amount: 180000,
          currency: 'GNF',
          customerPhone: '+224660000001',
          customerName: 'Client Wave Test',
          type: 'CHECKOUT',
          status: 'PENDING'
        }
      });

      expect(transaction.status).toBe('PENDING');
      expect(transaction.type).toBe('CHECKOUT');
    });

    it('devrait stocker l\'URL de checkout', async () => {
      const transaction = await prisma.waveTransaction.create({
        data: {
          companyId: testCompany.id,
          reference: `WAVE-URL-${Date.now()}`,
          amount: 95000,
          currency: 'GNF',
          customerPhone: '+224660000002',
          status: 'PENDING',
          checkoutUrl: 'https://wave.com/checkout/abc123'
        }
      });

      expect(transaction.checkoutUrl).toBe('https://wave.com/checkout/abc123');
    });

    it('devrait mettre � jour avec l\'ID Wave', async () => {
      const transaction = await prisma.waveTransaction.create({
        data: {
          companyId: testCompany.id,
          reference: `WAVE-ID-${Date.now()}`,
          amount: 120000,
          currency: 'GNF',
          customerPhone: '+224660000003',
          status: 'PENDING'
        }
      });

      const updated = await prisma.waveTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESS',
          waveId: 'WAVE-INTERNAL-456',
          completedAt: new Date()
        }
      });

      expect(updated.status).toBe('SUCCESS');
      expect(updated.waveId).toBe('WAVE-INTERNAL-456');
    });
  });

  describe('Statistiques et rapports', () => {
    it('devrait calculer le total des transactions par op�rateur', async () => {
      // Cr�er des transactions pour chaque op�rateur
      await prisma.orangeMoneyTransaction.createMany({
        data: [
          {
            companyId: testCompany.id,
            orderId: `OM-STAT-1-${Date.now()}`,
            amount: 100000,
            currency: 'GNF',
            customerPhone: '+224620000001',
            status: 'SUCCESS'
          },
          {
            companyId: testCompany.id,
            orderId: `OM-STAT-2-${Date.now()}`,
            amount: 50000,
            currency: 'GNF',
            customerPhone: '+224620000002',
            status: 'SUCCESS'
          }
        ]
      });

      await prisma.mtnMoneyTransaction.create({
        data: {
          companyId: testCompany.id,
          externalId: `MTN-STAT-${Date.now()}`,
          amount: 75000,
          currency: 'GNF',
          customerPhone: '+224662000001',
          status: 'SUCCESS'
        }
      });

      const orangeTotal = await prisma.orangeMoneyTransaction.aggregate({
        where: { companyId: testCompany.id, status: 'SUCCESS' },
        _sum: { amount: true }
      });

      const mtnTotal = await prisma.mtnMoneyTransaction.aggregate({
        where: { companyId: testCompany.id, status: 'SUCCESS' },
        _sum: { amount: true }
      });

      expect(orangeTotal._sum.amount).toBe(150000);
      expect(mtnTotal._sum.amount).toBe(75000);
    });

    it('devrait compter les transactions par statut', async () => {
      await prisma.orangeMoneyTransaction.createMany({
        data: [
          {
            companyId: testCompany.id,
            orderId: `OM-COUNT-1-${Date.now()}`,
            amount: 50000,
            currency: 'GNF',
            customerPhone: '+224620000001',
            status: 'SUCCESS'
          },
          {
            companyId: testCompany.id,
            orderId: `OM-COUNT-2-${Date.now()}`,
            amount: 50000,
            currency: 'GNF',
            customerPhone: '+224620000002',
            status: 'SUCCESS'
          },
          {
            companyId: testCompany.id,
            orderId: `OM-COUNT-3-${Date.now()}`,
            amount: 50000,
            currency: 'GNF',
            customerPhone: '+224620000003',
            status: 'PENDING'
          },
          {
            companyId: testCompany.id,
            orderId: `OM-COUNT-4-${Date.now()}`,
            amount: 50000,
            currency: 'GNF',
            customerPhone: '+224620000004',
            status: 'FAILED'
          }
        ]
      });

      const successCount = await prisma.orangeMoneyTransaction.count({
        where: { companyId: testCompany.id, status: 'SUCCESS' }
      });

      const pendingCount = await prisma.orangeMoneyTransaction.count({
        where: { companyId: testCompany.id, status: 'PENDING' }
      });

      const failedCount = await prisma.orangeMoneyTransaction.count({
        where: { companyId: testCompany.id, status: 'FAILED' }
      });

      expect(successCount).toBe(2);
      expect(pendingCount).toBe(1);
      expect(failedCount).toBe(1);
    });

    it('devrait filtrer les transactions par date', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.waveTransaction.create({
        data: {
          companyId: testCompany.id,
          reference: `WAVE-TODAY-${Date.now()}`,
          amount: 100000,
          currency: 'GNF',
          customerPhone: '+224660000001',
          status: 'SUCCESS',
          createdAt: today
        }
      });

      const todaysTransactions = await prisma.waveTransaction.findMany({
        where: {
          companyId: testCompany.id,
          createdAt: {
            gte: new Date(today.setHours(0, 0, 0, 0)),
            lt: new Date(today.setHours(23, 59, 59, 999))
          }
        }
      });

      expect(todaysTransactions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Validation des donn�es', () => {
    it('devrait valider le format du num�ro de t�l�phone guin�en', () => {
      const phoneRegex = /^\+224(62|66|64|65|61|55)\d{7}$/;
      
      // Num�ros valides
      expect(phoneRegex.test('+224620000000')).toBe(true); // Orange
      expect(phoneRegex.test('+224662000000')).toBe(true); // MTN
      expect(phoneRegex.test('+224640000000')).toBe(true); // Cellcom
      
      // Num�ros invalides
      expect(phoneRegex.test('620000000')).toBe(false);
      expect(phoneRegex.test('+223620000000')).toBe(false);
    });

    it('devrait valider les montants positifs', () => {
      const validateAmount = (amount: number) => amount > 0 && Number.isInteger(amount);
      
      expect(validateAmount(1000)).toBe(true);
      expect(validateAmount(0)).toBe(false);
      expect(validateAmount(-100)).toBe(false);
      expect(validateAmount(100.5)).toBe(false);
    });

    it('devrait valider la devise GNF', () => {
      const validCurrencies = ['GNF', 'XOF', 'XAF', 'EUR', 'USD'];
      
      expect(validCurrencies).toContain('GNF');
      expect(validCurrencies).toContain('XOF');
    });
  });
});
