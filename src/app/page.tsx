'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { SimpleLoginPage } from '@/components/pages/simple-login-page';
import { RegisterPage } from '@/components/pages/register-page';
import { DashboardPage } from '@/components/pages/dashboard-page';
import { ClientsPage } from '@/components/pages/clients-page';
import { ProduitsPage } from '@/components/pages/produits-page';
import { FacturesEnhancedPage } from '@/components/pages/factures-enhanced-page';
import { EmployesEnhancedPage } from '@/components/pages/employes-enhanced-page';
import { PaiePage } from '@/components/pages/paie-page';
import { DepensesPage } from '@/components/pages/depenses-page';
import { RapportsAdvancedPage } from '@/components/pages/rapports-advanced-page';
import { AIDashboardPage } from '@/components/pages/ai-dashboard-page';
import { AIAssistantPage } from '@/components/pages/ai-assistant-page';
import { SettingsPage } from '@/components/pages/settings-page';
import { DevisPage } from '@/components/pages/devis-page';
import { CommandesPage } from '@/components/pages/commandes-page';
import { StockPage } from '@/components/pages/stock-page';
import { FournisseursPage } from '@/components/pages/fournisseurs-page';
import { ComptabilitePage } from '@/components/pages/comptabilite-page';
import { CRMPage } from '@/components/pages/crm-page';
import { DevisesPage } from '@/components/pages/devises-page';
import { RHPage } from '@/components/pages/rh-page';
import { MobileMoneyPage } from '@/components/pages/mobile-money-page';
import { MobileAppPage } from '@/components/pages/mobile-app-page';
import { POSPage } from '@/components/pages/pos-page';
import { AIPredictivePage } from '@/components/pages/ai-predictive-page';
import { LogistiquePage } from '@/components/pages/logistique-page';
import { ChatWidget } from '@/components/chatbot/ChatWidget';
import { useAppStore } from '@/stores/auth-store';

const pageConfig: Record<string, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Tableau de bord', subtitle: 'Vue d\'ensemble de votre activité' },
  'ai-dashboard': { title: 'Tableau de Bord IA', subtitle: 'Analyses intelligentes et prédictions' },
  'ai-predictive': { title: 'IA Prédictive', subtitle: 'Prévisions de trésorerie, risques et suggestions' },
  'ai-assistant': { title: 'Assistant IA', subtitle: 'Outils intelligents pour votre gestion' },
  clients: { title: 'Clients', subtitle: 'Gestion de vos clients' },
  produits: { title: 'Produits', subtitle: 'Catalogue et stocks' },
  factures: { title: 'Factures', subtitle: 'Facturation et paiements' },
  devis: { title: 'Devis', subtitle: 'Gestion des devis clients' },
  commandes: { title: 'Commandes', subtitle: 'Suivi des commandes clients' },
  logistique: { title: 'Logistique & Livraisons', subtitle: 'Gestion des livreurs et suivi GPS' },
  stock: { title: 'Stock', subtitle: 'Gestion avancée des stocks' },
  fournisseurs: { title: 'Fournisseurs', subtitle: 'Gestion des fournisseurs' },
  crm: { title: 'CRM', subtitle: 'Gestion des prospects et opportunités' },
  'mobile-money': { title: 'Mobile Money', subtitle: 'Orange Money, MTN, Wave - Paiements et transferts' },
  'mobile': { title: 'Application Mobile', subtitle: 'Vente mobile et mode hors-ligne' },
  'pos': { title: 'Point de Vente', subtitle: 'Caisse tactile pour commerçants' },
  rh: { title: 'Ressources Humaines', subtitle: 'Gestion complète RH : congés, présences, recrutement' },
  employes: { title: 'Employés', subtitle: 'Gestion du personnel' },
  paie: { title: 'Paie', subtitle: 'Bulletins de paie et salaires' },
  depenses: { title: 'Dépenses', subtitle: 'Suivi des dépenses' },
  comptabilite: { title: 'Comptabilité OHADA', subtitle: 'Plan comptable Syscohada révisé' },
  devises: { title: 'Multi-Devises', subtitle: 'Taux de change et conversions' },
  rapports: { title: 'Rapports', subtitle: 'Analyses et statistiques' },
  settings: { title: 'Paramètres', subtitle: 'Configuration du compte' },
};

export default function Home() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const { isAuthenticated, login, register, checkAuth } = useAppStore();

  // Check authentication on mount - only once
  useEffect(() => {
    // Check if we have a token before making API call
    const token = localStorage.getItem('guineamanager-token');
    if (token) {
      setIsCheckingAuth(true);
      checkAuth().finally(() => setIsCheckingAuth(false));
    }
  }, [checkAuth]);

  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password);
    return result;
  };

  const handleRegister = async (data: { email: string; password: string; nom: string; prenom: string; companyName: string }) => {
    const result = await register(data);
    return result;
  };

  if (!isAuthenticated) {
    // Show loading while checking auth
    if (isCheckingAuth) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Chargement...</p>
          </div>
        </div>
      );
    }
    
    if (authMode === 'register') {
      return (
        <RegisterPage
          onRegister={handleRegister}
          onSwitchToLogin={() => setAuthMode('login')}
        />
      );
    }
    return (
      <SimpleLoginPage />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'ai-dashboard':
        return <AIDashboardPage />;
      case 'ai-predictive':
        return <AIPredictivePage />;
      case 'ai-assistant':
        return <AIAssistantPage />;
      case 'clients':
        return <ClientsPage />;
      case 'produits':
        return <ProduitsPage />;
      case 'factures':
        return <FacturesEnhancedPage />;
      case 'devis':
        return <DevisPage />;
      case 'commandes':
        return <CommandesPage />;
      case 'logistique':
        return <LogistiquePage />;
      case 'stock':
        return <StockPage />;
      case 'fournisseurs':
        return <FournisseursPage />;
      case 'crm':
        return <CRMPage />;
      case 'mobile-money':
        return <MobileMoneyPage />;
      case 'mobile':
        return <MobileAppPage />;
      case 'pos':
        return <POSPage />;
      case 'rh':
        return <RHPage />;
      case 'employes':
        return <EmployesEnhancedPage />;
      case 'paie':
        return <PaiePage />;
      case 'depenses':
        return <DepensesPage />;
      case 'comptabilite':
        return <ComptabilitePage />;
      case 'devises':
        return <DevisesPage />;
      case 'rapports':
        return <RapportsAdvancedPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-100 flex">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header 
            title="" 
            subtitle="" 
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {renderPage()}
          </main>
        </div>
      </div>
      {/* Chatbot Widget with GLM-5 */}
      <ChatWidget />
    </>
  );
}
