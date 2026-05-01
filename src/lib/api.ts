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

  // ============ PLANS & ABONNEMENT ============
  async getPlans() {
    return this.request<any[]>('/plans');
  }

  async getPlan(id: string) {
    return this.request<any>(`/plans/${id}`);
  }

  async getAbonnementActuel() {
    return this.request<any>('/plans/abonnement/actuel');
  }

  async changerPlan(planId: string, duree: 'mensuel' | 'annuel' = 'mensuel') {
    return this.request<any>('/plans/abonnement/changer', {
      method: 'POST',
      body: JSON.stringify({ planId, duree }),
    });
  }

  async getHistoriqueAbonnement() {
    return this.request<any[]>('/plans/abonnement/historique');
  }

  async getPlansComparaison() {
    return this.request<any>('/plans/comparaison/feature');
  }

  // ============ 2FA ============
  async get2FAStatus() {
    return this.request<{ enabled: boolean; method: string | null; phone?: string }>('/auth/2fa/status');
  }

  async initiate2FASetup(method: 'totp' | 'sms') {
    return this.request<{
      method: string;
      qrCodeUrl?: string;
      secret?: string;
      recoveryCodes?: string[];
      otp?: string;
    }>('/auth/2fa/setup/initiate', {
      method: 'POST',
      body: JSON.stringify({ method }),
    });
  }

  async verify2FASetup(code: string) {
    return this.request<{ method: string; recoveryCodes?: string[] }>('/auth/2fa/setup/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async disable2FA(password: string) {
    return this.request('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async verify2FALogin(tempToken: string, code: string) {
    return this.request<{ token: string; user: any }>('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ tempToken, code }),
    });
  }

  async resend2FAOTP(tempToken: string) {
    return this.request('/auth/2fa/resend', {
      method: 'POST',
      body: JSON.stringify({ tempToken }),
    });
  }

  // ============ MOBILE MONEY ============
  async getMobileMoneyConfig() {
    return this.request<{
      orangeMoney: { enabled: boolean; apiKey: string; apiSecret: string; merchantCode: string };
      mtnMoney: { enabled: boolean; subscriberKey: string; subscriptionKey: string };
    }>('/paiements-mobile/config');
  }

  async saveMobileMoneyConfig(data: any) {
    return this.request('/paiements-mobile/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async initiateOrangeMoneyPayment(data: {
    amount: number;
    orderId: string;
    customerPhone: string;
    customerName?: string;
    description?: string;
  }) {
    return this.request<{
      orderId: string;
      txId: string;
      status: string;
      message: string;
    }>('/paiements-mobile/orange-money/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkPaymentStatus(transactionId: string) {
    return this.request<{
      id: string;
      status: string;
      amount: number;
      completedAt?: string;
    }>(`/paiements-mobile/status/${transactionId}`);
  }

  async getMobileMoneyTransactions(params?: { status?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());
    return this.request<any[]>(`/paiements-mobile/transactions?${query.toString()}`);
  }

  // ============ NOTIFICATIONS ============
  async getNotificationSettings() {
    return this.request<{
      email: boolean;
      sms: boolean;
      push: boolean;
      invoiceCreated: boolean;
      invoicePaid: boolean;
      invoiceReminder: boolean;
      payrollReady: boolean;
      stockAlert: boolean;
      employeeHired: boolean;
      subscriptionExpiring: boolean;
    }>('/notifications/preferences');
  }

  async updateNotificationSettings(data: any) {
    return this.request('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getNotifications(params?: { page?: number; limit?: number; lu?: boolean; type?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.lu !== undefined) query.set('lu', params.lu.toString());
    if (params?.type) query.set('type', params.type);
    return this.request<{
      data: any[];
      unreadCount: number;
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/notifications?${query.toString()}`);
  }

  async getUnreadCount() {
    return this.request<{ count: number }>('/notifications/unread-count');
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', { method: 'PUT' });
  }

  async deleteNotification(id: string) {
    return this.request(`/notifications/${id}`, { method: 'DELETE' });
  }

  async clearAllNotifications() {
    return this.request('/notifications', { method: 'DELETE' });
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

  async updateFiscalConfig(data: any) {
    return this.request<any>('/parametres/societe/fiscal', { method: 'PUT', body: JSON.stringify(data) });
  }

  async getCustomParams() {
    return this.request<Record<string, any>>('/parametres/custom');
  }

  async setCustomParam(cle: string, valeur: any, type?: string, description?: string) {
    return this.request<any>(`/parametres/custom/${cle}`, {
      method: 'PUT',
      body: JSON.stringify({ valeur, type, description }),
    });
  }

  async deleteCustomParam(cle: string) {
    return this.request(`/parametres/custom/${cle}`, { method: 'DELETE' });
  }

  async getPays() {
    return this.request<any[]>('/parametres/pays');
  }

  async getPaysConfig(code: string) {
    return this.request<any>(`/parametres/pays/${code}/config`);
  }

  async getUtilisateurs() {
    return this.request<any[]>('/parametres/utilisateurs');
  }

  async updateUtilisateur(id: string, data: any) {
    return this.request<any>(`/parametres/utilisateurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
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

  // ============ PASSWORD RESET ============
  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async verifyEmail(token: string) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // ============ PAIE MULTI-PAYS ============
  async getPaieConfigPays() {
    return this.request<any>('/paie/config-pays');
  }

  async getPaysSupportes() {
    return this.request<any[]>('/paie/pays-supportes');
  }

  async getRapportCotisations(mois: number, annee: number) {
    return this.request<any>(`/paie/rapport-cotisations?mois=${mois}&annee=${annee}`);
  }

  async getRapportImposition(annee: number) {
    return this.request<any>(`/paie/rapport-imposition?annee=${annee}`);
  }

  // ============ ENTREPOTS ============
  async getEntrepots(params?: { actif?: boolean; search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.actif !== undefined) query.set('actif', params.actif.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request<any[]>(`/entrepots?${query.toString()}`);
  }

  async getEntrepot(id: string) {
    return this.request<any>(`/entrepots/${id}`);
  }

  async createEntrepot(data: any) {
    return this.request<any>('/entrepots', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateEntrepot(id: string, data: any) {
    return this.request<any>(`/entrepots/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async getStockEntrepot(entrepotId: string, params?: { search?: string; lowStock?: boolean }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.lowStock) query.set('lowStock', 'true');
    return this.request<any[]>(`/entrepots/${entrepotId}/stock?${query.toString()}`);
  }

  async updateStockEntrepot(entrepotId: string, produitId: string, quantite: number, raison?: string) {
    return this.request<any>(`/entrepots/${entrepotId}/stock/${produitId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantite, raison }),
    });
  }

  async getStockSummary() {
    return this.request<any>('/entrepots/stats');
  }

  // ============ FOURNISSEURS ============
  async getFournisseurs(params?: { actif?: boolean; search?: string; pays?: string }) {
    const query = new URLSearchParams();
    if (params?.actif !== undefined) query.set('actif', params.actif.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.pays) query.set('pays', params.pays);
    return this.request<any[]>(`/fournisseurs?${query.toString()}`);
  }

  async getFournisseur(id: string) {
    return this.request<any>(`/fournisseurs/${id}`);
  }

  async createFournisseur(data: any) {
    return this.request<any>('/fournisseurs', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateFournisseur(id: string, data: any) {
    return this.request<any>(`/fournisseurs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteFournisseur(id: string) {
    return this.request(`/fournisseurs/${id}`, { method: 'DELETE' });
  }

  async getFournisseurStats() {
    return this.request<any>('/fournisseurs/stats');
  }

  // ============ STOCK ============
  async getStockAlerts() {
    return this.request<any[]>('/stock/alerts');
  }

  async getLowStockProducts() {
    return this.request<any[]>('/stock/low-stock');
  }

  async getStockHistory(params?: { produitId?: string; type?: string; startDate?: string; endDate?: string }) {
    const query = new URLSearchParams();
    if (params?.produitId) query.set('produitId', params.produitId);
    if (params?.type) query.set('type', params.type);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return this.request<any[]>(`/stock/history?${query.toString()}`);
  }

  // ============ GENERIC HTTP METHODS ============
  async get<T = any>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.set(key, String(value));
        }
      });
      const queryString = query.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ============ COMMANDES FOURNISSEUR ============
  async getCommandesFournisseur(params?: { statut?: string; fournisseurId?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.statut) query.set('statut', params.statut);
    if (params?.fournisseurId) query.set('fournisseurId', params.fournisseurId);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request<any[]>(`/fournisseurs/commandes/all?${query.toString()}`);
  }

  async getCommandeFournisseur(id: string) {
    return this.request<any>(`/fournisseurs/commandes/${id}`);
  }

  async createCommandeFournisseur(data: any) {
    return this.request<any>('/fournisseurs/commandes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCommandeFournisseurStatus(id: string, statut: string) {
    return this.request<any>(`/fournisseurs/commandes/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ statut }),
    });
  }

  async cancelCommandeFournisseur(id: string, raison?: string) {
    return this.request<any>(`/fournisseurs/commandes/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ raison }),
    });
  }

  async receptionnerCommandeFournisseur(id: string, data: { lignes: { produitId: string; quantiteRecue: number }[] }) {
    return this.request<any>(`/fournisseurs/commandes/${id}/reception`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============ TRANSFERTS STOCK ============
  async getTransferts(params?: { statut?: string; entrepotSourceId?: string; entrepotDestinationId?: string }) {
    const query = new URLSearchParams();
    if (params?.statut) query.set('statut', params.statut);
    if (params?.entrepotSourceId) query.set('entrepotSourceId', params.entrepotSourceId);
    if (params?.entrepotDestinationId) query.set('entrepotDestinationId', params.entrepotDestinationId);
    return this.request<any[]>(`/entrepots/transferts/history?${query.toString()}`);
  }

  async createTransfert(data: {
    entrepotSourceId: string;
    entrepotDestinationId: string;
    lignes: { produitId: string; quantite: number }[];
    notes?: string;
  }) {
    return this.request<any>('/entrepots/transferts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async validerTransfert(id: string) {
    return this.request<any>(`/entrepots/transferts/${id}/valider`, { method: 'PUT' });
  }

  async annulerTransfert(id: string) {
    return this.request<any>(`/entrepots/transferts/${id}/annuler`, { method: 'PUT' });
  }

  // ============ DEVIS ============
  async getDevis(params?: { statut?: string; clientId?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.statut) query.set('statut', params.statut);
    if (params?.clientId) query.set('clientId', params.clientId);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request<any[]>(`/devis?${query.toString()}`);
  }

  async getDevisStats() {
    return this.request<any>('/devis/stats');
  }

  async getDevis(id: string) {
    return this.request<any>(`/devis/${id}`);
  }

  async createDevis(data: any) {
    return this.request<any>('/devis', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateDevisStatus(id: string, statut: string) {
    return this.request<any>(`/devis/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ statut }),
    });
  }

  async convertirDevisEnFacture(id: string) {
    return this.request<any>(`/devis/${id}/convert`, { method: 'POST' });
  }

  async envoyerDevis(id: string, email?: string) {
    return this.request<any>(`/devis/${id}/send`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getDevisPdf(id: string) {
    return this.request<any>(`/devis/${id}/pdf`);
  }

  // ============ COMMANDES CLIENT ============
  async getCommandes(params?: { statut?: string; clientId?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.statut) query.set('statut', params.statut);
    if (params?.clientId) query.set('clientId', params.clientId);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request<any[]>(`/commandes?${query.toString()}`);
  }

  async getCommandeStats() {
    return this.request<any>('/commandes/stats');
  }

  async getCommande(id: string) {
    return this.request<any>(`/commandes/${id}`);
  }

  async createCommande(data: any) {
    return this.request<any>('/commandes', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateCommande(id: string, data: any) {
    return this.request<any>(`/commandes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async updateCommandeStatus(id: string, statut: string) {
    return this.request<any>(`/commandes/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ statut }),
    });
  }

  async cancelCommande(id: string, raison?: string) {
    return this.request<any>(`/commandes/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ raison }),
    });
  }

  async creerFactureDepuisCommande(id: string) {
    return this.request<any>(`/commandes/${id}/facture`, { method: 'POST' });
  }

  async creerBonLivraison(id: string, data: any) {
    return this.request<any>(`/commandes/${id}/livraison`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============ COMPTABILITE ============
  async getExercicesComptables() {
    return this.request<any[]>('/comptabilite/exercices');
  }

  async getExerciceComptable(id: string) {
    return this.request<any>(`/comptabilite/exercices/${id}`);
  }

  async creerExerciceComptable(data: any) {
    return this.request<any>('/comptabilite/exercices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cloturerExercice(id: string) {
    return this.request<any>(`/comptabilite/exercices/${id}/cloturer`, { method: 'POST' });
  }

  async getPlanComptable() {
    return this.request<any[]>('/comptabilite/plan-comptable');
  }

  async getJournaux() {
    return this.request<any[]>('/comptabilite/journaux');
  }

  async getEcritures(params?: { exerciceId?: string; journalId?: string; compte?: string }) {
    const query = new URLSearchParams();
    if (params?.exerciceId) query.set('exerciceId', params.exerciceId);
    if (params?.journalId) query.set('journalId', params.journalId);
    if (params?.compte) query.set('compte', params.compte);
    return this.request<any[]>(`/comptabilite/ecritures?${query.toString()}`);
  }

  async creerEcriture(data: any) {
    return this.request<any>('/comptabilite/ecritures', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGrandLivre(params?: { exerciceId?: string; compte?: string }) {
    const query = new URLSearchParams();
    if (params?.exerciceId) query.set('exerciceId', params.exerciceId);
    if (params?.compte) query.set('compte', params.compte);
    return this.request<any>(`/comptabilite/grand-livre?${query.toString()}`);
  }

  async getBalance(params?: { exerciceId?: string; date?: string }) {
    const query = new URLSearchParams();
    if (params?.exerciceId) query.set('exerciceId', params.exerciceId);
    if (params?.date) query.set('date', params.date);
    return this.request<any>(`/comptabilite/balance?${query.toString()}`);
  }

  async getBilan(exerciceId?: string) {
    const query = exerciceId ? `?exerciceId=${exerciceId}` : '';
    return this.request<any>(`/comptabilite/bilan${query}`);
  }

  async getCompteResultat(exerciceId?: string) {
    const query = exerciceId ? `?exerciceId=${exerciceId}` : '';
    return this.request<any>(`/comptabilite/compte-resultat${query}`);
  }

  async initialiserComptabilite() {
    return this.request<any>('/comptabilite/initialiser', { method: 'POST' });
  }

  // ============ DEVISES ============
  async getDevises() {
    return this.request<any[]>('/devises');
  }

  async getDevise(code: string) {
    return this.request<any>(`/devises/${code}`);
  }

  async getTauxChange(source: string, cible: string) {
    return this.request<any>(`/devises/taux/${source}/${cible}`);
  }

  async getTauxActuels(base?: string) {
    const query = base ? `?base=${base}` : '';
    return this.request<any>(`/devises/taux-actuels${query}`);
  }

  async convertirDevise(data: { montant: number; source: string; cible: string }) {
    return this.request<any>('/devises/convertir', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createTauxChange(data: { sourceCode: string; cibleCode: string; taux: number; dateEffet?: string }) {
    return this.request<any>('/devises/taux', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTauxFromApi() {
    return this.request<any>('/devises/taux/update-api', { method: 'POST' });
  }

  async getConversionsDevise() {
    return this.request<any[]>('/devises/conversions');
  }

  // ============ CRM ============
  async getProspects(params?: { statut?: string; search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.statut) query.set('statut', params.statut);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request<any[]>(`/crm/prospects?${query.toString()}`);
  }

  async getProspect(id: string) {
    return this.request<any>(`/crm/prospects/${id}`);
  }

  async createProspect(data: any) {
    return this.request<any>('/crm/prospects', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateProspect(id: string, data: any) {
    return this.request<any>(`/crm/prospects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async updateProspectStatut(id: string, statut: string) {
    return this.request<any>(`/crm/prospects/${id}/statut`, {
      method: 'PATCH',
      body: JSON.stringify({ statut }),
    });
  }

  async calculerScoreProspect(id: string) {
    return this.request<any>(`/crm/prospects/${id}/score`, { method: 'POST' });
  }

  async convertirProspectEnClient(id: string) {
    return this.request<any>(`/crm/prospects/${id}/convertir`, { method: 'POST' });
  }

  async deleteProspect(id: string) {
    return this.request<any>(`/crm/prospects/${id}`, { method: 'DELETE' });
  }

  async getOpportunites(params?: { etape?: string; prospectId?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.etape) query.set('etape', params.etape);
    if (params?.prospectId) query.set('prospectId', params.prospectId);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request<any[]>(`/crm/opportunites?${query.toString()}`);
  }

  async getOpportunite(id: string) {
    return this.request<any>(`/crm/opportunites/${id}`);
  }

  async createOpportunite(data: any) {
    return this.request<any>('/crm/opportunites', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateOpportunite(id: string, data: any) {
    return this.request<any>(`/crm/opportunites/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async updateOpportuniteEtape(id: string, etape: string) {
    return this.request<any>(`/crm/opportunites/${id}/etape`, {
      method: 'PATCH',
      body: JSON.stringify({ etape }),
    });
  }

  async gagnerOpportunite(id: string, data?: { montantFinal?: number; notes?: string }) {
    return this.request<any>(`/crm/opportunites/${id}/gagner`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async perdreOpportunite(id: string, raison?: string) {
    return this.request<any>(`/crm/opportunites/${id}/perdre`, {
      method: 'POST',
      body: JSON.stringify({ raison }),
    });
  }

  async deleteOpportunite(id: string) {
    return this.request<any>(`/crm/opportunites/${id}`, { method: 'DELETE' });
  }

  async getActivitesCRM(params?: { type?: string; opportuniteId?: string; prospectId?: string }) {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.opportuniteId) query.set('opportuniteId', params.opportuniteId);
    if (params?.prospectId) query.set('prospectId', params.prospectId);
    return this.request<any[]>(`/crm/activites?${query.toString()}`);
  }

  async getActiviteCRM(id: string) {
    return this.request<any>(`/crm/activites/${id}`);
  }

  async createActiviteCRM(data: any) {
    return this.request<any>('/crm/activites', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateActiviteCRM(id: string, data: any) {
    return this.request<any>(`/crm/activites/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async terminerActiviteCRM(id: string) {
    return this.request<any>(`/crm/activites/${id}/terminer`, { method: 'POST' });
  }

  async deleteActiviteCRM(id: string) {
    return this.request<any>(`/crm/activites/${id}`, { method: 'DELETE' });
  }

  async getCRMDashboard() {
    return this.request<any>('/crm/dashboard');
  }

  async getPipelineStats() {
    return this.request<any>('/crm/pipeline/stats');
  }

  async getPipelines() {
    return this.request<any[]>('/crm/pipelines');
  }

  // ============ SUPPORT ============
  async getTickets(params?: { statut?: string; categorie?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.statut) query.set('statut', params.statut);
    if (params?.categorie) query.set('categorie', params.categorie);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request<any[]>(`/support/tickets?${query.toString()}`);
  }

  async getTicket(id: string) {
    return this.request<any>(`/support/tickets/${id}`);
  }

  async createTicket(data: { sujet: string; description: string; categorie: string; priorite?: string }) {
    return this.request<any>('/support/tickets', { method: 'POST', body: JSON.stringify(data) });
  }

  async repondreTicket(id: string, message: string) {
    return this.request<any>(`/support/tickets/${id}/reponses`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async fermerTicket(id: string) {
    return this.request<any>(`/support/tickets/${id}/close`, { method: 'PUT' });
  }

  async noterTicket(id: string, note: number, commentaire?: string) {
    return this.request<any>(`/support/tickets/${id}/satisfaction`, {
      method: 'POST',
      body: JSON.stringify({ note, commentaire }),
    });
  }

  async getSupportStats() {
    return this.request<any>('/support/stats');
  }

  async getFAQ() {
    return this.request<any[]>('/support/faq');
  }

  async getCategoriesSupport() {
    return this.request<any[]>('/support/categories');
  }

  // ============ INVENTAIRES ============
  async getInventaires(params?: { statut?: string; entrepotId?: string }) {
    const query = new URLSearchParams();
    if (params?.statut) query.set('statut', params.statut);
    if (params?.entrepotId) query.set('entrepotId', params.entrepotId);
    return this.request<any[]>(`/inventaires?${query.toString()}`);
  }

  async getInventaire(id: string) {
    return this.request<any>(`/inventaires/${id}`);
  }

  async createInventaire(data: { entrepotId: string; notes?: string }) {
    return this.request<any>('/inventaires', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateLigneInventaire(inventaireId: string, ligneId: string, data: { quantiteComptee: number; notes?: string }) {
    return this.request<any>(`/inventaires/${inventaireId}/ligne/${ligneId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async finaliserInventaire(id: string) {
    return this.request<any>(`/inventaires/${id}/finalize`, { method: 'PUT' });
  }

  async annulerInventaire(id: string) {
    return this.request<any>(`/inventaires/${id}/cancel`, { method: 'PUT' });
  }

  // ============ RAPPORTS ============
  async getCAMensuel(annee?: number) {
    const query = annee ? `?annee=${annee}` : '';
    return this.request<any>(`/rapports/ca-mensuel${query}`);
  }

  async getTopClients(limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<any[]>(`/rapports/top-clients${query}`);
  }

  async getBilanSimplifie() {
    return this.request<any>('/rapports/bilan-simplifie');
  }

  async getImpayes() {
    return this.request<any[]>('/rapports/impayes');
  }

  async exportRapport(type: string, format?: string) {
    const query = format ? `?format=${format}` : '';
    return this.request<any>(`/rapports/export${query}`);
  }

  // ============ EXPORTS ============
  async exportClients(format: string = 'xlsx') {
    return this.request<any>(`/exports/clients?format=${format}`);
  }

  async exportFactures(params?: { startDate?: string; endDate?: string; format?: string }) {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.format) query.set('format', params.format);
    return this.request<any>(`/exports/factures?${query.toString()}`);
  }

  async exportEmployes(format: string = 'xlsx') {
    return this.request<any>(`/exports/employes?format=${format}`);
  }

  async exportPaie(params?: { mois?: number; annee?: number; format?: string }) {
    const query = new URLSearchParams();
    if (params?.mois) query.set('mois', params.mois.toString());
    if (params?.annee) query.set('annee', params.annee.toString());
    if (params?.format) query.set('format', params.format);
    return this.request<any>(`/exports/paie?${query.toString()}`);
  }

  async exportDepenses(params?: { mois?: string; format?: string }) {
    const query = new URLSearchParams();
    if (params?.mois) query.set('mois', params.mois);
    if (params?.format) query.set('format', params.format);
    return this.request<any>(`/exports/depenses?${query.toString()}`);
  }
}

export const api = new ApiClient();
export default api;
