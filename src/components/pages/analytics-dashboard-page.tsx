'use client';

import { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Package, 
  CalendarRange, RefreshCw, Download, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChart, LineChart, Activity, Target, Zap,
  AlertTriangle, CheckCircle2, Clock, CreditCard, Wallet,
  Smartphone, Building2, ShoppingCart, Truck
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { 
  Bar, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell, Area, AreaChart, ComposedChart
} from 'recharts';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF, formatDate } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

// Chart configuration
const chartConfig = {
  ventes: { label: 'Ventes', color: '#10b981' },
  achats: { label: 'Achats', color: '#ef4444' },
  marge: { label: 'Marge', color: '#3b82f6' },
  prevision: { label: 'Prévision', color: '#8b5cf6' },
  orange: { label: 'Orange Money', color: '#f97316' },
  mtn: { label: 'MTN Money', color: '#fbbf24' },
  wave: { label: 'Wave', color: '#06b6d4' },
};

// Mock data for analytics
const monthlyTrend = [
  { mois: 'Jan', ventes: 45000000, achats: 28000000, marge: 17000000, prevision: 42000000 },
  { mois: 'Fév', ventes: 52000000, achats: 32000000, marge: 20000000, prevision: 48000000 },
  { mois: 'Mar', ventes: 48000000, achats: 30000000, marge: 18000000, prevision: 50000000 },
  { mois: 'Avr', ventes: 61000000, achats: 38000000, marge: 23000000, prevision: 55000000 },
  { mois: 'Mai', ventes: 55000000, achats: 34000000, marge: 21000000, prevision: 58000000 },
  { mois: 'Jun', ventes: 67000000, achats: 42000000, marge: 25000000, prevision: 62000000 },
  { mois: 'Jul', ventes: 72000000, achats: 45000000, marge: 27000000, prevision: 68000000 },
  { mois: 'Aoû', ventes: 69000000, achats: 43000000, marge: 26000000, prevision: 70000000 },
  { mois: 'Sep', ventes: 78000000, achats: 48000000, marge: 30000000, prevision: 75000000 },
  { mois: 'Oct', ventes: 85000000, achats: 52000000, marge: 33000000, prevision: 80000000 },
  { mois: 'Nov', ventes: 92000000, achats: 56000000, marge: 36000000, prevision: 88000000 },
  { mois: 'Déc', ventes: 105000000, achats: 64000000, marge: 41000000, prevision: 95000000 },
];

const mobileMoneyDistribution = [
  { name: 'Orange Money', value: 45, amount: 125000000, color: '#f97316' },
  { name: 'MTN Money', value: 30, amount: 83000000, color: '#fbbf24' },
  { name: 'Wave', value: 25, amount: 69000000, color: '#06b6d4' },
];

const productPerformance = [
  { produit: 'Électronique', ca: 180000000, marge: 28, tendance: 'up', stock: 245 },
  { produit: 'Alimentation', ca: 120000000, marge: 15, tendance: 'stable', stock: 1890 },
  { produit: 'Vêtements', ca: 85000000, marge: 35, tendance: 'up', stock: 320 },
  { produit: 'Cosmétiques', ca: 65000000, marge: 42, tendance: 'up', stock: 156 },
  { produit: 'Quincaillerie', ca: 42000000, marge: 22, tendance: 'down', stock: 89 },
];

const clientSegments = [
  { segment: 'Premium', clients: 45, ca: 180000000, croissance: '+15%', retention: 92 },
  { segment: 'Business', clients: 120, ca: 240000000, croissance: '+8%', retention: 85 },
  { segment: 'Standard', clients: 380, ca: 180000000, croissance: '+12%', retention: 78 },
  { segment: 'Occasionnel', clients: 520, ca: 85000000, croissance: '-3%', retention: 45 },
];

const predictiveInsights = [
  { 
    type: 'opportunity',
    title: 'Pic de ventes prévu',
    description: 'Basé sur les tendances historiques, une augmentation de 25% des ventes est prévue pour les 2 prochaines semaines.',
    confidence: 87,
    action: 'Préparer les stocks et renforcer les équipes'
  },
  { 
    type: 'risk',
    title: 'Risque de rupture de stock',
    description: '3 produits populaires risquent d\'être en rupture sous 10 jours.',
    confidence: 92,
    action: 'Passer commande fournisseur urgent'
  },
  { 
    type: 'info',
    title: 'Optimisation trésorerie',
    description: 'Meilleur moment pour investir: les entrées de trésorerie dépassent les sorties de 35%.',
    confidence: 78,
    action: 'Envisager des investissements ou placements'
  },
  { 
    type: 'opportunity',
    title: 'Clients à fort potentiel',
    description: '15 clients identifiés comme susceptibles de passer en segment Premium.',
    confidence: 82,
    action: 'Proposer des offres personnalisées'
  },
];

