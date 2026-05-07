'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Smartphone, Scan, Camera, ShoppingCart, Package, Users, FileText,
  Plus, Minus, Trash2, Check, X, Search, Barcode, QrCode, CreditCard,
  RefreshCw, Wifi, WifiOff, Download, Share2, CheckCircle, AlertCircle,
  DollarSign, Phone, Send, Printer, Clock, MapPin, User, Building2,
  ChevronRight, MoreHorizontal, Eye, Edit2, Ban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF, formatDate } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

// Types
interface PanierItem {
  produitId: string;
  nom: string;
  prixUnitaire: number;
  quantite: number;
  stock: number;
  codeBarre?: string;
}

interface VenteMobile {
  id: string;
  date: string;
  items: PanierItem[];
  total: number;
  clientNom?: string;
  clientTelephone?: string;
  modePaiement: 'ESPECES' | 'ORANGE_MONEY' | 'MTN_MONEY' | 'WAVE' | 'CARTE';
  statut: 'EN_COURS' | 'VALIDEE' | 'ANNULEE';
  sync: 'SYNCED' | 'PENDING' | 'FAILED';
}

interface ProduitLocal {
  id: string;
  nom: string;
  prix: number;
  stock: number;
  codeBarre: string;
  categorie: string;
  image?: string;
}

// Demo products for offline mode
const produitsDemo: ProduitLocal[] = [
  { id: 'p1', nom: 'Riz local 50kg', prix: 450000, stock: 150, codeBarre: '6220000000001', categorie: 'Alimentaire' },
  { id: 'p2', nom: 'Huile végétale 5L', prix: 85000, stock: 80, codeBarre: '6220000000002', categorie: 'Alimentaire' },
  { id: 'p3', nom: 'Sucre blanc 1kg', prix: 15000, stock: 200, codeBarre: '6220000000003', categorie: 'Alimentaire' },
  { id: 'p4', nom: 'Savon de ménage', prix: 5000, stock: 300, codeBarre: '6220000000004', categorie: 'Hygiène' },
  { id: 'p5', nom: 'Lait en poudre 400g', prix: 25000, stock: 120, codeBarre: '6220000000005', categorie: 'Alimentaire' },
  { id: 'p6', nom: 'Café torréfié 250g', prix: 18000, stock: 90, codeBarre: '6220000000006', categorie: 'Alimentaire' },
  { id: 'p7', nom: 'Eau minérale 1.5L', prix: 3500, stock: 500, codeBarre: '6220000000007', categorie: 'Boissons' },
  { id: 'p8', nom: 'Pates alimentaires 500g', prix: 8000, stock: 180, codeBarre: '6220000000008', categorie: 'Alimentaire' },
];

