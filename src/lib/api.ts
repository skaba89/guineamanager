// API Client for GuinéaManager Backend

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

class ApiClient {
  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('guineamanager-token');
    }
    return null;
  }

  setToken(token: string | null) {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('guineamanager-token', token);
      } else {
        localStorage.removeItem('guineamanager-token');
      }
    }
  }

  logout() {
    this.setToken(null);
  }

  getToken(): string | null {
    return this.getStoredToken();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getStoredToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const url = `/api${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {
          success: false,
          message: 'Erreur de connexion au serveur',
        };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Erreur serveur',
          errors: data.errors,
        };
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        message: 'Erreur de connexion au serveur',
      };
    }
  }

  // ============ AUTH ============
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(data: { email: string; password: string; nom: string; prenom: string; companyName: string }) {
    const response = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async getMe() {
    return this.request<{ id: string; email: string; nom: string; prenom: string; role: string; company: any }>('/auth/me');
  }

  // ============ HEALTH ============
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // ============ CLIENTS ============
  async getClients(params?: { search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request<any[]>(`/clients?${query.toString()}`);
  }

  async createClient(data: any) {
    return this.request<any>('/clients', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateClient(id: string, data: any) {
    return this.request<any>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteClient(id: string) {
    return this.request(`/clients/${id}`, { method: 'DELETE' });
  }

  // ============ PRODUITS ============
  async getProduits(params?: { search?: string; categorie?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.categorie) query.set('categorie', params.categorie);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request<any[]>(`/produits?${query.toString()}`);
  }

  async createProduit(data: any) {
    return this.request<any>('/produits', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateProduit(id: string, data: any) {
    return this.request<any>(`/produits/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteProduit(id: string) {
    return this.request(`/produits/${id}`, { method: 'DELETE' });
  }

  // ============ FACTURES ============
  async getFactures(params?: { statut?: string; clientId?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.statut) query.set('statut', params.statut);
    if (params?.clientId) query.set('clientId', params.clientId);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request<any[]>(`/factures?${query.toString()}`);
  }

  async createFacture(data: any) {
    return this.request<any>('/factures', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateFactureStatut(id: string, statut: string) {
    return this.request<any>(`/factures/${id}/statut`, { method: 'PUT', body: JSON.stringify({ statut }) });
  }

  async deleteFacture(id: string) {
    return this.request(`/factures/${id}`, { method: 'DELETE' });
  }

  // ============ EMPLOYES ============
  async getEmployes(params?: { departement?: string; search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.departement) query.set('departement', params.departement);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request<any[]>(`/employes?${query.toString()}`);
  }

  async createEmploye(data: any) {
    return this.request<any>('/employes', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateEmploye(id: string, data: any) {
    return this.request<any>(`/employes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteEmploye(id: string) {
    return this.request(`/employes/${id}`, { method: 'DELETE' });
  }

  // ============ PAIE ============
  async getBulletins(params?: { mois?: number; annee?: number; employeId?: string }) {
    const query = new URLSearchParams();
    if (params?.mois) query.set('mois', params.mois.toString());
    if (params?.annee) query.set('annee', params.annee.toString());
    if (params?.employeId) query.set('employeId', params.employeId);
    return this.request<any[]>(`/paie/bulletins?${query.toString()}`);
  }

  async calculerPaie(data: any) {
    return this.request<any>('/paie/calculer', { method: 'POST', body: JSON.stringify(data) });
  }

  async createBulletin(data: any) {
    return this.request<any>('/paie/bulletins', { method: 'POST', body: JSON.stringify(data) });
  }

  async validerBulletin(id: string) {
    return this.request<any>(`/paie/bulletins/${id}/valider`, { method: 'PUT' });
  }

  async payerBulletin(id: string) {
    return this.request<any>(`/paie/bulletins/${id}/payer`, { method: 'PUT' });
  }

  // ============ DEPENSES ============
  async getDepenses(params?: { categorie?: string; mois?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.categorie) query.set('categorie', params.categorie);
    if (params?.mois) query.set('mois', params.mois);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request<any[]>(`/depenses?${query.toString()}`);
  }

  async createDepense(data: any) {
    return this.request<any>('/depenses', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateDepense(id: string, data: any) {
    return this.request<any>(`/depenses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteDepense(id: string) {
    return this.request(`/depenses/${id}`, { method: 'DELETE' });
  }

  // ============ DASHBOARD ============
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  async getFacturesRecentes() {
    return this.request<any[]>('/dashboard/factures-recentes');
  }

  async getAlertes() {
    return this.request<{ stockBas: any[]; facturesRetard: any[] }>('/dashboard/alertes');
  }

  // ============ PARAMETRES ============
  async getSociete() {
    return this.request<any>('/parametres/societe');
  }

  async updateSociete(data: any) {
    return this.request<any>('/parametres/societe', { method: 'PUT', body: JSON.stringify(data) });
  }

  async getProfil() {
    return this.request<any>('/parametres/profil');
  }

  async updateProfil(data: any) {
    return this.request<any>('/parametres/profil', { method: 'PUT', body: JSON.stringify(data) });
  }

  async changePassword(ancienPassword: string, nouveauPassword: string) {
    return this.request<any>('/parametres/profil/password', {
      method: 'PUT',
      body: JSON.stringify({ ancienPassword, nouveauPassword }),
    });
  }
}

export const api = new ApiClient();
export default api;
