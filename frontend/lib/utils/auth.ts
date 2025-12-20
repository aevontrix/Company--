import { jwtDecode } from 'jwt-decode';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

interface TokenPayload {
  user_id: number;
  exp: number;
  email: string;
}

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  // ✅ FIX: Also set cookie for middleware and session marker
  document.cookie = `onthego_token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
  localStorage.setItem('onthego_session', 'true');
};

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  // ✅ FIX: Also clear cookie and session marker
  document.cookie = 'onthego_token=; path=/; max-age=0';
  localStorage.removeItem('onthego_session');
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.exp < Date.now() / 1000;
  } catch {
    return true;
  }
};

export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  return token ? !isTokenExpired(token) : false;
};