export function MobileAppPage() {
  const { clients, produits } = useAppStore();
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState('vente');
  const [searchProduit, setSearchProduit] = useState('');
  const [scanMode, setScanMode] = useState(false);
  const [panier, setPanier] = useState<PanierItem[]>([]);
  const [ventes, setVentes] = useState<VenteMobile[]>([]);
  const [produitsLocal, setProduitsLocal] = useState<ProduitLocal[]>(produitsDemo);
  const [pendingSync, setPendingSync] = useState(0);
  
  // Dialog states
  const [isPaiementDialogOpen, setIsPaiementDialogOpen] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isVenteDialogOpen, setIsVenteDialogOpen] = useState(false);
  const [selectedVente, setSelectedVente] = useState<VenteMobile | null>(null);
  
  // Form states
  const [clientForm, setClientForm] = useState({ nom: '', telephone: '' });
  const [modePaiement, setModePaiement] = useState<'ESPECES' | 'ORANGE_MONEY' | 'MTN_MONEY' | 'WAVE' | 'CARTE'>('ESPECES');
  const [montantRecu, setMontantRecu] = useState(0);
  
  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial state
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending sales from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('guineamanager_pending_sales');
    if (saved) {
      const parsed = JSON.parse(saved);
      setVentes(parsed);
      setPendingSync(parsed.filter((v: VenteMobile) => v.sync === 'PENDING').length);
    }
  }, []);

  // Save to localStorage when sales change
  useEffect(() => {
    localStorage.setItem('guineamanager_pending_sales', JSON.stringify(ventes));
    setPendingSync(ventes.filter(v => v.sync === 'PENDING').length);
  }, [ventes]);

  // Calculate totals
  const totalPanier = panier.reduce((acc, item) => acc + (item.prixUnitaire * item.quantite), 0);
  const nombreArticles = panier.reduce((acc, item) => acc + item.quantite, 0);

  // Filter products
  const filteredProduits = produitsLocal.filter(p => 
    p.nom.toLowerCase().includes(searchProduit.toLowerCase()) ||
    p.codeBarre.includes(searchProduit)
  );

  // Add to cart
  const addToPanier = (produit: ProduitLocal) => {
    const existing = panier.find(item => item.produitId === produit.id);
    
    if (existing) {
      if (existing.quantite < produit.stock) {
        setPanier(panier.map(item => 
          item.produitId === produit.id 
            ? { ...item, quantite: item.quantite + 1 }
            : item
        ));
      }
    } else {
      setPanier([...panier, {
        produitId: produit.id,
        nom: produit.nom,
        prixUnitaire: produit.prix,
        quantite: 1,
        stock: produit.stock,
        codeBarre: produit.codeBarre
      }]);
    }
  };

  // Update quantity
  const updateQuantite = (produitId: string, change: number) => {
    setPanier(panier.map(item => {
      if (item.produitId === produitId) {
        const newQty = item.quantite + change;
        if (newQty <= 0) return item;
        if (newQty > item.stock) return item;
        return { ...item, quantite: newQty };
      }
      return item;
    }));
  };

  // Remove from cart
  const removeFromPanier = (produitId: string) => {
    setPanier(panier.filter(item => item.produitId !== produitId));
  };

  // Clear cart
  const clearPanier = () => {
    setPanier([]);
    setClientForm({ nom: '', telephone: '' });
  };

  // Validate sale
  const validerVente = () => {
    if (panier.length === 0) return;
    
    const newVente: VenteMobile = {
      id: `VNT-${Date.now()}`,
      date: new Date().toISOString(),
      items: [...panier],
      total: totalPanier,
      clientNom: clientForm.nom || undefined,
      clientTelephone: clientForm.telephone || undefined,
      modePaiement,
      statut: 'VALIDEE',
      sync: isOnline ? 'SYNCED' : 'PENDING'
    };
    
    setVentes([newVente, ...ventes]);
    
    // Update stock
    setProduitsLocal(produitsLocal.map(p => {
      const soldItem = panier.find(item => item.produitId === p.id);
      if (soldItem) {
        return { ...p, stock: p.stock - soldItem.quantite };
      }
      return p;
    }));
    
    // Clear cart
    setPanier([]);
    setClientForm({ nom: '', telephone: '' });
    setIsPaiementDialogOpen(false);
    setModePaiement('ESPECES');
    setMontantRecu(0);
  };

  // Sync pending sales
  const synchroniser = useCallback(async () => {
    if (!isOnline) return;
    
    const pending = ventes.filter(v => v.sync === 'PENDING');
    
    for (const vente of pending) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setVentes(prev => prev.map(v => 
          v.id === vente.id ? { ...v, sync: 'SYNCED' } : v
        ));
      } catch (error) {
        setVentes(prev => prev.map(v => 
          v.id === vente.id ? { ...v, sync: 'FAILED' } : v
        ));
      }
    }
  }, [isOnline, ventes]);

  // Scan barcode simulation
  const simulerScan = () => {
    setScanMode(true);
    setTimeout(() => {
      const randomProduct = produitsLocal[Math.floor(Math.random() * produitsLocal.length)];
      addToPanier(randomProduct);
      setScanMode(false);
    }, 1500);
  };

  // Install PWA
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const installPWA = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Mobile */}
      <header className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6" />
          <div>
            <h1 className="font-bold">GuinéaManager</h1>
            <p className="text-xs text-emerald-100">Vendeur Mobile</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-emerald-200" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-300" />
            )}
          </div>
          {pendingSync > 0 && (
            <Badge className="bg-amber-500 text-white">
              {pendingSync} en attente
            </Badge>
          )}
          {!isInstalled && installPrompt && (
            <Button size="sm" variant="secondary" onClick={installPWA}>
              <Download className="w-4 h-4 mr-1" />
              Installer
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-amber-500 text-white px-4 py-2 text-sm flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            Mode hors-ligne actif - Les ventes seront synchronisées ultérieurement
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Vente Tab */}
          <TabsContent value="vente" className="m-0">
            {/* Search & Scan */}
            <div className="p-4 bg-white border-b space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher produit ou scanner..."
                    value={searchProduit}
                    onChange={(e) => setSearchProduit(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={simulerScan}
                  disabled={scanMode}
                >
                  {scanMode ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Scan className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="p-4 grid grid-cols-2 gap-3">
              {filteredProduits.map((produit) => (
                <Card 
                  key={produit.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addToPanier(produit)}
                >
                  <CardContent className="p-3">
                    <div className="aspect-square bg-slate-100 rounded-lg mb-2 flex items-center justify-center">
                      <Package className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="font-medium text-sm line-clamp-2">{produit.nom}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-emerald-600 font-bold">{formatGNF(produit.prix)}</p>
                      <Badge variant={produit.stock > 10 ? 'secondary' : 'destructive'} className="text-xs">
                        {produit.stock}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Panier Tab */}
          <TabsContent value="panier" className="m-0">
            {panier.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p>Panier vide</p>
                <p className="text-sm mt-1">Ajoutez des produits pour commencer</p>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="p-4 space-y-3">
                  {panier.map((item) => (
                    <Card key={item.produitId}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-slate-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-sm">{item.nom}</h3>
                            <p className="text-emerald-600 font-semibold">{formatGNF(item.prixUnitaire)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="icon" 
                              variant="outline" 
                              className="h-8 w-8"
                              onClick={() => updateQuantite(item.produitId, -1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{item.quantite}</span>
                            <Button 
                              size="icon" 
                              variant="outline" 
                              className="h-8 w-8"
                              onClick={() => updateQuantite(item.produitId, 1)}
                              disabled={item.quantite >= item.stock}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t">
                          <Badge variant="outline" className="text-xs">
                            <Barcode className="w-3 h-3 mr-1" />
                            {item.codeBarre}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{formatGNF(item.prixUnitaire * item.quantite)}</span>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-red-500"
                              onClick={() => removeFromPanier(item.produitId)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Cart Summary */}
                <div className="fixed bottom-20 left-0 right-0 bg-white border-t p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Articles: {nombreArticles}</span>
                    <Button variant="ghost" size="sm" onClick={clearPanier}>
                      Vider le panier
                    </Button>
                  </div>
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-emerald-600">{formatGNF(totalPanier)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsClientDialogOpen(true)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      {clientForm.nom || 'Client'}
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setIsPaiementDialogOpen(true)}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Payer
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Historique Tab */}
          <TabsContent value="historique" className="m-0">
            <div className="p-4 space-y-3">
              {/* Sync Button */}
              {pendingSync > 0 && isOnline && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={synchroniser}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Synchroniser {pendingSync} vente(s)
                </Button>
              )}

              {/* Sales List */}
              {ventes.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p>Aucune vente</p>
                </div>
              ) : (
                ventes.map((vente) => (
                  <Card 
                    key={vente.id} 
                    className="cursor-pointer"
                    onClick={() => { setSelectedVente(vente); setIsVenteDialogOpen(true); }}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{formatGNF(vente.total)}</p>
                          <p className="text-xs text-slate-500">
                            {vente.items.length} article(s) • {new Date(vente.date).toLocaleTimeString('fr-GN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {vente.clientNom && (
                            <p className="text-xs text-slate-600 mt-1">
                              <User className="w-3 h-3 inline mr-1" />
                              {vente.clientNom}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={
                            vente.modePaiement === 'ESPECES' ? 'secondary' :
                            vente.modePaiement === 'ORANGE_MONEY' ? 'default' :
                            vente.modePaiement === 'MTN_MONEY' ? 'default' :
                            'outline'
                          } className={
                            vente.modePaiement === 'ORANGE_MONEY' ? 'bg-orange-500' :
                            vente.modePaiement === 'MTN_MONEY' ? 'bg-yellow-500' :
                            vente.modePaiement === 'WAVE' ? 'bg-cyan-500' : ''
                          }>
                            {vente.modePaiement === 'ESPECES' ? 'Espèces' :
                             vente.modePaiement === 'ORANGE_MONEY' ? 'Orange' :
                             vente.modePaiement === 'MTN_MONEY' ? 'MTN' :
                             vente.modePaiement === 'WAVE' ? 'Wave' : 'Carte'}
                          </Badge>
                          <Badge variant={vente.sync === 'SYNCED' ? 'default' : 'secondary'} className={
                            vente.sync === 'SYNCED' ? 'bg-emerald-600' :
                            vente.sync === 'PENDING' ? 'bg-amber-500' : 'bg-red-500'
                          }>
                            {vente.sync === 'SYNCED' ? 'Synchronisé' :
                             vente.sync === 'PENDING' ? 'En attente' : 'Échec'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Plus Tab */}
          <TabsContent value="plus" className="m-0">
            <div className="p-4 space-y-4">
              {/* Status Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-3 h-3 rounded-full',
                      isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                    )} />
                    <div>
                      <p className="font-medium">{isOnline ? 'En ligne' : 'Hors ligne'}</p>
                      <p className="text-sm text-slate-500">
                        {pendingSync > 0 ? `${pendingSync} vente(s) en attente de sync` : 'Toutes les données synchronisées'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Menu Items */}
              <Card>
                <CardContent className="p-0">
                  {[
                    { icon: Users, label: 'Clients', count: clients.length },
                    { icon: Package, label: 'Produits', count: produitsLocal.length },
                    { icon: FileText, label: 'Factures', count: 0 },
                    { icon: Printer, label: 'Imprimante Bluetooth', count: null },
                  ].map((item, i) => (
                    <button key={i} className="w-full flex items-center justify-between p-4 border-b last:border-0 hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-slate-600" />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.count !== null && (
                          <Badge variant="secondary">{item.count}</Badge>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Install PWA */}
              {!isInstalled && installPrompt && (
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Download className="w-8 h-8 text-emerald-600" />
                      <div className="flex-1">
                        <p className="font-medium text-emerald-800">Installer l'application</p>
                        <p className="text-sm text-emerald-600">Accès rapide depuis votre écran d'accueil</p>
                      </div>
                    </div>
                    <Button className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700" onClick={installPWA}>
                      Installer
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* About */}
              <Card>
                <CardContent className="p-4 text-center text-slate-500 text-sm">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                  <p className="font-medium text-slate-700">GuinéaManager</p>
                  <p>Version 1.0.0</p>
                  <p className="mt-1">ERP pour PME en Afrique de l'Ouest</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-50">
        {[
          { id: 'vente', icon: Package, label: 'Produits' },
          { id: 'panier', icon: ShoppingCart, label: `Panier (${nombreArticles})`, badge: nombreArticles > 0 ? nombreArticles : undefined },
          { id: 'historique', icon: Clock, label: 'Historique', badge: pendingSync > 0 ? pendingSync : undefined },
          { id: 'plus', icon: MoreHorizontal, label: 'Plus' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex flex-col items-center gap-1 py-1 px-3 relative',
              activeTab === tab.id ? 'text-emerald-600' : 'text-slate-500'
            )}
          >
            {tab.badge && (
              <span className="absolute -top-1 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {tab.badge}
              </span>
            )}
            <tab.icon className="w-6 h-6" />
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Dialog: Paiement */}
      <Dialog open={isPaiementDialogOpen} onOpenChange={setIsPaiementDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mode de paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-sm text-slate-500">Total à payer</p>
              <p className="text-3xl font-bold text-emerald-600">{formatGNF(totalPanier)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'ESPECES', label: 'Espèces', icon: DollarSign, color: 'bg-slate-100' },
                { value: 'ORANGE_MONEY', label: 'Orange Money', icon: Smartphone, color: 'bg-orange-100 text-orange-600' },
                { value: 'MTN_MONEY', label: 'MTN Money', icon: Smartphone, color: 'bg-yellow-100 text-yellow-600' },
                { value: 'WAVE', label: 'Wave', icon: Smartphone, color: 'bg-cyan-100 text-cyan-600' },
              ].map((mode) => (
                <Button
                  key={mode.value}
                  variant={modePaiement === mode.value ? 'default' : 'outline'}
                  className={`h-auto py-4 flex-col ${modePaiement === mode.value ? 'bg-emerald-600' : mode.color}`}
                  onClick={() => setModePaiement(mode.value as any)}
                >
                  <mode.icon className="w-6 h-6 mb-1" />
                  <span className="text-sm">{mode.label}</span>
                </Button>
              ))}
            </div>

            {modePaiement === 'ESPECES' && (
              <div className="space-y-2">
                <Label>Montant reçu</Label>
                <Input
                  type="number"
                  value={montantRecu || ''}
                  onChange={(e) => setMontantRecu(parseInt(e.target.value) || 0)}
                  placeholder="Entrez le montant reçu"
                />
                {montantRecu > totalPanier && (
                  <div className="bg-emerald-50 p-3 rounded-lg">
                    <p className="text-sm text-slate-600">Monnaie à rendre</p>
                    <p className="text-xl font-bold text-emerald-600">{formatGNF(montantRecu - totalPanier)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaiementDialogOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={validerVente}>
              <Check className="w-4 h-4 mr-2" />
              Valider la vente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Client */}
      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Informations client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Nom du client</Label>
              <Input
                value={clientForm.nom}
                onChange={(e) => setClientForm({ ...clientForm, nom: e.target.value })}
                placeholder="Nom (optionnel)"
              />
            </div>
            <div className="grid gap-2">
              <Label>Téléphone</Label>
              <Input
                value={clientForm.telephone}
                onChange={(e) => setClientForm({ ...clientForm, telephone: e.target.value })}
                placeholder="622 XX XX XX (optionnel)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClientDialogOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsClientDialogOpen(false)}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Vente Details */}
      <Dialog open={isVenteDialogOpen} onOpenChange={setIsVenteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de la vente</DialogTitle>
          </DialogHeader>
          {selectedVente && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">{selectedVente.id}</span>
                <Badge variant={selectedVente.sync === 'SYNCED' ? 'default' : 'secondary'} className={
                  selectedVente.sync === 'SYNCED' ? 'bg-emerald-600' : 'bg-amber-500'
                }>
                  {selectedVente.sync === 'SYNCED' ? 'Synchronisé' : 'En attente'}
                </Badge>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-500">Date</p>
                <p className="font-medium">
                  {new Date(selectedVente.date).toLocaleString('fr-GN', { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                  })}
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Articles</p>
                {selectedVente.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.quantite}x {item.nom}</span>
                    <span>{formatGNF(item.prixUnitaire * item.quantite)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-emerald-600">{formatGNF(selectedVente.total)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500 mt-1">
                  <span>Mode de paiement</span>
                  <span>{selectedVente.modePaiement}</span>
                </div>
              </div>

              {selectedVente.clientNom && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-sm text-slate-500">Client</p>
                  <p className="font-medium">{selectedVente.clientNom}</p>
                  {selectedVente.clientTelephone && (
                    <p className="text-sm text-slate-500">{selectedVente.clientTelephone}</p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVenteDialogOpen(false)}>Fermer</Button>
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MobileAppPage;
