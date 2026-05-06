/**
 * API Client pour GuinéaManager Mobile App
 * 
 * Service centralisé pour toutes les communications avec l'API backend.
 * Gère l'authentification, les tokens, et les requêtes HTTP.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Network from 'expo-network';
import { Platform } from 'react-native';

// Configuration de l'API
const API_CONFIG = {
  production: 'https://api.guineamanager.com',
  staging: 'https://staging-api.guineamanager.com',
  development: 'http://localhost:3001',
};

const ENV = __DEV__ ? 'development' : 'production';
const BASE_URL = API_CONFIG[ENV];

// Clés de stockage
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

// Types
export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  companyId: string;
  role: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone?: string;
  entreprise?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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

/**
 * Client API principal
 */
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = BASE_URL;
    this.loadToken();
  }

  /**
   * Charge le token depuis le stockage sécurisé
   */
  private async loadToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        this.token = await AsyncStorage.getItem(TOKEN_KEY);
      } else {
        this.token = await SecureStore.getItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  /**
   * Sauvegarde le token dans le stockage sécurisé
   */
  private async saveToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
      this.token = token;
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  /**
   * Supprime le token du stockage
   */
  private async clearToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
      }
      this.token = null;
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  /**
   * Vérifie la connectivité réseau
   */
  private async checkNetwork(): Promise<boolean> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return networkState.isConnected || false;
    } catch (error) {
      return true; // Assume connected on error
    }
  }

  /**
   * Effectue une requête HTTP
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: { skipAuth?: boolean }
  ): Promise<ApiResponse<T>> {
    try {
      // Vérifier le réseau
      const isConnected = await this.checkNetwork();
      if (!isConnected) {
        return {
          success: false,
          error: 'Pas de connexion internet',
        };
      }

      const url = `${this.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Ajouter le token d'authentification
      if (!options?.skipAuth && this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      const result = await response.json();

      if (!response.ok) {
        // Gérer l'expiration du token
        if (response.status === 401) {
          await this.clearToken();
        }
        return {
          success: false,
          error: result.error || `Erreur HTTP ${response.status}`,
          message: result.message,
        };
      }

      return result;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion',
      };
    }
  }

  // ============================================
  // AUTHENTIFICATION
  // ============================================

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.request<{ user: User; token: string }>(
      'POST',
      '/api/auth/login',
      credentials,
      { skipAuth: true }
    );

    if (response.success && response.data?.token) {
      await this.saveToken(response.data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
    }

    return response;
  }

  async register(data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.request<{ user: User; token: string }>(
      'POST',
      '/api/auth/register',
      data,
      { skipAuth: true }
    );

    if (response.success && response.data?.token) {
      await this.saveToken(response.data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
    }

    return response;
  }

  async logout(): Promise<void> {
    await this.request('POST', '/api/auth/logout');
    await this.clearToken();
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.token) {
      await this.loadToken();
    }
    return !!this.token;
  }

  // ============================================
  // DASHBOARD
  // ============================================

  async getDashboard(): Promise<ApiResponse<any>> {
    return this.request('GET', '/api/dashboard');
  }

  // ============================================
  // FACTURES
  // ============================================

  async getInvoices(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<any>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/factures${query ? `?${query}` : ''}`);
  }

  async getInvoice(id: string): Promise<ApiResponse<any>> {
    return this.request('GET', `/api/factures/${id}`);
  }

  async createInvoice(data: any): Promise<ApiResponse<any>> {
    return this.request('POST', '/api/factures', data);
  }

  // ============================================
  // CLIENTS
  // ============================================

  async getClients(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<any>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/clients${query ? `?${query}` : ''}`);
  }

  async createClient(data: any): Promise<ApiResponse<any>> {
    return this.request('POST', '/api/clients', data);
  }

  // ============================================
  // PRODUITS
  // ============================================

  async getProducts(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<any>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/produits${query ? `?${query}` : ''}`);
  }

  // ============================================
  // MOBILE MONEY
  // ============================================

  async initiatePayment(data: {
    operateur: 'ORANGE' | 'MTN' | 'WAVE';
    montant: number;
    telephone: string;
    reference?: string;
  }): Promise<ApiResponse<any>> {
    const endpoint = `/api/paiements-mobile/${data.operateur.toLowerCase()}-money/initier`;
    return this.request('POST', endpoint, {
      montant: data.montant,
      telephone: data.telephone,
      reference: data.reference,
    });
  }

  async checkPaymentStatus(transactionId: string, operateur: string): Promise<ApiResponse<any>> {
    return this.request('GET', `/api/paiements-mobile/${operateur.toLowerCase()}-money/statut/${transactionId}`);
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  async registerPushToken(token: string): Promise<ApiResponse<any>> {
    return this.request('POST', '/api/notifications/register-device', { token });
  }

  async getNotifications(): Promise<PaginatedResponse<any>> {
    return this.request('GET', '/api/notifications');
  }

  async markNotificationRead(id: string): Promise<ApiResponse<any>> {
    return this.request('PUT', `/api/notifications/${id}/read`);
  }
}

// Export singleton
export const api = new ApiClient();
export default api;
