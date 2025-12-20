// lib/hooks/useGamification.ts
import { useState, useEffect, useCallback } from 'react';
import { gamificationAPI, GamificationStats } from '../api';
import { connectDashboard, connectStreak } from '../websocket';

export const useGamification = () => {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial stats
  const loadStats = useCallback(async () => {
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
  }, []);

  // Handle real-time dashboard updates
  const handleDashboardUpdate = useCallback((data: any) => {
    if (data.type === 'xp_update' || data.type === 'level_up') {
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          xp: data.xp || prev.xp,
          level: data.level || prev.level,
          progress: data.progress || prev.progress,
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

  // Handle real-time streak updates
  const handleStreakUpdate = useCallback((data: any) => {
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

  useEffect(() => {
    loadStats();

    // ✅ FIX: Connect to WebSocket (async, use wsService for cleanup)
    connectDashboard(handleDashboardUpdate);
    connectStreak(handleStreakUpdate);

    return () => {
      // Use wsService.disconnect instead of ws.close() for proper cleanup
      const wsService = require('../websocket').wsService;
      wsService.disconnect('dashboard');
      wsService.disconnect('streak');
    };
  }, [loadStats, handleDashboardUpdate, handleStreakUpdate]);

  return {
    stats,
    loading,
    error,
    reload: loadStats,
  };
};

export default useGamification;