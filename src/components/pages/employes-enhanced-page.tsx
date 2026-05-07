'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Users, User, Mail, Phone, Calendar, Briefcase,
  Building2, LayoutGrid, List, Network, Crown, UserCog, DollarSign, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF, formatDate } from '@/lib/mock-data';
import { Employe } from '@/types';
import { cn } from '@/lib/utils';

const departements = [
  'Administration', 'Commercial', 'Finance', 'Logistique',
  'Marketing', 'Ressources Humaines', 'Technique', 'Direction'
];

const typesContrat = [
  { value: 'CDI', label: 'CDI - Contrat à durée indéterminée' },
  { value: 'CDD', label: 'CDD - Contrat à durée déterminée' },
  { value: 'APPRENTISSAGE', label: 'Contrat d\'apprentissage' },
  { value: 'STAGE', label: 'Stage' },
];

// Hierarchy levels
const hierarchy: Record<string, { level: number; icon: React.ElementType; color: string }> = {
  'Directeur Général': { level: 1, icon: Crown, color: 'bg-amber-500' },
  'Directeur Commercial': { level: 2, icon: Briefcase, color: 'bg-blue-500' },
  'Directeur Financier': { level: 2, icon: Briefcase, color: 'bg-blue-500' },
  'Responsable RH': { level: 2, icon: UserCog, color: 'bg-purple-500' },
  'Chef de projet': { level: 3, icon: UserCog, color: 'bg-emerald-500' },
  'Comptable': { level: 3, icon: User, color: 'bg-teal-500' },
  'Commercial': { level: 3, icon: User, color: 'bg-indigo-500' },
  'Technicien': { level: 4, icon: User, color: 'bg-slate-500' },
};

