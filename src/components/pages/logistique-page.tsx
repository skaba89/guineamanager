'use client';

import { useState, useEffect } from 'react';
import { 
  Truck, MapPin, Package, Clock, CheckCircle2, XCircle, AlertCircle,
  Phone, Navigation, Route, Calendar, User, Building2, Eye, Send,
  Plus, Search, Filter, RefreshCw, ChevronRight, Play, Pause,
  BarChart3, Users, Timer, DollarSign, ArrowRight, Copy, Share2
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
interface Livraison {
  id: string;
  numero: string;
  commandeId: string;
  clientNom: string;
  clientTelephone: string;
  clientAdresse: string;
  quartier: string;
  ville: string;
  articles: { nom: string; quantite: number }[];
  poids: number;
  montant: number;
  fraisLivraison: number;
  statut: 'EN_ATTENTE' | 'EN_PREPARATION' | 'EN_COURS' | 'LIVREE' | 'ANNULEE' | 'RETOUR';
  dateCreation: string;
  dateLivraisonPrevue: string;
  dateLivraisonReelle?: string;
  livreurId?: string;
  livreurNom?: string;
  livreurTelephone?: string;
  position?: { lat: number; lng: number };
  distanceKm?: number;
  dureeMinutes?: number;
  signature?: string;
  photoPreuve?: string;
  notes?: string;
  priorite: 'NORMALE' | 'URGENTE' | 'EXPRESS';
}

interface Livreur {
  id: string;
  nom: string;
  telephone: string;
  vehicule: 'MOTO' | 'VOITURE' | 'CAMION' | 'TRICYCLE';
  statut: 'DISPONIBLE' | 'EN_LIVRAISON' | 'INDISPONIBLE' | 'HORS_LIGNE';
  position: { lat: number; lng: number };
  commandesJour: number;
  revenusJour: number;
  zone: string;
}

interface Tournee {
  id: string;
  livreurId: string;
  livreurNom: string;
  date: string;
  statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE';
  livraisons: Livraison[];
  distanceTotale: number;
  dureeEstimee: number;
  distanceParcourue: number;
  livraisonsEffectuees: number;
  revenus: number;
}

interface Vehicule {
  id: string;
  type: 'MOTO' | 'VOITURE' | 'CAMION' | 'TRICYCLE';
  immatriculation: string;
  kilometrage: number;
  carburant: number; // percentage
  statut: 'DISPONIBLE' | 'EN_SERVICE' | 'MAINTENANCE';
  livreurId?: string;
}

// Mock data
const generateLivreurs = (): Livreur[] => [
  { id: 'l1', nom: 'Mamadou Diallo', telephone: '622 10 00 01', vehicule: 'MOTO', statut: 'DISPONIBLE', position: { lat: 9.6412, lng: -13.5784 }, commandesJour: 5, revenusJour: 75000, zone: 'Kaloum' },
  { id: 'l2', nom: 'Ibrahima Sow', telephone: '622 10 00 02', vehicule: 'MOTO', statut: 'EN_LIVRAISON', position: { lat: 9.6512, lng: -13.5884 }, commandesJour: 8, revenusJour: 120000, zone: 'Dixinn' },
  { id: 'l3', nom: 'Fatou Camara', telephone: '622 10 00 03', vehicule: 'TRICYCLE', statut: 'EN_LIVRAISON', position: { lat: 9.6312, lng: -13.5684 }, commandesJour: 6, revenusJour: 90000, zone: 'Matam' },
  { id: 'l4', nom: 'Sekou Barry', telephone: '622 10 00 04', vehicule: 'VOITURE', statut: 'DISPONIBLE', position: { lat: 9.6612, lng: -13.5984 }, commandesJour: 3, revenusJour: 150000, zone: 'Ratoma' },
  { id: 'l5', nom: 'Aissata Touré', telephone: '622 10 00 05', vehicule: 'MOTO', statut: 'INDISPONIBLE', position: { lat: 9.6412, lng: -13.5784 }, commandesJour: 0, revenusJour: 0, zone: 'Matoto' },
];

const generateLivraisons = (): Livraison[] => [
  {
    id: 'liv1', numero: 'LIV-2024-001', commandeId: 'CMD-2024-001', clientNom: 'Boutique Fatou', clientTelephone: '622 20 00 01',
    clientAdresse: 'Quartier Kaloum, Rue 12', quartier: 'Kaloum', ville: 'Conakry',
    articles: [{ nom: 'Riz 50kg', quantite: 5 }, { nom: 'Huile 5L', quantite: 3 }],
    poids: 265, montant: 2755000, fraisLivraison: 25000,
    statut: 'EN_COURS', priorite: 'NORMALE',
    dateCreation: '2024-05-01T08:00:00', dateLivraisonPrevue: '2024-05-01T12:00:00',
    livreurId: 'l2', livreurNom: 'Ibrahima Sow', livreurTelephone: '622 10 00 02',
    position: { lat: 9.6450, lng: -13.5800 }, distanceKm: 4.2, dureeMinutes: 25
  },
  {
    id: 'liv2', numero: 'LIV-2024-002', commandeId: 'CMD-2024-002', clientNom: 'Superette Conakry', clientTelephone: '622 20 00 02',
    clientAdresse: 'Dixinn, Avenue de la République', quartier: 'Dixinn', ville: 'Conakry',
    articles: [{ nom: 'Café 250g', quantite: 20 }, { nom: 'Thé 100g', quantite: 15 }],
    poids: 8, montant: 480000, fraisLivraison: 15000,
    statut: 'EN_ATTENTE', priorite: 'URGENTE',
    dateCreation: '2024-05-01T09:30:00', dateLivraisonPrevue: '2024-05-01T11:00:00',
  },
  {
    id: 'liv3', numero: 'LIV-2024-003', commandeId: 'CMD-2024-003', clientNom: 'Restaurant Le Savana', clientTelephone: '622 20 00 03',
    clientAdresse: 'Matam, près du marché', quartier: 'Matam', ville: 'Conakry',
    articles: [{ nom: 'Riz 50kg', quantite: 10 }, { nom: 'Huile 5L', quantite: 5 }],
    poids: 525, montant: 4925000, fraisLivraison: 35000,
    statut: 'LIVREE', priorite: 'EXPRESS',
    dateCreation: '2024-05-01T07:00:00', dateLivraisonPrevue: '2024-05-01T09:00:00', dateLivraisonReelle: '2024-05-01T08:45:00',
    livreurId: 'l3', livreurNom: 'Fatou Camara', livreurTelephone: '622 10 00 03',
    distanceKm: 6.8, dureeMinutes: 42
  },
  {
    id: 'liv4', numero: 'LIV-2024-004', commandeId: 'CMD-2024-004', clientNom: 'Épicerie Alpha', clientTelephone: '622 20 00 04',
    clientAdresse: 'Ratoma, Quartier Siguiri', quartier: 'Ratoma', ville: 'Conakry',
    articles: [{ nom: 'Sucre 1kg', quantite: 25 }, { nom: 'Lait 400g', quantite: 15 }],
    poids: 31, montant: 750000, fraisLivraison: 20000,
    statut: 'EN_PREPARATION', priorite: 'NORMALE',
    dateCreation: '2024-05-01T10:00:00', dateLivraisonPrevue: '2024-05-01T14:00:00',
  },
  {
    id: 'liv5', numero: 'LIV-2024-005', commandeId: 'CMD-2024-005', clientNom: 'Commerce Diallo', clientTelephone: '622 20 00 05',
    clientAdresse: 'Matoto, Zone Industrielle', quartier: 'Matoto', ville: 'Conakry',
    articles: [{ nom: 'Produits ménagers', quantite: 50 }],
    poids: 75, montant: 850000, fraisLivraison: 30000,
    statut: 'ANNULEE', priorite: 'NORMALE',
    dateCreation: '2024-04-30T14:00:00', dateLivraisonPrevue: '2024-05-01T10:00:00',
    notes: 'Client injoignable après 3 tentatives'
  },
];

const generateTournees = (): Tournee[] => [
  {
    id: 't1', livreurId: 'l2', livreurNom: 'Ibrahima Sow', date: '2024-05-01',
    statut: 'EN_COURS', livraisons: [], distanceTotale: 18.5, dureeEstimee: 120,
    distanceParcourue: 8.2, livraisonsEffectuees: 3, revenus: 85000
  },
  {
    id: 't2', livreurId: 'l3', livreurNom: 'Fatou Camara', date: '2024-05-01',
    statut: 'EN_COURS', livraisons: [], distanceTotale: 22.0, dureeEstimee: 150,
    distanceParcourue: 15.5, livraisonsEffectuees: 4, revenus: 110000
  },
];

const generateVehicules = (): Vehicule[] => [
  { id: 'v1', type: 'MOTO', immatriculation: 'GN-001-AA', kilometrage: 15420, carburant: 75, statut: 'EN_SERVICE', livreurId: 'l2' },
  { id: 'v2', type: 'MOTO', immatriculation: 'GN-002-BB', kilometrage: 12350, carburant: 45, statut: 'DISPONIBLE' },
  { id: 'v3', type: 'TRICYCLE', immatriculation: 'GN-003-CC', kilometrage: 28700, carburant: 60, statut: 'EN_SERVICE', livreurId: 'l3' },
  { id: 'v4', type: 'VOITURE', immatriculation: 'GN-004-DD', kilometrage: 45200, carburant: 90, statut: 'DISPONIBLE' },
  { id: 'v5', type: 'MOTO', immatriculation: 'GN-005-EE', kilometrage: 8900, carburant: 20, statut: 'MAINTENANCE' },
];

// Status badge helper
const getStatutBadge = (statut: Livraison['statut']) => {
  const configs = {
    EN_ATTENTE: { label: 'En attente', icon: Clock, color: 'bg-slate-100 text-slate-700' },
    EN_PREPARATION: { label: 'En préparation', icon: Package, color: 'bg-blue-100 text-blue-700' },
    EN_COURS: { label: 'En cours', icon: Truck, color: 'bg-amber-100 text-amber-700' },
    LIVREE: { label: 'Livrée', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
    ANNULEE: { label: 'Annulée', icon: XCircle, color: 'bg-red-100 text-red-700' },
    RETOUR: { label: 'Retour', icon: ArrowRight, color: 'bg-orange-100 text-orange-700' },
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

const getPrioriteBadge = (priorite: Livraison['priorite']) => {
  const configs = {
    NORMALE: 'bg-slate-100 text-slate-700',
    URGENTE: 'bg-amber-100 text-amber-700',
    EXPRESS: 'bg-red-100 text-red-700',
  };
  return <Badge className={configs[priorite]}>{priorite}</Badge>;
};

export function LogistiquePage() {
  const { clients } = useAppStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  
  // Data states
  const [livraisons, setLivraisons] = useState<Livraison[]>([]);
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [tournees, setTournees] = useState<Tournee[]>([]);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  
  // Dialog states
  const [isNewLivraisonOpen, setIsNewLivraisonOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [selectedLivraison, setSelectedLivraison] = useState<Livraison | null>(null);
  
  // Form states
  const [newLivraisonForm, setNewLivraisonForm] = useState({
    clientNom: '',
    clientTelephone: '',
    clientAdresse: '',
    quartier: '',
    articles: '',
    montant: 0,
    fraisLivraison: 20000,
    priorite: 'NORMALE' as Livraison['priorite'],
    dateLivraisonPrevue: ''
  });

  // Initialize data
  useEffect(() => {
    setLivraisons(generateLivraisons());
    setLivreurs(generateLivreurs());
    setTournees(generateTournees());
    setVehicules(generateVehicules());
  }, []);

  // Stats
  const stats = {
    totalJour: livraisons.length,
    enCours: livraisons.filter(l => l.statut === 'EN_COURS').length,
    enAttente: livraisons.filter(l => l.statut === 'EN_ATTENTE' || l.statut === 'EN_PREPARATION').length,
    livrees: livraisons.filter(l => l.statut === 'LIVREE').length,
    retard: livraisons.filter(l => l.statut === 'EN_COURS' && new Date(l.dateLivraisonPrevue) < new Date()).length,
    livreursActifs: livreurs.filter(l => l.statut === 'EN_LIVRAISON' || l.statut === 'DISPONIBLE').length,
    revenusJour: livraisons.filter(l => l.statut === 'LIVREE').reduce((acc, l) => acc + l.fraisLivraison, 0),
    distanceTotale: tournees.reduce((acc, t) => acc + t.distanceParcourue, 0),
  };

  // Filter deliveries
  const filteredLivraisons = livraisons.filter(l => 
    l.numero.toLowerCase().includes(search.toLowerCase()) ||
    l.clientNom.toLowerCase().includes(search.toLowerCase()) ||
    l.quartier.toLowerCase().includes(search.toLowerCase())
  );

  // Actions
  const createLivraison = () => {
    const newLiv: Livraison = {
      id: `liv_${Date.now()}`,
      numero: `LIV-2024-${String(livraisons.length + 1).padStart(3, '0')}`,
      commandeId: `CMD-${Date.now()}`,
      clientNom: newLivraisonForm.clientNom,
      clientTelephone: newLivraisonForm.clientTelephone,
      clientAdresse: newLivraisonForm.clientAdresse,
      quartier: newLivraisonForm.quartier,
      ville: 'Conakry',
      articles: newLivraisonForm.articles.split(',').map(a => ({ nom: a.trim(), quantite: 1 })),
      poids: 0,
      montant: newLivraisonForm.montant,
      fraisLivraison: newLivraisonForm.fraisLivraison,
      statut: 'EN_ATTENTE',
      priorite: newLivraisonForm.priorite,
      dateCreation: new Date().toISOString(),
      dateLivraisonPrevue: newLivraisonForm.dateLivraisonPrevue || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };
    setLivraisons([newLiv, ...livraisons]);
    setIsNewLivraisonOpen(false);
    setNewLivraisonForm({
      clientNom: '', clientTelephone: '', clientAdresse: '', quartier: '',
      articles: '', montant: 0, fraisLivraison: 20000, priorite: 'NORMALE', dateLivraisonPrevue: ''
    });
  };

  const assignLivreur = (livraisonId: string, livreurId: string) => {
    const livreur = livreurs.find(l => l.id === livreurId);
    if (!livreur) return;
    
    setLivraisons(livraisons.map(l => 
      l.id === livraisonId 
        ? { ...l, statut: 'EN_COURS' as const, livreurId, livreurNom: livreur.nom, livreurTelephone: livreur.telephone }
        : l
    ));
    setLivreurs(livreurs.map(l => 
      l.id === livreurId ? { ...l, statut: 'EN_LIVRAISON' as const } : l
    ));
    setIsAssignDialogOpen(false);
  };

  const updateStatus = (livraisonId: string, statut: Livraison['statut']) => {
    setLivraisons(livraisons.map(l => 
      l.id === livraisonId 
        ? { 
            ...l, 
            statut,
            dateLivraisonReelle: statut === 'LIVREE' ? new Date().toISOString() : l.dateLivraisonReelle
          }
        : l
    ));
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-7 h-7 text-emerald-600" />
            Logistique & Livraisons
          </h1>
          <p className="text-slate-500">Gérez vos livraisons et suivez vos livreurs en temps réel</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsNewLivraisonOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle livraison
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="livraisons">Livraisons</TabsTrigger>
          <TabsTrigger value="livreurs">Livreurs</TabsTrigger>
          <TabsTrigger value="tournees">Tournées</TabsTrigger>
          <TabsTrigger value="flotte">Flotte</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 rounded-xl">
                    <Truck className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">En cours</p>
                    <p className="text-2xl font-bold">{stats.enCours}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 rounded-xl">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">En attente</p>
                    <p className="text-2xl font-bold">{stats.enAttente}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Livrées</p>
                    <p className="text-2xl font-bold">{stats.livrees}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 rounded-xl">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Livreurs actifs</p>
                    <p className="text-2xl font-bold">{stats.livreursActifs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                Carte en temps réel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg flex items-center justify-center relative">
                <div className="text-center">
                  <MapPin className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                  <p className="text-slate-500">Carte interactive</p>
                  <p className="text-sm text-slate-400">Conakry, Guinée</p>
                </div>
                
                {/* Simulated markers */}
                {livreurs.filter(l => l.statut === 'EN_LIVRAISON').map((livreur, i) => (
                  <div 
                    key={livreur.id}
                    className="absolute bg-emerald-500 text-white p-2 rounded-full shadow-lg"
                    style={{ top: `${20 + i * 15}%`, left: `${25 + i * 20}%` }}
                  >
                    <Truck className="w-4 h-4" />
                  </div>
                ))}
              </div>
              
              {/* Legend */}
              <div className="flex gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span>En livraison ({stats.enCours})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>Disponible ({livreurs.filter(l => l.statut === 'DISPONIBLE').length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span>En retard ({stats.retard})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Deliveries */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Livraisons en cours</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('livraisons')}>
                Voir tout <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {livraisons.filter(l => l.statut === 'EN_COURS').slice(0, 3).map((livraison) => (
                  <div key={livraison.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Truck className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">{livraison.numero}</p>
                        <p className="text-sm text-slate-500">{livraison.clientNom} • {livraison.quartier}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">{livraison.livreurNom}</p>
                        <p className="text-xs text-slate-500">{livraison.distanceKm} km</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedLivraison(livraison); setIsTrackingDialogOpen(true); }}>
                        <Navigation className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deliveries Tab */}
        <TabsContent value="livraisons" className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Rechercher par N°, client, quartier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                <SelectItem value="EN_COURS">En cours</SelectItem>
                <SelectItem value="LIVREE">Livrées</SelectItem>
                <SelectItem value="ANNULEE">Annulées</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Livreur</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLivraisons.map((livraison) => (
                    <TableRow key={livraison.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{livraison.numero}</p>
                          {getPrioriteBadge(livraison.priorite)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{livraison.clientNom}</p>
                          <p className="text-sm text-slate-500">{livraison.clientTelephone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{livraison.quartier}</p>
                          <p className="text-slate-500">{livraison.ville}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {livraison.livreurNom ? (
                          <div>
                            <p className="font-medium">{livraison.livreurNom}</p>
                            <p className="text-sm text-slate-500">{livraison.livreurTelephone}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">Non assigné</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-medium">{formatGNF(livraison.montant)}</p>
                        <p className="text-xs text-emerald-600">+{formatGNF(livraison.fraisLivraison)} livraison</p>
                      </TableCell>
                      <TableCell className="text-center">{getStatutBadge(livraison.statut)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {livraison.statut === 'EN_ATTENTE' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => { setSelectedLivraison(livraison); setIsAssignDialogOpen(true); }}
                            >
                              <User className="w-4 h-4 mr-1" />
                              Assigner
                            </Button>
                          )}
                          {livraison.statut === 'EN_COURS' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-emerald-600"
                              onClick={() => updateStatus(livraison.id, 'LIVREE')}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Livrer
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedLivraison(livraison); setIsDetailDialogOpen(true); }}>
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

        {/* Delivery People Tab */}
        <TabsContent value="livreurs" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {livreurs.map((livreur) => (
              <Card key={livreur.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-emerald-600">
                          {livreur.nom.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{livreur.nom}</p>
                        <p className="text-sm text-slate-500">{livreur.telephone}</p>
                      </div>
                    </div>
                    <Badge variant={
                      livreur.statut === 'DISPONIBLE' ? 'default' :
                      livreur.statut === 'EN_LIVRAISON' ? 'secondary' : 'outline'
                    } className={
                      livreur.statut === 'DISPONIBLE' ? 'bg-emerald-600' :
                      livreur.statut === 'EN_LIVRAISON' ? 'bg-amber-500' : ''
                    }>
                      {livreur.statut}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Véhicule</span>
                      <span className="font-medium">{livreur.vehicule}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Zone</span>
                      <span className="font-medium">{livreur.zone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Livraisons jour</span>
                      <span className="font-medium">{livreur.commandesJour}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Revenus jour</span>
                      <span className="font-medium text-emerald-600">{formatGNF(livreur.revenusJour)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Phone className="w-4 h-4 mr-1" />
                      Appeler
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Navigation className="w-4 h-4 mr-1" />
                      Localiser
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="tournees" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tournées du jour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tournees.map((tournee) => (
                  <Card key={tournee.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <Route className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{tournee.livreurNom}</p>
                            <p className="text-sm text-slate-500">Tournée {tournee.id}</p>
                          </div>
                        </div>
                        <Badge variant={tournee.statut === 'EN_COURS' ? 'default' : 'secondary'} className={
                          tournee.statut === 'EN_COURS' ? 'bg-amber-500' : ''
                        }>
                          {tournee.statut}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mt-4 text-center">
                        <div>
                          <p className="text-2xl font-bold">{tournee.livraisonsEffectuees}</p>
                          <p className="text-xs text-slate-500">Livraisons</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{tournee.distanceParcourue}/{tournee.distanceTotale}</p>
                          <p className="text-xs text-slate-500">km parcourus</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{tournee.dureeEstimee}</p>
                          <p className="text-xs text-slate-500">min estimées</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-emerald-600">{formatGNF(tournee.revenus)}</p>
                          <p className="text-xs text-slate-500">Revenus</p>
                        </div>
                      </div>

                      <Progress 
                        value={(tournee.distanceParcourue / tournee.distanceTotale) * 100} 
                        className="mt-4 h-2" 
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fleet Tab */}
        <TabsContent value="flotte" className="space-y-6 mt-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Immatriculation</TableHead>
                    <TableHead>Kilométrage</TableHead>
                    <TableHead>Carburant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Livreur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicules.map((vehicule) => (
                    <TableRow key={vehicule.id}>
                      <TableCell className="font-medium">{vehicule.type}</TableCell>
                      <TableCell className="font-mono">{vehicule.immatriculation}</TableCell>
                      <TableCell>{vehicule.kilometrage.toLocaleString()} km</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={vehicule.carburant} className="w-16 h-2" />
                          <span className="text-sm">{vehicule.carburant}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={vehicule.statut === 'DISPONIBLE' ? 'default' : 'secondary'} className={
                          vehicule.statut === 'DISPONIBLE' ? 'bg-emerald-600' :
                          vehicule.statut === 'EN_SERVICE' ? 'bg-amber-500' : ''
                        }>
                          {vehicule.statut}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {vehicule.livreurId ? 
                          livreurs.find(l => l.id === vehicule.livreurId)?.nom : 
                          <span className="text-slate-400">-</span>
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: New Delivery */}
      <Dialog open={isNewLivraisonOpen} onOpenChange={setIsNewLivraisonOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle livraison</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nom client *</Label>
                <Input value={newLivraisonForm.clientNom} onChange={(e) => setNewLivraisonForm({...newLivraisonForm, clientNom: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Téléphone *</Label>
                <Input value={newLivraisonForm.clientTelephone} onChange={(e) => setNewLivraisonForm({...newLivraisonForm, clientTelephone: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Adresse *</Label>
              <Input value={newLivraisonForm.clientAdresse} onChange={(e) => setNewLivraisonForm({...newLivraisonForm, clientAdresse: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quartier</Label>
                <Select value={newLivraisonForm.quartier} onValueChange={(value) => setNewLivraisonForm({...newLivraisonForm, quartier: value})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kaloum">Kaloum</SelectItem>
                    <SelectItem value="Dixinn">Dixinn</SelectItem>
                    <SelectItem value="Ratoma">Ratoma</SelectItem>
                    <SelectItem value="Matam">Matam</SelectItem>
                    <SelectItem value="Matoto">Matoto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priorité</Label>
                <Select value={newLivraisonForm.priorite} onValueChange={(value) => setNewLivraisonForm({...newLivraisonForm, priorite: value as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMALE">Normale</SelectItem>
                    <SelectItem value="URGENTE">Urgente</SelectItem>
                    <SelectItem value="EXPRESS">Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Articles</Label>
              <Textarea value={newLivraisonForm.articles} onChange={(e) => setNewLivraisonForm({...newLivraisonForm, articles: e.target.value})} placeholder="Riz 50kg x2, Huile 5L x1..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Montant (GNF)</Label>
                <Input type="number" value={newLivraisonForm.montant || ''} onChange={(e) => setNewLivraisonForm({...newLivraisonForm, montant: parseInt(e.target.value) || 0})} />
              </div>
              <div className="grid gap-2">
                <Label>Frais livraison (GNF)</Label>
                <Input type="number" value={newLivraisonForm.fraisLivraison || ''} onChange={(e) => setNewLivraisonForm({...newLivraisonForm, fraisLivraison: parseInt(e.target.value) || 0})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewLivraisonOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={createLivraison}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Assign */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assigner un livreur</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {livreurs.filter(l => l.statut === 'DISPONIBLE').map((livreur) => (
              <div 
                key={livreur.id}
                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-slate-50"
                onClick={() => selectedLivraison && assignLivreur(selectedLivraison.id, livreur.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="font-medium text-emerald-600">{livreur.nom.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <p className="font-medium">{livreur.nom}</p>
                    <p className="text-sm text-slate-500">{livreur.vehicule} • {livreur.zone}</p>
                  </div>
                </div>
                <Badge className="bg-emerald-600">Disponible</Badge>
              </div>
            ))}
            {livreurs.filter(l => l.statut === 'DISPONIBLE').length === 0 && (
              <p className="text-center text-slate-500 py-4">Aucun livreur disponible</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detail */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de la livraison</DialogTitle>
          </DialogHeader>
          {selectedLivraison && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">{selectedLivraison.numero}</span>
                {getStatutBadge(selectedLivraison.statut)}
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{selectedLivraison.clientNom}</p>
                    <p className="text-sm text-slate-500">{selectedLivraison.clientTelephone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm">{selectedLivraison.clientAdresse}</p>
                    <p className="text-xs text-slate-500">{selectedLivraison.quartier}, {selectedLivraison.ville}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Articles</p>
                <div className="space-y-1">
                  {selectedLivraison.articles.map((article, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{article.nom}</span>
                      <span className="text-slate-500">x{article.quantite}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Montant articles</span>
                  <span>{formatGNF(selectedLivraison.montant)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Frais livraison</span>
                  <span className="text-emerald-600">{formatGNF(selectedLivraison.fraisLivraison)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatGNF(selectedLivraison.montant + selectedLivraison.fraisLivraison)}</span>
                </div>
              </div>

              {selectedLivraison.livreurNom && (
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <p className="text-sm text-slate-600">Livreur: <span className="font-medium">{selectedLivraison.livreurNom}</span></p>
                  <p className="text-sm text-slate-600">Contact: {selectedLivraison.livreurTelephone}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Tracking */}
      <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Suivi en temps réel</DialogTitle>
          </DialogHeader>
          {selectedLivraison && (
            <div className="space-y-4 py-4">
              <div className="h-48 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Navigation className="w-10 h-10 mx-auto text-emerald-500 animate-pulse" />
                  <p className="mt-2 font-medium">{selectedLivraison.livreurNom}</p>
                  <p className="text-sm text-slate-500">En route vers {selectedLivraison.quartier}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold">{selectedLivraison.distanceKm}</p>
                  <p className="text-xs text-slate-500">km restants</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold">{selectedLivraison.dureeMinutes}</p>
                  <p className="text-xs text-slate-500">min estimées</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Appeler
                </Button>
                <Button variant="outline" className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Lien client
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTrackingDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LogistiquePage;
