'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Edit2, Trash2, FileText, Eye, Send, CheckCircle, Clock, 
  AlertCircle, Download, Printer, Copy, X, Package, Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF, formatDate } from '@/lib/mock-data';
import { Facture, Produit, LigneFacture } from '@/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Factures');

const statuts = [
  { value: 'brouillon', label: 'Brouillon', color: 'secondary' },
  { value: 'envoyee', label: 'Envoyée', color: 'default' },
  { value: 'payee', label: 'Payée', color: 'success' },
  { value: 'en_retard', label: 'En retard', color: 'destructive' },
  { value: 'annulee', label: 'Annulée', color: 'outline' },
];

const modesPaiement = [
  { value: 'especes', label: 'Espèces' },
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'mtn_money', label: 'MTN Money' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'carte', label: 'Carte bancaire' },
];

// Taux de TVA disponibles
const tauxTVA = [
  { value: 0, label: '0%' },
  { value: 7, label: '7%' },
  { value: 9, label: '9%' },
  { value: 18, label: '18%' },
  { value: 19, label: '19%' },
  { value: 20, label: '20%' },
];

interface LigneFactureForm {
  id: string;
  produitId?: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  tauxTVA: number;
  modeSaisie: 'HT' | 'TTC'; // Nouveau: choix du mode de saisie
}

interface FactureFormData {
  clientId: string;
  dateEmission: string;
  dateEcheance: string;
  lignes: LigneFactureForm[];
  modePaiement: string;
  notes: string;
  conditions: string;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const createEmptyLigne = (): LigneFactureForm => ({
  id: generateId(),
  description: '',
  quantite: 1,
  prixUnitaire: 0,
  tauxTVA: 18,
  modeSaisie: 'HT',
});

export function FacturesEnhancedPage() {
  const { 
    factures, clients, produits, 
    fetchFactures, fetchClients, fetchProduits,
    addFacture, updateFactureStatut, deleteFacture 
  } = useAppStore();
  
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingFacture, setEditingFacture] = useState<Facture | null>(null);
  const [viewingFacture, setViewingFacture] = useState<Facture | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<FactureFormData>({
    clientId: '',
    dateEmission: new Date().toISOString().split('T')[0],
    dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lignes: [createEmptyLigne()],
    modePaiement: 'virement',
    notes: '',
    conditions: 'Paiement à réception de facture',
  });

  // Charger les données au montage
  useEffect(() => {
    fetchFactures();
    fetchClients();
    fetchProduits();
  }, [fetchFactures, fetchClients, fetchProduits]);

