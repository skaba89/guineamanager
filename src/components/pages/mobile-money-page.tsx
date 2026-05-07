'use client';

import { useState, useEffect } from 'react';
import { 
  Smartphone, CreditCard, QrCode, ArrowUpDown, CheckCircle2, XCircle, 
  Clock, AlertCircle, RefreshCw, Download, Filter, Search, Plus,
  Phone, DollarSign, TrendingUp, Users, Building2, Eye, MoreHorizontal,
  Copy, Share2, Printer, Send, Wallet, PiggyBank, ArrowUpRight, ArrowDownLeft,
  Ban, Check, X, ChevronRight, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF, formatDate } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

// Types
interface TransactionMobile {
  id: string;
  type: 'RECU' | 'ENVOYE' | 'RETRAIT' | 'DEPOT' | 'FACTURE';
  operateur: 'ORANGE' | 'MTN' | 'WAVE';
  numeroExpediteur?: string;
  numeroDestinataire?: string;
  montant: number;
  frais: number;
  reference: string;
  statut: 'EN_ATTENTE' | 'CONFIRME' | 'ECHOUE' | 'ANNULE';
  dateTransaction: string;
  dateConfirmation?: string;
  motif?: string;
  factureId?: string;
  factureRef?: string;
  clientId?: string;
  clientNom?: string;
}

interface CompteMobile {
  operateur: 'ORANGE' | 'MTN' | 'WAVE';
  numero: string;
  solde: number;
  soldeDernierSync: string;
  statut: 'ACTIF' | 'SUSPENDU' | 'NON_VERIFIE';
  transactionsMois: number;
  volumeMois: number;
}

interface DemandePaiement {
  id: string;
  clientNom: string;
  clientTelephone: string;
  montant: number;
  motif: string;
  factureRef?: string;
  operateur: 'ORANGE' | 'MTN' | 'WAVE';
  statut: 'EN_ATTENTE' | 'PAYE' | 'EXPIRE' | 'ANNULE';
  dateCreation: string;
  dateExpiration: string;
  qrCode: string;
  lienPaiement: string;
}

// Constants - Opérateurs Guinée
const operateurs = [
  { 
    value: 'ORANGE', 
    label: 'Orange Money', 
    color: 'bg-orange-500', 
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    prefix: '62',
    logoColor: 'bg-orange-500'
  },
  { 
    value: 'MTN', 
    label: 'MTN Mobile Money', 
    color: 'bg-yellow-400', 
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    prefix: '66',
    logoColor: 'bg-yellow-400'
  },
  { 
    value: 'WAVE', 
    label: 'Wave', 
    color: 'bg-cyan-500', 
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    prefix: '62',
    logoColor: 'bg-cyan-500'
  },
];

