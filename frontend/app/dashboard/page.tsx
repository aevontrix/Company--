'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { coursesAPI, analyticsAPI, type DailyActivity } from '@/lib/api';
import { wsService } from '@/lib/websocket';
import {
  Play,
  Target,
  Shield,
  Terminal,
  Bug,
  Check,
  Trophy,
  Star,
  Flame,
  Zap,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  category: string;
  progress: number;
  status: 'active' | 'paused' | 'locked';
  color: 'purple' | 'blue' | 'pink' | 'green' | 'orange';
  modulesCompleted: number;
  totalModules: number;
  timeLeft: string;
}

interface Quest {
  id: string;
  title: string;
  xpReward: number;
  completed: boolean;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  title: string;
  xp: number;
  isYou?: boolean;
}

// Icon mapping for courses
const courseIcons: Record<string, typeof Shield> = {
  purple: Shield,
  blue: Terminal,
  pink: Bug,
  green: Shield,
  orange: Terminal,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyActivity, setWeeklyActivity] = useState<DailyActivity[]>([]);

  // Load weekly activity data
  const loadActivity = async () => {
    try {
      const activities = await analyticsAPI.getWeeklyActivity();
      setWeeklyActivity(activities);
    } catch (error) {
      console.error('Failed to load weekly activity:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadActivity();
    }
  }, [user]);

  // ✅ NEW: WebSocket connection for real-time dashboard updates
  useEffect(() => {
    if (!user) return;

    const handleDashboardMessage = (data: any) => {
      console.log('📊 Dashboard update:', data);

      switch (data.type) {
        case 'dashboard_update':
          // Reload activity graph when dashboard data changes
          loadActivity();
          break;

        case 'xp_gained':
          // Show console log for XP gain (toast can be added later)
          console.log(`+${data.amount} XP earned`);
          loadActivity();
          break;

        case 'level_up':
          console.log(`🎉 Level up to ${data.new_level}!`);
          loadActivity();
          break;

        case 'lesson_completed':
          // Reload courses and activity when lesson is completed
          console.log('✅ Lesson completed');
          loadActivity();
          break;
      }
    };

    // ✅ FIX: Handle async connect properly
    wsService.connect('dashboard', handleDashboardMessage);

    return () => {
      wsService.disconnect('dashboard');
    };
  }, [user?.id]);

  // Load enrolled courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const response = await coursesAPI.getEnrolledCourses();
        const loadedCourses: Course[] = (response.results || []).slice(0, 3).map((course: any, index: number) => ({
          id: course.id.toString(),
          title: course.title,
          category: course.category || 'General',
          progress: Math.floor(Math.random() * 80) + 10,
          status: index === 0 ? 'active' : index === 1 ? 'paused' : 'locked',
          color: (['purple', 'blue', 'pink'] as const)[index % 3],
          modulesCompleted: Math.floor(Math.random() * 4) + 1,
          totalModules: 5,
          timeLeft: `${Math.floor(Math.random() * 6) + 1}ч осталось`,
        }));
        setCourses(loadedCourses);
      } catch (error) {
        // Default courses if API fails
        setCourses([
          {
            id: '1',
            title: 'Network Forensics',
            category: 'Blue Team • Advanced',
            progress: 75,
            status: 'active',
            color: 'purple',
            modulesCompleted: 3,
            totalModules: 4,
            timeLeft: '2ч осталось',
          },
          {
            id: '2',
            title: 'Linux Hardening',
            category: 'System Admin • Intermediate',
            progress: 30,
            status: 'paused',
            color: 'blue',
            modulesCompleted: 1,
            totalModules: 5,
            timeLeft: '6ч осталось',
          },
          {
            id: '3',
            title: 'Web Penetration',
            category: 'Red Team • Expert',
            progress: 0,
            status: 'locked',
            color: 'pink',
            modulesCompleted: 0,
            totalModules: 6,
            timeLeft: 'Откроется на 15 уровне',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, [user]);

  // Daily quests
  const quests: Quest[] = [
    { id: '1', title: 'Проанализируйте 5 PCAP файлов', xpReward: 50, completed: false },
    { id: '2', title: 'Настройте правила Firewall', xpReward: 30, completed: true },
  ];

  // Leaderboard
  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, username: 'Neo', title: 'The One', xp: 15400 },
    { rank: 2, username: 'Trinity', title: 'Operator', xp: 12300 },
    { rank: 3, username: user?.email?.split('@')[0] || 'Вы', title: 'Learner', xp: user?.xp || 0, isYou: true },
  ];

  const userProgress = 75;
  const userName = user?.email?.split('@')[0] || 'Alex';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome Hero Card */}
      <div className="cyber-card p-8 relative overflow-hidden group">
        {/* Gradient overlay */}
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex justify-between items-end">
          <div>
            <div className="text-xs font-mono text-primary mb-2">ТЕКУЩАЯ ЗАДАЧА</div>
            <h1 className="text-3xl font-bold font-display mb-4">С возвращением, {userName}</h1>
            <p className="text-text-secondary max-w-xl mb-6">
              Вы прошли {userProgress}% модуля &quot;Network Forensics&quot;. Завершите финальную лабораторную работу, чтобы разблокировать значок <span className="text-white font-medium">Packet Hunter</span>.
            </p>
            <button type="button" className="btn-primary">
              <Play size={16} fill="currentColor" />
              Продолжить обучение
            </button>
          </div>

          {/* Circular Progress */}
          <div className="hidden md:block circular-progress">
            <svg className="w-full h-full">
              <circle
                className="track"
                cx="64"
                cy="64"
                r="56"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                className="fill"
                cx="64"
                cy="64"
                r="56"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="351"
                strokeDashoffset={351 - (351 * userProgress) / 100}
              />
            </svg>
            <div className="value">{userProgress}%</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Learning Activity Chart */}
        <div className="lg:col-span-2 cyber-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold font-display">Активность обучения</h3>
            <select
              aria-label="Период времени"
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none"
              style={{
                colorScheme: 'dark',
              }}
            >
              <option value="week" style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>Эта неделя</option>
              <option value="month" style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>Этот месяц</option>
            </select>
          </div>
          <div className="chart-container flex items-end justify-between gap-2">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, i) => {
              // Get activity for this day (last 7 days in reverse order)
              const activityIndex = weeklyActivity.length - 7 + i;
              const activity = activityIndex >= 0 ? weeklyActivity[activityIndex] : null;

              // Calculate height based on time spent (max 2 hours = 100%)
              const maxMinutes = 120; // 2 hours
              const minutes = activity ? Math.floor(activity.time_spent / 60) : 0;
              const height = Math.min((minutes / maxMinutes) * 100, 100);

              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
                  <div
                    className="w-full rounded-t-lg transition-all duration-300 hover:opacity-80"
                    style={{
                      height: `${height || 5}%`, // Minimum 5% for visibility
                      background: height > 0 ? 'linear-gradient(180deg, #7c3aed 0%, #a78bfa 100%)' : 'rgba(255,255,255,0.05)',
                      boxShadow: height > 0 ? '0 0 10px rgba(124, 58, 237, 0.3)' : 'none',
                    }}
                    title={activity ? `${minutes} мин, ${activity.lessons_completed} уроков` : 'Нет данных'}
                  />
                  <span className="text-xs text-text-secondary">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Quests */}
        <div className="cyber-card p-6">
          <h3 className="font-bold font-display mb-4 flex items-center gap-2">
            <Target className="text-primary" size={18} />
            Ежедневные задания
          </h3>
          <div className="space-y-4">
            {quests.map((quest) => (
              <div
                key={quest.id}
                className={`quest-item ${quest.completed ? 'opacity-50' : ''}`}
              >
                <div className={`quest-checkbox ${quest.completed ? 'completed' : ''}`}>
                  {quest.completed && <Check size={12} className="text-primary" />}
                </div>
                <div>
                  <div className={`text-sm font-medium ${quest.completed ? 'line-through' : ''}`}>
                    {quest.title}
                  </div>
                  <div className="quest-xp">
                    {quest.completed ? 'Завершено' : `+${quest.xpReward} XP`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Modules */}
      <div>
        <h2 className="text-xl font-bold font-display mb-6">Активные модули</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const Icon = courseIcons[course.color] || Shield;
            const statusLabels = {
              active: 'АКТИВЕН',
              paused: 'ПАУЗА',
              locked: 'ЗАБЛОКИРОВАН',
            };
            return (
              <div
                key={course.id}
                className={`cyber-card module-card group ${course.status === 'locked' ? 'opacity-70' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`icon-wrapper ${course.color}`}>
                    <Icon size={24} />
                  </div>
                  <span className={`badge badge-${course.status}`}>
                    {statusLabels[course.status]}
                  </span>
                </div>

                <h3 className={`font-bold text-lg mb-1 group-hover:text-${course.color === 'purple' ? 'primary' : course.color === 'blue' ? 'blue-400' : 'pink-400'} transition`}>
                  {course.title}
                </h3>
                <p className="text-xs text-text-secondary mb-4">{course.category}</p>

                <div className="module-progress mb-2">
                  <div
                    className={`module-progress-fill ${course.color}`}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-text-secondary">
                  <span>Модуль {course.modulesCompleted}/{course.totalModules}</span>
                  <span>{course.timeLeft}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="cyber-card p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flame className="text-orange-400" size={20} />
            <span className="text-2xl font-bold font-display">{user?.streak || 14}</span>
          </div>
          <div className="text-xs text-text-secondary">Дней подряд</div>
        </div>

        <div className="cyber-card p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="text-primary" size={20} />
            <span className="text-2xl font-bold font-display">{user?.xp || 2450}</span>
          </div>
          <div className="text-xs text-text-secondary">Всего XP</div>
        </div>

        <div className="cyber-card p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="text-yellow-400" size={20} />
            <span className="text-2xl font-bold font-display">{user?.level || 12}</span>
          </div>
          <div className="text-xs text-text-secondary">Текущий уровень</div>
        </div>

        <div className="cyber-card p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="text-secondary" size={20} />
            <span className="text-2xl font-bold font-display">8</span>
          </div>
          <div className="text-xs text-text-secondary">Получено значков</div>
        </div>
      </div>

      {/* Leaderboard Preview */}
      <div className="cyber-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold font-display flex items-center gap-2">
            <Trophy className="text-yellow-400" size={18} />
            Топ студентов
          </h3>
          <Link href="/leaderboard" className="text-sm text-primary hover:underline">
            Показать все
          </Link>
        </div>

        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <div
              key={entry.rank}
              className={`leaderboard-item ${entry.isYou ? 'border-primary/30 bg-primary/5' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`leaderboard-rank ${entry.rank === 1 ? 'gold' : entry.rank === 2 ? 'silver' : 'bronze'}`}>
                  #{entry.rank}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary" />
                <div>
                  <div className="font-bold">{entry.username}</div>
                  <div className="text-xs text-text-secondary">{entry.title}</div>
                </div>
              </div>
              <div className="leaderboard-xp">{entry.xp.toLocaleString()} XP</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