  const filteredFactures = factures.filter(f => {
    const matchSearch = f.numero?.toLowerCase().includes(search.toLowerCase()) ||
      f.client?.nom?.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'all' || f.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  // Calcul des totaux à partir des lignes
  const calculs = useMemo(() => {
    let montantHT = 0;
    let montantTVA = 0;

    formData.lignes.forEach(ligne => {
      let prixHT = ligne.prixUnitaire;
      
      // Si le prix est saisi en TTC, on le convertit en HT
      if (ligne.modeSaisie === 'TTC' && ligne.tauxTVA > 0) {
        prixHT = Math.round(ligne.prixUnitaire / (1 + ligne.tauxTVA / 100));
      }
      
      const ligneHT = Math.round(prixHT * ligne.quantite);
      const ligneTVA = Math.round(ligneHT * ligne.tauxTVA / 100);
      
      montantHT += ligneHT;
      montantTVA += ligneTVA;
    });

    return {
      montantHT,
      montantTVA,
      montantTTC: montantHT + montantTVA,
    };
  }, [formData.lignes]);

  const handleAddLigne = () => {
    setFormData({
      ...formData,
      lignes: [...formData.lignes, createEmptyLigne()],
    });
  };

  const handleRemoveLigne = (index: number) => {
    if (formData.lignes.length > 1) {
      const newLignes = formData.lignes.filter((_, i) => i !== index);
      setFormData({ ...formData, lignes: newLignes });
    }
  };

  const handleLigneChange = (index: number, field: keyof LigneFactureForm, value: any) => {
    const newLignes = [...formData.lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };
    setFormData({ ...formData, lignes: newLignes });
  };

  const handleProduitSelect = (index: number, produitId: string) => {
    // Si l'utilisateur choisit "Saisie libre", on réinitialise produitId
    if (produitId === '__none__') {
      const newLignes = [...formData.lignes];
      newLignes[index] = {
        ...newLignes[index],
        produitId: undefined,
        description: '',
        prixUnitaire: 0,
        tauxTVA: 18,
        modeSaisie: 'HT',
      };
      setFormData({ ...formData, lignes: newLignes });
      return;
    }

    const produit = produits.find(p => p.id === produitId);
    if (produit) {
      const newLignes = [...formData.lignes];
      newLignes[index] = {
        ...newLignes[index],
        produitId: produit.id,
        description: produit.nom,
        prixUnitaire: produit.prixUnitaire,
        tauxTVA: produit.tva ?? 18,
        modeSaisie: 'HT',
      };
      setFormData({ ...formData, lignes: newLignes });
    }
  };

  const handleSubmit = async () => {
    if (!formData.clientId) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Préparer les données pour le backend
      const factureData = {
        clientId: formData.clientId,
        dateEmission: formData.dateEmission,
        dateEcheance: formData.dateEcheance,
        modePaiement: formData.modePaiement,
        notes: formData.notes,
        lignes: formData.lignes.map(ligne => {
          let prixHT = ligne.prixUnitaire;
          if (ligne.modeSaisie === 'TTC' && ligne.tauxTVA > 0) {
            prixHT = Math.round(ligne.prixUnitaire / (1 + ligne.tauxTVA / 100));
          }
          return {
            produitId: ligne.produitId,
            description: ligne.description,
            quantite: ligne.quantite,
            prixUnitaire: prixHT,
            tauxTVA: ligne.tauxTVA,
          };
        }),
      };

      await addFacture(factureData);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      logger.error('Erreur lors de la création:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      dateEmission: new Date().toISOString().split('T')[0],
      dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lignes: [createEmptyLigne()],
      modePaiement: 'virement',
      notes: '',
      conditions: 'Paiement à réception de facture',
    });
    setEditingFacture(null);
  };

  const openViewDialog = (facture: Facture) => {
    setViewingFacture(facture);
    setIsViewDialogOpen(true);
  };

  const getStatutBadge = (statut: Facture['statut']) => {
    const config = statuts.find(s => s.value === statut);
    return (
      <Badge 
        variant={config?.color as "default" | "secondary" | "destructive" | "outline"}
        className={statut === 'payee' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
      >
        {config?.label}
      </Badge>
    );
  };

  const stats = {
    total: factures.length,
    payees: factures.filter(f => f.statut === 'payee').length,
    enAttente: factures.filter(f => f.statut === 'envoyee' || f.statut === 'brouillon').length,
    enRetard: factures.filter(f => f.statut === 'en_retard').length,
    totalMontant: factures.reduce((acc, f) => acc + (f.montantTTC || 0), 0),
    totalPaye: factures.filter(f => f.statut === 'payee').reduce((acc, f) => acc + (f.montantTTC || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total factures</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Payées</p>
                <p className="text-xl font-bold">{stats.payees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
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
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">En retard</p>
                <p className="text-xl font-bold">{stats.enRetard}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Rechercher une facture..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatut} onValueChange={setFilterStatut}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {statuts.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle facture
        </Button>
      </div>

      {/* Factures Table */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredFactures.length} facture(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFactures.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune facture trouvée</p>
              <Button variant="outline" className="mt-4" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Créer une facture
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead className="text-right">Montant HT</TableHead>
                  <TableHead className="text-right">TVA</TableHead>
                  <TableHead className="text-right">Montant TTC</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFactures.map((facture) => (
                  <TableRow key={facture.id}>
                    <TableCell className="font-medium">{facture.numero}</TableCell>
                    <TableCell>{facture.client?.nom || '-'}</TableCell>
                    <TableCell>{formatDate(facture.dateEmission)}</TableCell>
                    <TableCell>{formatDate(facture.dateEcheance)}</TableCell>
                    <TableCell className="text-right">{formatGNF(facture.montantHT)}</TableCell>
                    <TableCell className="text-right">{formatGNF(facture.montantTVA)}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">{formatGNF(facture.montantTTC)}</TableCell>
                    <TableCell className="text-center">{getStatutBadge(facture.statut)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openViewDialog(facture)} title="Voir">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer la facture ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer la facture {facture.numero} ?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-600 hover:bg-red-700"
                                onClick={async () => {
                                  await deleteFacture(facture.id);
                                }}
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Nouvelle facture</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Client et dates */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Client *</Label>
                <Select 
                  value={formData.clientId} 
                  onValueChange={(value) => setFormData({...formData, clientId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Date d'émission</Label>
                <Input
                  type="date"
                  value={formData.dateEmission}
                  onChange={(e) => setFormData({...formData, dateEmission: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Date d'échéance</Label>
                <Input
                  type="date"
                  value={formData.dateEcheance}
                  onChange={(e) => setFormData({...formData, dateEcheance: e.target.value})}
                />
              </div>
            </div>

            {/* Lignes de facture */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Lignes de facture</Label>
                <Button variant="outline" size="sm" onClick={handleAddLigne}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une ligne
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-[250px]">Produit / Description</TableHead>
                      <TableHead className="w-[80px]">Qté</TableHead>
                      <TableHead className="w-[120px]">Prix</TableHead>
                      <TableHead className="w-[80px]">Saisie</TableHead>
                      <TableHead className="w-[80px]">TVA</TableHead>
                      <TableHead className="w-[100px]">Total HT</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.lignes.map((ligne, index) => {
                      let prixHT = ligne.prixUnitaire;
                      if (ligne.modeSaisie === 'TTC' && ligne.tauxTVA > 0) {
                        prixHT = Math.round(ligne.prixUnitaire / (1 + ligne.tauxTVA / 100));
                      }
                      const totalHT = Math.round(prixHT * ligne.quantite);
                      
                      return (
                        <TableRow key={ligne.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <Select
                                value={ligne.produitId || '__none__'}
                                onValueChange={(value) => handleProduitSelect(index, value)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Choisir un produit..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">-- Saisie libre --</SelectItem>
                                  {produits.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.nom} - {formatGNF(p.prixUnitaire)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="Description (libellé)"
                                value={ligne.description}
                                onChange={(e) => handleLigneChange(index, 'description', e.target.value)}
                                className="h-8"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={ligne.quantite}
                              onChange={(e) => handleLigneChange(index, 'quantite', parseInt(e.target.value) || 1)}
                              className="h-9 w-20"
                              min="1"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={ligne.prixUnitaire}
                              onChange={(e) => handleLigneChange(index, 'prixUnitaire', parseInt(e.target.value) || 0)}
                              className="h-9 w-28"
                              placeholder="GNF"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={ligne.modeSaisie}
                              onValueChange={(value: 'HT' | 'TTC') => handleLigneChange(index, 'modeSaisie', value)}
                            >
                              <SelectTrigger className="h-9 w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="HT">HT</SelectItem>
                                <SelectItem value="TTC">TTC</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={ligne.tauxTVA.toString()}
                              onValueChange={(value) => handleLigneChange(index, 'tauxTVA', parseInt(value))}
                            >
                              <SelectTrigger className="h-9 w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {tauxTVA.map(t => (
                                  <SelectItem key={t.value} value={t.value.toString()}>{t.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="font-medium text-right">
                            {formatGNF(totalHT)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => handleRemoveLigne(index)}
                              disabled={formData.lignes.length === 1}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Mode de paiement</Label>
                  <Select 
                    value={formData.modePaiement} 
                    onValueChange={(value) => setFormData({...formData, modePaiement: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modesPaiement.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Notes internes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>
              
              <Card className="bg-slate-50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total HT</span>
                    <span className="font-medium">{formatGNF(calculs.montantHT)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">TVA</span>
                    <span className="font-medium">{formatGNF(calculs.montantTVA)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold text-lg">Total TTC</span>
                    <span className="font-bold text-xl text-emerald-600">{formatGNF(calculs.montantTTC)}</span>
                  </div>
                  <p className="text-xs text-slate-400 text-right">
                    Arrondi au franc guinéen le plus proche
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700" 
              onClick={handleSubmit}
              disabled={!formData.clientId || formData.lignes.every(l => !l.description) || isSubmitting}
            >
              {isSubmitting ? 'Création...' : 'Créer la facture'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la facture</DialogTitle>
          </DialogHeader>
          {viewingFacture && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold">{viewingFacture.numero}</span>
                  {getStatutBadge(viewingFacture.statut)}
                </div>
                <p className="text-slate-500">Client: {viewingFacture.client?.nom}</p>
              </div>
              
              {/* Lignes de facture */}
              {viewingFacture.lignes && viewingFacture.lignes.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Qté</TableHead>
                        <TableHead className="text-right">P.U. HT</TableHead>
                        <TableHead className="text-center">TVA</TableHead>
                        <TableHead className="text-right">Total HT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingFacture.lignes.map((ligne, idx) => (
                        <TableRow key={ligne.id || idx}>
                          <TableCell>{ligne.description}</TableCell>
                          <TableCell className="text-center">{ligne.quantite}</TableCell>
                          <TableCell className="text-right">{formatGNF(ligne.prixUnitaire)}</TableCell>
                          <TableCell className="text-center">{ligne.tauxTVA}%</TableCell>
                          <TableCell className="text-right">{formatGNF(ligne.montantHT)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Date d'émission</p>
                  <p className="font-medium">{formatDate(viewingFacture.dateEmission)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Date d'échéance</p>
                  <p className="font-medium">{formatDate(viewingFacture.dateEcheance)}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Montant HT</span>
                  <span className="font-medium">{formatGNF(viewingFacture.montantHT)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">TVA</span>
                  <span className="font-medium">{formatGNF(viewingFacture.montantTVA)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Montant TTC</span>
                  <span className="text-emerald-600">{formatGNF(viewingFacture.montantTTC)}</span>
                </div>
              </div>
              
              {viewingFacture.modePaiement && (
                <div>
                  <p className="text-sm text-slate-500">Mode de paiement</p>
                  <p className="font-medium">
                    {modesPaiement.find(m => m.value === viewingFacture.modePaiement)?.label}
                  </p>
                </div>
              )}
              {viewingFacture.notes && (
                <div>
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="font-medium">{viewingFacture.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
