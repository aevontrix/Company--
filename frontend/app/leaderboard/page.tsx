'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { gamificationAPI } from '@/lib/api';
import { connectLeaderboard, wsService } from '@/lib/websocket';
import { Trophy, Flame, Zap, Timer, ChevronUp, ChevronDown, Search } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  level: number;
  xp: number;
  streak: number;
  rankChange: number;
  isYou?: boolean;
}

type TabType = 'global' | 'weekly' | 'friends';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState({ days: 3, hours: 14, minutes: 27 });

  // Load leaderboard
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await gamificationAPI.getLeaderboard({ limit: 50, period: 'all_time' });

        const data = response.results.map((entry: any, index: number) => ({
          rank: index + 1,
          userId: entry.user__id?.toString() || entry.id?.toString(),
          username: entry.user__first_name || entry.user__username || 'Unknown',
          level: entry.level || 1,
          xp: entry.xp || 0,
          streak: entry.streak || 0,
          rankChange: 0,
          isYou: entry.user__id?.toString() === user?.id?.toString(),
        }));

        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [activeTab, user]);

  // Subscribe to WebSocket updates for real-time leaderboard changes
  useEffect(() => {
    if (!user) return;

    const handleLeaderboardUpdate = (data: any) => {
      console.log('🏆 Leaderboard update received:', data);

      if (data.type === 'user_xp_updated') {
        // Update specific user's XP and level in the leaderboard
        setLeaderboard((prev) => {
          const updatedLeaderboard = prev.map((entry) => {
            if (entry.userId === data.user_id?.toString()) {
              return {
                ...entry,
                xp: data.xp || entry.xp,
                level: data.level || entry.level,
              };
            }
            return entry;
          });

          // Re-sort and re-rank the leaderboard based on XP
          const sortedLeaderboard = [...updatedLeaderboard].sort((a, b) => b.xp - a.xp);

          // Update ranks and calculate rank changes
          return sortedLeaderboard.map((entry, index) => {
            const oldRank = entry.rank;
            const newRank = index + 1;
            return {
              ...entry,
              rank: newRank,
              rankChange: oldRank - newRank, // Positive means moved up
              isYou: entry.userId === user?.id?.toString(),
            };
          });
        });
      }

      if (data.type === 'ranking_changed') {
        // Full leaderboard refresh when rankings change significantly
        console.log('📊 Rankings changed, refreshing leaderboard...');
        // Optionally trigger a full reload here if needed
      }
    };

    // Connect to leaderboard WebSocket
    const ws = connectLeaderboard(handleLeaderboardUpdate);

    return () => {
      // Cleanup WebSocket connection
      if (ws) {
        wsService.disconnect('leaderboard');
      }
    };
  }, [user]);

  // Tournament countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        let { days, hours, minutes } = prev;
        if (minutes > 0) minutes--;
        else if (hours > 0) { hours--; minutes = 59; }
        else if (days > 0) { days--; hours = 23; minutes = 59; }
        return { days, hours, minutes };
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredLeaderboard = searchQuery
    ? leaderboard.filter((entry) =>
        entry.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : leaderboard;

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-text-secondary';
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display mb-2 flex items-center gap-3">
          <Trophy className="text-yellow-400" />
          Рейтинг
        </h1>
        <p className="text-text-secondary">Соревнуйтесь с учащимися со всего мира</p>
      </div>

      {/* Tournament Timer */}
      <div className="cyber-card p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Timer className="text-primary" size={20} />
          <span className="text-sm text-text-secondary">Недельный турнир заканчивается через:</span>
        </div>
        <div className="flex items-center gap-2 text-lg font-bold font-display">
          <span className="text-primary">{timeRemaining.days}д</span>
          <span className="text-text-secondary">:</span>
          <span className="text-primary">{timeRemaining.hours}ч</span>
          <span className="text-text-secondary">:</span>
          <span className="text-primary">{timeRemaining.minutes}м</span>
        </div>
      </div>

      {/* Your Rank Card */}
      {user && (
        <div className="cyber-card p-6 mb-6 border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold">
                {leaderboard.find(e => e.isYou)?.rank || '-'}
              </div>
              <div>
                <div className="font-bold text-lg">{user.first_name || user.email?.split('@')[0]}</div>
                <div className="text-sm text-text-secondary">Level {user.level}</div>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-xs text-text-secondary mb-1">Опыт</div>
                <div className="text-xl font-bold text-primary">{user.xp?.toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-text-secondary mb-1">Серия</div>
                <div className="flex items-center gap-1 text-xl font-bold text-orange-400">
                  <Flame size={18} />
                  {user.streak}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {(['global', 'weekly', 'friends'] as TabType[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-primary/20 border-primary/40 text-white'
                : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10'
            } border`}
          >
            {tab === 'global' && '🌍 Глобальный'}
            {tab === 'weekly' && '📅 За неделю'}
            {tab === 'friends' && '👥 Друзья'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
        <input
          type="text"
          placeholder="Поиск игроков..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-search w-full pl-12"
        />
      </div>

      {/* Leaderboard Table */}
      <div className="cyber-card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-medium text-text-secondary uppercase">
          <div className="col-span-1">Место</div>
          <div className="col-span-5">Игрок</div>
          <div className="col-span-2 text-right hidden sm:block">Уровень</div>
          <div className="col-span-2 text-right">Опыт</div>
          <div className="col-span-2 text-right hidden sm:block">Серия</div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredLeaderboard.length === 0 && (
          <div className="text-center py-16">
            <Trophy size={48} className="mx-auto mb-4 text-text-secondary" />
            <p className="text-text-secondary">Игроки не найдены</p>
          </div>
        )}

        {/* Rows */}
        {!loading && filteredLeaderboard.map((entry, index) => (
          <div
            key={entry.userId}
            className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors hover:bg-white/5 ${
              entry.isYou ? 'bg-primary/10 border-l-2 border-l-primary' : ''
            } ${index < filteredLeaderboard.length - 1 ? 'border-b border-white/5' : ''}`}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            {/* Rank */}
            <div className="col-span-1">
              <div className={`font-bold text-lg ${getRankStyle(entry.rank)}`}>
                {entry.rank <= 3 ? (
                  <span className="text-2xl">
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  `#${entry.rank}`
                )}
              </div>
            </div>

            {/* Player */}
            <div className="col-span-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-lg">
                {entry.xp > 5000 ? '🌳' : entry.xp > 1000 ? '🌿' : '🌱'}
              </div>
              <div>
                <div className="font-medium flex items-center gap-2">
                  {entry.username}
                  {entry.isYou && (
                    <span className="text-xs text-primary font-bold">(Вы)</span>
                  )}
                </div>
                {entry.rankChange !== 0 && (
                  <div className={`text-xs flex items-center gap-1 ${
                    entry.rankChange > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {entry.rankChange > 0 ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {Math.abs(entry.rankChange)}
                  </div>
                )}
              </div>
            </div>

            {/* Level */}
            <div className="col-span-2 text-right hidden sm:block">
              <span className="text-text-secondary">Lvl</span>{' '}
              <span className="font-medium">{entry.level}</span>
            </div>

            {/* XP */}
            <div className="col-span-2 text-right">
              <span className="font-bold text-primary">{entry.xp.toLocaleString()}</span>
            </div>

            {/* Streak */}
            <div className="col-span-2 text-right hidden sm:flex items-center justify-end gap-1">
              <Flame size={14} className="text-orange-400" />
              <span className="font-medium text-orange-400">{entry.streak}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Results count */}
      {!loading && filteredLeaderboard.length > 0 && (
        <div className="text-center mt-4 text-sm text-text-secondary">
          Показано {filteredLeaderboard.length} из {leaderboard.length} игроков
        </div>
      )}
    </div>
  );
}
