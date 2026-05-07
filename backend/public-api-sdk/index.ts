/**
 * GuinéaManager SDK - Client JavaScript/TypeScript pour l'API publique
 * 
 * @package @guineamanager/sdk
 * @version 1.0.0
 * @description SDK officiel pour intégrer vos applications avec GuinéaManager ERP
 * 
 * @example
 * ```typescript
 * import { GuineamanagerClient } from '@guineamanager/sdk';
 * 
 * const client = new GuineamanagerClient({
 *   apiKey: 'gm_live_xxxxx',
 *   baseUrl: 'https://api.guineamanager.com'
 * });
 * 
 * // Récupérer les factures
 * const invoices = await client.invoices.list();
 * 
 * // Créer une facture
 * const invoice = await client.invoices.create({
 *   clientId: 'client_123',
 *   lignes: [{ quantite: 2, prixUnitaire: 50000, description: 'Service' }]
 * });
 * ```
 */

// Types
export interface GuineamanagerConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Invoice {
  id: string;
  numero: string;
  clientId: string;
  client?: Client;
  montantHT: number;
  tva: number;
  montantTTC: number;
  montantPaye: number;
  statut: string;
  echeance?: Date;
  notes?: string;
  lignes?: InvoiceLine[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLine {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
  produitId?: string;
}

export interface Client {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  createdAt: Date;
}

export interface Product {
  id: string;
  nom: string;
  reference: string;
  description?: string;
  prixUnitaire: number;
  categorie?: string;
  stockActuel: number;
  stockMin: number;
  unite?: string;
  actif: boolean;
}

export interface Payment {
  id: string;
  operateur: 'ORANGE' | 'MTN' | 'WAVE' | 'CELLCOM';
  montant: number;
  telephone: string;
  transactionId?: string;
  statut: 'EN_ATTENTE' | 'SUCCES' | 'ECHEC';
  createdAt: Date;
}

export interface CreateInvoiceParams {
  clientId: string;
  lignes: Array<{
    quantite: number;
    prixUnitaire: number;
    description: string;
    produitId?: string;
  }>;
  echeance?: Date;
  notes?: string;
}

export interface CreateClientParams {
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
}

// HTTP Client
class HttpClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;
  private retries: number;

  constructor(config: GuineamanagerConfig) {
    this.baseUrl = config.baseUrl || 'https://api.guineamanager.com';
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
  }

  async request<T>(
    method: string,
    path: string,
    params?: Record<string, any>,
    data?: any
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/api/public${path}`);
    
    // Ajouter les paramètres de query
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url.toString(), {
          method,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'GuineamanagerSDK/1.0.0',
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new GuineamanagerError(
            errorData.error || `HTTP ${response.status}`,
            response.status,
            errorData
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        
        // Ne pas retry sur les erreurs d'auth
        if (error instanceof GuineamanagerError && error.status === 401) {
          throw error;
        }
        
        // Retry sur erreurs réseau ou 5xx
        if (attempt < this.retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  get<T>(path: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>('GET', path, params);
  }

  post<T>(path: string, data: any): Promise<T> {
    return this.request<T>('POST', path, undefined, data);
  }

  put<T>(path: string, data: any): Promise<T> {
    return this.request<T>('PUT', path, undefined, data);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

// Custom Error
export class GuineamanagerError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'GuineamanagerError';
    this.status = status;
    this.data = data;
  }
}

// Resources
class InvoicesResource {
  constructor(private http: HttpClient) {}

  /**
   * Liste des factures
   */
  async list(params?: PaginationParams & {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Invoice>> {
    return this.http.get<PaginatedResponse<Invoice>>('/v1/invoices', params);
  }

  /**
   * Récupérer une facture par ID
   */
  async get(id: string): Promise<{ success: boolean; data: Invoice }> {
    return this.http.get<{ success: boolean; data: Invoice }>(`/v1/invoices/${id}`);
  }

  /**
   * Créer une nouvelle facture
   */
  async create(params: CreateInvoiceParams): Promise<{ success: boolean; data: Invoice }> {
    return this.http.post<{ success: boolean; data: Invoice }>('/v1/invoices', params);
  }
}

class ClientsResource {
  constructor(private http: HttpClient) {}

  /**
   * Liste des clients
   */
  async list(params?: PaginationParams & { search?: string }): Promise<PaginatedResponse<Client>> {
    return this.http.get<PaginatedResponse<Client>>('/v1/clients', params);
  }

  /**
   * Créer un client
   */
  async create(params: CreateClientParams): Promise<{ success: boolean; data: Client }> {
    return this.http.post<{ success: boolean; data: Client }>('/v1/clients', params);
  }
}

class ProductsResource {
  constructor(private http: HttpClient) {}

  /**
   * Liste des produits
   */
  async list(params?: PaginationParams & {
    categorie?: string;
    search?: string;
  }): Promise<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>('/v1/products', params);
  }
}

class PaymentsResource {
  constructor(private http: HttpClient) {}

  /**
   * Liste des transactions
   */
  async list(params?: PaginationParams & {
    status?: string;
    operateur?: string;
  }): Promise<PaginatedResponse<Payment>> {
    return this.http.get<PaginatedResponse<Payment>>('/v1/payments', params);
  }
}

// Main Client
export class GuineamanagerClient {
  private http: HttpClient;
  
  public invoices: InvoicesResource;
  public clients: ClientsResource;
  public products: ProductsResource;
  public payments: PaymentsResource;

  constructor(config: GuineamanagerConfig) {
    this.http = new HttpClient(config);
    
    this.invoices = new InvoicesResource(this.http);
    this.clients = new ClientsResource(this.http);
    this.products = new ProductsResource(this.http);
    this.payments = new PaymentsResource(this.http);
  }

  /**
   * Vérifier la connexion à l'API
   */
  async ping(): Promise<{ status: string; timestamp: string }> {
    return this.http.get('/health');
  }

  /**
   * Obtenir les informations sur l'API
   */
  async info(): Promise<{
    name: string;
    version: string;
    description: string;
    documentation: string;
  }> {
    return this.http.get('/info');
  }
}

// Export par défaut
export default GuineamanagerClient;

// Export pour Node.js CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GuineamanagerClient,
    GuineamanagerError,
  };
}
