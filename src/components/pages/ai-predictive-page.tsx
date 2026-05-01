'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target,
  DollarSign, Users, Package, Calendar, Clock, ChevronRight, ArrowUpRight,
  ArrowDownRight, Minus, BarChart3, PieChart, Activity, Zap, Shield,
  Bell, CheckCircle2, XCircle, AlertCircle, Info, RefreshCw, Eye,
  MessageSquare, Send, Download, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF, formatDate } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

// Types
interface PrevisionTresorerie {
  jour: number;
  date: string;
  entreesPrevues: number;
  sortiesPrevues: number;
  soldePrevu: number;
  confiance: number; // 0-100
}

interface RisqueClient {
  clientId: string;
  clientNom: string;
  scoreRisque: number; // 0-100 (100 = très risqué)
  niveau: 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'CRITIQUE';
  facturesImpayees: number;
  montantImpaye: number;
  joursRetardMoyen: number;
  recommandation: string;
}

interface SuggestionIA {
  id: string;
  type: 'OPPORTUNITE' | 'ALERTE' | 'ACTION' | 'OPTIMISATION';
  titre: string;
  description: string;
  impact: 'FAIBLE' | 'MOYEN' | 'FORT';
  categorie: 'FINANCE' | 'VENTE' | 'STOCK' | 'CLIENT' | 'RH';
  priorite: number;
  actions: string[];
  gainEstime?: number;
  dateCreation: string;
  lu: boolean;
}

interface PredictionVente {
  mois: string;
  ventesPrevues: number;
  confiance: number;
  tendance: 'HAUSSE' | 'STABLE' | 'BAISSE';
  facteurs: string[];
}

// Mock data generators
const generatePrevisionsTresorerie = (): PrevisionTresorerie[] => {
  const today = new Date();
  let solde = 15000000; // Solde initial
  const previsions: PrevisionTresorerie[] = [];
  
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    const entrees = Math.floor(Math.random() * 5000000) + 1000000;
    const sorties = Math.floor(Math.random() * 4000000) + 500000;
    solde = solde + entrees - sorties;
    
    previsions.push({
      jour: i + 1,
      date: date.toISOString().split('T')[0],
      entreesPrevues: entrees,
      sortiesPrevues: sorties,
      soldePrevu: solde,
      confiance: Math.max(50, 95 - i * 0.5) // Diminue avec le temps
    });
  }
  
  return previsions;
};

const generateRisquesClients = (): RisqueClient[] => [
  {
    clientId: 'c1',
    clientNom: 'Entreprise ABC SARL',
    scoreRisque: 85,
    niveau: 'CRITIQUE',
    facturesImpayees: 3,
    montantImpaye: 8500000,
    joursRetardMoyen: 45,
    recommandation: 'Contacter immédiatement le client. Envisager une procédure de recouvrement.'
  },
  {
    clientId: 'c2',
    clientNom: 'Commerce Diallo',
    scoreRisque: 62,
    niveau: 'ELEVE',
    facturesImpayees: 2,
    montantImpaye: 3200000,
    joursRetardMoyen: 28,
    recommandation: 'Planifier un rappel téléphonique et proposer un échéancier de paiement.'
  },
  {
    clientId: 'c3',
    clientNom: 'Boutique Fatou',
    scoreRisque: 45,
    niveau: 'MOYEN',
    facturesImpayees: 1,
    montantImpaye: 1200000,
    joursRetardMoyen: 15,
    recommandation: 'Envoyer un rappel par SMS ou email.'
  },
  {
    clientId: 'c4',
    clientNom: 'Superette Conakry',
    scoreRisque: 25,
    niveau: 'FAIBLE',
    facturesImpayees: 0,
    montantImpaye: 0,
    joursRetardMoyen: 0,
    recommandation: 'Client fiable. Maintenir la relation commerciale.'
  },
];

