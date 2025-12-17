'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { friendsAPI, Friend, FriendRequest } from '@/lib/api';
import { User, LogOut, Trophy, Flame, Clock, BookOpen, Award, Users, UserPlus, Check, X, ChevronRight } from 'lucide-react';
import UserProgress from '@/components/UserProgress';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date | null;
}

export default function ProfilePage() {
  const { user, logout: authLogout } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'friends'>('overview');

  useEffect(() => {
    const loadFriendsData = async () => {
      if (!user) return;

      try {
        setLoadingFriends(true);
        const [friendsData, pendingData, sentData] = await Promise.all([
          friendsAPI.getFriends(),
          friendsAPI.getPendingRequests(),
          friendsAPI.getSentRequests(),
        ]);

        setFriends(friendsData.results || []);
        setPendingRequests(pendingData.results || []);
        setSentRequests(sentData.results || []);
      } catch (error) {
        console.error('Error loading friends:', error);
      } finally {
        setLoadingFriends(false);
      }
    };

    loadFriendsData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await authLogout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendsAPI.acceptFriendRequest(requestId);
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      const acceptedRequest = pendingRequests.find(req => req.id === requestId);
      if (acceptedRequest) {
        setFriends(prev => [...prev, acceptedRequest.from_user]);
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await friendsAPI.rejectFriendRequest(requestId);
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  // Not logged in state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="cyber-card p-12 text-center">
          <User size={48} className="mx-auto mb-4 text-text-secondary" />
          <p className="text-lg text-text-secondary">Необходимо войти в систему</p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="mt-6 px-6 py-3 bg-primary/20 border border-primary/40 rounded-xl text-white font-medium hover:bg-primary/30 transition-all"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  const xpProgress = user.xp ? (user.xp / ((user.level || 1) * 1000)) * 100 : 0;
  const achievements: Achievement[] = user.achievements || [];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold font-display mb-2 flex items-center gap-3">
            <User className="text-primary" />
            Профиль
          </h1>
          <p className="text-text-secondary">Управление аккаунтом и достижениями</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-text-secondary hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all flex items-center gap-2"
        >
          <LogOut size={18} />
          Выйти
        </button>
      </div>

      {/* Profile Card */}
      <div className="cyber-card p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-primary/40 flex items-center justify-center text-6xl">
              {user.xp === 0 ? '🌱' : (user.xp || 0) > 5000 ? '🌳' : '🌿'}
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold">
              {user.level || 1}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold mb-2">
              {user.first_name || user.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-text-secondary mb-4">{user.email}</p>

            {/* XP Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-primary font-medium">Level {user.level || 1}</span>
                <span className="text-text-secondary">
                  {(user.xp || 0).toLocaleString()} / {((user.level || 1) * 1000).toLocaleString()} XP
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.min(xpProgress, 100)}%` }} />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
                  <Flame size={18} />
                  <span className="text-xl font-bold">{user.streak || 0}</span>
                </div>
                <div className="text-xs text-text-secondary">Streak</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <div className="flex items-center justify-center gap-1 text-primary mb-1">
                  <Trophy size={18} />
                  <span className="text-xl font-bold">{achievements.length}</span>
                </div>
                <div className="text-xs text-text-secondary">Достижений</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                  <BookOpen size={18} />
                  <span className="text-xl font-bold">{user.completed_courses?.length || 0}</span>
                </div>
                <div className="text-xs text-text-secondary">Курсов</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { id: 'overview', label: 'Обзор', icon: User },
          { id: 'achievements', label: 'Достижения', icon: Award },
          { id: 'friends', label: 'Друзья', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-primary/20 border-primary/40 text-white'
                : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10'
            } border`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.id === 'friends' && pendingRequests.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* User Progress Component */}
          <UserProgress variant="full" />

          {/* Recent Activity */}
          <div className="cyber-card p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="text-primary" size={20} />
              Недавняя активность
            </h3>
            <div className="space-y-3">
              {user.completed_courses && user.completed_courses.length > 0 ? (
                user.completed_courses.slice(0, 5).map((courseId: string, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Check size={16} className="text-green-400" />
                    </div>
                    <span className="text-sm">Курс #{courseId} завершен</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  <Clock size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Пока нет активности</p>
                  <p className="text-sm mt-1">Начните изучать курсы!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="cyber-card p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award className="text-primary" size={20} />
            Достижения
          </h3>
          {achievements.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-xl text-center transition-all ${
                    achievement.unlockedAt
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-white/5 border border-white/10 opacity-50 grayscale'
                  }`}
                >
                  <div className="text-4xl mb-2">
                    {achievement.unlockedAt ? achievement.icon : '🔒'}
                  </div>
                  <div className="font-medium text-sm mb-1">{achievement.title}</div>
                  <div className="text-xs text-text-secondary">{achievement.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-text-secondary">
              <Award size={48} className="mx-auto mb-4 opacity-50" />
              <p>Пока нет достижений</p>
              <p className="text-sm mt-1">Выполняйте задания, чтобы получить награды!</p>
            </div>
          )}
        </div>
      )}

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div className="space-y-6">
          {/* Find Friends Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/users')}
              className="px-5 py-2.5 bg-primary/20 border border-primary/40 rounded-xl text-white font-medium hover:bg-primary/30 transition-all flex items-center gap-2"
            >
              <UserPlus size={18} />
              Найти друзей
            </button>
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="cyber-card p-6 border-orange-500/30">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-orange-400">
                <Users size={20} />
                Входящие запросы ({pendingRequests.length})
              </h3>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                  >
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => router.push(`/profile/${request.from_user.id}`)}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/40 flex items-center justify-center text-2xl">
                        {request.from_user.xp === 0 ? '🌱' : request.from_user.xp > 5000 ? '🌳' : '🌿'}
                      </div>
                      <div>
                        <div className="font-medium">
                          {request.from_user.first_name} {request.from_user.last_name}
                        </div>
                        <div className="text-sm text-text-secondary">
                          Level {request.from_user.level} • {request.from_user.xp} XP
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAcceptRequest(request.id)}
                        className="p-2 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400 hover:bg-green-500/30 transition-all"
                        aria-label="Accept request"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectRequest(request.id)}
                        className="p-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 hover:bg-red-500/30 transition-all"
                        aria-label="Reject request"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          <div className="cyber-card p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="text-primary" size={20} />
              Мои друзья ({friends.length})
            </h3>
            {loadingFriends ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : friends.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => router.push(`/profile/${friend.id}`)}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/40 flex items-center justify-center text-lg">
                        {friend.xp === 0 ? '🌱' : friend.xp > 5000 ? '🌳' : '🌿'}
                      </div>
                      <div>
                        <div className="font-medium">
                          {friend.first_name} {friend.last_name}
                        </div>
                        <div className="text-sm text-text-secondary">
                          Level {friend.level} • {friend.xp} XP
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-text-secondary group-hover:text-primary transition-colors" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-text-secondary">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>У вас пока нет друзей</p>
                <p className="text-sm mt-1">Найдите друзей и учитесь вместе!</p>
              </div>
            )}
          </div>

          {/* Sent Requests */}
          {sentRequests.length > 0 && (
            <div className="cyber-card p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-text-secondary">
                <UserPlus size={20} />
                Отправленные запросы ({sentRequests.length})
              </h3>
              <div className="space-y-3">
                {sentRequests.map((request) => (
                  <div
                    key={request.id}
                    onClick={() => router.push(`/profile/${request.to_user.id}`)}
                    className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/40 flex items-center justify-center text-lg">
                      {request.to_user.xp === 0 ? '🌱' : request.to_user.xp > 5000 ? '🌳' : '🌿'}
                    </div>
                    <div>
                      <div className="font-medium">
                        {request.to_user.first_name} {request.to_user.last_name}
                      </div>
                      <div className="text-sm text-text-secondary">Ожидает подтверждения</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
