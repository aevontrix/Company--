'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { gamificationAPI, GamificationStats } from '@/lib/api';

export default function GamificationWidget() {
  const { user } = useAuth();
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Load stats and auto-refresh on user changes
  useEffect(() => {
    loadStats();
  }, [user]); // Re-load when user changes (XP/level updates)

  const loadStats = async () => {
    try {
      const data = await gamificationAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading gamification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress from user data if available (for instant updates)
  const currentProgress = useMemo(() => {
    if (!stats || !user) return stats;

    // Calculate XP needed for next level: XP = 100 * level²
    const currentLevelXP = 100 * user.level * user.level;
    const nextLevelXP = 100 * (user.level + 1) * (user.level + 1);
    const xpNeeded = nextLevelXP - currentLevelXP;
    const xpCurrent = user.xp - currentLevelXP;
    const percentage = Math.min(100, Math.max(0, (xpCurrent / xpNeeded) * 100));

    return {
      ...stats,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      badges: user.badges || stats.badges,
      progress: {
        current: xpCurrent,
        needed: xpNeeded,
        percentage: Math.round(percentage),
      },
    };
  }, [stats, user]);

  if (loading || !currentProgress) {
    return null;
  }

  const displayStats = currentProgress;

  return (
    <div
      style={{
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        marginBottom: '24px',
      }}
      className="gamification-widget"
    >
      {/* Level & XP */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4DBDFF, #B13CFF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 800,
            color: '#FFFFFF',
            boxShadow: '0 0 30px rgba(77, 189, 255, 0.5)',
          }}
        >
          {displayStats.level}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', color: '#888888', marginBottom: '4px' }}>
            Уровень {displayStats.level}
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${displayStats.progress.percentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #4DBDFF, #B13CFF)',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#888888', marginTop: '4px' }}>
            {displayStats.progress.current} / {displayStats.progress.needed} XP
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div
          style={{
            padding: '12px',
            background: 'rgba(77, 189, 255, 0.1)',
            border: '1px solid rgba(77, 189, 255, 0.3)',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>⭐</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#4DBDFF', marginBottom: '2px' }}>
            {displayStats.xp.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#888888' }}>Total XP</div>
        </div>

        <div
          style={{
            padding: '12px',
            background: 'rgba(255, 159, 64, 0.1)',
            border: '1px solid rgba(255, 159, 64, 0.3)',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>🔥</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#FF9F40', marginBottom: '2px' }}>
            {displayStats.streak}
          </div>
          <div style={{ fontSize: '11px', color: '#888888' }}>День подряд</div>
        </div>

        <div
          style={{
            padding: '12px',
            background: 'rgba(177, 60, 255, 0.1)',
            border: '1px solid rgba(177, 60, 255, 0.3)',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏆</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#B13CFF', marginBottom: '2px' }}>
            {displayStats.badges.length}
          </div>
          <div style={{ fontSize: '11px', color: '#888888' }}>Значков</div>
        </div>
      </div>

      {/* Recent Badges */}
      {displayStats.badges.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '12px', color: '#888888', marginBottom: '8px', fontWeight: 600 }}>
            Последние достижения:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {displayStats.badges.slice(-5).reverse().map((badge) => (
              <div
                key={badge.id}
                title={badge.name}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span>{badge.emoji}</span>
                <span style={{ color: '#FFFFFF', fontSize: '11px' }}>{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .gamification-widget {
            padding: 16px !important;
            margin-bottom: 16px !important;
          }

          .gamification-widget > div:first-child {
            flex-direction: column !important;
            text-align: center !important;
          }

          .gamification-widget > div:nth-child(2) {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
        }

        @media (max-width: 480px) {
          .gamification-widget {
            padding: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