const generateSuggestions = (): SuggestionIA[] => [
  {
    id: 's1',
    type: 'ALERTE',
    titre: 'Risque de rupture de stock',
    description: 'Le produit "Riz local 50kg" atteindra le stock minimum dans 5 jours si la tendance de vente actuelle se poursuit.',
    impact: 'FORT',
    categorie: 'STOCK',
    priorite: 1,
    actions: ['Commander 100 unités supplémentaires', 'Négocier un délai court avec le fournisseur'],
    gainEstime: 2500000,
    dateCreation: new Date().toISOString(),
    lu: false
  },
  {
    id: 's2',
    type: 'OPPORTUNITE',
    titre: 'Période de forte demande',
    description: 'L\'analyse historique montre une augmentation de 35% des ventes pendant le Ramadan. Préparez vos stocks.',
    impact: 'FORT',
    categorie: 'VENTE',
    priorite: 2,
    actions: ['Augmenter les stocks de produits alimentaires', 'Préparer des offres spéciales', 'Planifier des promotions'],
    gainEstime: 15000000,
    dateCreation: new Date().toISOString(),
    lu: false
  },
  {
    id: 's3',
    type: 'ACTION',
    titre: 'Relance clients en retard',
    description: '3 clients totalisant 12 700 000 GNF n\'ont pas commandé ce mois. Une relance pourrait récupérer 60% de ce montant.',
    impact: 'MOYEN',
    categorie: 'CLIENT',
    priorite: 3,
    actions: ['Envoyer un email personnalisé', 'Proposer une offre de fidélité', 'Appeler les 2 plus gros clients'],
    gainEstime: 7620000,
    dateCreation: new Date().toISOString(),
    lu: false
  },
  {
    id: 's4',
    type: 'OPTIMISATION',
    titre: 'Réduire les frais Mobile Money',
    description: 'En regroupant vos retraits, vous pourriez économiser 15% sur les frais de transaction ce mois.',
    impact: 'MOYEN',
    categorie: 'FINANCE',
    priorite: 4,
    actions: ['Regrouper les retraits en 2-3 opérations par semaine', 'Utiliser Wave pour les gros montants (frais inférieurs)'],
    gainEstime: 450000,
    dateCreation: new Date().toISOString(),
    lu: true
  },
  {
    id: 's5',
    type: 'ALERTE',
    titre: 'Trésorerie tendue prévue',
    description: 'Selon nos projections, votre trésorerie pourrait devenir négative dans 12 jours. Action recommandée.',
    impact: 'FORT',
    categorie: 'FINANCE',
    priorite: 1,
    actions: ['Accélérer les encaissements clients', 'Reporter certaines dépenses non urgentes', 'Négocier des délais fournisseurs'],
    dateCreation: new Date().toISOString(),
    lu: false
  },
];

const generatePredictionsVentes = (): PredictionVente[] => [
  { mois: 'Mai 2024', ventesPrevues: 45000000, confiance: 85, tendance: 'HAUSSE', facteurs: ['Ramadan', 'Saison des cultures'] },
  { mois: 'Juin 2024', ventesPrevues: 52000000, confiance: 78, tendance: 'HAUSSE', facteurs: ['Fête de fin Ramadan', 'Rentrée scolaire préparations'] },
  { mois: 'Juillet 2024', ventesPrevues: 38000000, confiance: 72, tendance: 'BAISSE', facteurs: ['Mousson', 'Départs en vacances'] },
  { mois: 'Août 2024', ventesPrevues: 32000000, confiance: 65, tendance: 'BAISSE', facteurs: ['Vacances scolaires', 'Mousson'] },
  { mois: 'Sept 2024', ventesPrevues: 48000000, confiance: 70, tendance: 'HAUSSE', facteurs: ['Rentrée scolaire', 'Retour vacances'] },
  { mois: 'Oct 2024', ventesPrevues: 55000000, confiance: 62, tendance: 'HAUSSE', facteurs: ['Fêtes de fin d\'année préparation'] },
];

