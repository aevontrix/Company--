// contexts/GamificationContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { gamificationAPI, GamificationStats } from '@/lib/api';
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

  // ✅ FIX: Removed duplicate WebSocket handlers (handleDashboardUpdate, handleStreakUpdate)
  // These are no longer needed since WebSocket connections are handled elsewhere:
  // - Dashboard page handles its own WebSocket updates
  // - WebSocketContext handles global progress/streak updates
  // WebSocket updates are now handled by:
  // - Dashboard page: handles its own 'dashboard' WebSocket
  // - WebSocketContext: handles 'progress', 'leaderboard', 'streak' globally
  // This context now only loads stats via REST API
  useEffect(() => {
    if (!isAuthenticated) {
      setStats(null);
      setLoading(false);
      return;
    }

    loadStats();
  }, [isAuthenticated, loadStats]);

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