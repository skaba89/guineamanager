/**
 * Service d'intégration bancaire pour les banques guinéennes
 * 
 * Ce module permet l'intégration avec les principales banques de Guinée:
 * - BSG (Banque pour le Salut Guinéen)
 * - BICIGUI (Banque Internationale pour le Commerce et l'Industrie de Guinée)
 * - SGBG (Société Générale de Banque en Guinée)
 * - BPG (Banque Populaire de Guinée)
 * - Ecobank Guinée
 * - Orabank Guinée
 * 
 * @module banking
 */

import crypto from 'crypto';
import logger from '../../utils/logger';

// Types de banques supportées
export type BankCode = 'BSG' | 'BICIGUI' | 'SGBG' | 'BPG' | 'ECOBANK' | 'ORABANK';

// Configuration d'une banque
interface BankConfig {
  code: BankCode;
  name: string;
  swiftCode: string;
  apiBaseUrl: string;
  apiVersion: string;
  supportedServices: string[];
}

// Configuration des banques guinéennes
const BANK_CONFIGS: Record<BankCode, BankConfig> = {
  BSG: {
    code: 'BSG',
    name: 'Banque pour le Salut Guinéen',
    swiftCode: 'BSGUGNCE',
    apiBaseUrl: 'https://api.bsg-guinee.com',
    apiVersion: 'v1',
    supportedServices: ['balance', 'transactions', 'transfer', 'direct-debit'],
  },
  BICIGUI: {
    code: 'BICIGUI',
    name: 'Banque Internationale pour le Commerce et l\'Industrie de Guinée',
    swiftCode: 'BICIGNCE',
    apiBaseUrl: 'https://api.bicigui-guinee.com',
    apiVersion: 'v2',
    supportedServices: ['balance', 'transactions', 'transfer', 'direct-debit'],
  },
  SGBG: {
    code: 'SGBG',
    name: 'Société Générale de Banque en Guinée',
    swiftCode: 'SGGNGNCE',
    apiBaseUrl: 'https://api.sg-guinee.com',
    apiVersion: 'v1',
    supportedServices: ['balance', 'transactions', 'transfer'],
  },
  BPG: {
    code: 'BPG',
    name: 'Banque Populaire de Guinée',
    swiftCode: 'BPGCGNCE',
    apiBaseUrl: 'https://api.bpg-guinee.com',
    apiVersion: 'v1',
    supportedServices: ['balance', 'transactions', 'transfer'],
  },
  ECOBANK: {
    code: 'ECOBANK',
    name: 'Ecobank Guinée',
    swiftCode: 'ECOCGNCE',
    apiBaseUrl: 'https://api.ecobank.com/guinea',
    apiVersion: 'v2',
    supportedServices: ['balance', 'transactions', 'transfer', 'direct-debit', 'international'],
  },
  ORABANK: {
    code: 'ORABANK',
    name: 'Orabank Guinée',
    swiftCode: 'ORABGNCE',
    apiBaseUrl: 'https://api.orabank.com/gn',
    apiVersion: 'v1',
    supportedServices: ['balance', 'transactions', 'transfer'],
  },
};

// Types pour les opérations bancaires
export interface BankAccount {
  id: string;
  bankCode: BankCode;
  accountNumber: string;
  accountName: string;
  currency: string;
  type: 'CHECKING' | 'SAVINGS' | 'BUSINESS';
  iban?: string;
  bic?: string;
}

export interface BankBalance {
  accountNumber: string;
  currency: string;
  availableBalance: number;
  currentBalance: number;
  holdAmount: number;
  lastUpdated: Date;
}

export interface BankTransaction {
  id: string;
  accountNumber: string;
  reference: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  date: Date;
  valueDate: Date;
  counterparty?: {
    name: string;
    account?: string;
    bank?: string;
  };
  category?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
}

export interface TransferRequest {
  fromAccount: string;
  toAccount: string;
  toBank?: BankCode;
  amount: number;
  currency: string;
  reference: string;
  description?: string;
  scheduledDate?: Date;
  beneficiaryName?: string;
}

export interface TransferResult {
  success: boolean;
  transactionId?: string;
  reference?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  message?: string;
  estimatedArrival?: Date;
}

// Classe abstraite pour les adaptateurs bancaires
abstract class BankAdapter {
  protected config: BankConfig;
  protected credentials: {
    clientId: string;
    clientSecret: string;
    merchantId?: string;
  };

