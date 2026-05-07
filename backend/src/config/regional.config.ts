/**
 * Configuration pour l'expansion régionale GuinéaManager
 * 
 * Ce module définit les configurations spécifiques pour chaque pays cible:
 * - Sénégal
 * - Mali  
 * - Côte d'Ivoire
 * - Guinée (base)
 * 
 * @module regional-config
 */

// Types
export type CountryCode = 'GN' | 'SN' | 'ML' | 'CI';

export interface CountryConfig {
  code: CountryCode;
  name: string;
  currency: string;
  currencySymbol: string;
  language: string;
  phonePrefix: string;
  vatRate: number;
  
  // Opérateurs Mobile Money
  mobileMoneyOperators: MobileMoneyOperator[];
  
  // Banques locales
  localBanks: LocalBank[];
  
  // Configuration fiscale
  taxConfig: TaxConfig;
  
  // Configuration paie
  payrollConfig: PayrollConfig;
}

export interface MobileMoneyOperator {
  code: string;
  name: string;
  phonePrefixes: string[];
  apiEndpoint?: string;
  fees: {
    pourcentage: number;
    minimum: number;
    maximum: number;
  };
}

export interface LocalBank {
  code: string;
  name: string;
  swiftCode: string;
  type: 'COMMERCIAL' | 'ISLAMIC' | 'MICROFINANCE';
}

export interface TaxConfig {
  vatName: string;
  vatRate: number;
  vatNumberFormat: string;
  cnssRate: { employee: number; employer: number };
  cnssPlafond: number;
  otherTaxes: Array<{ name: string; rate: number; base?: string }>;
}

export interface PayrollConfig {
  smic: number;
  workingHoursPerMonth: number;
  iprBrackets: Array<{ min: number; max: number; rate: number }>;
  familyAllowances: Array<{ parts: number; amount: number }>;
}

// ============================================
// CONFIGURATIONS PAR PAYS
// ============================================

