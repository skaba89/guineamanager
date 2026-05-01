'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Wand2, FileText, Tag, User, DollarSign, Sparkles, 
  Copy, RefreshCw, Check, Loader2, Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tools = [
  { 
    id: 'description', 
    name: 'Génération de description', 
    description: 'Créez des descriptions de produits optimisées',
    icon: FileText 
  },
  { 
    id: 'classification', 
    name: 'Classification OHADA', 
    description: 'Classez vos dépenses selon le plan comptable',
    icon: Tag 
  },
  { 
    id: 'risk', 
    name: 'Analyse de risque client', 
    description: 'Évaluez le risque de vos clients',
    icon: User 
  },
  { 
    id: 'pricing', 
    name: 'Suggestion de prix', 
    description: 'Obtenez des recommandations de prix',
    icon: DollarSign 
  },
];

// Simulated AI responses
const generateDescription = (product: string) => {
  const descriptions = [
    `${product} - Produit de haute qualité, idéal pour les besoins quotidiens. Fabriqué avec des matériaux durables, ce produit offre un excellent rapport qualité-prix. Parfait pour les foyers africains.`,
    `Découvrez ${product}, une solution innovante conçue pour répondre à vos besoins. Sa conception robuste garantit une longue durée de vie. Livraison disponible dans toute la Guinée.`,
    `${product} - Qualité premium à prix abordable. Ce produit a été sélectionné pour sa fiabilité et son adaptation aux conditions locales. Satisfait ou remboursé.`,
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

const classifyExpense = (description: string) => {
  const classifications = [
    { code: '601', account: 'Achats de matières premières', category: 'Charges d\'exploitation' },
    { code: '606', account: 'Achats non stockés', category: 'Charges d\'exploitation' },
    { code: '613', account: 'Locations', category: 'Charges d\'exploitation' },
    { code: '614', account: 'Charges locatives', category: 'Charges d\'exploitation' },
    { code: '622', account: 'Rémunérations d\'intermédiaires', category: 'Charges d\'exploitation' },
    { code: '641', account: 'Charges de personnel', category: 'Charges de personnel' },
  ];
  return classifications[Math.floor(Math.random() * classifications.length)];
};

const analyzeRisk = (clientName: string) => {
  const risks = ['Faible', 'Modéré', 'Élevé'];
  const risk = risks[Math.floor(Math.random() * risks.length)];
  const score = risk === 'Faible' ? Math.floor(Math.random() * 20) + 80 : 
                risk === 'Modéré' ? Math.floor(Math.random() * 20) + 50 : 
                Math.floor(Math.random() * 30) + 10;
  
  return {
    score,
    risk,
    recommendations: risk === 'Faible' 
      ? 'Client fiable. Conditions de paiement standards recommandées.'
      : risk === 'Modéré'
      ? 'Surveiller les délais de paiement. Prévoir des acomptes.'
      : 'Risque élevé. Exiger un prépaiement ou des garanties.'
  };
};

const suggestPrice = (product: string, cost: number) => {
  const margin = 1.3 + Math.random() * 0.4; // 30-70% margin
  const suggestedPrice = Math.round(cost * margin / 1000) * 1000;
  return {
    suggestedPrice,
    margin: Math.round((margin - 1) * 100),
    marketPosition: ['Économique', 'Compétitif', 'Premium'][Math.floor(Math.random() * 3)],
    reasoning: 'Basé sur l\'analyse du marché local et des coûts de production.'
  };
};

function formatGNF(amount: number) {
  return new Intl.NumberFormat('fr-GN', { 
    style: 'decimal', 
    maximumFractionDigits: 0 
  }).format(amount) + ' GNF';
}

export function AIAssistantPage() {
  const [activeTool, setActiveTool] = useState('description');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [productName, setProductName] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [productForPrice, setProductForPrice] = useState('');
  const [productCost, setProductCost] = useState('');

  const handleGenerate = async () => {
    setIsLoading(true);
    setResult(null);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    switch (activeTool) {
      case 'description':
        setResult({ description: generateDescription(productName) });
        break;
      case 'classification':
        setResult({ classification: classifyExpense(expenseDescription) });
        break;
      case 'risk':
        setResult({ analysis: analyzeRisk(clientName) });
        break;
      case 'pricing':
        setResult({ pricing: suggestPrice(productForPrice, parseInt(productCost) || 100000) });
        break;
    }
    
    setIsLoading(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Wand2 className="w-7 h-7 text-pink-600" />
          Assistant IA
          <Badge className="bg-pink-600">GLM-5</Badge>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Outils intelligents pour optimiser votre gestion
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tools Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Outils IA</CardTitle>
            <CardDescription>Sélectionnez un outil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id);
                    setResult(null);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                    activeTool === tool.id 
                      ? "bg-pink-50 border border-pink-200" 
                      : "hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    activeTool === tool.id ? "bg-pink-100" : "bg-slate-100"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5",
                      activeTool === tool.id ? "text-pink-600" : "text-slate-500"
                    )} />
                  </div>
                  <div>
                    <p className={cn(
                      "font-medium",
                      activeTool === tool.id ? "text-pink-600" : "text-slate-700"
                    )}>
                      {tool.name}
                    </p>
                    <p className="text-xs text-slate-500">{tool.description}</p>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Tool Interface */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-pink-600" />
              {tools.find(t => t.id === activeTool)?.name}
            </CardTitle>
            <CardDescription>
              {tools.find(t => t.id === activeTool)?.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Description Generator */}
            {activeTool === 'description' && (
              <>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Nom du produit</label>
                  <Input
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ex: Riz Importé 25kg"
                  />
                </div>
                <Button 
                  onClick={handleGenerate} 
                  disabled={!productName || isLoading}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Générer
                </Button>
                {result?.description && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <p>{result.description}</p>
                      <Button variant="ghost" size="icon" onClick={() => handleCopy(result.description)}>
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* OHADA Classification */}
            {activeTool === 'classification' && (
              <>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Description de la dépense</label>
                  <Textarea
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    placeholder="Ex: Achat de fournitures de bureau"
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleGenerate} 
                  disabled={!expenseDescription || isLoading}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Tag className="w-4 h-4 mr-2" />
                  )}
                  Classifier
                </Button>
                {result?.classification && (
                  <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Code:</span>
                      <span className="font-mono font-bold">{result.classification.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Compte:</span>
                      <span className="font-medium">{result.classification.account}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Catégorie:</span>
                      <Badge>{result.classification.category}</Badge>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Risk Analysis */}
            {activeTool === 'risk' && (
              <>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Nom du client</label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: SARL Koumbia"
                  />
                </div>
                <Button 
                  onClick={handleGenerate} 
                  disabled={!clientName || isLoading}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <User className="w-4 h-4 mr-2" />
                  )}
                  Analyser
                </Button>
                {result?.analysis && (
                  <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Score de risque</p>
                        <p className="text-3xl font-bold">{result.analysis.score}/100</p>
                      </div>
                      <Badge 
                        variant={result.analysis.risk === 'Faible' ? 'default' : 
                                result.analysis.risk === 'Modéré' ? 'secondary' : 'destructive'}
                        className="text-lg px-4 py-1"
                      >
                        {result.analysis.risk}
                      </Badge>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium text-slate-700">Recommandation:</p>
                      <p className="text-sm text-slate-600">{result.analysis.recommendations}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Price Suggestion */}
            {activeTool === 'pricing' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Nom du produit</label>
                    <Input
                      value={productForPrice}
                      onChange={(e) => setProductForPrice(e.target.value)}
                      placeholder="Ex: Télévision LED 32 pouces"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Coût d'achat (GNF)</label>
                    <Input
                      type="number"
                      value={productCost}
                      onChange={(e) => setProductCost(e.target.value)}
                      placeholder="Ex: 500000"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleGenerate} 
                  disabled={!productForPrice || !productCost || isLoading}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <DollarSign className="w-4 h-4 mr-2" />
                  )}
                  Suggérer
                </Button>
                {result?.pricing && (
                  <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Prix suggéré:</span>
                      <span className="text-2xl font-bold text-emerald-600">
                        {formatGNF(result.pricing.suggestedPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Marge:</span>
                      <Badge>{result.pricing.margin}%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Position marché:</span>
                      <span className="font-medium">{result.pricing.marketPosition}</span>
                    </div>
                    <p className="text-xs text-slate-500 pt-2 border-t">
                      {result.pricing.reasoning}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AIAssistantPage;
