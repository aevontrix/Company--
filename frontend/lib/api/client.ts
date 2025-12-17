import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@/lib/utils/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshToken = getRefreshToken();
            if (!refreshToken) throw new Error('No refresh token');

            const { data } = await axios.post(`${API_URL}/users/token/refresh/`, { refresh: refreshToken });
            setTokens(data.access, refreshToken);

            if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${data.access}`;
            return this.client(originalRequest);
          } catch {
            clearTokens();
            if (typeof window !== 'undefined') window.location.href = '/login';
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.get<T>(url, config);
    return data;
  }

  async post<T>(url: string, body?: any, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.post<T>(url, body, config);
    return data;
  }

  async patch<T>(url: string, body?: any, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.patch<T>(url, body, config);
    return data;
  }
}

export const apiClient = new APIClient();