export const COUNTRY_CONFIGS: Record<CountryCode, CountryConfig> = {
  // GUINÉE (Base)
  GN: {
    code: 'GN',
    name: 'Guinée',
    currency: 'GNF',
    currencySymbol: 'GNF',
    language: 'fr',
    phonePrefix: '+224',
    vatRate: 0.18,
    
    mobileMoneyOperators: [
      {
        code: 'ORANGE',
        name: 'Orange Money',
        phonePrefixes: ['62', '63', '64'],
        fees: { pourcentage: 1, minimum: 100, maximum: 5000 },
      },
      {
        code: 'MTN',
        name: 'MTN Mobile Money',
        phonePrefixes: ['66', '67', '68'],
        fees: { pourcentage: 1.5, minimum: 100, maximum: 5000 },
      },
      {
        code: 'WAVE',
        name: 'Wave',
        phonePrefixes: ['61'],
        fees: { pourcentage: 1, minimum: 50, maximum: 2500 },
      },
    ],
    
    localBanks: [
      { code: 'BSG', name: 'Banque pour le Salut Guinéen', swiftCode: 'BSGUGNCE', type: 'COMMERCIAL' },
      { code: 'BICIGUI', name: 'BICIGUI', swiftCode: 'BICIGNCE', type: 'COMMERCIAL' },
      { code: 'SGBG', name: 'Société Générale Guinée', swiftCode: 'SGGNGNCE', type: 'COMMERCIAL' },
      { code: 'ECOBANK', name: 'Ecobank Guinée', swiftCode: 'ECOCGNCE', type: 'COMMERCIAL' },
    ],
    
    taxConfig: {
      vatName: 'TVA',
      vatRate: 0.18,
      vatNumberFormat: 'NIF: \\d{9}',
      cnssRate: { employee: 0.05, employer: 0.18 },
      cnssPlafond: 5000000,
      otherTaxes: [],
    },
    
    payrollConfig: {
      smic: 440000,
      workingHoursPerMonth: 173.33,
      iprBrackets: [
        { min: 0, max: 500000, rate: 0 },
        { min: 500000, max: 2000000, rate: 0.10 },
        { min: 2000000, max: 5000000, rate: 0.15 },
        { min: 5000000, max: 10000000, rate: 0.20 },
        { min: 10000000, max: Infinity, rate: 0.30 },
      ],
      familyAllowances: [
        { parts: 1, amount: 50000 },
        { parts: 2, amount: 75000 },
        { parts: 3, amount: 100000 },
        { parts: 4, amount: 125000 },
      ],
    },
  },
  
  // SÉNÉGAL
  SN: {
    code: 'SN',
    name: 'Sénégal',
    currency: 'XOF',
    currencySymbol: 'FCFA',
    language: 'fr',
    phonePrefix: '+221',
    vatRate: 0.18,
    
    mobileMoneyOperators: [
      {
        code: 'ORANGE',
        name: 'Orange Money Sénégal',
        phonePrefixes: ['77', '78'],
        fees: { pourcentage: 1, minimum: 50, maximum: 2500 },
      },
      {
        code: 'WAVE',
        name: 'Wave Sénégal',
        phonePrefixes: ['76'],
        fees: { pourcentage: 1, minimum: 50, maximum: 2500 },
      },
      {
        code: 'FREE',
        name: 'Free Money',
        phonePrefixes: ['76'],
        fees: { pourcentage: 0.5, minimum: 25, maximum: 1500 },
      },
    ],
    
    localBanks: [
      { code: 'SGBS', name: 'Société Générale Sénégal', swiftCode: 'SGSNSNDA', type: 'COMMERCIAL' },
      { code: 'CBAO', name: 'CBAO', swiftCode: 'CBAOSNDA', type: 'COMMERCIAL' },
      { code: 'BHS', name: 'Banque de l\'Habitat du Sénégal', swiftCode: 'BHSISNDA', type: 'COMMERCIAL' },
      { code: 'ECOBANK', name: 'Ecobank Sénégal', swiftCode: 'ECOCSNDA', type: 'COMMERCIAL' },
    ],
    
    taxConfig: {
      vatName: 'TVA',
      vatRate: 0.18,
      vatNumberFormat: 'NU:\\d{9}',
      cnssRate: { employee: 0.056, employer: 0.165 },
      cnssPlafond: 336000,
      otherTaxes: [
        { name: 'CFCE', rate: 0.01 },
        { name: 'ITS', rate: 0.03 },
      ],
    },
    
    payrollConfig: {
      smic: 54891, // ~54,891 FCFA/hour, ~36243 FCFA/month for 173h
      workingHoursPerMonth: 173.33,
      iprBrackets: [
        { min: 0, max: 50000, rate: 0 },
        { min: 50000, max: 130000, rate: 0.10 },
        { min: 130000, max: 290000, rate: 0.15 },
        { min: 290000, max: 530000, rate: 0.20 },
        { min: 530000, max: 980000, rate: 0.25 },
        { min: 980000, max: Infinity, rate: 0.30 },
      ],
      familyAllowances: [],
    },
  },
  
  // MALI
  ML: {
    code: 'ML',
    name: 'Mali',
    currency: 'XOF',
    currencySymbol: 'FCFA',
    language: 'fr',
    phonePrefix: '+223',
    vatRate: 0.18,
    
    mobileMoneyOperators: [
      {
        code: 'ORANGE',
        name: 'Orange Money Mali',
        phonePrefixes: ['77', '78', '79'],
        fees: { pourcentage: 1, minimum: 50, maximum: 2500 },
      },
      {
        code: 'MOOV',
        name: 'Moov Money',
        phonePrefixes: ['70', '71', '72', '73'],
        fees: { pourcentage: 1, minimum: 50, maximum: 2500 },
      },
    ],
    
    localBanks: [
      { code: 'BDM', name: 'Banque de Développement du Mali', swiftCode: 'BDMAMLBA', type: 'COMMERCIAL' },
      { code: 'BMCD', name: 'Banque Malienne de Crédit et de Dépôt', swiftCode: 'BMCDMLBA', type: 'COMMERCIAL' },
      { code: 'ECOBANK', name: 'Ecobank Mali', swiftCode: 'ECOCMLBA', type: 'COMMERCIAL' },
    ],
    
    taxConfig: {
      vatName: 'TVA',
      vatRate: 0.18,
      vatNumberFormat: 'NIF:\\d{10}',
      cnssRate: { employee: 0.05, employer: 0.17 },
      cnssPlafond: 300000,
      otherTaxes: [],
    },
    
    payrollConfig: {
      smic: 28465, // FCFA par heure
      workingHoursPerMonth: 173.33,
      iprBrackets: [
        { min: 0, max: 50000, rate: 0 },
        { min: 50000, max: 150000, rate: 0.10 },
        { min: 150000, max: 400000, rate: 0.15 },
        { min: 400000, max: 800000, rate: 0.20 },
        { min: 800000, max: Infinity, rate: 0.30 },
      ],
      familyAllowances: [],
    },
  },
  
  // CÔTE D'IVOIRE
  CI: {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    currency: 'XOF',
    currencySymbol: 'FCFA',
    language: 'fr',
    phonePrefix: '+225',
    vatRate: 0.18,
    
    mobileMoneyOperators: [
      {
        code: 'ORANGE',
        name: 'Orange Money CI',
        phonePrefixes: ['07', '08', '09'],
        fees: { pourcentage: 1, minimum: 50, maximum: 2500 },
      },
      {
        code: 'MTN',
        name: 'MTN Mobile Money CI',
        phonePrefixes: ['05', '04'],
        fees: { pourcentage: 1, minimum: 50, maximum: 2500 },
      },
      {
        code: 'MOOV',
        name: 'Moov Money',
        phonePrefixes: ['01', '02'],
        fees: { pourcentage: 1, minimum: 50, maximum: 2500 },
      },
      {
        code: 'WAVE',
        name: 'Wave CI',
        phonePrefixes: ['01', '05', '07'],
        fees: { pourcentage: 1, minimum: 50, maximum: 2500 },
      },
    ],
    
    localBanks: [
      { code: 'SGBCI', name: 'Société Générale CI', swiftCode: 'SGBCFRPP', type: 'COMMERCIAL' },
      { code: 'BNI', name: 'Banque Nationale d\'Investissement', swiftCode: 'BNICIABP', type: 'COMMERCIAL' },
      { code: 'NSIA', name: 'NSIA Banque CI', swiftCode: 'NSIACIAB', type: 'COMMERCIAL' },
      { code: 'ECOBANK', name: 'Ecobank CI', swiftCode: 'ECOCCIAB', type: 'COMMERCIAL' },
    ],
    
    taxConfig: {
      vatName: 'TVA',
      vatRate: 0.18,
      vatNumberFormat: 'CC:\\d{13}',
      cnssRate: { employee: 0.06, employer: 0.12 },
      cnssPlafond: 480000,
      otherTaxes: [
        { name: 'IGR', rate: 0, base: 'income' },
      ],
    },
    
    payrollConfig: {
      smic: 75000, // FCFA par mois (SMIG)
      workingHoursPerMonth: 173.33,
      iprBrackets: [
        { min: 0, max: 75000, rate: 0 },
        { min: 75000, max: 165000, rate: 0.10 },
        { min: 165000, max: 345000, rate: 0.15 },
        { min: 345000, max: 705000, rate: 0.20 },
        { min: 705000, max: Infinity, rate: 0.25 },
      ],
      familyAllowances: [],
    },
  },
};

