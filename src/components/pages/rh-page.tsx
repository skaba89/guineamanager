'use client';

import { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Calendar, Clock, Plane, BookOpen, Star, TrendingUp,
  Plus, Search, Edit2, Trash2, Eye, Check, X, AlertCircle, FileText,
  Briefcase, GraduationCap, Award, BarChart3, PieChart, Activity,
  ChevronRight, Download, Filter, MoreHorizontal, Send, Mail, Phone,
  Building2, MapPin, DollarSign, CalendarDays, Timer, CheckCircle2,
  XCircle, MinusCircle, Clock4, UserCheck, UserX, Ban
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
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF, formatDate } from '@/lib/mock-data';
import { Employe } from '@/types';
import { cn } from '@/lib/utils';

// Types
interface Conge {
  id: string;
  employeId: string;
  employe?: Employe;
  type: 'ANNUEL' | 'MALADIE' | 'MATERNITE' | 'PATERNITE' | 'SANS_SOLDE' | 'EXCEPTIONNEL';
  dateDebut: string;
  dateFin: string;
  nbJours: number;
  motif: string;
  statut: 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE' | 'ANNULE';
  dateDemande: string;
  dateValidation?: string;
  validateur?: string;
  commentaire?: string;
}

interface Presence {
  id: string;
  employeId: string;
  employe?: Employe;
  date: string;
  heureArrivee?: string;
  heureDepart?: string;
  statut: 'PRESENT' | 'ABSENT' | 'RETARD' | 'CONGE' | 'FERIE';
  heuresTravaillees: number;
  heuresSupplementaires: number;
  observations?: string;
}

interface Candidat {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
  departement: string;
  dateCandidature: string;
  statut: 'NOUVEAU' | 'EN_COURS' | 'ENTRETIEN' | 'RETENU' | 'REFUSE';
  source: string;
  cv?: string;
  lettreMotivation?: string;
  notes?: string;
  salaireSouhaite?: number;
  disponibilite: string;
}

interface Formation {
  id: string;
  titre: string;
  description: string;
  formateur: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  capacite: number;
  inscrits: number;
  statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  budget: number;
  participants?: Employe[];
}

interface Evaluation {
  id: string;
  employeId: string;
  employe?: Employe;
  evaluateur: string;
  dateEvaluation: string;
  periode: string;
  objectifs: { intitule: string; resultat: number; poids: number }[];
  competences: { nom: string; note: number }[];
  noteGlobale: number;
  commentaires: string;
  pointsForts: string;
  axesAmelioration: string;
  objectifsFuturs: string;
}

// Mock data generators
const generateConges = (employes: Employe[]): Conge[] => {
  const types: Conge['type'][] = ['ANNUEL', 'MALADIE', 'MATERNITE', 'PATERNITE', 'EXCEPTIONNEL'];
  const statuts: Conge['statut'][] = ['EN_ATTENTE', 'APPROUVE', 'REFUSE'];
  
  return employes.slice(0, 5).map((emp, i) => ({
    id: `conge_${i}`,
    employeId: emp.id,
    employe: emp,
    type: types[i % types.length],
    dateDebut: new Date(2024, 4 + i, 1).toISOString().split('T')[0],
    dateFin: new Date(2024, 4 + i, 5 + i).toISOString().split('T')[0],
    nbJours: 3 + i,
    motif: 'Congé personnel',
    statut: statuts[i % statuts.length],
    dateDemande: new Date(2024, 3 + i, 15).toISOString().split('T')[0],
  }));
};

const generatePresences = (employes: Employe[]): Presence[] => {
  const today = new Date().toISOString().split('T')[0];
  return employes.map((emp, i) => ({
    id: `pres_${i}`,
    employeId: emp.id,
    employe: emp,
    date: today,
    heureArrivee: i % 3 === 0 ? '08:35' : '08:00',
    heureDepart: i % 2 === 0 ? '17:00' : '17:30',
    statut: i % 5 === 0 ? 'RETARD' : 'PRESENT' as const,
    heuresTravaillees: 8,
    heuresSupplementaires: i % 3 === 0 ? 1 : 0,
  }));
};

