import { create } from 'zustand';
import { User } from '@/lib/types';
import { authAPI } from '@/lib/api/auth';
import { isAuthenticated } from '@/lib/utils/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authAPI.login({ email, password });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Ошибка входа', isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authAPI.register(data);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Ошибка регистрации', isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authAPI.logout();
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  fetchCurrentUser: async () => {
    if (!isAuthenticated()) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    set({ isLoading: true });
    try {
      const user = await authAPI.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
