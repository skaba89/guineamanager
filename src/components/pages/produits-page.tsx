'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useAppStore } from '@/stores/auth-store';
import { formatGNF } from '@/lib/mock-data';
import { Produit } from '@/types';
import { useToast } from '@/hooks/use-toast';

const categories = [
  'Fournitures de bureau',
  'Matériel informatique',
  'Consommables',
  'Mobilier',
  'Équipements',
  'Services',
  'Autres'
];

const unites = ['Unité', 'Pack', 'Ramette', 'Carton', 'Kg', 'Litre', 'Mètre', 'Heure'];

// TVA rates for West Africa
const tvaRates = [
  { value: 0, label: '0%' },
  { value: 0.18, label: '18% (Standard)' },
  { value: 0.09, label: '9% (Réduit)' },
];

export function ProduitsPage() {
  const { produits, fetchProduits, addProduit, updateProduit, deleteProduit, error } = useAppStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prixUnitaire: 0,
    unite: 'Unité',
    stockActuel: 0,
    stockMin: 0,
    categorie: '',
    tva: 0.18
  });

  // Charger les produits au montage
  useEffect(() => {
    const loadProduits = async () => {
      setIsFetching(true);
      await fetchProduits();
      setIsFetching(false);
    };
    loadProduits();
  }, [fetchProduits]);

  const filteredProduits = produits.filter(p => 
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    p.categorie?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!formData.nom.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom du produit est obligatoire',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      let success: boolean;
      if (editingProduit) {
        success = await updateProduit(editingProduit.id, formData);
        if (success) {
          toast({
            title: 'Succès',
            description: 'Produit modifié avec succès',
          });
        } else {
          toast({
            title: 'Erreur',
            description: error || 'Impossible de modifier le produit',
            variant: 'destructive',
          });
        }
      } else {
        success = await addProduit(formData);
        if (success) {
          toast({
            title: 'Succès',
            description: 'Produit créé avec succès',
          });
        } else {
          toast({
            title: 'Erreur',
            description: error || 'Impossible de créer le produit',
            variant: 'destructive',
          });
        }
      }
      
      if (success) {
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
      tva: 0.18
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
      tva: produit.tva || 0.18
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteProduit(id);
    if (success) {
      toast({
        title: 'Succès',
        description: 'Produit supprimé avec succès',
      });
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le produit',
        variant: 'destructive',
      });
    }
  };

  const getStockStatus = (produit: Produit) => {
    if (produit.stockActuel === 0) return { label: 'Rupture', color: 'destructive' };
    if (produit.stockActuel <= produit.stockMin) return { label: 'Stock bas', color: 'warning' };
    return { label: 'OK', color: 'success' };
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
                <p className="text-xl font-bold">{new Set(produits.map(p => p.categorie)).size}</p>
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau produit
          </Button>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProduit ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  placeholder="Nom du produit"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Description courte"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="prix">Prix unitaire (GNF)</Label>
                  <Input
                    id="prix"
                    type="number"
                    value={formData.prixUnitaire}
                    onChange={(e) => setFormData({...formData, prixUnitaire: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tva">TVA</Label>
                  <Select value={String(formData.tva)} onValueChange={(value) => setFormData({...formData, tva: parseFloat(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tvaRates.map(rate => (
                        <SelectItem key={rate.value} value={String(rate.value)}>{rate.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="unite">Unité</Label>
                  <Select value={formData.unite} onValueChange={(value) => setFormData({...formData, unite: value})}>
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
                <div className="grid gap-2">
                  <Label htmlFor="categorie">Catégorie</Label>
                  <Select value={formData.categorie} onValueChange={(value) => setFormData({...formData, categorie: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stockActuel">Stock actuel</Label>
                  <Input
                    id="stockActuel"
                    type="number"
                    value={formData.stockActuel}
                    onChange={(e) => setFormData({...formData, stockActuel: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stockMin">Stock minimum</Label>
                  <Input
                    id="stockMin"
                    type="number"
                    value={formData.stockMin}
                    onChange={(e) => setFormData({...formData, stockMin: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                Annuler
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700" 
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingProduit ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredProduits.length} produit(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="ml-2">Chargement des produits...</span>
            </div>
          ) : filteredProduits.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {produits.length === 0 
                ? 'Aucun produit. Créez votre premier produit en cliquant sur "Nouveau produit".'
                : 'Aucun produit ne correspond à votre recherche.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Prix unitaire</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProduits.map((produit) => {
                  const stockStatus = getStockStatus(produit);
                  return (
                    <TableRow key={produit.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{produit.nom}</p>
                          <p className="text-sm text-slate-500">{produit.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{produit.categorie || 'Non classé'}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatGNF(produit.prixUnitaire)} / {produit.unite}
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <p className="font-medium">{produit.stockActuel}</p>
                          <Progress 
                            value={Math.min((produit.stockActuel / (produit.stockMin * 3)) * 100, 100)} 
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
                                  Êtes-vous sûr de vouloir supprimer {produit.nom} ?
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
    </div>
  );
}
