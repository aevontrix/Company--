'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import { authAPI, UserProfile, setTokens, clearTokens, getAccessToken } from '@/lib/api';
import { AchievementNotifications } from '@/components/ui/AchievementNotification';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    country?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const previousLevelRef = useRef<number | null>(null);
  const previousBadgesRef = useRef<string[]>([]);
  const previousXPRef = useRef<number | null>(null); // ← ДОБАВЛЕНО

  // Check for level up and new badges
  useEffect(() => {
    if (!user) return;

    // Check for XP increase (for notifications)
    if (previousXPRef.current !== null && user.xp > previousXPRef.current) {
      const xpGained = user.xp - previousXPRef.current;
      console.log(`✨ +${xpGained} XP! Total: ${user.xp}`);
    }
    previousXPRef.current = user.xp;

    // Check for level up
    if (previousLevelRef.current !== null && user.level > previousLevelRef.current) {
      AchievementNotifications.showLevelUp(user.level, 100);
    }
    previousLevelRef.current = user.level;

    // Check for new badges
    const currentBadgeIds = user.badges?.map(b => b.id) || [];
    const newBadges = currentBadgeIds.filter(id => !previousBadgesRef.current.includes(id));

    if (newBadges.length > 0 && previousBadgesRef.current.length > 0) {
      // Show notification for each new badge
      newBadges.forEach(badgeId => {
        const badge = user.badges?.find(b => b.id === badgeId);
        if (badge) {
          AchievementNotifications.showBadge(
            badge.name,
            badge.description || 'Achievement unlocked!',
            badge.emoji || '🏆',
            50,
            'rare'
          );
        }
      });
    }
    previousBadgesRef.current = currentBadgeIds;
  }, [user]);

  // ✅ FIX: Removed polling - XP updates now come via WebSocket
  // User data is refreshed by WebSocketContext when real-time updates are received

  // Check if user is authenticated on mount
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadUser = async () => {
      const token = getAccessToken();
      if (token && isMounted) {
        try {
          const userData = await authAPI.getCurrentUser();
          if (isMounted) {
            setUser(userData);
          }
        } catch (error) {
          console.error('Failed to load user:', error);
          if (isMounted) {
            clearTokens();
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    loadUser();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      setTokens(response.access, response.refresh);

      // Get user data after login
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
    } catch (error) {
      throw error;
    }
  }, []);

  const register = useCallback(async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    country?: string;
  }) => {
    try {
      const registerPayload = {
        ...data,
        password_confirm: data.password,
      };
      const response = await authAPI.register(registerPayload);
      setTokens(response.access, response.refresh);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    clearTokens();
    setUser(null);

    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const updateUser = useCallback(async (data: Partial<UserProfile>) => {
    try {
      const updatedUser = await authAPI.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: !!user,
  }), [user, loading, login, register, logout, updateUser, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}