  constructor(
    config: BankConfig,
    credentials: { clientId: string; clientSecret: string; merchantId?: string }
  ) {
    this.config = config;
    this.credentials = credentials;
  }

  abstract getBalance(accountNumber: string): Promise<BankBalance>;
  abstract getTransactions(
    accountNumber: string,
    startDate: Date,
    endDate: Date
  ): Promise<BankTransaction[]>;
  abstract initiateTransfer(transfer: TransferRequest): Promise<TransferResult>;
  abstract getTransferStatus(transactionId: string): Promise<TransferResult>;

  // Générer la signature pour l'authentification
  protected generateSignature(payload: string, timestamp: number): string {
    const message = `${payload}${timestamp}${this.credentials.clientId}`;
    return crypto
      .createHmac('sha256', this.credentials.clientSecret)
      .update(message)
      .digest('hex');
  }

  // Headers communs pour les requêtes
  protected getHeaders(payload: string): Record<string, string> {
    const timestamp = Date.now();
    return {
      'Content-Type': 'application/json',
      'X-Client-Id': this.credentials.clientId,
      'X-Timestamp': timestamp.toString(),
      'X-Signature': this.generateSignature(payload, timestamp),
      'X-Api-Version': this.config.apiVersion,
    };
  }
}

// Adaptateur BSG (Banque pour le Salut Guinéen)
class BSGAdapter extends BankAdapter {
  async getBalance(accountNumber: string): Promise<BankBalance> {
    try {
      const payload = JSON.stringify({ accountNumber });
      const response = await fetch(`${this.config.apiBaseUrl}/${this.config.apiVersion}/accounts/balance`, {
        method: 'POST',
        headers: this.getHeaders(payload),
        body: payload,
      });

      if (!response.ok) {
        throw new Error(`BSG API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return {
        accountNumber,
        currency: data.currency || 'GNF',
        availableBalance: data.available_balance,
        currentBalance: data.current_balance,
        holdAmount: data.hold_amount || 0,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error('BSG balance fetch error', { error, accountNumber });
      throw error;
    }
  }

  async getTransactions(
    accountNumber: string,
    startDate: Date,
    endDate: Date
  ): Promise<BankTransaction[]> {
    try {
      const payload = JSON.stringify({
        account_number: accountNumber,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });

      const response = await fetch(`${this.config.apiBaseUrl}/${this.config.apiVersion}/accounts/transactions`, {
        method: 'POST',
        headers: this.getHeaders(payload),
        body: payload,
      });

      if (!response.ok) {
        throw new Error(`BSG API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return data.transactions.map((t: any) => ({
        id: t.id,
        accountNumber,
        reference: t.reference,
        type: t.type === 'C' ? 'CREDIT' : 'DEBIT',
        amount: t.amount,
        currency: t.currency || 'GNF',
        description: t.description,
        date: new Date(t.date),
        valueDate: new Date(t.value_date || t.date),
        status: t.status || 'COMPLETED',
      }));
    } catch (error) {
      logger.error('BSG transactions fetch error', { error, accountNumber });
      throw error;
    }
  }

  async initiateTransfer(transfer: TransferRequest): Promise<TransferResult> {
    try {
      const payload = JSON.stringify({
        from_account: transfer.fromAccount,
        to_account: transfer.toAccount,
        amount: transfer.amount,
        currency: transfer.currency,
        reference: transfer.reference,
        description: transfer.description,
        beneficiary_name: transfer.beneficiaryName,
      });

      const response = await fetch(`${this.config.apiBaseUrl}/${this.config.apiVersion}/transfers`, {
        method: 'POST',
        headers: this.getHeaders(payload),
        body: payload,
      });

      const data = await response.json() as any;

      return {
        success: response.ok,
        transactionId: data.transaction_id,
        reference: data.reference,
        status: data.status || 'PENDING',
        message: data.message,
        estimatedArrival: data.estimated_arrival ? new Date(data.estimated_arrival) : undefined,
      };
    } catch (error) {
      logger.error('BSG transfer error', { error, transfer });
      return {
        success: false,
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Erreur de transfert',
      };
    }
  }

  async getTransferStatus(transactionId: string): Promise<TransferResult> {
    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}/${this.config.apiVersion}/transfers/${transactionId}`,
        {
          method: 'GET',
          headers: this.getHeaders(''),
        }
      );

      const data = await response.json() as any;

      return {
        success: response.ok,
        transactionId: data.transaction_id,
        status: data.status,
        message: data.message,
      };
    } catch (error) {
      logger.error('BSG transfer status error', { error, transactionId });
      throw error;
    }
  }
}

// Adaptateur Ecobank (plusieurs pays d'Afrique)
class EcobankAdapter extends BankAdapter {
  async getBalance(accountNumber: string): Promise<BankBalance> {
    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}/${this.config.apiVersion}/accounts/${accountNumber}/balance`,
        {
          method: 'GET',
          headers: {
            ...this.getHeaders(''),
            'Authorization': `Bearer ${this.credentials.clientSecret}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Ecobank API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return {
        accountNumber,
        currency: data.accountCurrency || 'GNF',
        availableBalance: data.availableBalance,
        currentBalance: data.ledgerBalance,
        holdAmount: data.holdBalance || 0,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error('Ecobank balance fetch error', { error, accountNumber });
      throw error;
    }
  }

  async getTransactions(
    accountNumber: string,
    startDate: Date,
    endDate: Date
  ): Promise<BankTransaction[]> {
    try {
      const params = new URLSearchParams({
        fromDate: startDate.toISOString().split('T')[0],
        toDate: endDate.toISOString().split('T')[0],
      });

      const response = await fetch(
        `${this.config.apiBaseUrl}/${this.config.apiVersion}/accounts/${accountNumber}/transactions?${params}`,
        {
          method: 'GET',
          headers: {
            ...this.getHeaders(''),
            'Authorization': `Bearer ${this.credentials.clientSecret}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Ecobank API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return data.transactions.map((t: any) => ({
        id: t.transactionId,
        accountNumber,
        reference: t.narration,
        type: t.creditDebitIndicator === 'CRDT' ? 'CREDIT' : 'DEBIT',
        amount: t.amount,
        currency: t.currency || 'GNF',
        description: t.narration,
        date: new Date(t.valueDate),
        valueDate: new Date(t.valueDate),
        counterparty: t.counterPartyName ? {
          name: t.counterPartyName,
          account: t.counterPartyAccount,
        } : undefined,
        status: 'COMPLETED',
      }));
    } catch (error) {
      logger.error('Ecobank transactions fetch error', { error, accountNumber });
      throw error;
    }
  }

  async initiateTransfer(transfer: TransferRequest): Promise<TransferResult> {
    try {
      const payload = JSON.stringify({
        debitAccount: transfer.fromAccount,
        creditAccount: transfer.toAccount,
        amount: {
          value: transfer.amount,
          currency: transfer.currency,
        },
        paymentReference: transfer.reference,
        narration: transfer.description,
        beneficiaryName: transfer.beneficiaryName,
      });

      const response = await fetch(
        `${this.config.apiBaseUrl}/${this.config.apiVersion}/transfers`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.credentials.clientSecret}`,
          },
          body: payload,
        }
      );

      const data = await response.json() as any;

      return {
        success: response.ok,
        transactionId: data.transactionId,
        reference: data.paymentReference,
        status: data.status || 'PENDING',
        message: data.message,
        estimatedArrival: (data as any).expectedValueDate ? new Date((data as any).expectedValueDate) : undefined,
      };
    } catch (error) {
      logger.error('Ecobank transfer error', { error, transfer });
      return {
        success: false,
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Erreur de transfert',
      };
    }
  }

  async getTransferStatus(transactionId: string): Promise<TransferResult> {
    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}/${this.config.apiVersion}/transfers/${transactionId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.credentials.clientSecret}`,
          },
        }
      );

      const data = await response.json() as any;

      return {
        success: response.ok,
        transactionId: (data as any).transactionId,
        status: (data as any).status,
        message: (data as any).statusDescription,
      };
    } catch (error) {
      logger.error('Ecobank transfer status error', { error, transactionId });
      throw error;
    }
  }
}

