'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Monitor, Scan, Grid, List, Plus, Minus, Trash2, Check, X, Search,
  Barcode, QrCode, CreditCard, DollarSign, Smartphone, Printer, User,
  ShoppingCart, Package, Percent, Tag, Clock, Eye, MoreHorizontal,
  ArrowLeft, RefreshCw, Wifi, WifiOff, AlertCircle, CheckCircle2,
  Ban, Send, Copy, Share2, ChevronRight, ChevronLeft, Save, FileText
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
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF, formatDate } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

// Types
interface POSProduct {
  id: string;
  nom: string;
  prix: number;
  stock: number;
  codeBarre: string;
  categorie: string;
  image?: string;
  remise?: number;
}

interface POSCartItem {
  produitId: string;
  nom: string;
  prixUnitaire: number;
  quantite: number;
  stock: number;
  remise: number;
  total: number;
}

interface POSTicket {
  id: string;
  numero: string;
  date: string;
  items: POSCartItem[];
  sousTotal: number;
  remiseTotal: number;
  total: number;
  montantRecu: number;
  monnaie: number;
  modePaiement: 'ESPECES' | 'ORANGE_MONEY' | 'MTN_MONEY' | 'WAVE' | 'CARTE' | 'MIXTE';
  client?: { nom: string; telephone: string };
  vendeur: string;
  statut: 'EN_COURS' | 'VALIDE' | 'ANNULE';
}

// Categories with icons
const categories = [
  { id: 'all', nom: 'Tous', icon: Grid },
  { id: 'alimentaire', nom: 'Alimentaire', icon: Package },
  { id: 'boissons', nom: 'Boissons', icon: DollarSign },
  { id: 'hygiene', nom: 'Hygiène', icon: Percent },
  { id: 'menager', nom: 'Ménager', icon: Tag },
];

// Demo products
const produitsPOS: POSProduct[] = [
  { id: 'p1', nom: 'Riz local 50kg', prix: 450000, stock: 150, codeBarre: '6220000000001', categorie: 'alimentaire' },
  { id: 'p2', nom: 'Huile végétale 5L', prix: 85000, stock: 80, codeBarre: '6220000000002', categorie: 'alimentaire' },
  { id: 'p3', nom: 'Sucre blanc 1kg', prix: 15000, stock: 200, codeBarre: '6220000000003', categorie: 'alimentaire' },
  { id: 'p4', nom: 'Savon ménager x6', prix: 5000, stock: 300, codeBarre: '6220000000004', categorie: 'hygiene' },
  { id: 'p5', nom: 'Lait en poudre 400g', prix: 25000, stock: 120, codeBarre: '6220000000005', categorie: 'alimentaire' },
  { id: 'p6', nom: 'Café torréfié 250g', prix: 18000, stock: 90, codeBarre: '6220000000006', categorie: 'alimentaire' },
  { id: 'p7', nom: 'Eau minérale 1.5L', prix: 3500, stock: 500, codeBarre: '6220000000007', categorie: 'boissons' },
  { id: 'p8', nom: 'Pâtes alimentaires 500g', prix: 8000, stock: 180, codeBarre: '6220000000008', categorie: 'alimentaire' },
  { id: 'p9', nom: 'Jus d\'orange 1L', prix: 12000, stock: 60, codeBarre: '6220000000009', categorie: 'boissons' },
  { id: 'p10', nom: 'Thé vert 100g', prix: 8000, stock: 100, codeBarre: '6220000000010', categorie: 'alimentaire' },
  { id: 'p11', nom: 'Tomate concentrée', prix: 5000, stock: 150, codeBarre: '6220000000011', categorie: 'alimentaire' },
  { id: 'p12', nom: 'Dentifrice 100ml', prix: 7000, stock: 80, codeBarre: '6220000000012', categorie: 'hygiene' },
  { id: 'p13', nom: 'Lessive 1kg', prix: 15000, stock: 70, codeBarre: '6220000000013', categorie: 'menager' },
  { id: 'p14', nom: 'Sauce soja 250ml', prix: 6000, stock: 90, codeBarre: '6220000000014', categorie: 'alimentaire' },
  { id: 'p15', nom: 'Biscuits assortis', prix: 4500, stock: 120, codeBarre: '6220000000015', categorie: 'alimentaire' },
  { id: 'p16', nom: 'Coca-Cola 33cl', prix: 3000, stock: 200, codeBarre: '6220000000016', categorie: 'boissons' },
];

