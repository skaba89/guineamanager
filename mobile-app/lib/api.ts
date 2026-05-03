/**
 * GuinéaManager Mobile - API Client
 * Client HTTP pour les appels API
 */

import * as SecureStore from 'expo-secure-store';
import { type ApiResponse } from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.guineamanager.com';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await SecureStore.getItemAsync('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: await this.getHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API GET Error:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API POST Error:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: await this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API PUT Error:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: await this.getHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API DELETE Error:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  }
}

export const api = new ApiClient(API_BASE_URL);

// Services spécifiques
export const authService = {
  login: (email: string, password: string) => 
    api.post('/api/auth/login', { email, password }),
  
  logout: () => 
    api.post('/api/auth/logout'),
  
  me: () => 
    api.get('/api/auth/me'),
};

export const clientService = {
  getAll: () => 
    api.get('/api/clients'),
  
  getById: (id: string) => 
    api.get(`/api/clients/${id}`),
  
  create: (data: Partial<import('@/types').Client>) => 
    api.post('/api/clients', data),
};

export const factureService = {
  getAll: (params?: { statut?: string }) => 
    api.get('/api/factures', params),
  
  getById: (id: string) => 
    api.get(`/api/factures/${id}`),
  
  create: (data: Partial<import('@/types').Facture>) => 
    api.post('/api/factures', data),
  
  envoyer: (id: string) => 
    api.post(`/api/factures/${id}/envoyer`),
};

export const mobileMoneyService = {
  getBalance: (operateur: 'ORANGE' | 'MTN' | 'WAVE') => 
    api.get(`/api/mobile-money/balance/${operateur}`),
  
  getTransactions: (params?: { operateur?: string }) => 
    api.get('/api/mobile-money/transactions', params),
  
  initierPaiement: (data: { 
    operateur: 'ORANGE' | 'MTN' | 'WAVE';
    montant: number;
    telephone: string;
    motif?: string;
  }) => api.post('/api/mobile-money/initier', data),
  
  generateQR: (montant: number, motif?: string) => 
    api.post('/api/mobile-money/qr-code', { montant, motif }),
  
  checkStatus: (transactionId: string) => 
    api.get(`/api/mobile-money/statut/${transactionId}`),
};

export const dashboardService = {
  getStats: () => 
    api.get('/api/dashboard/stats'),
};
