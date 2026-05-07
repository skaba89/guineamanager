'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, TrendingUp, TrendingDown, DollarSign, Users, Package, 
  AlertTriangle, Sparkles, ArrowUpRight, ArrowDownRight, RefreshCw,
  BarChart3, LineChart, PieChart, Activity, Target, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Simulated AI predictions
const salesPredictions = [
  { month: 'Mai 2026', predicted: 98500000, confidence: 92 },
  { month: 'Juin 2026', predicted: 105000000, confidence: 88 },
  { month: 'Juil 2026', predicted: 112000000, confidence: 85 },
];

const cashFlowForecast = [
  { week: 'S21', income: 45000000, expenses: 32000000, net: 13000000 },
  { week: 'S22', income: 52000000, expenses: 28000000, net: 24000000 },
  { week: 'S23', income: 38000000, expenses: 45000000, net: -7000000 },
  { week: 'S24', income: 65000000, expenses: 30000000, net: 35000000 },
];

const anomalies = [
  { type: 'warning', title: 'Factures en retard', description: '8 factures totalisant 12.5M GNF sont en retard de plus de 30 jours', impact: 'high' },
  { type: 'info', title: 'Stock optimal', description: 'Le stock de produits électroménagers est optimal pour les 3 prochains mois', impact: 'low' },
  { type: 'warning', title: 'Saison des pluies', description: 'Prévision de baisse des ventes de 15% pour les produits extérieurs', impact: 'medium' },
];

function formatGNF(amount: number) {
  return new Intl.NumberFormat('fr-GN', { 
    style: 'decimal', 
    maximumFractionDigits: 0 
  }).format(amount) + ' GNF';
}

export function AIDashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setLastUpdate(new Date());
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Brain className="w-7 h-7 text-purple-600" />
            Tableau de Bord IA
            <Badge className="bg-purple-600">GLM-5</Badge>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Analyses intelligentes et prédictions pour votre entreprise
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Mis à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4 mr-1", isLoading && "animate-spin")} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* AI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Score de santé</p>
                <p className="text-3xl font-bold mt-1">87%</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>+5% vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">CA prédictif</p>
                <p className="text-2xl font-bold mt-1">98.5M</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-emerald-100">
              Confiance: 92%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Alertes actives</p>
                <p className="text-3xl font-bold mt-1">3</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-amber-100">
              1 critique, 2 modérées
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Opportunités</p>
                <p className="text-3xl font-bold mt-1">12</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-blue-100">
              Potentiel: +15M GNF
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Predictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Prédictions de ventes
            </CardTitle>
            <CardDescription>Basé sur l'analyse des tendances historiques</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {salesPredictions.map((pred, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{pred.month}</p>
                  <p className="text-sm text-slate-500">{pred.confidence}% de confiance</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-emerald-600">{formatGNF(pred.predicted)}</p>
                  <div className="flex items-center gap-1 text-emerald-600 text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                    +{(8 + i * 2)}%
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Cash Flow Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-5 h-5 text-blue-600" />
              Prévision de trésorerie
            </CardTitle>
            <CardDescription>Flux de trésorerie sur 4 semaines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cashFlowForecast.map((week, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 text-sm">
                  <div className="font-medium">{week.week}</div>
                  <div className="text-emerald-600">+{formatGNF(week.income)}</div>
                  <div className="text-red-600">-{formatGNF(week.expenses)}</div>
                  <div className={cn(
                    "font-bold",
                    week.net >= 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {week.net >= 0 ? '+' : ''}{formatGNF(week.net)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Solde prévisionnel</span>
                <span className="font-bold text-emerald-600">+65M GNF</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            Détection d'anomalies
          </CardTitle>
          <CardDescription>Alertes et opportunités détectées par l'IA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {anomalies.map((anomaly, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border-l-4",
                  anomaly.type === 'warning' ? "bg-amber-50 border-amber-500" : "bg-blue-50 border-blue-500"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  anomaly.type === 'warning' ? "bg-amber-100" : "bg-blue-100"
                )}>
                  {anomaly.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-900">{anomaly.title}</h4>
                    <Badge variant={anomaly.impact === 'high' ? 'destructive' : anomaly.impact === 'medium' ? 'secondary' : 'outline'}>
                      {anomaly.impact === 'high' ? 'Élevé' : anomaly.impact === 'medium' ? 'Moyen' : 'Faible'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{anomaly.description}</p>
                </div>
                <Button variant="outline" size="sm">
                  Détails
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AIDashboardPage;