export function AIPredictivePage() {
  const { clients, factures } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data states
  const [previsionsTresorerie, setPrevisionsTresorerie] = useState<PrevisionTresorerie[]>([]);
  const [risquesClients, setRisquesClients] = useState<RisqueClient[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionIA[]>([]);
  const [predictionsVentes, setPredictionsVentes] = useState<PredictionVente[]>([]);
  
  // Dialog states
  const [isSuggestionDialogOpen, setIsSuggestionDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionIA | null>(null);

  // Initialize data
  useEffect(() => {
    // Simulate AI processing
    setLoading(true);
    setTimeout(() => {
      setPrevisionsTresorerie(generatePrevisionsTresorerie());
      setRisquesClients(generateRisquesClients());
      setSuggestions(generateSuggestions());
      setPredictionsVentes(generatePredictionsVentes());
      setLoading(false);
    }, 1000);
  }, []);

  // Stats
  const stats = {
    tresorerieJ30: previsionsTresorerie[29]?.soldePrevu || 0,
    tresorerieJ60: previsionsTresorerie[59]?.soldePrevu || 0,
    tresorerieJ90: previsionsTresorerie[89]?.soldePrevu || 0,
    risquesCritiques: risquesClients.filter(r => r.niveau === 'CRITIQUE' || r.niveau === 'ELEVE').length,
    montantRisque: risquesClients.reduce((acc, r) => acc + r.montantImpaye, 0),
    suggestionsNonLues: suggestions.filter(s => !s.lu).length,
    gainPotentiel: suggestions.filter(s => s.gainEstime).reduce((acc, s) => acc + (s.gainEstime || 0), 0),
  };

  // Mark suggestion as read
  const markAsRead = (suggestionId: string) => {
    setSuggestions(suggestions.map(s => 
      s.id === suggestionId ? { ...s, lu: true } : s
    ));
  };

  // Get risk badge
  const getRiskBadge = (niveau: RisqueClient['niveau']) => {
    const configs = {
      FAIBLE: { label: 'Faible', color: 'bg-emerald-100 text-emerald-700' },
      MOYEN: { label: 'Moyen', color: 'bg-amber-100 text-amber-700' },
      ELEVE: { label: 'Élevé', color: 'bg-orange-100 text-orange-700' },
      CRITIQUE: { label: 'Critique', color: 'bg-red-100 text-red-700' },
    };
    const config = configs[niveau];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Get suggestion type badge
  const getSuggestionBadge = (type: SuggestionIA['type']) => {
    const configs = {
      ALERTE: { label: 'Alerte', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
      OPPORTUNITE: { label: 'Opportunité', icon: Lightbulb, color: 'bg-emerald-100 text-emerald-700' },
      ACTION: { label: 'Action', icon: Target, color: 'bg-blue-100 text-blue-700' },
      OPTIMISATION: { label: 'Optimisation', icon: Zap, color: 'bg-purple-100 text-purple-700' },
    };
    const config = configs[type];
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Get trend icon
  const getTrendIcon = (tendance: 'HAUSSE' | 'STABLE' | 'BAISSE') => {
    switch (tendance) {
      case 'HAUSSE': return <ArrowUpRight className="w-5 h-5 text-emerald-500" />;
      case 'BAISSE': return <ArrowDownRight className="w-5 h-5 text-red-500" />;
      default: return <Minus className="w-5 h-5 text-amber-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto animate-spin text-emerald-600 mb-4" />
          <p className="text-slate-600">Analyse prédictive en cours...</p>
          <p className="text-sm text-slate-400">L'IA analyse vos données</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Brain className="w-7 h-7 text-purple-600" />
            Intelligence Prédictive
          </h1>
          <p className="text-slate-500">Anticipez l'avenir de votre entreprise avec l'IA</p>
        </div>
        <div className="flex items-center gap-2">
          {stats.suggestionsNonLues > 0 && (
            <Badge className="bg-red-500 text-white animate-pulse">
              {stats.suggestionsNonLues} nouvelles suggestions
            </Badge>
          )}
          <Button variant="outline" onClick={() => setLoading(true)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="tresorerie">Trésorerie</TabsTrigger>
          <TabsTrigger value="risques">Risques</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm">Trésorerie J+30</p>
                    <p className="text-2xl font-bold mt-1">{formatGNF(stats.tresorerieJ30)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-emerald-200" />
                </div>
                <Progress value={previsionsTresorerie[29]?.confiance || 0} className="mt-3 bg-emerald-400" />
                <p className="text-xs text-emerald-100 mt-1">Confiance: {Math.round(previsionsTresorerie[29]?.confiance || 0)}%</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm">Risques critiques</p>
                    <p className="text-2xl font-bold mt-1">{stats.risquesCritiques}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-amber-200" />
                </div>
                <p className="text-sm text-amber-100 mt-3">
                  {formatGNF(stats.montantRisque)} en impayés
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Suggestions IA</p>
                    <p className="text-2xl font-bold mt-1">{suggestions.length}</p>
                  </div>
                  <Lightbulb className="w-8 h-8 text-purple-200" />
                </div>
                <p className="text-sm text-purple-100 mt-3">
                  {stats.suggestionsNonLues} non lues
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Gain potentiel</p>
                    <p className="text-lg font-bold mt-1">{formatGNF(stats.gainPotentiel)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-200" />
                </div>
                <p className="text-sm text-blue-100 mt-3">
                  En suivant les suggestions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sales Predictions Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Prévisions des ventes
              </CardTitle>
              <CardDescription>Projections basées sur l'historique et les tendances saisonnières</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictionsVentes.map((pred, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-24 font-medium">{pred.mois}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-500">{formatGNF(pred.ventesPrevues)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Confiance: {pred.confiance}%</span>
                          {getTrendIcon(pred.tendance)}
                        </div>
                      </div>
                      <Progress value={pred.confiance} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Suggestions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Suggestions prioritaires</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('suggestions')}>
                Voir tout <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestions.filter(s => !s.lu).slice(0, 3).map((suggestion) => (
                  <div 
                    key={suggestion.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                    onClick={() => {
                      setSelectedSuggestion(suggestion);
                      setIsSuggestionDialogOpen(true);
                      markAsRead(suggestion.id);
                    }}
                  >
                    {getSuggestionBadge(suggestion.type)}
                    <div className="flex-1">
                      <p className="font-medium">{suggestion.titre}</p>
                      <p className="text-sm text-slate-500 line-clamp-1">{suggestion.description}</p>
                    </div>
                    {suggestion.gainEstime && (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                        +{formatGNF(suggestion.gainEstime)}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Tab */}
        <TabsContent value="tresorerie" className="space-y-6 mt-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'J+30', value: stats.tresorerieJ30, confiance: previsionsTresorerie[29]?.confiance },
              { label: 'J+60', value: stats.tresorerieJ60, confiance: previsionsTresorerie[59]?.confiance },
              { label: 'J+90', value: stats.tresorerieJ90, confiance: previsionsTresorerie[89]?.confiance },
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Trésorerie {item.label}</p>
                    <p className={cn(
                      'text-2xl font-bold mt-1',
                      item.value > 0 ? 'text-emerald-600' : 'text-red-600'
                    )}>
                      {formatGNF(item.value)}
                    </p>
                    <Progress value={item.confiance || 0} className="mt-2 h-1" />
                    <p className="text-xs text-slate-400 mt-1">Confiance: {Math.round(item.confiance || 0)}%</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution prévisionnelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-1">
                {previsionsTresorerie.filter((_, i) => i % 7 === 0).map((prev, i) => {
                  const maxSolde = Math.max(...previsionsTresorerie.map(p => p.soldePrevu));
                  const height = Math.abs(prev.soldePrevu) / maxSolde * 200;
                  const isNegative = prev.soldePrevu < 0;
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div 
                        className={cn(
                          'w-full rounded-t',
                          isNegative ? 'bg-red-400' : 'bg-emerald-400'
                        )}
                        style={{ height: `${height}px` }}
                      />
                      <p className="text-xs text-slate-400 mt-1">J{prev.jour}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          {previsionsTresorerie.some(p => p.soldePrevu < 0) && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800">Attention: Risque de découvert détecté</p>
                    <p className="text-sm text-red-600 mt-1">
                      Selon nos projections, votre trésorerie pourrait devenir négative. 
                      Nous vous recommandons d'anticiper cette situation.
                    </p>
                    <Button size="sm" variant="destructive" className="mt-3">
                      Voir les actions recommandées
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risques" className="space-y-6 mt-6">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['FAIBLE', 'MOYEN', 'ELEVE', 'CRITIQUE'].map((niveau) => {
              const count = risquesClients.filter(r => r.niveau === niveau).length;
              const colors = {
                FAIBLE: 'bg-emerald-100 text-emerald-700',
                MOYEN: 'bg-amber-100 text-amber-700',
                ELEVE: 'bg-orange-100 text-orange-700',
                CRITIQUE: 'bg-red-100 text-red-700',
              };
              return (
                <Card key={niveau}>
                  <CardContent className="p-4 text-center">
                    <Badge className={colors[niveau as keyof typeof colors]}>{niveau}</Badge>
                    <p className="text-3xl font-bold mt-2">{count}</p>
                    <p className="text-sm text-slate-500">clients</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Risk Table */}
          <Card>
            <CardHeader>
              <CardTitle>Analyse des risques clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {risquesClients.map((risque) => (
                  <Card key={risque.clientId}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{risque.clientNom}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getRiskBadge(risque.niveau)}
                              <span className="text-sm text-slate-500">
                                Score: {risque.scoreRisque}/100
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">{formatGNF(risque.montantImpaye)}</p>
                          <p className="text-xs text-slate-500">{risque.facturesImpayees} facture(s) impayée(s)</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Recommandation: </span>
                          {risque.recommandation}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Contacter
                        </Button>
                        <Button size="sm" variant="outline">
                          <Send className="w-4 h-4 mr-1" />
                          Relance
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-6 mt-6">
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <Card 
                key={suggestion.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  !suggestion.lu && 'border-l-4 border-l-purple-500'
                )}
                onClick={() => {
                  setSelectedSuggestion(suggestion);
                  setIsSuggestionDialogOpen(true);
                  markAsRead(suggestion.id);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getSuggestionBadge(suggestion.type)}
                        <Badge variant="outline">{suggestion.categorie}</Badge>
                        {!suggestion.lu && (
                          <Badge className="bg-purple-100 text-purple-700">Nouveau</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold">{suggestion.titre}</h3>
                      <p className="text-sm text-slate-600 mt-1">{suggestion.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                        <span>Impact: <Badge variant={suggestion.impact === 'FORT' ? 'destructive' : 'secondary'}>{suggestion.impact}</Badge></span>
                        {suggestion.gainEstime && (
                          <span className="text-emerald-600 font-medium">
                            +{formatGNF(suggestion.gainEstime)} potentiel
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: Suggestion Details */}
      <Dialog open={isSuggestionDialogOpen} onOpenChange={setIsSuggestionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSuggestion?.titre}</DialogTitle>
          </DialogHeader>
          {selectedSuggestion && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                {getSuggestionBadge(selectedSuggestion.type)}
                <Badge variant="outline">{selectedSuggestion.categorie}</Badge>
                <Badge variant={selectedSuggestion.impact === 'FORT' ? 'destructive' : 'secondary'}>
                  Impact: {selectedSuggestion.impact}
                </Badge>
              </div>
              
              <p className="text-slate-600">{selectedSuggestion.description}</p>
              
              {selectedSuggestion.gainEstime && (
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Gain potentiel estimé</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatGNF(selectedSuggestion.gainEstime)}</p>
                </div>
              )}

              <div>
                <p className="font-medium mb-2">Actions recommandées:</p>
                <ul className="space-y-2">
                  {selectedSuggestion.actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuggestionDialogOpen(false)}>Fermer</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Marquer comme traitée
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AIPredictivePage;