const generateCandidats = (): Candidat[] => [
  { id: 'c1', nom: 'Diallo', prenom: 'Fatou', email: 'fatou.diallo@email.com', telephone: '622 00 00 01', poste: 'Comptable', departement: 'Finance', dateCandidature: '2024-04-15', statut: 'ENTRETIEN', source: 'LinkedIn', salaireSouhaite: 2500000, disponibilite: 'Immédiate' },
  { id: 'c2', nom: 'Camara', prenom: 'Mamadou', email: 'mamadou.camara@email.com', telephone: '622 00 00 02', poste: 'Commercial', departement: 'Commercial', dateCandidature: '2024-04-18', statut: 'EN_COURS', source: 'Site Web', salaireSouhaite: 2000000, disponibilite: '1 mois' },
  { id: 'c3', nom: 'Barry', prenom: 'Aissata', email: 'aissata.barry@email.com', telephone: '622 00 00 03', poste: 'Responsable RH', departement: 'Ressources Humaines', dateCandidature: '2024-04-20', statut: 'NOUVEAU', source: 'Recommandation', salaireSouhaite: 3500000, disponibilite: '2 semaines' },
  { id: 'c4', nom: 'Sow', prenom: 'Ibrahima', email: 'ibrahima.sow@email.com', telephone: '622 00 00 04', poste: 'Technicien', departement: 'Technique', dateCandidature: '2024-04-22', statut: 'RETENU', source: 'Annonce', salaireSouhaite: 1500000, disponibilite: 'Immédiate' },
];

const generateFormations = (): Formation[] => [
  { id: 'f1', titre: 'Excel Avancé', description: 'Formation Excel niveau avancé pour les services administratifs', formateur: 'M. Koné', dateDebut: '2024-05-15', dateFin: '2024-05-17', lieu: 'Salle de formation', capacite: 15, inscrits: 12, statut: 'PLANIFIEE', budget: 2500000 },
  { id: 'f2', titre: 'Management d\'équipe', description: 'Techniques de management et leadership', formateur: 'Mme Touré', dateDebut: '2024-05-20', dateFin: '2024-05-22', lieu: 'Hôtel Riviera', capacite: 10, inscrits: 8, statut: 'PLANIFIEE', budget: 5000000 },
  { id: 'f3', titre: 'Securité au travail', description: 'Formation obligatoire sécurité', formateur: 'M. Bah', dateDebut: '2024-04-10', dateFin: '2024-04-10', lieu: 'Entrepôt', capacite: 30, inscrits: 28, statut: 'TERMINEE', budget: 1000000 },
];

const generateEvaluations = (employes: Employe[]): Evaluation[] => 
  employes.slice(0, 3).map((emp, i) => ({
    id: `eval_${i}`,
    employeId: emp.id,
    employe: emp,
    evaluateur: 'Directeur',
    dateEvaluation: new Date(2024, 3, 15).toISOString().split('T')[0],
    periode: 'T1 2024',
    objectifs: [
      { intitule: 'Objectifs commerciaux', resultat: 85 + i * 5, poids: 40 },
      { intitule: 'Gestion de projet', resultat: 75 + i * 10, poids: 30 },
      { intitule: 'Travail en équipe', resultat: 90, poids: 30 },
    ],
    competences: [
      { nom: 'Communication', note: 4 + i * 0.2 },
      { nom: 'Leadership', note: 3.5 + i * 0.3 },
      { nom: 'Expertise technique', note: 4.2 + i * 0.1 },
    ],
    noteGlobale: 4 + i * 0.2,
    commentaires: 'Bonne performance générale',
    pointsForts: 'Rigueur, ponctualité',
    axesAmelioration: 'Développement des compétences en management',
    objectifsFuturs: 'Former 2 collaborateurs, améliorer les processus',
  }));

// Constants
const typesConge: { value: Conge['type']; label: string; color: string }[] = [
  { value: 'ANNUEL', label: 'Congé annuel', color: 'bg-blue-100 text-blue-700' },
  { value: 'MALADIE', label: 'Maladie', color: 'bg-red-100 text-red-700' },
  { value: 'MATERNITE', label: 'Maternité', color: 'bg-pink-100 text-pink-700' },
  { value: 'PATERNITE', label: 'Paternité', color: 'bg-purple-100 text-purple-700' },
  { value: 'SANS_SOLDE', label: 'Sans solde', color: 'bg-gray-100 text-gray-700' },
  { value: 'EXCEPTIONNEL', label: 'Exceptionnel', color: 'bg-amber-100 text-amber-700' },
];

