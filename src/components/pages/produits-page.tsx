'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF } from '@/lib/mock-data';
import { Produit } from '@/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Produits');

const categories = [
  'Fournitures de bureau',
  'Matériel informatique',
  'Consommables',
  'Mobilier',
  'Équipements',
  'Services',
  'Alimentation',
  'Vêtements',
  'Bâtiment',
  'Transport',
  'Autres'
];

const unites = ['Unité', 'Pack', 'Ramette', 'Carton', 'Kg', 'Litre', 'Mètre', 'Heure', 'Forfait', 'M²', 'M³'];

// Taux de TVA courants en Guinée et Afrique de l'Ouest
const tauxTVA = [
  { value: 0, label: '0% - Exonéré' },
  { value: 7, label: '7% - Taux réduit' },
  { value: 9, label: '9% - Taux réduit (CEMAC)' },
  { value: 18, label: '18% - Taux normal (Guinée)' },
  { value: 19, label: '19% - Taux normal (Sénégal)' },
  { value: 20, label: '20% - Taux normal (CEDEAO)' },
];

const typesProduit = [
  { value: 'PRODUIT', label: 'Produit' },
  { value: 'SERVICE', label: 'Service' },
];

interface ProduitFormData {
  nom: string;
  description: string;
  prixUnitaire: number;
  unite: string;
  stockActuel: number;
  stockMin: number;
  categorie: string;
  tva: number;
  type: 'PRODUIT' | 'SERVICE';
  reference: string;
}