export function EmployesEnhancedPage() {
  const { employes, fetchEmployes, addEmploye, updateEmploye, deleteEmploye } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'org'>('table');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedEmploye, setSelectedEmploye] = useState<Employe | null>(null);
  const [editingEmploye, setEditingEmploye] = useState<Employe | null>(null);
  const [formData, setFormData] = useState({
    matricule: '', nom: '', prenom: '', email: '', telephone: '', adresse: '',
    dateNaissance: '', dateEmbauche: new Date().toISOString().split('T')[0],
    poste: '', departement: '', salaireBase: 0, typeContrat: 'CDI' as Employe['typeContrat']
  });

  // Fetch employes on mount
  useEffect(() => {
    fetchEmployes();
  }, [fetchEmployes]);

  const filteredEmployes = employes.filter(e => {
    const matchSearch = e.nom.toLowerCase().includes(search.toLowerCase()) ||
      e.prenom.toLowerCase().includes(search.toLowerCase()) ||
      e.matricule.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === 'all' || e.departement === filterDept;
    return matchSearch && matchDept;
  });

  const handleSubmit = () => {
    if (editingEmploye) {
      updateEmploye(editingEmploye.id, formData);
    } else {
      addEmploye(formData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      matricule: `EMP-${String(employes.length + 1).padStart(3, '0')}`,
      nom: '', prenom: '', email: '', telephone: '', adresse: '',
      dateNaissance: '', dateEmbauche: new Date().toISOString().split('T')[0],
      poste: '', departement: '', salaireBase: 0, typeContrat: 'CDI'
    });
    setEditingEmploye(null);
  };

  const openEditDialog = (employe: Employe) => {
    setEditingEmploye(employe);
    setFormData({
      matricule: employe.matricule, nom: employe.nom, prenom: employe.prenom,
      email: employe.email || '', telephone: employe.telephone || '',
      adresse: employe.adresse || '', dateNaissance: employe.dateNaissance || '',
      dateEmbauche: employe.dateEmbauche, poste: employe.poste,
      departement: employe.departement || '', salaireBase: employe.salaireBase,
      typeContrat: employe.typeContrat
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = (employe: Employe) => {
    setSelectedEmploye(employe);
    setIsViewDialogOpen(true);
  };

  const stats = {
    total: employes.length,
    actifs: employes.filter(e => e.actif).length,
    cdi: employes.filter(e => e.typeContrat === 'CDI').length,
    masseSalariale: employes.reduce((acc, e) => acc + e.salaireBase, 0),
    parDept: departements.map(d => ({
      nom: d, count: employes.filter(e => e.departement === d).length
    })).filter(d => d.count > 0)
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="overflow-hidden">
          <div className="h-1 bg-blue-500" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total employés</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="h-1 bg-emerald-500" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Actifs</p>
                <p className="text-2xl font-bold">{stats.actifs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="h-1 bg-purple-500" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">En CDI</p>
                <p className="text-2xl font-bold">{stats.cdi}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="h-1 bg-amber-500" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Masse salariale</p>
                <p className="text-lg font-bold">{formatGNF(stats.masseSalariale)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Répartition par département</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {stats.parDept.map((dept) => (
              <div key={dept.nom} className="w-36">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{dept.nom}</span>
                  <span className="font-medium">{dept.count}</span>
                </div>
                <Progress value={(dept.count / stats.total) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Rechercher un employé..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Département" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les départements</SelectItem>
              {departements.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('table')}>
              <List className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === 'cards' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('cards')}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvel employé
            </Button>
          </Dialog>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle>{filteredEmployes.length} employé(s)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead>Contrat</TableHead>
                  <TableHead className="text-right">Salaire</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployes.map((employe) => (
                  <TableRow key={employe.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="font-semibold text-emerald-600">
                            {employe.prenom[0]}{employe.nom[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{employe.prenom} {employe.nom}</p>
                          <p className="text-sm text-slate-500">{employe.matricule}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {employe.email || '-'}</p>
                        <p className="flex items-center gap-1 text-slate-500"><Phone className="w-3 h-3" /> {employe.telephone || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>{employe.poste}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{employe.departement || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employe.typeContrat === 'CDI' ? 'default' : 'secondary'}>
                        {employe.typeContrat}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatGNF(employe.salaireBase)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openViewDialog(employe)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(employe)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer l'employé ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer {employe.prenom} {employe.nom} ?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600" onClick={() => deleteEmploye(employe.id)}>
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
          </CardContent>
        </Card>
      )}

      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployes.map((employe) => {
            const position = hierarchy[employe.poste as keyof typeof hierarchy] || 
              { level: 99, icon: User, color: 'bg-slate-500' };
            const Icon = position.icon;
            
            return (
              <Card key={employe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className={cn('h-2', position.color)} />
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className={cn(
                      'w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg mb-4',
                      position.color
                    )}>
                      {employe.prenom[0]}{employe.nom[0]}
                    </div>
                    
                    <h3 className="font-bold text-lg">{employe.prenom} {employe.nom}</h3>
                    <div className="flex items-center gap-1 text-slate-500 mt-1">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{employe.poste}</span>
                    </div>
                    
                    <Badge variant="outline" className="mt-2">
                      {employe.departement || 'Non assigné'}
                    </Badge>
                    
                    <div className="w-full mt-4 pt-4 border-t space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Matricule</span>
                        <span className="font-mono">{employe.matricule}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Contrat</span>
                        <Badge variant={employe.typeContrat === 'CDI' ? 'default' : 'secondary'} className="text-xs">
                          {employe.typeContrat}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Salaire</span>
                        <span className="font-medium">{formatGNF(employe.salaireBase)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4 w-full">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openViewDialog(employe)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(employe)}>
                        <Edit2 className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de l'employé</DialogTitle>
          </DialogHeader>
          {selectedEmploye && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-600">
                    {selectedEmploye.prenom[0]}{selectedEmploye.nom[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedEmploye.prenom} {selectedEmploye.nom}</h3>
                  <p className="text-slate-500">{selectedEmploye.poste}</p>
                  <Badge variant="outline" className="mt-1">{selectedEmploye.departement}</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Matricule</p>
                    <p className="font-mono">{selectedEmploye.matricule}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p>{selectedEmploye.email || '-'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Contrat</p>
                    <Badge>{selectedEmploye.typeContrat}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Date d'embauche</p>
                    <p>{formatDate(selectedEmploye.dateEmbauche)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Salaire</p>
                    <p className="font-bold text-emerald-600">{formatGNF(selectedEmploye.salaireBase)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEmploye ? 'Modifier l\'employé' : 'Nouvel employé'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Matricule</Label>
                <Input value={formData.matricule} onChange={(e) => setFormData({...formData, matricule: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Type de contrat</Label>
                <Select value={formData.typeContrat} onValueChange={(value) => setFormData({...formData, typeContrat: value as Employe['typeContrat']})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {typesContrat.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nom *</Label>
                <Input value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Prénom *</Label>
                <Input value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Téléphone</Label>
                <Input value={formData.telephone} onChange={(e) => setFormData({...formData, telephone: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Poste *</Label>
                <Input value={formData.poste} onChange={(e) => setFormData({...formData, poste: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Département</Label>
                <Select value={formData.departement} onValueChange={(value) => setFormData({...formData, departement: value})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {departements.map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Salaire de base (GNF) *</Label>
              <Input type="number" value={formData.salaireBase} onChange={(e) => setFormData({...formData, salaireBase: parseInt(e.target.value) || 0})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit}>
              {editingEmploye ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EmployesEnhancedPage;