const statutsConge: { value: Conge['statut']; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'EN_ATTENTE', label: 'En attente', icon: Clock4, color: 'bg-amber-100 text-amber-700' },
  { value: 'APPROUVE', label: 'Approuvé', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'REFUSE', label: 'Refusé', icon: XCircle, color: 'bg-red-100 text-red-700' },
  { value: 'ANNULE', label: 'Annulé', icon: Ban, color: 'bg-gray-100 text-gray-700' },
];

const statutsPresence: { value: Presence['statut']; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'PRESENT', label: 'Présent', icon: UserCheck, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'ABSENT', label: 'Absent', icon: UserX, color: 'bg-red-100 text-red-700' },
  { value: 'RETARD', label: 'Retard', icon: Clock, color: 'bg-amber-100 text-amber-700' },
  { value: 'CONGE', label: 'Congé', icon: Plane, color: 'bg-blue-100 text-blue-700' },
  { value: 'FERIE', label: 'Férié', icon: Calendar, color: 'bg-purple-100 text-purple-700' },
];

const statutsCandidat: { value: Candidat['statut']; label: string; color: string }[] = [
  { value: 'NOUVEAU', label: 'Nouveau', color: 'bg-blue-100 text-blue-700' },
  { value: 'EN_COURS', label: 'En cours', color: 'bg-amber-100 text-amber-700' },
  { value: 'ENTRETIEN', label: 'Entretien', color: 'bg-purple-100 text-purple-700' },
  { value: 'RETENU', label: 'Retenu', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'REFUSE', label: 'Refusé', color: 'bg-red-100 text-red-700' },
];

const departements = [
  'Administration', 'Commercial', 'Finance', 'Logistique',
  'Marketing', 'Ressources Humaines', 'Technique', 'Direction'
];