// ============================================
// UTILITAIRES
// ============================================

/**
 * Récupère la configuration d'un pays
 */
export function getCountryConfig(countryCode: CountryCode): CountryConfig {
  return COUNTRY_CONFIGS[countryCode];
}

/**
 * Détecte le pays à partir d'un numéro de téléphone
 */
export function detectCountryFromPhone(phone: string): CountryCode | null {
  if (phone.startsWith('+224')) return 'GN';
  if (phone.startsWith('+221')) return 'SN';
  if (phone.startsWith('+223')) return 'ML';
  if (phone.startsWith('+225')) return 'CI';
  return null;
}

/**
 * Formate un montant selon la devise du pays
 */
export function formatAmount(amount: number, countryCode: CountryCode): string {
  const config = COUNTRY_CONFIGS[countryCode];
  
  if (config.currency === 'GNF') {
    return new Intl.NumberFormat('fr-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' ' + config.currencySymbol;
  }
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: config.currency,
  }).format(amount);
}

/**
 * Valide un numéro de téléphone pour un pays
 */
export function validatePhoneNumber(phone: string, countryCode: CountryCode): boolean {
  const config = COUNTRY_CONFIGS[countryCode];
  const cleanPhone = phone.replace(/\s/g, '');
  
  // Vérifier le préfixe pays
  if (!cleanPhone.startsWith(config.phonePrefix)) {
    return false;
  }
  
  // Vérifier la longueur
  const numberWithoutPrefix = cleanPhone.replace(config.phonePrefix, '');
  if (numberWithoutPrefix.length !== 9) {
    return false;
  }
  
  return true;
}

/**
 * Identifie l'opérateur Mobile Money à partir d'un numéro
 */
export function identifyMobileOperator(
  phone: string,
  countryCode: CountryCode
): MobileMoneyOperator | null {
  const config = COUNTRY_CONFIGS[countryCode];
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  
  // Extraire le préfixe local (2 chiffres après l'indicatif pays)
  const prefixLength = countryCode === 'GN' ? 2 : 2;
  const prefixStart = countryCode === 'GN' ? 4 : 3;
  const localPrefix = cleanPhone.substring(prefixStart, prefixStart + prefixLength);
  
  for (const operator of config.mobileMoneyOperators) {
    if (operator.phonePrefixes.some(p => localPrefix.startsWith(p))) {
      return operator;
    }
  }
  
  return null;
}

export default {
  COUNTRY_CONFIGS,
  getCountryConfig,
  detectCountryFromPhone,
  formatAmount,
  validatePhoneNumber,
  identifyMobileOperator,
};