const cashFlowForecast = [
  { periode: 'Sem 1', entrees: 45000000, sorties: 32000000, net: 13000000 },
  { periode: 'Sem 2', entrees: 52000000, sorties: 28000000, net: 24000000 },
  { periode: 'Sem 3', entrees: 38000000, sorties: 35000000, net: 3000000 },
  { periode: 'Sem 4', entrees: 65000000, sorties: 42000000, net: 23000000 },
];

function formatGNFShort(value: number) {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}Md`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

function getInsightIcon(type: string) {
  switch (type) {
    case 'opportunity': return <TrendingUp className="w-5 h-5 text-emerald-500" />;
    case 'risk': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    default: return <Activity className="w-5 h-5 text-blue-500" />;
  }
}

function getInsightColor(type: string) {
  switch (type) {
    case 'opportunity': return 'border-emerald-200 bg-emerald-50';
    case 'risk': return 'border-amber-200 bg-amber-50';
    default: return 'border-blue-200 bg-blue-50';
  }
}

export function AnalyticsDashboardPage() {
  const [period, setPeriod] = useState('year');
  const [activeTab, setActiveTab] = useState('overview');
  const { factures, clients, produits, commandes } = useAppStore();

  // KPIs calculés
  const totalCA = monthlyTrend.reduce((acc, m) => acc + m.ventes, 0);
  const totalMarge = monthlyTrend.reduce((acc, m) => acc + m.marge, 0);
  const margePercent = ((totalMarge / totalCA) * 100).toFixed(1);

  const kpis = [
    { 
      title: 'Chiffre d\'affaires', 
      value: formatGNF(totalCA), 
      change: '+18.5%', 
      positive: true, 
      icon: DollarSign, 
      color: 'bg-emerald-500',
      description: 'vs année précédente'
    },
    { 
      title: 'Marge brute', 
      value: `${margePercent}%`, 
      change: '+2.3%', 
      positive: true, 
      icon: TrendingUp, 
      color: 'bg-blue-500',
      description: `${formatGNF(totalMarge)} de marge`
    },
    { 
      title: 'Clients actifs', 
      value: clients.length.toString() || '1,065', 
      change: '+12%', 
      positive: true, 
      icon: Users, 
      color: 'bg-purple-500',
      description: 'Segmentés en 4 catégories'
    },
    { 
      title: 'Volume Mobile Money', 
      value: formatGNF(277000000), 
      change: '+32%', 
      positive: true, 
      icon: Smartphone, 
      color: 'bg-orange-500',
      description: 'Orange, MTN, Wave'
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analyse & Insights</h1>
          <p className="text-slate-500 text-sm mt-1">Tableau de bord analytique avec prédictions IA</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <CalendarRange className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="semester">Ce semestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">{kpi.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                    <div className="flex items-center gap-2">
                      <p className={cn('text-sm flex items-center gap-1', kpi.positive ? 'text-emerald-600' : 'text-red-600')}>
                        {kpi.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {kpi.change}
                      </p>
                      <span className="text-xs text-slate-400">{kpi.description}</span>
                    </div>
                  </div>
                  <div className={cn('p-3 rounded-xl', kpi.color)}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2"><Activity className="w-4 h-4" /> Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="predictions" className="gap-2"><Zap className="w-4 h-4" /> Prédictions IA</TabsTrigger>
          <TabsTrigger value="mobile-money" className="gap-2"><Smartphone className="w-4 h-4" /> Mobile Money</TabsTrigger>
          <TabsTrigger value="cashflow" className="gap-2"><Wallet className="w-4 h-4" /> Trésorerie</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Main Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Évolution des performances</CardTitle>
              <CardDescription>Ventes, achats et marges avec prévisions</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px]">
                <ComposedChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mois" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={formatGNFShort} />
                  <ChartTooltip content={<ChartTooltipContent />} formatter={(value: number) => formatGNF(value)} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="ventes" fill="var(--color-ventes)" radius={[4, 4, 0, 0]} name="Ventes" />
                  <Bar dataKey="achats" fill="var(--color-achats)" radius={[4, 4, 0, 0]} name="Achats" />
                  <Line type="monotone" dataKey="prevision" stroke="var(--color-prevision)" strokeDasharray="5 5" strokeWidth={2} name="Prévision" />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance par produit</CardTitle>
                <CardDescription>Analyse par catégorie</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="text-right">CA</TableHead>
                      <TableHead className="text-right">Marge</TableHead>
                      <TableHead className="text-center">Tendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productPerformance.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.produit}</TableCell>
                        <TableCell className="text-right">{formatGNF(row.ca)}</TableCell>
                        <TableCell className="text-right">{row.marge}%</TableCell>
                        <TableCell className="text-center">
                          {row.tendance === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto" />}
                          {row.tendance === 'down' && <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />}
                          {row.tendance === 'stable' && <Activity className="w-4 h-4 text-blue-500 mx-auto" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Client Segments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Segmentation client</CardTitle>
                <CardDescription>Répartition et performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientSegments.map((segment, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{segment.segment}</Badge>
                          <span className="text-sm text-slate-500">{segment.clients} clients</span>
                        </div>
                        <span className="text-sm font-semibold">{formatGNF(segment.ca)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Croissance: </span>
                          <span className={segment.croissance.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}>
                            {segment.croissance}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Rétention: </span>
                          <span className="font-medium">{segment.retention}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {predictiveInsights.map((insight, index) => (
              <Card key={index} className={cn('border-l-4', getInsightColor(insight.type))}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white shadow-sm">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{insight.title}</h3>
                        <Badge variant="secondary">{insight.confidence}% confiance</Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{insight.description}</p>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-500">{insight.action}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Prediction Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prévisions vs Réel</CardTitle>
              <CardDescription>Précision des prédictions IA sur les 6 derniers mois</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <RechartsLineChart data={monthlyTrend.slice(-6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mois" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={formatGNFShort} />
                  <ChartTooltip formatter={(value: number) => formatGNF(value)} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="ventes" stroke="var(--color-ventes)" strokeWidth={3} name="Ventes réelles" />
                  <Line type="monotone" dataKey="prevision" stroke="var(--color-prevision)" strokeDasharray="5 5" strokeWidth={2} name="Prévisions" />
                </RechartsLineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mobile Money Tab */}
        <TabsContent value="mobile-money" className="space-y-6">
          {/* Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {mobileMoneyDistribution.map((item, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="h-2" style={{ backgroundColor: item.color }} />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    <Badge variant="secondary">{item.value}%</Badge>
                  </div>
                  <div className="text-2xl font-bold mb-2">{formatGNF(item.amount)}</div>
                  <Progress value={item.value} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mobile Money Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transactions Mobile Money</CardTitle>
              <CardDescription>Répartition par opérateur</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-8">
                <ResponsiveContainer width="50%" height={250}>
                  <RechartsPieChart>
                    <Pie 
                      data={mobileMoneyDistribution} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60} 
                      outerRadius={100} 
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {mobileMoneyDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="space-y-4">
                  {mobileMoneyDistribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-slate-500">{formatGNF(item.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cashflow Tab */}
        <TabsContent value="cashflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prévision de trésorerie</CardTitle>
              <CardDescription>Entrées et sorties prévues pour les 4 prochaines semaines</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px]">
                <RechartsBarChart data={cashFlowForecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="periode" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={formatGNFShort} />
                  <ChartTooltip formatter={(value: number) => formatGNF(value)} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="entrees" fill="#10b981" radius={[4, 4, 0, 0]} name="Entrées" />
                  <Bar dataKey="sorties" fill="#ef4444" radius={[4, 4, 0, 0]} name="Sorties" />
                </RechartsBarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Détail flux de trésorerie</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Période</TableHead>
                      <TableHead className="text-right">Entrées</TableHead>
                      <TableHead className="text-right">Sorties</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashFlowForecast.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.periode}</TableCell>
                        <TableCell className="text-right text-emerald-600">+{formatGNF(row.entrees)}</TableCell>
                        <TableCell className="text-right text-red-600">-{formatGNF(row.sorties)}</TableCell>
                        <TableCell className={cn('text-right font-semibold', row.net >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                          {row.net >= 0 ? '+' : ''}{formatGNF(row.net)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Indicateurs clés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-800">Solvabilité</p>
                      <p className="text-sm text-emerald-600">Capacité à couvrir les dépenses: 145%</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">Cycle de trésorerie</p>
                      <p className="text-sm text-blue-600">Délai moyen de recouvrement: 18 jours</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-800">Objectif mensuel</p>
                      <p className="text-sm text-purple-600">87% atteint - Reste {formatGNF(15000000)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AnalyticsDashboardPage;