export function RHPage() {
  const { employes } = useAppStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  
  // Data states
  const [conges, setConges] = useState<Conge[]>([]);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [candidats, setCandidats] = useState<Candidat[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  
  // Dialog states
  const [isCongeDialogOpen, setIsCongeDialogOpen] = useState(false);
  const [isPresenceDialogOpen, setIsPresenceDialogOpen] = useState(false);
  const [isCandidatDialogOpen, setIsCandidatDialogOpen] = useState(false);
  const [isFormationDialogOpen, setIsFormationDialogOpen] = useState(false);
  const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Form states
  const [congeForm, setCongeForm] = useState<Partial<Conge>>({});
  const [presenceForm, setPresenceForm] = useState<Partial<Presence>>({});
  const [candidatForm, setCandidatForm] = useState<Partial<Candidat>>({});
  const [formationForm, setFormationForm] = useState<Partial<Formation>>({});

  // Initialize data
  useEffect(() => {
    if (employes.length > 0) {
      setConges(generateConges(employes));
      setPresences(generatePresences(employes));
      setCandidats(generateCandidats());
      setFormations(generateFormations());
      setEvaluations(generateEvaluations(employes));
    }
  }, [employes]);

  // Stats calculations
  const stats = {
    totalEmployes: employes.length,
    employesActifs: employes.filter(e => e.actif).length,
    congesEnAttente: conges.filter(c => c.statut === 'EN_ATTENTE').length,
    congesApprouves: conges.filter(c => c.statut === 'APPROUVE').length,
    presencesJour: presences.filter(p => p.statut === 'PRESENT').length,
    retardsJour: presences.filter(p => p.statut === 'RETARD').length,
    candidatsActifs: candidats.filter(c => c.statut !== 'REFUSE' && c.statut !== 'RETENU').length,
    formationsPlanifiees: formations.filter(f => f.statut === 'PLANIFIEE').length,
    evaluationsRecentes: evaluations.length,
    tauxPresence: presences.length > 0 ? Math.round((presences.filter(p => p.statut === 'PRESENT').length / presences.length) * 100) : 0,
  };

  // Conge handlers
  const handleAddConge = () => {
    const employe = employes.find(e => e.id === congeForm.employeId);
    const newConge: Conge = {
      id: `conge_${Date.now()}`,
      employeId: congeForm.employeId || '',
      employe,
      type: congeForm.type || 'ANNUEL',
      dateDebut: congeForm.dateDebut || '',
      dateFin: congeForm.dateFin || '',
      nbJours: congeForm.nbJours || 0,
      motif: congeForm.motif || '',
      statut: 'EN_ATTENTE',
      dateDemande: new Date().toISOString().split('T')[0],
    };
    setConges([...conges, newConge]);
    setIsCongeDialogOpen(false);
    setCongeForm({});
  };

  const handleValidateConge = (congeId: string, approved: boolean) => {
    setConges(conges.map(c => 
      c.id === congeId ? { 
        ...c, 
        statut: approved ? 'APPROUVE' : 'REFUSE',
        dateValidation: new Date().toISOString().split('T')[0]
      } : c
    ));
  };

  // Presence handlers
  const handleAddPresence = () => {
    const employe = employes.find(e => e.id === presenceForm.employeId);
    const newPresence: Presence = {
      id: `pres_${Date.now()}`,
      employeId: presenceForm.employeId || '',
      employe,
      date: presenceForm.date || new Date().toISOString().split('T')[0],
      heureArrivee: presenceForm.heureArrivee,
      heureDepart: presenceForm.heureDepart,
      statut: presenceForm.statut || 'PRESENT',
      heuresTravaillees: presenceForm.heuresTravaillees || 8,
      heuresSupplementaires: presenceForm.heuresSupplementaires || 0,
      observations: presenceForm.observations,
    };
    setPresences([...presences, newPresence]);
    setIsPresenceDialogOpen(false);
    setPresenceForm({});
  };

  // Candidat handlers
  const handleAddCandidat = () => {
    const newCandidat: Candidat = {
      id: `cand_${Date.now()}`,
      nom: candidatForm.nom || '',
      prenom: candidatForm.prenom || '',
      email: candidatForm.email || '',
      telephone: candidatForm.telephone || '',
      poste: candidatForm.poste || '',
      departement: candidatForm.departement || '',
      dateCandidature: new Date().toISOString().split('T')[0],
      statut: 'NOUVEAU',
      source: candidatForm.source || '',
      salaireSouhaite: candidatForm.salaireSouhaite,
      disponibilite: candidatForm.disponibilite || '',
    };
    setCandidats([...candidats, newCandidat]);
    setIsCandidatDialogOpen(false);
    setCandidatForm({});
  };

  const handleUpdateCandidatStatus = (candidatId: string, statut: Candidat['statut']) => {
    setCandidats(candidats.map(c => c.id === candidatId ? { ...c, statut } : c));
  };

  // Formation handlers
  const handleAddFormation = () => {
    const newFormation: Formation = {
      id: `form_${Date.now()}`,
      titre: formationForm.titre || '',
      description: formationForm.description || '',
      formateur: formationForm.formateur || '',
      dateDebut: formationForm.dateDebut || '',
      dateFin: formationForm.dateFin || '',
      lieu: formationForm.lieu || '',
      capacite: formationForm.capacite || 10,
      inscrits: 0,
      statut: 'PLANIFIEE',
      budget: formationForm.budget || 0,
    };
    setFormations([...formations, newFormation]);
    setIsFormationDialogOpen(false);
    setFormationForm({});
  };

  // Get statut badge helper
  const getCongeStatutBadge = (statut: Conge['statut']) => {
    const config = statutsConge.find(s => s.value === statut);
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPresenceStatutBadge = (statut: Presence['statut']) => {
    const config = statutsPresence.find(s => s.value === statut);
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getCandidatStatutBadge = (statut: Candidat['statut']) => {
    const config = statutsCandidat.find(s => s.value === statut);
    return config ? <Badge className={config.color}>{config.label}</Badge> : null;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestion des Ressources Humaines</h1>
          <p className="text-slate-500">Gérez vos employés, congés, présences et recrutements</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Tableau de bord</span>
          </TabsTrigger>
          <TabsTrigger value="conges" className="flex items-center gap-2">
            <Plane className="w-4 h-4" />
            <span className="hidden sm:inline">Congés</span>
          </TabsTrigger>
          <TabsTrigger value="presences" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Présences</span>
          </TabsTrigger>
          <TabsTrigger value="recrutement" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Recrutement</span>
          </TabsTrigger>
          <TabsTrigger value="formations" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Formations</span>
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Évaluations</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="overflow-hidden">
              <div className="h-1 bg-blue-500" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 rounded-xl">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Employés actifs</p>
                    <p className="text-2xl font-bold">{stats.employesActifs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-1 bg-amber-500" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 rounded-xl">
                    <Plane className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Congés en attente</p>
                    <p className="text-2xl font-bold">{stats.congesEnAttente}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-1 bg-emerald-500" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 rounded-xl">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Taux présence</p>
                    <p className="text-2xl font-bold">{stats.tauxPresence}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-1 bg-purple-500" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 rounded-xl">
                    <UserPlus className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Candidatures</p>
                    <p className="text-2xl font-bold">{stats.candidatsActifs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Presence Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  Présences du jour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statutsPresence.slice(0, 3).map((statut) => {
                    const count = presences.filter(p => p.statut === statut.value).length;
                    const percentage = presences.length > 0 ? (count / presences.length) * 100 : 0;
                    return (
                      <div key={statut.value} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <statut.icon className="w-4 h-4" />
                            {statut.label}
                          </span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Conges by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-500" />
                  Demandes de congés par type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {typesConge.slice(0, 4).map((type) => {
                    const count = conges.filter(c => c.type === type.value).length;
                    const percentage = conges.length > 0 ? (count / conges.length) * 100 : 0;
                    return (
                      <div key={type.value} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{type.label}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Conges */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Demandes de congés en attente</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('conges')}>
                  Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conges.filter(c => c.statut === 'EN_ATTENTE').slice(0, 3).map((conge) => (
                    <div key={conge.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-emerald-600">
                            {conge.employe?.prenom[0]}{conge.employe?.nom[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{conge.employe?.prenom} {conge.employe?.nom}</p>
                          <p className="text-xs text-slate-500">{conge.nbJours} jours - {typesConge.find(t => t.value === conge.type)?.label}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-emerald-600 hover:bg-emerald-50" onClick={() => handleValidateConge(conge.id, true)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleValidateConge(conge.id, false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {conges.filter(c => c.statut === 'EN_ATTENTE').length === 0 && (
                    <p className="text-center text-slate-500 py-4">Aucune demande en attente</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Candidates */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Nouvelles candidatures</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('recrutement')}>
                  Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {candidats.filter(c => c.statut === 'NOUVEAU' || c.statut === 'EN_COURS').slice(0, 3).map((candidat) => (
                    <div key={candidat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-purple-600">
                            {candidat.prenom[0]}{candidat.nom[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{candidat.prenom} {candidat.nom}</p>
                          <p className="text-xs text-slate-500">{candidat.poste}</p>
                        </div>
                      </div>
                      {getCandidatStatutBadge(candidat.statut)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conges Tab */}
        <TabsContent value="conges" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Gestion des congés et absences</h2>
              <p className="text-sm text-slate-500">Gérez les demandes de congés de vos employés</p>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsCongeDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle demande
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock4 className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">En attente</p>
                    <p className="text-xl font-bold">{stats.congesEnAttente}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Approuvés</p>
                    <p className="text-xl font-bold">{stats.congesApprouves}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CalendarDays className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total demandes</p>
                    <p className="text-xl font-bold">{conges.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Jours demandés</p>
                    <p className="text-xl font-bold">{conges.reduce((acc, c) => acc + c.nbJours, 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conges Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead className="text-center">Jours</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conges.map((conge) => (
                    <TableRow key={conge.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-emerald-600">
                              {conge.employe?.prenom[0]}{conge.employe?.nom[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{conge.employe?.prenom} {conge.employe?.nom}</p>
                            <p className="text-xs text-slate-500">{conge.employe?.poste}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={typesConge.find(t => t.value === conge.type)?.color}>
                          {typesConge.find(t => t.value === conge.type)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(conge.dateDebut)}</p>
                          <p className="text-slate-500">au {formatDate(conge.dateFin)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{conge.nbJours}</TableCell>
                      <TableCell className="text-center">{getCongeStatutBadge(conge.statut)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {conge.statut === 'EN_ATTENTE' && (
                            <>
                              <Button size="sm" variant="ghost" className="text-emerald-600 hover:bg-emerald-50" onClick={() => handleValidateConge(conge.id, true)}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleValidateConge(conge.id, false)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedItem(conge); setIsViewDialogOpen(true); }}>
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

        {/* Presences Tab */}
        <TabsContent value="presences" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Suivi des présences</h2>
              <p className="text-sm text-slate-500">Enregistrez et suivez les présences de vos employés</p>
            </div>
            <div className="flex gap-2">
              <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-40" />
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsPresenceDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {statutsPresence.map((statut) => {
              const count = presences.filter(p => p.statut === statut.value).length;
              const Icon = statut.icon;
              return (
                <Card key={statut.value}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', statut.color.split(' ')[0])}>
                        <Icon className={cn('w-5 h-5', statut.color.split(' ')[1])} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">{statut.label}</p>
                        <p className="text-xl font-bold">{count}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Presences Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead>Arrivée</TableHead>
                    <TableHead>Départ</TableHead>
                    <TableHead className="text-center">Heures</TableHead>
                    <TableHead className="text-center">HS</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presences.map((presence) => (
                    <TableRow key={presence.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-emerald-600">
                              {presence.employe?.prenom[0]}{presence.employe?.nom[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{presence.employe?.prenom} {presence.employe?.nom}</p>
                            <p className="text-xs text-slate-500">{presence.employe?.poste}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          presence.statut === 'RETARD' && 'text-amber-600 font-medium'
                        )}>
                          {presence.heureArrivee || '-'}
                        </span>
                      </TableCell>
                      <TableCell>{presence.heureDepart || '-'}</TableCell>
                      <TableCell className="text-center">{presence.heuresTravaillees}h</TableCell>
                      <TableCell className="text-center">
                        {presence.heuresSupplementaires > 0 ? (
                          <Badge variant="secondary">{presence.heuresSupplementaires}h</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">{getPresenceStatutBadge(presence.statut)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recrutement Tab */}
        <TabsContent value="recrutement" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Gestion du recrutement</h2>
              <p className="text-sm text-slate-500">Suivez les candidatures et le processus de recrutement</p>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsCandidatDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle candidature
            </Button>
          </div>

          {/* Pipeline Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {statutsCandidat.map((statut) => {
              const count = candidats.filter(c => c.statut === statut.value).length;
              return (
                <Card key={statut.value}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">{statut.label}</p>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                      <Badge className={statut.color}>{count}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Candidats Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidat</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Prétention salariale</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidats.map((candidat) => (
                    <TableRow key={candidat.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600">
                              {candidat.prenom[0]}{candidat.nom[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{candidat.prenom} {candidat.nom}</p>
                            <p className="text-xs text-slate-500">Disponible: {candidat.disponibilite}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{candidat.poste}</p>
                          <p className="text-xs text-slate-500">{candidat.departement}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {candidat.email}</p>
                          <p className="flex items-center gap-1 text-slate-500"><Phone className="w-3 h-3" /> {candidat.telephone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{candidat.source}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {candidat.salaireSouhaite ? formatGNF(candidat.salaireSouhaite) : '-'}
                      </TableCell>
                      <TableCell className="text-center">{getCandidatStatutBadge(candidat.statut)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Select value={candidat.statut} onValueChange={(value) => handleUpdateCandidatStatus(candidat.id, value as Candidat['statut'])}>
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statutsCandidat.map(s => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedItem(candidat); setIsViewDialogOpen(true); }}>
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

        {/* Formations Tab */}
        <TabsContent value="formations" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Gestion des formations</h2>
              <p className="text-sm text-slate-500">Planifiez et suivez les formations de vos employés</p>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsFormationDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle formation
            </Button>
          </div>

          {/* Formation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formations.map((formation) => (
              <Card key={formation.id} className="overflow-hidden">
                <div className={cn(
                  'h-2',
                  formation.statut === 'PLANIFIEE' ? 'bg-blue-500' :
                  formation.statut === 'EN_COURS' ? 'bg-amber-500' :
                  formation.statut === 'TERMINEE' ? 'bg-emerald-500' : 'bg-red-500'
                )} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{formation.titre}</CardTitle>
                    <Badge variant={formation.statut === 'TERMINEE' ? 'default' : 'secondary'}>
                      {formation.statut}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{formation.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <UserPlus className="w-4 h-4" />
                    <span>{formation.formateur}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(formation.dateDebut)} - {formatDate(formation.dateFin)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4" />
                    <span>{formation.lieu}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>{formation.inscrits}/{formation.capacite} inscrits</span>
                    </div>
                    <div className="text-sm font-medium text-emerald-600">
                      {formatGNF(formation.budget)}
                    </div>
                  </div>
                  <Progress value={(formation.inscrits / formation.capacite) * 100} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Evaluations Tab */}
        <TabsContent value="evaluations" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Évaluations et performances</h2>
              <p className="text-sm text-slate-500">Gérez les évaluations annuelles de vos employés</p>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsEvaluationDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle évaluation
            </Button>
          </div>

          {/* Evaluation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {evaluations.map((evaluation) => (
              <Card key={evaluation.id} className="overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-emerald-500 to-blue-500" />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-emerald-600">
                          {evaluation.employe?.prenom[0]}{evaluation.employe?.nom[0]}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-base">{evaluation.employe?.prenom} {evaluation.employe?.nom}</CardTitle>
                        <p className="text-xs text-slate-500">{evaluation.periode}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Note globale */}
                  <div className="flex items-center justify-center py-3 bg-slate-50 rounded-lg">
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'w-6 h-6',
                              star <= Math.round(evaluation.noteGlobale)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-300'
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-2xl font-bold mt-1">{evaluation.noteGlobale.toFixed(1)}/5</p>
                    </div>
                  </div>

                  {/* Competences */}
                  <div className="space-y-2">
                    {evaluation.competences.slice(0, 3).map((comp, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{comp.nom}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={comp.note * 20} className="w-16 h-2" />
                          <span className="font-medium w-8">{comp.note.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t text-sm">
                    <p className="text-slate-600 line-clamp-2">{evaluation.commentaires}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedItem(evaluation); setIsViewDialogOpen(true); }}>
                      <Eye className="w-4 h-4 mr-1" />
                      Détails
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit2 className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: Nouvelle demande de congé */}
      <Dialog open={isCongeDialogOpen} onOpenChange={setIsCongeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle demande de congé</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Employé *</Label>
              <Select value={congeForm.employeId} onValueChange={(value) => setCongeForm({...congeForm, employeId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employes.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type de congé *</Label>
                <Select value={congeForm.type} onValueChange={(value) => setCongeForm({...congeForm, type: value as Conge['type']})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typesConge.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Nombre de jours</Label>
                <Input type="number" value={congeForm.nbJours || ''} onChange={(e) => setCongeForm({...congeForm, nbJours: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date de début *</Label>
                <Input type="date" value={congeForm.dateDebut || ''} onChange={(e) => setCongeForm({...congeForm, dateDebut: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Date de fin *</Label>
                <Input type="date" value={congeForm.dateFin || ''} onChange={(e) => setCongeForm({...congeForm, dateFin: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Motif</Label>
              <Textarea value={congeForm.motif || ''} onChange={(e) => setCongeForm({...congeForm, motif: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCongeDialogOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddConge}>Créer la demande</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Enregistrer présence */}
      <Dialog open={isPresenceDialogOpen} onOpenChange={setIsPresenceDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enregistrer une présence</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Employé *</Label>
              <Select value={presenceForm.employeId} onValueChange={(value) => setPresenceForm({...presenceForm, employeId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employes.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" value={presenceForm.date || new Date().toISOString().split('T')[0]} onChange={(e) => setPresenceForm({...presenceForm, date: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Statut</Label>
                <Select value={presenceForm.statut} onValueChange={(value) => setPresenceForm({...presenceForm, statut: value as Presence['statut']})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {statutsPresence.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Heure d'arrivée</Label>
                <Input type="time" value={presenceForm.heureArrivee || ''} onChange={(e) => setPresenceForm({...presenceForm, heureArrivee: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Heure de départ</Label>
                <Input type="time" value={presenceForm.heureDepart || ''} onChange={(e) => setPresenceForm({...presenceForm, heureDepart: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Heures travaillées</Label>
                <Input type="number" value={presenceForm.heuresTravaillees || 8} onChange={(e) => setPresenceForm({...presenceForm, heuresTravaillees: parseInt(e.target.value)})} />
              </div>
              <div className="grid gap-2">
                <Label>Heures supplémentaires</Label>
                <Input type="number" value={presenceForm.heuresSupplementaires || 0} onChange={(e) => setPresenceForm({...presenceForm, heuresSupplementaires: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Observations</Label>
              <Textarea value={presenceForm.observations || ''} onChange={(e) => setPresenceForm({...presenceForm, observations: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPresenceDialogOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddPresence}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nouvelle candidature */}
      <Dialog open={isCandidatDialogOpen} onOpenChange={setIsCandidatDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle candidature</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nom *</Label>
                <Input value={candidatForm.nom || ''} onChange={(e) => setCandidatForm({...candidatForm, nom: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Prénom *</Label>
                <Input value={candidatForm.prenom || ''} onChange={(e) => setCandidatForm({...candidatForm, prenom: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Email *</Label>
                <Input type="email" value={candidatForm.email || ''} onChange={(e) => setCandidatForm({...candidatForm, email: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Téléphone *</Label>
                <Input value={candidatForm.telephone || ''} onChange={(e) => setCandidatForm({...candidatForm, telephone: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Poste souhaité *</Label>
                <Input value={candidatForm.poste || ''} onChange={(e) => setCandidatForm({...candidatForm, poste: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Département</Label>
                <Select value={candidatForm.departement} onValueChange={(value) => setCandidatForm({...candidatForm, departement: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {departements.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Source</Label>
                <Select value={candidatForm.source} onValueChange={(value) => setCandidatForm({...candidatForm, source: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Site Web">Site Web</SelectItem>
                    <SelectItem value="Recommandation">Recommandation</SelectItem>
                    <SelectItem value="Annonce">Annonce</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Disponibilité</Label>
                <Select value={candidatForm.disponibilite} onValueChange={(value) => setCandidatForm({...candidatForm, disponibilite: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Disponibilité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Immédiate">Immédiate</SelectItem>
                    <SelectItem value="2 semaines">2 semaines</SelectItem>
                    <SelectItem value="1 mois">1 mois</SelectItem>
                    <SelectItem value="3 mois">3 mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Prétention salariale (GNF)</Label>
              <Input type="number" value={candidatForm.salaireSouhaite || ''} onChange={(e) => setCandidatForm({...candidatForm, salaireSouhaite: parseInt(e.target.value)})} />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={candidatForm.notes || ''} onChange={(e) => setCandidatForm({...candidatForm, notes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCandidatDialogOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddCandidat}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nouvelle formation */}
      <Dialog open={isFormationDialogOpen} onOpenChange={setIsFormationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Planifier une formation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Titre *</Label>
              <Input value={formationForm.titre || ''} onChange={(e) => setFormationForm({...formationForm, titre: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={formationForm.description || ''} onChange={(e) => setFormationForm({...formationForm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Formateur *</Label>
                <Input value={formationForm.formateur || ''} onChange={(e) => setFormationForm({...formationForm, formateur: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Lieu *</Label>
                <Input value={formationForm.lieu || ''} onChange={(e) => setFormationForm({...formationForm, lieu: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date de début *</Label>
                <Input type="date" value={formationForm.dateDebut || ''} onChange={(e) => setFormationForm({...formationForm, dateDebut: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Date de fin *</Label>
                <Input type="date" value={formationForm.dateFin || ''} onChange={(e) => setFormationForm({...formationForm, dateFin: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Capacité max</Label>
                <Input type="number" value={formationForm.capacite || 10} onChange={(e) => setFormationForm({...formationForm, capacite: parseInt(e.target.value)})} />
              </div>
              <div className="grid gap-2">
                <Label>Budget (GNF)</Label>
                <Input type="number" value={formationForm.budget || ''} onChange={(e) => setFormationForm({...formationForm, budget: parseInt(e.target.value)})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormationDialogOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddFormation}>Planifier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: View details */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <pre className="text-sm bg-slate-50 p-4 rounded-lg overflow-auto max-h-96">
                {JSON.stringify(selectedItem, null, 2)}
              </pre>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RHPage;
