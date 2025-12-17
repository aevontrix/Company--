import { apiClient } from './client';
import { User, AuthTokens, LoginCredentials, RegisterData } from '@/lib/types';
import { setTokens, clearTokens } from '@/lib/utils/auth';

export const authAPI = {
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const tokens = await apiClient.post<AuthTokens>('/users/login/', credentials);
    setTokens(tokens.access, tokens.refresh);
    const user = await this.getCurrentUser();
    return { user, tokens };
  },

  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const tokens = await apiClient.post<AuthTokens>('/users/register/', data);
    setTokens(tokens.access, tokens.refresh);
    const user = await this.getCurrentUser();
    return { user, tokens };
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/users/logout/');
    } finally {
      clearTokens();
    }
  },

  async getCurrentUser(): Promise<User> {
    return await apiClient.get<User>('/users/profile/');
  },
};
