/**
 * Store d'authentification avec Zustand
 * 
 * Gère l'état global de l'authentification utilisateur.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { User, LoginCredentials, RegisterData } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.login(credentials);
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          } else {
            set({
              error: response.error || 'Erreur de connexion',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          set({
            error: 'Erreur de connexion au serveur',
            isLoading: false,
          });
          return false;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.register(data);
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          } else {
            set({
              error: response.error || 'Erreur lors de l\'inscription',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          set({
            error: 'Erreur de connexion au serveur',
            isLoading: false,
          });
          return false;
        }
      },

      logout: async () => {
        await api.logout();
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        
        try {
          const isAuth = await api.isAuthenticated();
          
          if (isAuth) {
            const user = await api.getStoredUser();
            set({
              user,
              isAuthenticated: !!user,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
