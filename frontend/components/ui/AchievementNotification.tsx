'use client';

import { useEffect, useState } from 'react';

// ============================================================
// ACHIEVEMENT NOTIFICATION COMPONENT
// ============================================================
// Beautiful animated notification for badges, level-ups, achievements
// Inspired by Duolingo, Khan Academy, PlayStation trophies
// ============================================================

export interface AchievementData {
  type: 'badge' | 'level_up' | 'achievement';
  title: string;
  description: string;
  icon: string; // emoji or icon name
  xp?: number;
  level?: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Props {
  achievement: AchievementData | null;
  onClose: () => void;
  duration?: number;
}

export default function AchievementNotification({ achievement, onClose, duration = 5000 }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (achievement) {
      // Entry animation
      setTimeout(() => setIsVisible(true), 10);

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [achievement, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      onClose();
    }, 300);
  };

  if (!achievement) return null;

  const getRarityColor = () => {
    switch (achievement.rarity) {
      case 'legendary':
        return {
          gradient: 'linear-gradient(135deg, #FFD700, #FFA500)',
          glow: 'rgba(255, 215, 0, 0.6)',
          border: 'rgba(255, 215, 0, 0.8)',
        };
      case 'epic':
        return {
          gradient: 'linear-gradient(135deg, #9333EA, #DB2777)',
          glow: 'rgba(147, 51, 234, 0.6)',
          border: 'rgba(147, 51, 234, 0.8)',
        };
      case 'rare':
        return {
          gradient: 'linear-gradient(135deg, #4DBDFF, #B13CFF)',
          glow: 'rgba(77, 189, 255, 0.6)',
          border: 'rgba(77, 189, 255, 0.8)',
        };
      default:
        return {
          gradient: 'linear-gradient(135deg, #10B981, #059669)',
          glow: 'rgba(16, 185, 129, 0.6)',
          border: 'rgba(16, 185, 129, 0.8)',
        };
    }
  };

  const colors = getRarityColor();

  const getTypeLabel = () => {
    switch (achievement.type) {
      case 'badge':
        return '🏆 Badge Unlocked';
      case 'level_up':
        return `⬆️ Level ${achievement.level}!`;
      case 'achievement':
        return '🎯 Achievement';
      default:
        return 'Achievement';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: isVisible && !isExiting ? '20px' : '-400px',
        zIndex: 10000,
        maxWidth: '380px',
        width: '100%',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isVisible && !isExiting ? 'scale(1)' : 'scale(0.9)',
        opacity: isVisible && !isExiting ? 1 : 0,
      }}
    >
      <div
        style={{
          padding: '20px',
          borderRadius: '16px',
          background: 'rgba(0, 0, 0, 0.95)',
          border: `2px solid ${colors.border}`,
          backdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: `0 0 40px ${colors.glow}, 0 8px 32px rgba(0, 0, 0, 0.4)`,
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={handleClose}
      >
        {/* Glow Effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: colors.gradient,
            opacity: 0.1,
            pointerEvents: 'none',
          }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '6px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#FFFFFF',
            fontSize: '18px',
            transition: 'all 0.2s',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          ×
        </button>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Type Label */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: colors.border,
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              textShadow: `0 0 10px ${colors.glow}`,
            }}
          >
            {getTypeLabel()}
          </div>

          {/* Main Content */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Icon */}
            <div
              style={{
                fontSize: '64px',
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                background: colors.gradient,
                boxShadow: `0 0 30px ${colors.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
                flexShrink: 0,
                animation: 'pulse 2s ease-in-out infinite',
              }}
            >
              {achievement.icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginBottom: '4px',
                  lineHeight: '1.3',
                }}
              >
                {achievement.title}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.4',
                }}
              >
                {achievement.description}
              </div>
              {achievement.xp && (
                <div
                  style={{
                    marginTop: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    background: 'rgba(77, 189, 255, 0.2)',
                    border: '1px solid rgba(77, 189, 255, 0.4)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#4DBDFF',
                  }}
                >
                  +{achievement.xp} XP
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// ACHIEVEMENT NOTIFICATION MANAGER (Global State)
// ============================================================

let showAchievementCallback: ((achievement: AchievementData) => void) | null = null;

export const AchievementNotifications = {
  // Register the show function
  setShow: (callback: (achievement: AchievementData) => void) => {
    showAchievementCallback = callback;
  },

  // Show achievement notification
  show: (achievement: AchievementData) => {
    if (showAchievementCallback) {
      showAchievementCallback(achievement);
    } else {
      console.warn('AchievementNotification not initialized. Add <AchievementNotificationProvider /> to your app.');
    }
  },

  // Convenience methods
  showBadge: (title: string, description: string, icon: string, xp?: number, rarity?: AchievementData['rarity']) => {
    AchievementNotifications.show({
      type: 'badge',
      title,
      description,
      icon,
      xp,
      rarity,
    });
  },

  showLevelUp: (level: number, xp?: number) => {
    AchievementNotifications.show({
      type: 'level_up',
      title: `Level ${level} Reached!`,
      description: `You've reached level ${level}! Keep learning to unlock more rewards.`,
      icon: '🎉',
      level,
      xp,
      rarity: level >= 10 ? 'epic' : 'rare',
    });
  },

  showAchievement: (title: string, description: string, icon: string, xp?: number, rarity?: AchievementData['rarity']) => {
    AchievementNotifications.show({
      type: 'achievement',
      title,
      description,
      icon,
      xp,
      rarity,
    });
  },
};

// ============================================================
// PROVIDER COMPONENT
// ============================================================

export function AchievementNotificationProvider({ children }: { children: React.ReactNode }) {
  const [currentAchievement, setCurrentAchievement] = useState<AchievementData | null>(null);

  useEffect(() => {
    AchievementNotifications.setShow(setCurrentAchievement);
  }, []);

  return (
    <>
      {children}
      <AchievementNotification
        achievement={currentAchievement}
        onClose={() => setCurrentAchievement(null)}
      />
    </>
  );
}