// Factory pour créer les adaptateurs bancaires
export class BankIntegrationFactory {
  private static adapters: Map<BankCode, BankAdapter> = new Map();

  static createAdapter(
    bankCode: BankCode,
    credentials: { clientId: string; clientSecret: string; merchantId?: string }
  ): BankAdapter {
    const existing = this.adapters.get(bankCode);
    if (existing) {
      return existing;
    }

    const config = BANK_CONFIGS[bankCode];
    if (!config) {
      throw new Error(`Banque non supportée: ${bankCode}`);
    }

    let adapter: BankAdapter;
    switch (bankCode) {
      case 'BSG':
      case 'BICIGUI':
      case 'SGBG':
      case 'BPG':
      case 'ORABANK':
        adapter = new BSGAdapter(config, credentials);
        break;
      case 'ECOBANK':
        adapter = new EcobankAdapter(config, credentials);
        break;
      default:
        throw new Error(`Adaptateur non implémenté pour: ${bankCode}`);
    }

    this.adapters.set(bankCode, adapter);
    return adapter;
  }

  static getSupportedBanks(): Array<{ code: BankCode; name: string; swiftCode: string }> {
    return Object.values(BANK_CONFIGS).map(({ code, name, swiftCode }) => ({
      code,
      name,
      swiftCode,
    }));
  }

