// Modules Service for GuinéaManager ERP
// Gestion de la configuration des modules par entreprise

import prisma from '../utils/database';

// Liste des modules disponibles dans le système
export const AVAILABLE_MODULES = [
  {
    id: 'dashboard',
    nom: 'Tableau de bord',
    description: 'Vue d\'ensemble de votre activité',
    icon: 'LayoutDashboard',
    actifParDefaut: true,
    categorie: 'general'
  },
  {
    id: 'facturation',
    nom: 'Facturation',
    description: 'Création et gestion des factures',
    icon: 'FileText',
    actifParDefaut: true,
    categorie: 'ventes'
  },
  {
    id: 'clients',
    nom: 'Clients',
    description: 'Gestion de la clientèle',
    icon: 'Users',
    actifParDefaut: true,
    categorie: 'ventes'
  },
  {
    id: 'produits',
    nom: 'Produits & Services',
    description: 'Catalogue de produits et services',
    icon: 'Package',
    actifParDefaut: true,
    categorie: 'ventes'
  },
  {
    id: 'devis',
    nom: 'Devis',
    description: 'Création et suivi des devis',
    icon: 'FileSignature',
    actifParDefaut: true,
    categorie: 'ventes'
  },
  {
    id: 'employes',
    nom: 'Employés',
    description: 'Gestion des employés',
    icon: 'UserCog',
    actifParDefaut: false,
    categorie: 'rh'
  },
  {
    id: 'paie',
    nom: 'Paie',
    description: 'Gestion de la paie et bulletins',
    icon: 'Wallet',
    actifParDefaut: false,
    categorie: 'rh'
  },
  {
    id: 'depenses',
    nom: 'Dépenses',
    description: 'Suivi des dépenses',
    icon: 'TrendingDown',
    actifParDefaut: true,
    categorie: 'comptabilite'
  },
  {
    id: 'stock',
    nom: 'Stock',
    description: 'Gestion des stocks et inventaires',
    icon: 'Warehouse',
    actifParDefaut: false,
    categorie: 'logistique'
  },
  {
    id: 'comptabilite',
    nom: 'Comptabilité',
    description: 'Comptabilité OHADA',
    icon: 'Calculator',
    actifParDefaut: false,
    categorie: 'comptabilite'
  },
  {
    id: 'rapports',
    nom: 'Rapports',
    description: 'Rapports et analyses',
    icon: 'BarChart3',
    actifParDefaut: true,
    categorie: 'general'
  },
  {
    id: 'crm',
    nom: 'CRM',
    description: 'Gestion de la relation client',
    icon: 'HeartHandshake',
    actifParDefaut: false,
    categorie: 'ventes'
  },
  {
    id: 'mobile-money',
    nom: 'Mobile Money',
    description: 'Paiements Orange Money, MTN, Wave',
    icon: 'Smartphone',
    actifParDefaut: false,
    categorie: 'paiements'
  },
  {
    id: 'fournisseurs',
    nom: 'Fournisseurs',
    description: 'Gestion des fournisseurs',
    icon: 'Truck',
    actifParDefaut: false,
    categorie: 'achats'
  },
  {
    id: 'parametres',
    nom: 'Paramètres',
    description: 'Configuration de l\'entreprise',
    icon: 'Settings',
    actifParDefaut: true,
    categorie: 'general'
  },
  {
    id: 'support',
    nom: 'Support',
    description: 'Tickets et assistance',
    icon: 'HeadphonesIcon',
    actifParDefaut: true,
    categorie: 'general'
  }
];

/**
 * Get all available modules with their configuration status for a company
 */
export const getCompanyModules = async (companyId: string) => {
  // Get all module configurations for this company
  const configurations = await prisma.moduleConfiguration.findMany({
    where: { companyId }
  });

  // Create a map of configured modules
  const configMap = new Map(
    configurations.map(c => [c.moduleCode, c.enabled])
  );

  // Return all modules with their status
  return AVAILABLE_MODULES.map(module => {
    const isConfigured = configMap.has(module.id);
    const isEnabled = configMap.get(module.id);

    return {
      ...module,
      enabled: isConfigured ? isEnabled : module.actifParDefaut,
      configured: isConfigured
    };
  });
};

/**
 * Update module configuration for a company
 */
export const updateModuleConfiguration = async (
  companyId: string,
  moduleCode: string,
  enabled: boolean
) => {
  // Verify the module exists
  const moduleExists = AVAILABLE_MODULES.some(m => m.id === moduleCode);
  if (!moduleExists) {
    throw new Error(`Module '${moduleCode}' n'existe pas`);
  }

  // Upsert the configuration
  const config = await prisma.moduleConfiguration.upsert({
    where: {
      companyId_moduleCode: {
        companyId,
        moduleCode
      }
    },
    update: {
      enabled,
      updatedAt: new Date()
    },
    create: {
      companyId,
      moduleCode,
      enabled
    }
  });

  return config;
};

/**
 * Batch update multiple module configurations
 */
export const batchUpdateModules = async (
  companyId: string,
  modules: Array<{ moduleCode: string; enabled: boolean }>
) => {
  const results = [];

  for (const { moduleCode, enabled } of modules) {
    const result = await updateModuleConfiguration(companyId, moduleCode, enabled);
    results.push(result);
  }

  return results;
};

/**
 * Check if a specific module is enabled for a company
 */
export const isModuleEnabled = async (companyId: string, moduleCode: string): Promise<boolean> => {
  const config = await prisma.moduleConfiguration.findUnique({
    where: {
      companyId_moduleCode: {
        companyId,
        moduleCode
      }
    }
  });

  if (config) {
    return config.enabled;
  }

  // If not configured, use default
  const module = AVAILABLE_MODULES.find(m => m.id === moduleCode);
  return module?.actifParDefaut ?? false;
};

/**
 * Get enabled module codes for a company
 */
export const getEnabledModuleCodes = async (companyId: string): Promise<string[]> => {
  const modules = await getCompanyModules(companyId);
  return modules.filter(m => m.enabled).map(m => m.id);
};
