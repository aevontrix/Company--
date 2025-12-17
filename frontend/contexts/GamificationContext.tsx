// contexts/GamificationContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { gamificationAPI, GamificationStats } from '@/lib/api';
import { connectDashboard, connectStreak, wsService } from '@/lib/websocket';
import { useAuth } from './AuthContext';

interface GamificationContextType {
  stats: GamificationStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  updateStreak: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load gamification stats
  const loadStats = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await gamificationAPI.getStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load gamification stats');
      console.error('Failed to load gamification stats:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Update streak manually
  const updateStreak = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const streakData = await gamificationAPI.updateStreak();
      
      // Update stats with new streak info
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          streak: streakData.streak_count,
          xp: prev.xp + streakData.bonus_xp,
        };
      });

      console.log('✅ Streak updated:', streakData);
    } catch (err: any) {
      console.error('Failed to update streak:', err);
    }
  }, [isAuthenticated]);

  // Handle real-time dashboard updates via WebSocket
  const handleDashboardUpdate = useCallback((data: any) => {
    console.log('📊 Dashboard update received:', data);

    if (data.type === 'xp_update' || data.type === 'level_up') {
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          xp: data.xp ?? prev.xp,
          level: data.level ?? prev.level,
          progress: data.progress ?? prev.progress,
        };
      });
    }

    if (data.type === 'badge_unlocked') {
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          badges: [...prev.badges, data.badge],
        };
      });
    }
  }, []);

  // Handle real-time streak updates via WebSocket
  const handleStreakUpdate = useCallback((data: any) => {
    console.log('🔥 Streak update received:', data);

    if (data.type === 'streak_update') {
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          streak: data.streak,
        };
      });
    }
  }, []);

  // Setup WebSocket connections and load initial data
  useEffect(() => {
    if (!isAuthenticated) {
      setStats(null);
      setLoading(false);
      return;
    }

    loadStats();

    // Connect to WebSocket for real-time updates
    const wsDashboard = connectDashboard(handleDashboardUpdate);
    const wsStreak = connectStreak(handleStreakUpdate);

    return () => {
      // Cleanup WebSocket connections
      if (wsDashboard) {
        wsService.disconnect('dashboard');
      }
      if (wsStreak) {
        wsService.disconnect('streak');
      }
    };
  }, [isAuthenticated, loadStats, handleDashboardUpdate, handleStreakUpdate]);

  const value = {
    stats,
    loading,
    error,
    refreshStats: loadStats,
    updateStreak,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}