  static getBankConfig(bankCode: BankCode): BankConfig | undefined {
    return BANK_CONFIGS[bankCode];
  }
}

// Service principal d'intégration bancaire
export class BankIntegrationService {
  /**
   * Synchroniser les transactions bancaires avec le système
   */
  static async syncTransactions(
    companyId: string,
    bankAccount: BankAccount,
    credentials: { clientId: string; clientSecret: string },
    startDate: Date,
    endDate: Date
  ): Promise<{ imported: number; duplicates: number; errors: number }> {
    const adapter = BankIntegrationFactory.createAdapter(bankAccount.bankCode, credentials);
    
    try {
      const transactions = await adapter.getTransactions(
        bankAccount.accountNumber,
        startDate,
        endDate
      );

      logger.info('Transactions synced', {
        companyId,
        bankCode: bankAccount.bankCode,
        count: transactions.length,
      });

      return {
        imported: transactions.length,
        duplicates: 0,
        errors: 0,
      };
    } catch (error) {
      logger.error('Transaction sync error', { error, companyId, bankAccount });
      throw error;
    }
  }

  /**
   * Initier un virement bancaire
   */
  static async initiateBankTransfer(
    companyId: string,
    bankCode: BankCode,
    credentials: { clientId: string; clientSecret: string },
    transfer: TransferRequest
  ): Promise<TransferResult> {
    const adapter = BankIntegrationFactory.createAdapter(bankCode, credentials);
    
    const result = await adapter.initiateTransfer(transfer);
    
    logger.info('Bank transfer initiated', {
      companyId,
      bankCode,
      success: result.success,
      transactionId: result.transactionId,
    });

    return result;
  }

  /**
   * Obtenir le solde d'un compte bancaire
   */
  static async getAccountBalance(
    bankCode: BankCode,
    accountNumber: string,
    credentials: { clientId: string; clientSecret: string }
  ): Promise<BankBalance> {
    const adapter = BankIntegrationFactory.createAdapter(bankCode, credentials);
    return adapter.getBalance(accountNumber);
  }

  /**
   * Rapprochement bancaire automatique
   */
  static async reconcileTransactions(
    companyId: string,
    bankTransactions: BankTransaction[],
    internalTransactions: any[]
  ): Promise<{
    matched: Array<{ bank: BankTransaction; internal: any }>;
    unmatched: BankTransaction[];
    discrepancies: Array<{ bank: BankTransaction; internal: any; difference: number }>;
  }> {
    const matched: Array<{ bank: BankTransaction; internal: any }> = [];
    const unmatched: BankTransaction[] = [];
    const discrepancies: Array<{ bank: BankTransaction; internal: any; difference: number }> = [];

    for (const bankTx of bankTransactions) {
      const matching = internalTransactions.find(
        (intTx) =>
          Math.abs(intTx.amount - bankTx.amount) < 100 &&
          (intTx.reference === bankTx.reference ||
            intTx.date.toDateString() === bankTx.date.toDateString())
      );

      if (matching) {
        if (Math.abs(matching.amount - bankTx.amount) > 0) {
          discrepancies.push({
            bank: bankTx,
            internal: matching,
            difference: bankTx.amount - matching.amount,
          });
        } else {
          matched.push({ bank: bankTx, internal: matching });
        }
      } else {
        unmatched.push(bankTx);
      }
    }

    logger.info('Bank reconciliation completed', {
      companyId,
      matched: matched.length,
      unmatched: unmatched.length,
      discrepancies: discrepancies.length,
    });

    return { matched, unmatched, discrepancies };
  }
}

export default {
  BankIntegrationFactory,
  BankIntegrationService,
  BANK_CONFIGS,
};
