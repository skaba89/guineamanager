/**
 * GuinéaManager Mobile - Types
 */

// Client
export interface Client {
  id: string;
  nom: string;
  email?: string;
  telephone: string;
  adresse?: string;
  statut: 'ACTIF' | 'INACTIF';
  totalAchats: number;
  derniereVisite?: string;
}

// Produit
export interface Produit {
  id: string;
  nom: string;
  reference: string;
  prixUnitaire: number;
  stock: number;
  categorie?: string;
  image?: string;
}

// Facture
export interface Facture {
  id: string;
  numero: string;
  clientId: string;
  clientNom: string;
  date: string;
  echeance: string;
  totalHt: number;
  totalTtc: number;
  statut: 'BROUILLON' | 'ENVOYEE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';
  lignes: LigneFacture[];
}

export interface LigneFacture {
  id: string;
  produitId: string;
  produitNom: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
}

// Transaction Mobile Money
export interface TransactionMobile {
  id: string;
  type: 'RECU' | 'ENVOYE' | 'RETRAIT' | 'DEPOT';
  operateur: 'ORANGE' | 'MTN' | 'WAVE';
  montant: number;
  frais: number;
  reference: string;
  statut: 'EN_ATTENTE' | 'CONFIRME' | 'ECHOUE';
  date: string;
  expediteur?: string;
  destinataire?: string;
  motif?: string;
}

// Dashboard Stats
export interface DashboardStats {
  chiffreAffairesJour: number;
  chiffreAffairesMois: number;
  facturesImpayees: number;
  clientsActifs: number;
  transactionsJour: number;
  soldeOrange: number;
  soldeMTN: number;
  soldeWave: number;
}

// QR Code
export interface QRCodeData {
  type: 'PAYMENT' | 'INVOICE' | 'CLIENT';
  merchantId: string;
  amount?: number;
  invoiceId?: string;
  clientId?: string;
  reference: string;
  expiresAt: string;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
