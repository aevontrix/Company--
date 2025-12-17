'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI, friendsAPI, Friend, FriendRequest } from '@/lib/api';
import { Users, Search, UserPlus, Check, Clock, ChevronLeft } from 'lucide-react';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  xp: number;
  level: number;
}

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        const [usersData, friendsData, sentData] = await Promise.all([
          authAPI.getAllUsers(),
          friendsAPI.getFriends(),
          friendsAPI.getSentRequests(),
        ]);

        setUsers(usersData.results || []);
        setFriends(friendsData.results || []);
        setSentRequests(sentData.results || []);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser, router]);

  const handleSendRequest = async (userId: number) => {
    try {
      await friendsAPI.sendFriendRequest(userId);
      const sentData = await friendsAPI.getSentRequests();
      setSentRequests(sentData.results || []);
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };

  const isFriend = (userId: number) => friends.some((f) => f.id === userId);
  const hasRequestSent = (userId: number) => sentRequests.some((req) => req.to_user.id === userId);

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const email = user.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Загрузка пользователей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-4xl font-bold font-display flex items-center gap-3">
            <Users className="text-primary" />
            Поиск пользователей
          </h1>
          <p className="text-text-secondary mt-1">Найдите друзей и учитесь вместе</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
        <input
          type="text"
          placeholder="Поиск по имени или email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-text-secondary focus:outline-none focus:border-primary/40 transition-all"
        />
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <div className="px-5 py-3 bg-primary/10 border border-primary/30 rounded-xl text-sm font-medium text-primary">
          Найдено: {filteredUsers.length}
        </div>
        <div className="px-5 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-sm font-medium text-green-400">
          Друзей: {friends.length}
        </div>
        <div className="px-5 py-3 bg-secondary/10 border border-secondary/30 rounded-xl text-sm font-medium text-secondary">
          Запросов: {sentRequests.length}
        </div>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="cyber-card p-16 text-center">
          <Search size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
          <p className="text-text-secondary">Пользователи не найдены</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const friend = isFriend(user.id);
            const requestSent = hasRequestSent(user.id);
            const userAvatar = user.xp === 0 ? '🌱' : user.xp > 5000 ? '🌳' : '🌿';

            return (
              <div key={user.id} className="cyber-card p-5 hover:border-primary/30 transition-all">
                <div
                  className="cursor-pointer mb-4"
                  onClick={() => router.push(`/profile/${user.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-primary/40 flex items-center justify-center text-3xl">
                      {userAvatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-text-secondary truncate">{user.email}</div>
                      <div className="text-xs text-primary font-medium mt-1">
                        Level {user.level} • {user.xp} XP
                      </div>
                    </div>
                  </div>
                </div>

                {friend ? (
                  <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm font-medium">
                    <Check size={16} />
                    Уже в друзьях
                  </div>
                ) : requestSent ? (
                  <div className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-text-secondary text-sm font-medium">
                    <Clock size={16} />
                    Запрос отправлен
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendRequest(user.id)}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-primary/20 border border-primary/40 rounded-xl text-white text-sm font-medium hover:bg-primary/30 transition-all"
                  >
                    <UserPlus size={16} />
                    Добавить в друзья
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
