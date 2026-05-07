/**
 * GuinéaManager Mobile - Auth Store
 * Gestion de l'état d'authentification
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  entrepriseId: string;
  entrepriseNom: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => Promise<void>;
}

// Sauvegarde sécurisée du token
const saveToken = async (token: string) => {
  await SecureStore.setItemAsync('auth_token', token);
};

const getToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('auth_token');
};

const deleteToken = async () => {
  await SecureStore.deleteItemAsync('auth_token');
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // TODO: Appel API réel
          // const response = await api.post('/auth/login', { email, password });
          
          // Simulation pour le développement
          if (email && password) {
            const mockUser: User = {
              id: '1',
              email,
              nom: 'Diallo',
              prenom: 'Mamadou',
              entrepriseId: 'ent_1',
              entrepriseNom: 'Mon Entreprise SARL',
              role: 'ADMIN',
            };
            
            const mockToken = 'mock_jwt_token_' + Date.now();
            
            await saveToken(mockToken);
            
            set({
              isAuthenticated: true,
              user: mockUser,
              token: mockToken,
              isLoading: false,
            });
            
            return true;
          }
          
          set({ isLoading: false });
          return false;
        } catch (error) {
          console.error('Erreur login:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: async () => {
        await deleteToken();
        set({
          isAuthenticated: false,
          user: null,
          token: null,
        });
      },

      checkAuth: async () => {
        try {
          const token = await getToken();
          if (token) {
            // TODO: Vérifier la validité du token avec l'API
            set({ token, isAuthenticated: true });
          }
        } catch (error) {
          console.error('Erreur vérification auth:', error);
        }
      },

      setUser: (user: User) => set({ user }),
      
      setToken: async (token: string) => {
        await saveToken(token);
        set({ token });
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