export function ProduitsPage() {
  const { produits, fetchProduits, addProduit, updateProduit, deleteProduit } = useAppStore();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProduitFormData>({
    nom: '',
    description: '',
    prixUnitaire: 0,
    unite: 'Unité',
    stockActuel: 0,
    stockMin: 0,
    categorie: '',
    tva: 18,
    type: 'PRODUIT',
    reference: '',
  });

  // Charger les produits au montage
  useEffect(() => {
    fetchProduits();
  }, [fetchProduits]);

  const filteredProduits = produits.filter(p => 
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    p.categorie?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!formData.nom.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProduit) {
        await updateProduit(editingProduit.id, formData);
      } else {
        await addProduit(formData);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      prixUnitaire: 0,
      unite: 'Unité',
      stockActuel: 0,
      stockMin: 0,
      categorie: '',
      tva: 18,
      type: 'PRODUIT',
      reference: '',
    });
    setEditingProduit(null);
  };

  const openEditDialog = (produit: Produit) => {
    setEditingProduit(produit);
    setFormData({
      nom: produit.nom,
      description: produit.description || '',
      prixUnitaire: produit.prixUnitaire,
      unite: produit.unite,
      stockActuel: produit.stockActuel,
      stockMin: produit.stockMin,
      categorie: produit.categorie || '',
      tva: produit.tva ?? 18,
      type: produit.type ?? 'PRODUIT',
      reference: produit.reference || '',
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduit(id);
    } catch (error) {
      logger.error('Erreur lors de la suppression:', error);
    }
  };

  const getStockStatus = (produit: Produit) => {
    if (produit.stockActuel === 0) return { label: 'Rupture', color: 'destructive' };
    if (produit.stockActuel <= produit.stockMin) return { label: 'Stock bas', color: 'warning' };
    return { label: 'OK', color: 'success' };
  };

  // Calculer le prix TTC
  const getPrixTTC = (prixHT: number, tva: number) => {
    return Math.round(prixHT * (1 + tva / 100));
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total produits</p>
                <p className="text-xl font-bold">{produits.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Stock bas</p>
                <p className="text-xl font-bold">{produits.filter(p => p.stockActuel <= p.stockMin).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Catégories</p>
                <p className="text-xl font-bold">{new Set(produits.map(p => p.categorie).filter(Boolean)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Valeur stock</p>
                <p className="text-xl font-bold">{formatGNF(produits.reduce((acc, p) => acc + p.prixUnitaire * p.stockActuel, 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau produit
        </Button>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredProduits.length} produit(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProduits.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun produit trouvé</p>
              <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un produit
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Prix HT</TableHead>
                  <TableHead className="text-right">TVA</TableHead>
                  <TableHead className="text-right">Prix TTC</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProduits.map((produit) => {
                  const stockStatus = getStockStatus(produit);
                  const prixTTC = getPrixTTC(produit.prixUnitaire, produit.tva ?? 18);
                  return (
                    <TableRow key={produit.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{produit.nom}</p>
                          {produit.reference && (
                            <p className="text-xs text-slate-400">Réf: {produit.reference}</p>
                          )}
                          {produit.description && (
                            <p className="text-sm text-slate-500 truncate max-w-xs">{produit.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={produit.type === 'SERVICE' ? 'bg-purple-50' : 'bg-blue-50'}>
                          {produit.type === 'SERVICE' ? 'Service' : 'Produit'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{produit.categorie || 'Non classé'}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatGNF(produit.prixUnitaire)} / {produit.unite}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{produit.tva ?? 18}%</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">
                        {formatGNF(prixTTC)}
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <p className="font-medium">{produit.stockActuel}</p>
                          <Progress 
                            value={Math.min((produit.stockActuel / (produit.stockMin * 3 || 1)) * 100, 100)} 
                            className="w-16 h-1.5 mx-auto mt-1"
                          />
                          <p className="text-xs text-slate-500">Min: {produit.stockMin}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={stockStatus.color === 'destructive' ? 'destructive' : stockStatus.color === 'warning' ? 'secondary' : 'default'}
                          className={stockStatus.color === 'success' ? 'bg-emerald-600' : stockStatus.color === 'warning' ? 'bg-amber-500' : ''}
                        >
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(produit)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer le produit ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer {produit.nom} ? Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDelete(produit.id)}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduit ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Informations générales */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nom">Nom du produit *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  placeholder="Ex: Stylo bic bleu"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reference">Référence</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  placeholder="Ex: REF-001"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Description détaillée du produit..."
                rows={2}
              />
            </div>

            {/* Type et Catégorie */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'PRODUIT' | 'SERVICE') => setFormData({...formData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typesProduit.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="categorie">Catégorie</Label>
                <Select 
                  value={formData.categorie} 
                  onValueChange={(value) => setFormData({...formData, categorie: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prix et TVA */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="prixHT">Prix HT (GNF)</Label>
                <Input
                  id="prixHT"
                  type="number"
                  value={formData.prixUnitaire}
                  onChange={(e) => setFormData({...formData, prixUnitaire: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tva">Taux TVA</Label>
                <Select 
                  value={formData.tva.toString()} 
                  onValueChange={(value) => setFormData({...formData, tva: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tauxTVA.map(t => (
                      <SelectItem key={t.value} value={t.value.toString()}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unite">Unité</Label>
                <Select 
                  value={formData.unite} 
                  onValueChange={(value) => setFormData({...formData, unite: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unites.map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Aperçu du prix TTC */}
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Prix TTC calculé:</span>
                <span className="text-lg font-bold text-emerald-600">
                  {formatGNF(getPrixTTC(formData.prixUnitaire, formData.tva))} / {formData.unite}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                HT: {formatGNF(formData.prixUnitaire)} + TVA ({formData.tva}%): {formatGNF(Math.round(formData.prixUnitaire * formData.tva / 100))}
              </p>
            </div>

            {/* Stock */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Gestion du stock</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stockActuel">Stock actuel</Label>
                  <Input
                    id="stockActuel"
                    type="number"
                    value={formData.stockActuel}
                    onChange={(e) => setFormData({...formData, stockActuel: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stockMin">Stock minimum (alerte)</Label>
                  <Input
                    id="stockMin"
                    type="number"
                    value={formData.stockMin}
                    onChange={(e) => setFormData({...formData, stockMin: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700" 
              onClick={handleSubmit}
              disabled={!formData.nom.trim() || isSubmitting}
            >
              {isSubmitting ? 'Enregistrement...' : (editingProduit ? 'Modifier' : 'Créer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
