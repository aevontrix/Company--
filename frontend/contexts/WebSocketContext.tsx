'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { connectProgress, connectLeaderboard, connectStreak, wsService } from '@/lib/websocket';
import { useToast } from '@/components/notifications/ToastNotification';
import LevelUpAnimation from '@/components/animations/LevelUpAnimation';

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (endpoint: string, data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);

  const toast = useToast();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsConnected(false);
      return;
    }

    console.log('🔌 Connecting WebSockets...');

    // Handle Progress Updates (XP, Level, Lessons)
    const handleProgressMessage = (data: any) => {
      console.log('📊 Progress message:', data);

      switch (data.type) {
        case 'connection_established':
          console.log('✅ Connected to progress updates');
          setIsConnected(true);
          break;

        case 'xp_gained':
          toast.xpGained(data.amount, data.total_xp);
          // Refresh user data to update UI
          refreshUser();
          break;

        case 'level_up':
          console.log('🎉 LEVEL UP!', data);
          setNewLevel(data.new_level);
          setShowLevelUp(true);
          toast.levelUp(data.new_level);
          // Refresh user data
          refreshUser();
          break;

        case 'lesson_completed':
          toast.showToast({
            type: 'success',
            title: 'Урок завершен!',
            message: `+${data.xp_gained} XP получено`,
            duration: 4000,
          });
          break;

        case 'progress_updated':
          // Silent update, just refresh user data
          refreshUser();
          break;
      }
    };

    // Handle Leaderboard Updates
    const handleLeaderboardMessage = (data: any) => {
      console.log('🏆 Leaderboard message:', data);

      switch (data.type) {
        case 'connection_established':
          console.log('✅ Connected to leaderboard updates');
          break;

        case 'ranking_changed':
          const rankChange = data.old_rank - data.new_rank;
          if (rankChange > 0) {
            toast.showToast({
              type: 'success',
              title: 'Новая позиция в рейтинге!',
              message: `Вы поднялись на ${rankChange} ${rankChange === 1 ? 'место' : 'места'}! Место: ${data.new_rank}`,
              duration: 6000,
            });
          }
          break;

        case 'user_xp_updated':
          // Other user's XP updated - can be used to update leaderboard in real-time
          console.log(`User ${data.username} gained XP:`, data.xp);
          break;
      }
    };

    // Handle Streak Updates
    const handleStreakMessage = (data: any) => {
      console.log('🔥 Streak message:', data);

      switch (data.type) {
        case 'connection_established':
          console.log('✅ Connected to streak updates');
          break;

        case 'streak_updated':
          toast.streakUpdated(data.current_streak);
          refreshUser();
          break;

        case 'streak_milestone':
          toast.showToast({
            type: 'streak',
            title: `Milestone: ${data.milestone} дней!`,
            message: data.message,
            duration: 7000,
          });
          if (data.reward_xp > 0) {
            toast.xpGained(data.reward_xp, 0);
          }
          break;

        case 'streak_warning':
          toast.showToast({
            type: 'warning',
            title: 'Серия под угрозой!',
            message: `Осталось ${data.hours_remaining} часов. Завершите урок сегодня!`,
            duration: 8000,
          });
          break;
      }
    };

    // Connect to WebSockets
    const wsProgress = connectProgress(handleProgressMessage);
    const wsLeaderboard = connectLeaderboard(handleLeaderboardMessage);
    const wsStreak = connectStreak(handleStreakMessage);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting WebSockets...');
      wsService.disconnect('progress');
      wsService.disconnect('leaderboard');
      wsService.disconnect('streak');
      setIsConnected(false);
    };
  }, [isAuthenticated, user?.id, refreshUser]);

  const sendMessage = (endpoint: string, data: any) => {
    wsService.send(endpoint, data);
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, sendMessage }}>
      {children}

      {/* Toast Container */}
      <toast.ToastContainer />

      {/* Level Up Animation */}
      {showLevelUp && (
        <LevelUpAnimation
          level={newLevel}
          onComplete={() => setShowLevelUp(false)}
        />
      )}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