// Numpad Component
function Numpad({ value, onChange, onSubmit }: { 
  value: string; 
  onChange: (value: string) => void;
  onSubmit?: () => void;
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];
  
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((key) => (
        <Button
          key={key}
          variant={key === 'C' ? 'destructive' : 'outline'}
          className="h-16 text-2xl font-semibold"
          onClick={() => {
            if (key === 'C') onChange('');
            else if (key === '⌫') onChange(value.slice(0, -1));
            else onChange(value + key);
          }}
        >
          {key}
        </Button>
      ))}
      {onSubmit && (
        <Button 
          className="col-span-3 h-16 text-xl bg-emerald-600 hover:bg-emerald-700"
          onClick={onSubmit}
        >
          <Check className="w-6 h-6 mr-2" />
          Valider
        </Button>
      )}
    </div>
  );
}

export function POSPage() {
  const { user } = useAppStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Dialog states
  const [isPaiementDialogOpen, setIsPaiementDialogOpen] = useState(false);
  const [isRemiseDialogOpen, setIsRemiseDialogOpen] = useState(false);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false);
  
  // Payment states
  const [modePaiement, setModePaiement] = useState<'ESPECES' | 'ORANGE_MONEY' | 'MTN_MONEY' | 'WAVE' | 'CARTE'>('ESPECES');
  const [montantRecu, setMontantRecu] = useState('');
  const [selectedItemRemise, setSelectedItemRemise] = useState<POSCartItem | null>(null);
  const [remiseValue, setRemiseValue] = useState('');
  
  // Client
  const [clientInfo, setClientInfo] = useState({ nom: '', telephone: '' });
  
  // Ticket
  const [lastTicket, setLastTicket] = useState<POSTicket | null>(null);
  const [ticketHistory, setTicketHistory] = useState<POSTicket[]>([]);

  // Filter products
  const filteredProducts = produitsPOS.filter(p => {
    const matchCategory = activeCategory === 'all' || p.categorie === activeCategory;
    const matchSearch = p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codeBarre.includes(searchTerm);
    return matchCategory && matchSearch;
  });

  // Cart calculations
  const sousTotal = cart.reduce((acc, item) => acc + (item.prixUnitaire * item.quantite), 0);
  const remiseTotal = cart.reduce((acc, item) => acc + (item.prixUnitaire * item.quantite * item.remise / 100), 0);
  const total = sousTotal - remiseTotal;
  const itemCount = cart.reduce((acc, item) => acc + item.quantite, 0);

  // Add to cart
  const addToCart = (product: POSProduct) => {
    const existing = cart.find(item => item.produitId === product.id);
    
    if (existing) {
      if (existing.quantite < product.stock) {
        setCart(cart.map(item => 
          item.produitId === product.id 
            ? { ...item, quantite: item.quantite + 1, total: (item.quantite + 1) * item.prixUnitaire * (1 - item.remise / 100) }
            : item
        ));
      }
    } else {
      setCart([...cart, {
        produitId: product.id,
        nom: product.nom,
        prixUnitaire: product.prix,
        quantite: 1,
        stock: product.stock,
        remise: 0,
        total: product.prix
      }]);
    }
  };

  // Update quantity
  const updateQuantity = (produitId: string, change: number) => {
    setCart(cart.map(item => {
      if (item.produitId === produitId) {
        const newQty = item.quantite + change;
        if (newQty <= 0) return item;
        if (newQty > item.stock) return item;
        return { 
          ...item, 
          quantite: newQty,
          total: newQty * item.prixUnitaire * (1 - item.remise / 100)
        };
      }
      return item;
    }));
  };

  // Remove from cart
  const removeFromCart = (produitId: string) => {
    setCart(cart.filter(item => item.produitId !== produitId));
  };

  // Apply discount
  const applyRemise = () => {
    if (!selectedItemRemise || !remiseValue) return;
    
    const remise = parseFloat(remiseValue);
    if (remise < 0 || remise > 100) return;
    
    setCart(cart.map(item => 
      item.produitId === selectedItemRemise.produitId 
        ? { ...item, remise, total: item.quantite * item.prixUnitaire * (1 - remise / 100) }
        : item
    ));
    
    setIsRemiseDialogOpen(false);
    setSelectedItemRemise(null);
    setRemiseValue('');
  };

  // Validate payment
  const validerPaiement = () => {
    if (cart.length === 0) return;
    
    const montant = parseFloat(montantRecu) || 0;
    
    const ticket: POSTicket = {
      id: `TKT-${Date.now()}`,
      numero: `#${String(ticketHistory.length + 1).padStart(4, '0')}`,
      date: new Date().toISOString(),
      items: [...cart],
      sousTotal,
      remiseTotal,
      total,
      montantRecu: modePaiement === 'ESPECES' ? montant : total,
      monnaie: modePaiement === 'ESPECES' ? Math.max(0, montant - total) : 0,
      modePaiement,
      client: clientInfo.nom ? clientInfo : undefined,
      vendeur: user?.prenom || 'Vendeur',
      statut: 'VALIDE'
    };
    
    setLastTicket(ticket);
    setTicketHistory([ticket, ...ticketHistory]);
    
    // Reset
    setCart([]);
    setClientInfo({ nom: '', telephone: '' });
    setMontantRecu('');
    setModePaiement('ESPECES');
    setIsPaiementDialogOpen(false);
    setIsTicketDialogOpen(true);
  };

  // Print ticket (simulation)
  const printTicket = () => {
    if (!lastTicket) return;
    // In production, connect to thermal printer via Bluetooth/Ethernet
    console.log('Printing ticket:', lastTicket);
    alert('Impression du ticket en cours...');
  };

  // Scan barcode simulation
  const scanBarcode = () => {
    setIsBarcodeDialogOpen(true);
    setTimeout(() => {
      const randomProduct = produitsPOS[Math.floor(Math.random() * produitsPOS.length)];
      addToCart(randomProduct);
      setIsBarcodeDialogOpen(false);
    }, 1500);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Monitor className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl font-bold">Caisse</h1>
          </div>
          <div className="text-sm text-slate-500">
            <Clock className="w-4 h-4 inline mr-1" />
            {new Date().toLocaleTimeString('fr-GN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
            {user?.prenom || 'Vendeur'}
          </Badge>
          <Button variant="outline" size="sm" onClick={scanBarcode}>
            <Scan className="w-4 h-4 mr-2" />
            Scanner
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search & Filters */}
          <div className="bg-white border-b p-4 space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Rechercher produit ou scanner code-barres..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex border rounded-lg">
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'} 
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'shrink-0',
                    activeCategory === cat.id && 'bg-emerald-600 hover:bg-emerald-700'
                  )}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <cat.icon className="w-4 h-4 mr-2" />
                  {cat.nom}
                </Button>
              ))}
            </div>
          </div>

          {/* Products Grid/List */}
          <div className="flex-1 overflow-auto p-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-3">
                      <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mb-2 flex items-center justify-center">
                        <Package className="w-10 h-10 text-slate-400" />
                      </div>
                      <h3 className="font-medium text-sm line-clamp-2 h-10">{product.nom}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-emerald-600 font-bold text-lg">{formatGNF(product.prix)}</p>
                        <Badge variant={product.stock > 10 ? 'secondary' : 'destructive'} className="text-xs">
                          {product.stock}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-3 flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{product.nom}</h3>
                        <p className="text-sm text-slate-500">{product.codeBarre}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-600 font-bold">{formatGNF(product.prix)}</p>
                        <Badge variant={product.stock > 10 ? 'secondary' : 'destructive'} className="text-xs">
                          Stock: {product.stock}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-96 bg-white border-l flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Panier
              </h2>
              <Badge variant="secondary">{itemCount} articles</Badge>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p>Panier vide</p>
                <p className="text-sm mt-1">Cliquez sur un produit pour l'ajouter</p>
              </div>
            ) : (
              cart.map((item) => (
                <Card key={item.produitId}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.nom}</h3>
                        <p className="text-sm text-slate-500">{formatGNF(item.prixUnitaire)}</p>
                        {item.remise > 0 && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            -{item.remise}%
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.produitId, -1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantite}</span>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.produitId, 1)}
                          disabled={item.quantite >= item.stock}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t">
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setSelectedItemRemise(item);
                            setRemiseValue(item.remise.toString());
                            setIsRemiseDialogOpen(true);
                          }}
                        >
                          <Percent className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-500"
                          onClick={() => removeFromCart(item.produitId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="font-bold text-emerald-600">{formatGNF(item.total)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Cart Summary */}
          <div className="border-t p-4 space-y-3">
            {/* Client Info */}
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setIsClientDialogOpen(true)}
            >
              <User className="w-4 h-4 mr-2" />
              {clientInfo.nom || 'Ajouter un client'}
            </Button>

            {/* Totals */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Sous-total</span>
                <span>{formatGNF(sousTotal)}</span>
              </div>
              {remiseTotal > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Remises</span>
                  <span>-{formatGNF(remiseTotal)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-emerald-600">{formatGNF(total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCart([])}
                disabled={cart.length === 0}
              >
                <Ban className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setIsPaiementDialogOpen(true)}
                disabled={cart.length === 0}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Payer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog: Paiement */}
      <Dialog open={isPaiementDialogOpen} onOpenChange={setIsPaiementDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Paiement - {formatGNF(total)}</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6 py-4">
            {/* Payment Methods */}
            <div className="space-y-4">
              <Label>Mode de paiement</Label>
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
                    className={`h-20 flex-col ${modePaiement === mode.value ? 'bg-emerald-600' : mode.color}`}
                    onClick={() => setModePaiement(mode.value as any)}
                  >
                    <mode.icon className="w-6 h-6 mb-1" />
                    <span className="text-sm">{mode.label}</span>
                  </Button>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sous-total</span>
                  <span>{formatGNF(sousTotal)}</span>
                </div>
                {remiseTotal > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Remises</span>
                    <span>-{formatGNF(remiseTotal)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                  <span>Total à payer</span>
                  <span className="text-emerald-600">{formatGNF(total)}</span>
                </div>
              </div>
            </div>

            {/* Numpad */}
            <div className="space-y-4">
              <Label>Montant reçu (GNF)</Label>
              <Input
                value={montantRecu}
                onChange={(e) => setMontantRecu(e.target.value)}
                placeholder="0"
                className="text-2xl h-14 text-center"
                readOnly
              />
              <Numpad 
                value={montantRecu} 
                onChange={setMontantRecu}
              />
              
              {/* Change */}
              {modePaiement === 'ESPECES' && parseFloat(montantRecu) > total && (
                <div className="bg-emerald-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-slate-600">Monnaie à rendre</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {formatGNF(parseFloat(montantRecu) - total)}
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaiementDialogOpen(false)}>Annuler</Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={validerPaiement}
              disabled={modePaiement === 'ESPECES' && parseFloat(montantRecu) < total}
            >
              <Check className="w-4 h-4 mr-2" />
              Valider le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Remise */}
      <Dialog open={isRemiseDialogOpen} onOpenChange={setIsRemiseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Appliquer une remise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedItemRemise && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="font-medium">{selectedItemRemise.nom}</p>
                <p className="text-sm text-slate-500">
                  Prix: {formatGNF(selectedItemRemise.prixUnitaire)} × {selectedItemRemise.quantite}
                </p>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Remise (%)</Label>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((pct) => (
                  <Button
                    key={pct}
                    variant={remiseValue === pct.toString() ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRemiseValue(pct.toString())}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={remiseValue}
                onChange={(e) => setRemiseValue(e.target.value)}
                placeholder="0"
                className="text-center"
              />
            </div>
            {remiseValue && selectedItemRemise && (
              <div className="bg-emerald-50 p-3 rounded-lg">
                <p className="text-sm text-slate-600">Nouveau prix</p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatGNF(selectedItemRemise.prixUnitaire * selectedItemRemise.quantite * (1 - parseFloat(remiseValue) / 100))}
                </p>
                <p className="text-sm text-red-600">
                  Économie: {formatGNF(selectedItemRemise.prixUnitaire * selectedItemRemise.quantite * parseFloat(remiseValue) / 100)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemiseDialogOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={applyRemise}>
              Appliquer
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
              <Label>Nom</Label>
              <Input
                value={clientInfo.nom}
                onChange={(e) => setClientInfo({ ...clientInfo, nom: e.target.value })}
                placeholder="Nom du client (optionnel)"
              />
            </div>
            <div className="grid gap-2">
              <Label>Téléphone</Label>
              <Input
                value={clientInfo.telephone}
                onChange={(e) => setClientInfo({ ...clientInfo, telephone: e.target.value })}
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

      {/* Dialog: Ticket */}
      <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ticket {lastTicket?.numero}</DialogTitle>
          </DialogHeader>
          {lastTicket && (
            <div className="py-4 space-y-4">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">GuinéaManager</h2>
                <p className="text-sm text-slate-500">Votre commerce, notre solution</p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(lastTicket.date).toLocaleString('fr-GN')}
                </p>
              </div>
              
              <div className="text-sm">
                <p>Vendeur: {lastTicket.vendeur}</p>
                {lastTicket.client && (
                  <p>Client: {lastTicket.client.nom}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                {lastTicket.items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.quantite}× {item.nom}</span>
                    <span>{formatGNF(item.total)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{formatGNF(lastTicket.sousTotal)}</span>
                </div>
                {lastTicket.remiseTotal > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Remises</span>
                    <span>-{formatGNF(lastTicket.remiseTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>{formatGNF(lastTicket.total)}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span>Mode de paiement</span>
                  <span>{lastTicket.modePaiement}</span>
                </div>
                <div className="flex justify-between">
                  <span>Montant reçu</span>
                  <span>{formatGNF(lastTicket.montantRecu)}</span>
                </div>
                {lastTicket.monnaie > 0 && (
                  <div className="flex justify-between font-semibold text-emerald-600">
                    <span>Monnaie rendue</span>
                    <span>{formatGNF(lastTicket.monnaie)}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-xs text-slate-400 pt-2">
                <p>Merci de votre visite!</p>
                <p>À bientôt</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={printTicket}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsTicketDialogOpen(false)}>
              <Check className="w-4 h-4 mr-2" />
              Terminer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Scan Barcode */}
      <Dialog open={isBarcodeDialogOpen} onOpenChange={setIsBarcodeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan en cours...</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <RefreshCw className="w-16 h-16 mx-auto animate-spin text-emerald-600 mb-4" />
            <p className="text-slate-500">Placez le code-barres devant la caméra</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default POSPage;