// Mock data generators
const generateTransactions = (): TransactionMobile[] => [
  { id: 'tx1', type: 'RECU', operateur: 'ORANGE', numeroExpediteur: '622 00 00 01', montant: 500000, frais: 0, reference: 'OM2405A1B2C3', statut: 'CONFIRME', dateTransaction: '2024-05-01T10:30:00', dateConfirmation: '2024-05-01T10:30:45', motif: 'Paiement facture F-2024-001', factureRef: 'F-2024-001', clientNom: 'Mamadou Diallo' },
  { id: 'tx2', type: 'RECU', operateur: 'MTN', numeroExpediteur: '664 00 00 02', montant: 750000, frais: 0, reference: 'MTN2405X1Y2Z3', statut: 'CONFIRME', dateTransaction: '2024-05-01T11:15:00', dateConfirmation: '2024-05-01T11:15:30', motif: 'Acompte commande', clientNom: 'Fatou Camara' },
  { id: 'tx3', type: 'EN_ATTENTE', operateur: 'WAVE', numeroExpediteur: '622 00 00 03', montant: 1200000, frais: 0, reference: 'WV2405P1Q2R3', statut: 'EN_ATTENTE', dateTransaction: '2024-05-01T14:00:00', motif: 'Facture F-2024-002', factureRef: 'F-2024-002', clientNom: 'Ibrahima Sow' },
  { id: 'tx4', type: 'RECU', operateur: 'ORANGE', numeroExpediteur: '625 00 00 04', montant: 350000, frais: 0, reference: 'OM2405D4E5F6', statut: 'CONFIRME', dateTransaction: '2024-04-30T09:00:00', dateConfirmation: '2024-04-30T09:00:20', motif: 'Vente produits', clientNom: 'Aissata Barry' },
  { id: 'tx5', type: 'RETRAIT', operateur: 'MTN', numeroDestinataire: '666 00 00 05', montant: 2000000, frais: 15000, reference: 'MTN2405G7H8I9', statut: 'CONFIRME', dateTransaction: '2024-04-30T16:00:00', dateConfirmation: '2024-04-30T16:05:00' },
  { id: 'tx6', type: 'DEPOT', operateur: 'WAVE', numeroExpediteur: '622 00 00 06', montant: 3000000, frais: 0, reference: 'WV2405J1K2L3', statut: 'CONFIRME', dateTransaction: '2024-04-29T10:00:00', dateConfirmation: '2024-04-29T10:00:30' },
  { id: 'tx7', type: 'RECU', operateur: 'ORANGE', numeroExpediteur: '622 00 00 07', montant: 850000, frais: 0, reference: 'OM2405M4N5O6', statut: 'ECHOUE', dateTransaction: '2024-04-28T14:30:00', motif: 'Paiement annulé', clientNom: 'Kadiatou Touré' },
  { id: 'tx8', type: 'FACTURE', operateur: 'ORANGE', montant: 150000, frais: 500, reference: 'OM2405P7Q8R9', statut: 'CONFIRME', dateTransaction: '2024-04-27T08:00:00', dateConfirmation: '2024-04-27T08:00:15', motif: 'Paiement électricité' },
];

const generateComptes = (): CompteMobile[] => [
  { operateur: 'ORANGE', numero: '622 12 34 56', solde: 15250000, soldeDernierSync: new Date().toISOString(), statut: 'ACTIF', transactionsMois: 45, volumeMois: 12500000 },
  { operateur: 'MTN', numero: '664 98 76 54', solde: 8750000, soldeDernierSync: new Date().toISOString(), statut: 'ACTIF', transactionsMois: 28, volumeMois: 7800000 },
  { operateur: 'WAVE', numero: '622 55 55 55', solde: 22000000, soldeDernierSync: new Date().toISOString(), statut: 'ACTIF', transactionsMois: 62, volumeMois: 18500000 },
];

const generateDemandesPaiement = (): DemandePaiement[] => [
  { id: 'dp1', clientNom: 'Mamadou Diallo', clientTelephone: '622 00 00 01', montant: 500000, motif: 'Facture F-2024-003', factureRef: 'F-2024-003', operateur: 'ORANGE', statut: 'EN_ATTENTE', dateCreation: '2024-05-01T10:00:00', dateExpiration: '2024-05-02T10:00:00', qrCode: 'QR_OM_F2024003_500000', lienPaiement: 'https://pay.guineamanager.com/om/abc123' },
  { id: 'dp2', clientNom: 'Fatou Camara', clientTelephone: '664 00 00 02', montant: 750000, motif: 'Acompte commande C-2024-015', operateur: 'MTN', statut: 'PAYE', dateCreation: '2024-04-30T14:00:00', dateExpiration: '2024-05-01T14:00:00', qrCode: 'QR_MTN_C2024015_750000', lienPaiement: 'https://pay.guineamanager.com/mtn/def456' },
];

