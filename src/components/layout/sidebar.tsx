'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  UserCog, 
  Calculator, 
  Receipt, 
  BarChart3,
  Settings,
  LogOut,
  Building2,
  ShoppingCart,
  Warehouse,
  Truck,
  BookOpen,
  Target,
  DollarSign,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Brain,
  Wand2,
  Smartphone,
  Monitor,
  Map,
  Wallet,
  Receipt as ReceiptIcon,
  Briefcase,
  UsersRound,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  color?: string;
  badge?: string;
}

interface MenuSection {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    id: 'accueil',
    label: 'Accueil',
    icon: LayoutDashboard,
    color: 'text-emerald-500',
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, color: 'text-emerald-500' },
      { id: 'map-dashboard', label: 'Carte Interactive', icon: Map, color: 'text-emerald-600', badge: 'KPIs' },
      { id: 'rapports', label: 'Rapports', icon: BarChart3, color: 'text-slate-500' },
    ]
  },
  {
    id: 'ventes',
    label: 'Ventes & CRM',
    icon: ShoppingCart,
    color: 'text-pink-500',
    items: [
      { id: 'clients', label: 'Clients', icon: Users, color: 'text-blue-500' },
      { id: 'devis', label: 'Devis', icon: FileText, color: 'text-amber-500' },
      { id: 'commandes', label: 'Commandes', icon: ShoppingCart, color: 'text-pink-500' },
      { id: 'factures', label: 'Factures', icon: FileText, color: 'text-emerald-500' },
      { id: 'crm', label: 'CRM', icon: Target, color: 'text-indigo-500' },
      { id: 'pos', label: 'Point de Vente', icon: Monitor, color: 'text-indigo-500', badge: 'POS' },
    ]
  },
  {
    id: 'produits-stock',
    label: 'Produits & Stocks',
    icon: Package,
    color: 'text-purple-500',
    items: [
      { id: 'produits', label: 'Produits', icon: Package, color: 'text-purple-500' },
      { id: 'stock', label: 'Gestion Stock', icon: Warehouse, color: 'text-orange-500' },
      { id: 'fournisseurs', label: 'Fournisseurs', icon: Truck, color: 'text-teal-500' },
      { id: 'logistique', label: 'Logistique', icon: Truck, color: 'text-teal-500', badge: 'GPS' },
    ]
  },
  {
    id: 'rh-paie',
    label: 'RH & Paie',
    icon: UserCog,
    color: 'text-cyan-500',
    items: [
      { id: 'rh', label: 'Ressources Humaines', icon: UsersRound, color: 'text-cyan-500', badge: 'RH' },
      { id: 'employes', label: 'Employés', icon: Users, color: 'text-cyan-500' },
      { id: 'paie', label: 'Paie', icon: Calculator, color: 'text-green-500' },
    ]
  },
  {
    id: 'finance',
    label: 'Finance & Comptabilité',
    icon: Wallet,
    color: 'text-yellow-500',
    items: [
      { id: 'depenses', label: 'Dépenses', icon: Receipt, color: 'text-red-500' },
      { id: 'comptabilite', label: 'Comptabilité OHADA', icon: BookOpen, color: 'text-violet-500' },
      { id: 'devises', label: 'Multi-Devises', icon: DollarSign, color: 'text-yellow-500' },
    ]
  },
  {
    id: 'paiements',
    label: 'Paiements Mobile',
    icon: Wallet,
    color: 'text-orange-500',
    items: [
      { id: 'mobile-money', label: 'Mobile Money', icon: DollarSign, color: 'text-orange-500', badge: 'GN' },
      { id: 'mobile', label: 'App Mobile', icon: Smartphone, color: 'text-blue-500', badge: 'PWA' },
    ]
  },
  {
    id: 'ia',
    label: 'Intelligence Artificielle',
    icon: Brain,
    color: 'text-purple-500',
    items: [
      { id: 'ai-predictive', label: 'IA Prédictive', icon: Brain, color: 'text-purple-500', badge: 'IA' },
      { id: 'ai-assistant', label: 'Assistant IA', icon: Wand2, color: 'text-pink-500', badge: 'Nouveau' },
    ]
  },
];

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const { user, company, logout } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['accueil', 'ventes']);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Close sidebar on page change (mobile)
  const handlePageChange = (page: string) => {
    onPageChange(page);
    setIsOpen(false);
  };

  // Find which section contains the current page
  const findSectionForPage = (pageId: string): string | undefined => {
    for (const section of menuSections) {
      if (section.items.some(item => item.id === pageId)) {
        return section.id;
      }
    }
    return undefined;
  };

  // Auto-expand section containing current page
  useEffect(() => {
    const sectionId = findSectionForPage(currentPage);
    if (sectionId && !expandedSections.includes(sectionId)) {
      setExpandedSections(prev => [...prev, sectionId]);
    }
  }, [currentPage]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 ease-out',
        // Desktop: always visible
        'lg:translate-x-0',
        isCollapsed ? 'lg:w-20' : 'lg:w-72',
        // Mobile: slide in/out
        isOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'
      )}>
        {/* Logo & Company */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900 flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div className={cn(
              'flex-1 min-w-0 transition-opacity',
              isCollapsed && 'lg:opacity-0 lg:hidden'
            )}>
              <h1 className="font-bold text-lg truncate">GuinéaManager</h1>
              <p className="text-xs text-slate-400">ERP pour PME africaines</p>
            </div>
            
            {/* Mobile close button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Desktop collapse button */}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                'hidden lg:flex p-2 hover:bg-slate-800 rounded-lg transition-all',
                isCollapsed && 'rotate-180'
              )}
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          {company && !isCollapsed && (
            <div className="mt-3 text-xs text-slate-400 bg-slate-800/50 rounded-lg px-2.5 py-1.5 truncate">
              {company.nom}
            </div>
          )}
        </div>

        {/* Navigation with Dropdown Sections */}
        <nav className="flex-1 p-2 overflow-y-auto scrollbar-thin">
          {menuSections.map((section) => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSections.includes(section.id);
            const hasActiveItem = section.items.some(item => item.id === currentPage);
            
            return (
              <div key={section.id} className="mb-1">
                {/* Section Header */}
                <button
                  onClick={() => !isCollapsed && toggleSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    hasActiveItem 
                      ? 'bg-slate-800 text-white' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white',
                    isCollapsed && 'lg:justify-center lg:px-2'
                  )}
                  title={isCollapsed ? section.label : undefined}
                >
                  <SectionIcon className={cn('w-5 h-5 flex-shrink-0', section.color)} />
                  <span className={cn(
                    'flex-1 text-left truncate',
                    isCollapsed && 'lg:hidden'
                  )}>
                    {section.label}
                  </span>
                  {!isCollapsed && (
                    <ChevronDown className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      isExpanded && 'rotate-180'
                    )} />
                  )}
                </button>
                
                {/* Section Items */}
                {isExpanded && !isCollapsed && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-700/50 pl-2">
                    {section.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = currentPage === item.id;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handlePageChange(item.id)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group',
                            isActive 
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                          )}
                        >
                          <ItemIcon className={cn(
                            'w-4 h-4 flex-shrink-0',
                            isActive ? 'text-white' : item.color,
                            'group-hover:scale-110 transition-transform'
                          )} />
                          <span className="truncate flex-1">
                            {item.label}
                          </span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs bg-purple-600/20 text-purple-300 border-purple-500/30">
                              {item.badge}
                            </Badge>
                          )}
                          {isActive && !item.badge && (
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* Collapsed: Show items as icons */}
                {isCollapsed && (
                  <div className="hidden lg:flex flex-col gap-1 mt-1">
                    {section.items.slice(0, 3).map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = currentPage === item.id;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handlePageChange(item.id)}
                          className={cn(
                            'w-full flex items-center justify-center p-2 rounded-lg text-sm transition-all duration-200',
                            isActive 
                              ? 'bg-emerald-600 text-white' 
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                          )}
                          title={item.label}
                        >
                          <ItemIcon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div className="p-3 border-t border-slate-700/50 space-y-1">
          {user && (
            <div className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm rounded-xl bg-slate-800/50',
              isCollapsed && 'lg:justify-center lg:px-2'
            )}>
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center font-semibold text-sm shadow-lg">
                {user.prenom?.[0] || 'U'}{user.nom?.[0] || ''}
              </div>
              <div className={cn(
                'flex-1 min-w-0',
                isCollapsed && 'lg:hidden'
              )}>
                <p className="font-medium truncate">{user.prenom} {user.nom}</p>
                <p className="text-xs text-slate-400 truncate">{user.role}</p>
              </div>
            </div>
          )}
          
          <button
            onClick={() => handlePageChange('settings')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              currentPage === 'settings'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white',
              isCollapsed && 'lg:justify-center lg:px-2'
            )}
          >
            <Settings className="w-5 h-5" />
            <span className={cn(isCollapsed && 'lg:hidden')}>Paramètres</span>
          </button>
          
          <button
            onClick={logout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all duration-200',
              isCollapsed && 'lg:justify-center lg:px-2'
            )}
          >
            <LogOut className="w-5 h-5" />
            <span className={cn(isCollapsed && 'lg:hidden')}>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Spacer for desktop */}
      <div className={cn(
        'hidden lg:block flex-shrink-0 transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-72'
      )} />
    </>
  );
}
