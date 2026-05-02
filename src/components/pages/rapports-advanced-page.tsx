'use client';

import { useState } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  BarChart3, Download, TrendingUp, TrendingDown, DollarSign, Users, 
  Package, CalendarRange, RefreshCw, Printer, PieChart, LineChart, BarChart
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
  LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const chartConfig = {
  ventes: { label: 'Ventes', color: '#10b981' },
  achats: { label: 'Achats', color: '#ef4444' },
  marge: { label: 'Marge', color: '#3b82f6' },
};

const monthlyData = [
  { mois: 'Jan', ventes: 45000000, achats: 28000000, marge: 17000000 },
  { mois: 'Fév', ventes: 52000000, achats: 32000000, marge: 20000000 },
  { mois: 'Mar', ventes: 48000000, achats: 30000000, marge: 18000000 },
  { mois: 'Avr', ventes: 61000000, achats: 38000000, marge: 23000000 },
  { mois: 'Mai', ventes: 55000000, achats: 34000000, marge: 21000000 },
  { mois: 'Jun', ventes: 67000000, achats: 42000000, marge: 25000000 },
];

const salesByCategory = [
  { name: 'Électronique', value: 35, color: '#10b981' },
  { name: 'Alimentation', value: 25, color: '#3b82f6' },
  { name: 'Vêtements', value: 20, color: '#f59e0b' },
  { name: 'Autres', value: 20, color: '#94a3b8' },
];

function formatGNFShort(value: number) {
  return `${(value / 1000000).toFixed(0)}M`;
}

export function RapportsAdvancedPage() {
  const [period, setPeriod] = useState('year');
  const { factures, clients, produits, commandes } = useAppStore();

  const kpis = [
    { title: 'Chiffre d\'affaires', value: formatGNF(328000000), change: '+18.5%', positive: true, icon: DollarSign, color: 'bg-emerald-500' },
    { title: 'Marge brute', value: '38.2%', change: '+2.3%', positive: true, icon: TrendingUp, color: 'bg-blue-500' },
    { title: 'Clients actifs', value: clients.length.toString(), change: '+12', positive: true, icon: Users, color: 'bg-purple-500' },
    { title: 'Commandes', value: (commandes?.length || 0).toString(), change: '+8%', positive: true, icon: Package, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rapports & Analyses</h1>
          <p className="text-slate-500 text-sm mt-1">Tableaux de bord analytiques et états financiers</p>
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
                    <p className={cn('text-sm flex items-center gap-1', kpi.positive ? 'text-emerald-600' : 'text-red-600')}>
                      {kpi.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {kpi.change}
                    </p>
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

      {/* Main Charts Tabs */}
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="sales" className="gap-2"><BarChart className="w-4 h-4" /> Ventes</TabsTrigger>
          <TabsTrigger value="finance" className="gap-2"><LineChart className="w-4 h-4" /> Finance</TabsTrigger>
          <TabsTrigger value="clients" className="gap-2"><PieChart className="w-4 h-4" /> Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Évolution des ventes et marges</CardTitle>
              <CardDescription>Comparaison mensuelle</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <RechartsBarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mois" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={formatGNFShort} />
                  <ChartTooltip content={<ChartTooltipContent />} formatter={(value: number) => formatGNF(value)} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="ventes" fill="var(--color-ventes)" radius={[4, 4, 0, 0]} name="Ventes" />
                  <Bar dataKey="marge" fill="var(--color-marge)" radius={[4, 4, 0, 0]} name="Marge" />
                </RechartsBarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ventes par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsPieChart>
                      <Pie data={salesByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                        {salesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {salesByCategory.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-slate-600">{item.name}</span>
                      <span className="text-sm font-semibold ml-auto">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rapports rapides</CardTitle>
                <CardDescription>Générez des rapports prédéfinis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'Journal des ventes', icon: BarChart3 },
                  { name: 'Balance âgée', icon: CalendarRange },
                  { name: 'État des stocks', icon: Package },
                  { name: 'Compte de résultat', icon: DollarSign },
                ].map((report, index) => (
                  <Button key={index} variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                    <div className="p-2 rounded-lg bg-slate-100">
                      <report.icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{report.name}</p>
                      <p className="text-xs text-slate-500">Générer PDF</p>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tendance de trésorerie</CardTitle>
              <CardDescription>Évolution mensuelle du flux de trésorerie</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mois" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={formatGNFShort} />
                  <ChartTooltip formatter={(value: number) => formatGNF(value)} />
                  <defs>
                    <linearGradient id="colorMarge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="marge" stroke="#10b981" fill="url(#colorMarge)" name="Flux net" />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Segmentation client</CardTitle>
              <CardDescription>Répartition par segment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Segment</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Clients</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">CA</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Part</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { segment: 'Premium', clients: 45, ca: 180000000, color: '#10b981' },
                      { segment: 'Standard', clients: 120, ca: 240000000, color: '#3b82f6' },
                      { segment: 'Occasionnel', clients: 200, ca: 120000000, color: '#f59e0b' },
                    ].map((row, index) => (
                      <tr key={index} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color }} />
                            <span className="font-medium">{row.segment}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">{row.clients}</td>
                        <td className="text-right py-3 px-4 font-medium">{formatGNF(row.ca)}</td>
                        <td className="text-right py-3 px-4">
                          <Badge variant="secondary">{((row.ca / 540000000) * 100).toFixed(1)}%</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RapportsAdvancedPage;