// QR Code Generator Component
function QRCodeDisplay({ data, size = 200 }: { data: string; size?: number }) {
  // Simple QR code visualization (in production, use a real QR library)
  const pattern = data.split('').map((_, i) => Math.random() > 0.5);
  
  return (
    <div 
      className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-300 inline-block"
      style={{ width: size + 32, height: size + 32 }}
    >
      <div 
        className="grid gap-0.5"
        style={{ 
          gridTemplateColumns: `repeat(${Math.sqrt(size)}, 1fr)`,
          width: size,
          height: size 
        }}
      >
        {Array.from({ length: Math.floor(size / 8) * Math.floor(size / 8) }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              'w-2 h-2',
              i < 7 || i % Math.floor(size / 8) < 7 || i > (Math.floor(size / 8) * Math.floor(size / 8)) - 7
                ? 'bg-slate-800'
                : pattern[i % pattern.length] ? 'bg-slate-800' : 'bg-white'
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function MobileMoneyPage() {
  const { clients, factures } = useAppStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [filterOperateur, setFilterOperateur] = useState<string>('all');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  
  // Data states
  const [transactions, setTransactions] = useState<TransactionMobile[]>([]);
  const [comptes, setComptes] = useState<CompteMobile[]>([]);
  const [demandesPaiement, setDemandesPaiement] = useState<DemandePaiement[]>([]);
  
  // Dialog states
  const [isDemandeDialogOpen, setIsDemandeDialogOpen] = useState(false);
  const [isRetraitDialogOpen, setIsRetraitDialogOpen] = useState(false);
  const [isTransfertDialogOpen, setIsTransfertDialogOpen] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionMobile | null>(null);
  const [selectedDemande, setSelectedDemande] = useState<DemandePaiement | null>(null);
  
  // Form states
  const [demandeForm, setDemandeForm] = useState({
    clientTelephone: '',
    clientNom: '',
    montant: 0,
    motif: '',
    factureRef: '',
    operateur: 'ORANGE' as 'ORANGE' | 'MTN' | 'WAVE',
    dureeExpiration: 24
  });
  const [retraitForm, setRetraitForm] = useState({
    operateur: 'ORANGE' as 'ORANGE' | 'MTN' | 'WAVE',
    montant: 0,
    numeroDestinataire: ''
  });
  const [transfertForm, setTransfertForm] = useState({
    operateurSource: 'ORANGE' as 'ORANGE' | 'MTN' | 'WAVE',
    operateurDest: 'WAVE' as 'ORANGE' | 'MTN' | 'WAVE',
    montant: 0,
    numeroDestinataire: ''
  });

  // Initialize data
  useEffect(() => {
    setTransactions(generateTransactions());
    setComptes(generateComptes());
    setDemandesPaiement(generateDemandesPaiement());
  }, []);

  // Stats calculations
  const stats = {
    soldeTotal: comptes.reduce((acc, c) => acc + c.solde, 0),
    transactionsJour: transactions.filter(t => {
      const today = new Date().toISOString().split('T')[0];
      return t.dateTransaction.startsWith(today);
    }).length,
    montantJour: transactions.filter(t => {
      const today = new Date().toISOString().split('T')[0];
      return t.dateTransaction.startsWith(today) && t.statut === 'CONFIRME';
    }).reduce((acc, t) => acc + t.montant, 0),
    enAttente: transactions.filter(t => t.statut === 'EN_ATTENTE').length,
    demandesActives: demandesPaiement.filter(d => d.statut === 'EN_ATTENTE').length,
    volumeMois: comptes.reduce((acc, c) => acc + c.volumeMois, 0),
    fraisMois: transactions.filter(t => t.statut === 'CONFIRME').reduce((acc, t) => acc + t.frais, 0),
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter(t => {
    const matchSearch = t.reference.toLowerCase().includes(search.toLowerCase()) ||
      t.clientNom?.toLowerCase().includes(search.toLowerCase()) ||
      t.numeroExpediteur?.includes(search);
    const matchOperateur = filterOperateur === 'all' || t.operateur === filterOperateur;
    const matchStatut = filterStatut === 'all' || t.statut === filterStatut;
    return matchSearch && matchOperateur && matchStatut;
  });

  // Handlers
  const handleCreerDemande = () => {
    const newDemande: DemandePaiement = {
      id: `dp_${Date.now()}`,
      clientNom: demandeForm.clientNom,
      clientTelephone: demandeForm.clientTelephone,
      montant: demandeForm.montant,
      motif: demandeForm.motif,
      factureRef: demandeForm.factureRef,
      operateur: demandeForm.operateur,
      statut: 'EN_ATTENTE',
      dateCreation: new Date().toISOString(),
      dateExpiration: new Date(Date.now() + demandeForm.dureeExpiration * 60 * 60 * 1000).toISOString(),
      qrCode: `QR_${demandeForm.operateur}_${Date.now()}_${demandeForm.montant}`,
      lienPaiement: `https://pay.guineamanager.com/${demandeForm.operateur.toLowerCase()}/${Date.now()}`
    };
    setDemandesPaiement([newDemande, ...demandesPaiement]);
    setIsDemandeDialogOpen(false);
    setDemandeForm({
      clientTelephone: '',
      clientNom: '',
      montant: 0,
      motif: '',
      factureRef: '',
      operateur: 'ORANGE',
      dureeExpiration: 24
    });
  };

  const handleRetrait = () => {
    const compte = comptes.find(c => c.operateur === retraitForm.operateur);
    if (!compte || compte.solde < retraitForm.montant) {
      alert('Solde insuffisant');
      return;
    }
    
    const newTransaction: TransactionMobile = {
      id: `tx_${Date.now()}`,
      type: 'RETRAIT',
      operateur: retraitForm.operateur,
      numeroDestinataire: retraitForm.numeroDestinataire,
      montant: retraitForm.montant,
      frais: Math.ceil(retraitForm.montant * 0.01),
      reference: `${retraitForm.operateur.substring(0, 2)}${Date.now()}`,
      statut: 'EN_ATTENTE',
      dateTransaction: new Date().toISOString()
    };
    
    setTransactions([newTransaction, ...transactions]);
    setIsRetraitDialogOpen(false);
    setRetraitForm({ operateur: 'ORANGE', montant: 0, numeroDestinataire: '' });
  };

  const handleTransfert = () => {
    const compteSource = comptes.find(c => c.operateur === transfertForm.operateurSource);
    if (!compteSource || compteSource.solde < transfertForm.montant) {
      alert('Solde insuffisant');
      return;
    }
    
    const newTransaction: TransactionMobile = {
      id: `tx_${Date.now()}`,
      type: 'ENVOYE',
      operateur: transfertForm.operateurSource,
      numeroDestinataire: transfertForm.numeroDestinataire,
      montant: transfertForm.montant,
      frais: transfertForm.operateurSource !== transfertForm.operateurDest ? Math.ceil(transfertForm.montant * 0.02) : 0,
      reference: `${transfertForm.operateurSource.substring(0, 2)}${Date.now()}`,
      statut: 'EN_ATTENTE',
      dateTransaction: new Date().toISOString()
    };
    
    setTransactions([newTransaction, ...transactions]);
    setIsTransfertDialogOpen(false);
    setTransfertForm({ operateurSource: 'ORANGE', operateurDest: 'WAVE', montant: 0, numeroDestinataire: '' });
  };

  const handleSyncSolde = (operateur: 'ORANGE' | 'MTN' | 'WAVE') => {
    // Simulate sync
    setComptes(comptes.map(c => 
      c.operateur === operateur 
        ? { ...c, soldeDernierSync: new Date().toISOString() }
        : c
    ));
  };

  const handleConfirmerTransaction = (txId: string) => {
    setTransactions(transactions.map(t => 
      t.id === txId 
        ? { ...t, statut: 'CONFIRME', dateConfirmation: new Date().toISOString() }
        : t
    ));
  };

  const handleAnnulerTransaction = (txId: string) => {
    setTransactions(transactions.map(t => 
      t.id === txId ? { ...t, statut: 'ANNULE' } : t
    ));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Helper functions
  const getOperateurBadge = (operateur: 'ORANGE' | 'MTN' | 'WAVE') => {
    const op = operateurs.find(o => o.value === operateur);
    return (
      <Badge className={cn(op?.bgColor, op?.textColor, 'font-medium')}>
        {op?.logo} {op?.label}
      </Badge>
    );
  };

  const getStatutBadge = (statut: TransactionMobile['statut']) => {
    const configs = {
      EN_ATTENTE: { label: 'En attente', icon: Clock, color: 'bg-amber-100 text-amber-700' },
      CONFIRME: { label: 'Confirmé', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
      ECHOUE: { label: 'Échoué', icon: XCircle, color: 'bg-red-100 text-red-700' },
      ANNULE: { label: 'Annulé', icon: Ban, color: 'bg-gray-100 text-gray-700' },
    };
    const config = configs[statut];
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getTypeIcon = (type: TransactionMobile['type']) => {
    switch (type) {
      case 'RECU': return <ArrowDownLeft className="w-4 h-4 text-emerald-500" />;
      case 'ENVOYE': return <ArrowUpRight className="w-4 h-4 text-blue-500" />;
      case 'RETRAIT': return <Wallet className="w-4 h-4 text-amber-500" />;
      case 'DEPOT': return <PiggyBank className="w-4 h-4 text-purple-500" />;
      case 'FACTURE': return <CreditCard className="w-4 h-4 text-pink-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mobile Money</h1>
          <p className="text-slate-500">Gérez vos paiements Orange Money, MTN et Wave</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => {}}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsDemandeDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Demander paiement
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="comptes">Mes comptes</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="demandes">Demandes de paiement</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          {/* Solde Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {comptes.map((compte) => {
              const op = operateurs.find(o => o.value === compte.operateur);
              return (
                <Card key={compte.operateur} className="overflow-hidden">
                  <div className={cn('h-2', op?.color)} />
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{op?.logo}</span>
                          <div>
                            <p className="font-semibold">{op?.label}</p>
                            <p className="text-sm text-slate-500">{compte.numero}</p>
                          </div>
                        </div>
                      </div>
                      <Badge variant={compte.statut === 'ACTIF' ? 'default' : 'secondary'} className="bg-emerald-600">
                        {compte.statut}
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-slate-500">Solde disponible</p>
                      <p className="text-2xl font-bold">{formatGNF(compte.solde)}</p>
                    </div>
                    <div className="flex justify-between mt-4 pt-3 border-t text-sm">
                      <div>
                        <p className="text-slate-500">Transactions ce mois</p>
                        <p className="font-medium">{compte.transactionsMois}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500">Volume</p>
                        <p className="font-medium">{formatGNF(compte.volumeMois)}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => handleSyncSolde(compte.operateur)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Synchroniser
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 rounded-xl">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Solde total</p>
                    <p className="text-xl font-bold">{formatGNF(stats.soldeTotal)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Transactions jour</p>
                    <p className="text-xl font-bold">{stats.transactionsJour}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 rounded-xl">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">En attente</p>
                    <p className="text-xl font-bold">{stats.enAttente}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 rounded-xl">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Montant jour</p>
                    <p className="text-lg font-bold">{formatGNF(stats.montantJour)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setIsDemandeDialogOpen(true)}>
                  <QrCode className="w-6 h-6 mb-2 text-orange-500" />
                  <span>Créer QR paiement</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setIsRetraitDialogOpen(true)}>
                  <Wallet className="w-6 h-6 mb-2 text-amber-500" />
                  <span>Effectuer un retrait</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => setIsTransfertDialogOpen(true)}>
                  <ArrowUpDown className="w-6 h-6 mb-2 text-blue-500" />
                  <span>Transférer</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col">
                  <Building2 className="w-6 h-6 mb-2 text-purple-500" />
                  <span>Payer facture</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Transactions récentes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('transactions')}>
                Voir tout <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border">
                        {getTypeIcon(tx.type)}
                      </div>
                      <div>
                        <p className="font-medium">{tx.clientNom || tx.numeroExpediteur || tx.numeroDestinataire || 'Transaction'}</p>
                        <p className="text-xs text-slate-500">{tx.reference} • {formatDate(tx.dateTransaction)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'font-semibold',
                        tx.type === 'RECU' || tx.type === 'DEPOT' ? 'text-emerald-600' : 'text-slate-700'
                      )}>
                        {tx.type === 'RECU' || tx.type === 'DEPOT' ? '+' : '-'}{formatGNF(tx.montant)}
                      </p>
                      {getStatutBadge(tx.statut)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comptes Tab */}
        <TabsContent value="comptes" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {comptes.map((compte) => {
              const op = operateurs.find(o => o.value === compte.operateur);
              return (
                <Card key={compte.operateur} className="overflow-hidden">
                  <div className={cn('h-2', op?.color)} />
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{op?.logo}</span>
                        <div>
                          <CardTitle>{op?.label}</CardTitle>
                          <p className="text-sm text-slate-500">{compte.numero}</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-600">{compte.statut}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-slate-500">Solde disponible</p>
                      <p className="text-3xl font-bold mt-1">{formatGNF(compte.solde)}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Dernière sync: {new Date(compte.soldeDernierSync).toLocaleTimeString('fr-GN')}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-slate-500">Transactions/mois</p>
                        <p className="text-lg font-bold">{compte.transactionsMois}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-slate-500">Volume/mois</p>
                        <p className="text-sm font-bold">{formatGNF(compte.volumeMois)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsTransfertDialogOpen(true)}>
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={() => setIsRetraitDialogOpen(true)}>
                          <Wallet className="w-4 h-4 mr-2" />
                          Retirer
                        </Button>
                        <Button variant="outline" onClick={() => handleSyncSolde(compte.operateur)}>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sync
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Add Account */}
          <Card className="border-dashed">
            <CardContent className="py-8">
              <div className="text-center">
                <Smartphone className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 mb-4">Ajouter un nouveau compte Mobile Money</p>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Lier un compte
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6 mt-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Rechercher par référence, client, numéro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterOperateur} onValueChange={setFilterOperateur}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Opérateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les opérateurs</SelectItem>
                {operateurs.map(op => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.logo} {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                <SelectItem value="CONFIRME">Confirmé</SelectItem>
                <SelectItem value="ECHOUE">Échoué</SelectItem>
                <SelectItem value="ANNULE">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Opérateur</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Frais</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            {getTypeIcon(tx.type)}
                          </div>
                          <div>
                            <p className="font-medium">
                              {tx.type === 'RECU' && `Reçu de ${tx.clientNom || tx.numeroExpediteur}`}
                              {tx.type === 'ENVOYE' && `Envoyé à ${tx.numeroDestinataire}`}
                              {tx.type === 'RETRAIT' && `Retrait`}
                              {tx.type === 'DEPOT' && `Dépôt`}
                              {tx.type === 'FACTURE' && `Facture`}
                            </p>
                            {tx.motif && <p className="text-xs text-slate-500">{tx.motif}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getOperateurBadge(tx.operateur)}</TableCell>
                      <TableCell className="font-mono text-sm">{tx.reference}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(tx.dateTransaction)}</p>
                          <p className="text-slate-500">{new Date(tx.dateTransaction).toLocaleTimeString('fr-GN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          'font-semibold',
                          tx.type === 'RECU' || tx.type === 'DEPOT' ? 'text-emerald-600' : ''
                        )}>
                          {tx.type === 'RECU' || tx.type === 'DEPOT' ? '+' : '-'}{formatGNF(tx.montant)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-slate-500">
                        {tx.frais > 0 ? formatGNF(tx.frais) : '-'}
                      </TableCell>
                      <TableCell className="text-center">{getStatutBadge(tx.statut)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {tx.statut === 'EN_ATTENTE' && (
                            <>
                              <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => handleConfirmerTransaction(tx.id)}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleAnnulerTransaction(tx.id)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedTransaction(tx); setIsQRDialogOpen(true); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demandes Tab */}
        <TabsContent value="demandes" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Demandes de paiement</h2>
              <p className="text-sm text-slate-500">Créez des QR codes de paiement pour vos clients</p>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsDemandeDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle demande
            </Button>
          </div>

          {/* Demandes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demandesPaiement.map((demande) => {
              const op = operateurs.find(o => o.value === demande.operateur);
              const isExpired = new Date(demande.dateExpiration) < new Date();
              
              return (
                <Card key={demande.id} className="overflow-hidden">
                  <div className={cn('h-2', op?.color)} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{formatGNF(demande.montant)}</CardTitle>
                        <p className="text-sm text-slate-500">{demande.clientNom}</p>
                      </div>
                      <Badge className={cn(
                        demande.statut === 'PAYE' ? 'bg-emerald-100 text-emerald-700' :
                        demande.statut === 'EXPIRE' || isExpired ? 'bg-gray-100 text-gray-700' :
                        'bg-amber-100 text-amber-700'
                      )}>
                        {demande.statut === 'EN_ATTENTE' && !isExpired ? 'En attente' : 
                         demande.statut === 'PAYE' ? 'Payé' : 
                         demande.statut === 'EXPIRE' || isExpired ? 'Expiré' : demande.statut}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{op?.logo} {op?.label}</span>
                      <span className="text-slate-500">{demande.clientTelephone}</span>
                    </div>
                    
                    <p className="text-sm text-slate-600">{demande.motif}</p>

                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-500">Référence</span>
                        <Button variant="ghost" size="sm" className="h-6" onClick={() => copyToClipboard(demande.qrCode)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="font-mono text-xs">{demande.qrCode}</p>
                    </div>

                    <div className="text-xs text-slate-500">
                      <p>Créé: {formatDate(demande.dateCreation)}</p>
                      <p>Expire: {formatDate(demande.dateExpiration)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedDemande(demande); setIsQRDialogOpen(true); }}>
                        <QrCode className="w-4 h-4 mr-1" />
                        QR Code
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(demande.lienPaiement)}>
                        <Share2 className="w-4 h-4 mr-1" />
                        Partager
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: Créer demande de paiement */}
      <Dialog open={isDemandeDialogOpen} onOpenChange={setIsDemandeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer une demande de paiement</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nom du client</Label>
                <Input value={demandeForm.clientNom} onChange={(e) => setDemandeForm({...demandeForm, clientNom: e.target.value})} placeholder="Nom du client" />
              </div>
              <div className="grid gap-2">
                <Label>Téléphone</Label>
                <Input value={demandeForm.clientTelephone} onChange={(e) => setDemandeForm({...demandeForm, clientTelephone: e.target.value})} placeholder="622 XX XX XX" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Montant (GNF) *</Label>
                <Input type="number" value={demandeForm.montant || ''} onChange={(e) => setDemandeForm({...demandeForm, montant: parseInt(e.target.value) || 0})} />
              </div>
              <div className="grid gap-2">
                <Label>Opérateur *</Label>
                <Select value={demandeForm.operateur} onValueChange={(value) => setDemandeForm({...demandeForm, operateur: value as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operateurs.map(op => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.logo} {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Motif</Label>
              <Input value={demandeForm.motif} onChange={(e) => setDemandeForm({...demandeForm, motif: e.target.value})} placeholder="Ex: Facture F-2024-001" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Référence facture (optionnel)</Label>
                <Input value={demandeForm.factureRef} onChange={(e) => setDemandeForm({...demandeForm, factureRef: e.target.value})} placeholder="F-2024-XXX" />
              </div>
              <div className="grid gap-2">
                <Label>Durée de validité</Label>
                <Select value={demandeForm.dureeExpiration.toString()} onValueChange={(value) => setDemandeForm({...demandeForm, dureeExpiration: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 heure</SelectItem>
                    <SelectItem value="6">6 heures</SelectItem>
                    <SelectItem value="24">24 heures</SelectItem>
                    <SelectItem value="48">48 heures</SelectItem>
                    <SelectItem value="72">3 jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDemandeDialogOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreerDemande}>
              <QrCode className="w-4 h-4 mr-2" />
              Générer QR Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Retrait */}
      <Dialog open={isRetraitDialogOpen} onOpenChange={setIsRetraitDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Effectuer un retrait</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Opérateur</Label>
              <Select value={retraitForm.operateur} onValueChange={(value) => setRetraitForm({...retraitForm, operateur: value as any})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operateurs.map(op => {
                    const compte = comptes.find(c => c.operateur === op.value);
                    return (
                      <SelectItem key={op.value} value={op.value}>
                        {op.logo} {op.label} ({formatGNF(compte?.solde || 0)})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Montant à retirer (GNF)</Label>
              <Input type="number" value={retraitForm.montant || ''} onChange={(e) => setRetraitForm({...retraitForm, montant: parseInt(e.target.value) || 0})} />
            </div>
            <div className="grid gap-2">
              <Label>Numéro destinataire</Label>
              <Input value={retraitForm.numeroDestinataire} onChange={(e) => setRetraitForm({...retraitForm, numeroDestinataire: e.target.value})} placeholder="622 XX XX XX" />
            </div>
            {retraitForm.montant > 0 && (
              <div className="bg-slate-50 p-3 rounded-lg text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Montant</span>
                  <span>{formatGNF(retraitForm.montant)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Frais (1%)</span>
                  <span className="text-red-600">-{formatGNF(Math.ceil(retraitForm.montant * 0.01))}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total débité</span>
                  <span>{formatGNF(retraitForm.montant + Math.ceil(retraitForm.montant * 0.01))}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRetraitDialogOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleRetrait}>
              Confirmer le retrait
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Transfert */}
      <Dialog open={isTransfertDialogOpen} onOpenChange={setIsTransfertDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Effectuer un transfert</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Depuis</Label>
                <Select value={transfertForm.operateurSource} onValueChange={(value) => setTransfertForm({...transfertForm, operateurSource: value as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operateurs.map(op => {
                      const compte = comptes.find(c => c.operateur === op.value);
                      return (
                        <SelectItem key={op.value} value={op.value}>
                          {op.logo} {formatGNF(compte?.solde || 0)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Vers</Label>
                <Select value={transfertForm.operateurDest} onValueChange={(value) => setTransfertForm({...transfertForm, operateurDest: value as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operateurs.map(op => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.logo} {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Montant (GNF)</Label>
              <Input type="number" value={transfertForm.montant || ''} onChange={(e) => setTransfertForm({...transfertForm, montant: parseInt(e.target.value) || 0})} />
            </div>
            <div className="grid gap-2">
              <Label>Numéro destinataire</Label>
              <Input value={transfertForm.numeroDestinataire} onChange={(e) => setTransfertForm({...transfertForm, numeroDestinataire: e.target.value})} placeholder="622 XX XX XX" />
            </div>
            {transfertForm.operateurSource !== transfertForm.operateurDest && transfertForm.montant > 0 && (
              <div className="bg-amber-50 p-3 rounded-lg text-sm">
                <div className="flex items-center gap-2 text-amber-700">
                  <Info className="w-4 h-4" />
                  <span>Frais de transfert inter-opérateur: {formatGNF(Math.ceil(transfertForm.montant * 0.02))}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransfertDialogOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleTransfert}>
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: QR Code / Details */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDemande ? 'QR Code de paiement' : 'Détails de la transaction'}
            </DialogTitle>
          </DialogHeader>
          {selectedDemande && (
            <div className="py-4 space-y-4">
              <div className="flex justify-center">
                <QRCodeDisplay data={selectedDemande.qrCode} size={180} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{formatGNF(selectedDemande.montant)}</p>
                <p className="text-slate-500">{selectedDemande.clientNom}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <Label className="text-xs text-slate-500">Lien de paiement</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={selectedDemande.lienPaiement} readOnly className="text-sm" />
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(selectedDemande.lienPaiement)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => copyToClipboard(selectedDemande.lienPaiement)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copier lien
                </Button>
                <Button variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </div>
            </div>
          )}
          {selectedTransaction && (
            <div className="py-4">
              <pre className="bg-slate-50 p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(selectedTransaction, null, 2)}
              </pre>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQRDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MobileMoneyPage;
