'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { learningAPI } from '@/lib/api';
import { connectProgress, wsService } from '@/lib/websocket';
import { Trophy, Flame, Clock, BookOpen, Award, Target, TrendingUp } from 'lucide-react';
import { formatTime } from '@/lib/hooks/useLessonTimeTracking';

interface ProgressStats {
  total_lessons_completed: number;
  total_time_spent: number;
  average_score: number;
  courses_in_progress: number;
  total_courses: number;
  completed_courses: number;
}

interface UserProgressProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export default function UserProgress({ variant = 'full', className = '' }: UserProgressProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProgressStats>({
    total_lessons_completed: 0,
    total_time_spent: 0,
    average_score: 0,
    courses_in_progress: 0,
    total_courses: 0,
    completed_courses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Load enrollments to calculate stats
        const enrollmentsResponse = await learningAPI.getEnrollments();

        // ✅ Fix: Handle paginated response correctly
        const enrollments = Array.isArray(enrollmentsResponse?.results)
          ? enrollmentsResponse.results
          : Array.isArray(enrollmentsResponse)
            ? enrollmentsResponse
            : [];

        // Calculate stats from enrollments
        let totalLessonsCompleted = 0;
        let totalTimeSpent = 0;
        let totalScores = 0;
        let scoresCount = 0;
        let coursesInProgress = 0;
        let completedCourses = 0;

        enrollments.forEach((enrollment: any) => {
          if (enrollment.completed) {
            completedCourses++;
          } else if (enrollment.progress > 0) {
            coursesInProgress++;
          }

          if (enrollment.lessons_completed) {
            totalLessonsCompleted += enrollment.lessons_completed;
          }

          if (enrollment.total_time_spent) {
            totalTimeSpent += enrollment.total_time_spent;
          }

          if (enrollment.average_score) {
            totalScores += enrollment.average_score;
            scoresCount++;
          }
        });

        setStats({
          total_lessons_completed: totalLessonsCompleted,
          total_time_spent: totalTimeSpent,
          average_score: scoresCount > 0 ? Math.round(totalScores / scoresCount) : 0,
          courses_in_progress: coursesInProgress,
          total_courses: enrollments.length,
          completed_courses: completedCourses,
        });
      } catch (error) {
        console.error('Failed to load progress stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Subscribe to WebSocket updates for real-time progress changes
    const handleProgressUpdate = (data: any) => {
      console.log('📊 UserProgress received update:', data);

      if (data.type === 'progress_updated') {
        // Reload stats when progress is updated
        loadStats();
      }
      if (data.type === 'lesson_completed') {
        // Increment lessons completed immediately
        setStats((prev) => ({
          ...prev,
          total_lessons_completed: prev.total_lessons_completed + 1,
        }));
        // Then reload full stats
        setTimeout(() => loadStats(), 1000);
      }
    };

    // Connect to progress WebSocket (only if user exists)
    let ws: WebSocket | null = null;
    if (user) {
      ws = connectProgress(handleProgressUpdate);
    }

    return () => {
      // Cleanup WebSocket connection
      if (ws) {
        wsService.disconnect('progress');
      }
    };
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <div className={`cyber-card p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`cyber-card p-4 ${className}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
              <BookOpen size={16} />
              <span className="text-lg font-bold">{stats.total_lessons_completed}</span>
            </div>
            <div className="text-xs text-text-secondary">Уроков</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
              <Clock size={16} />
              <span className="text-lg font-bold">{Math.floor(stats.total_time_spent / 60)}</span>
            </div>
            <div className="text-xs text-text-secondary">Минут</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
              <Flame size={16} />
              <span className="text-lg font-bold">{user.streak}</span>
            </div>
            <div className="text-xs text-text-secondary">Серия</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Trophy size={16} />
              <span className="text-lg font-bold">{user.xp}</span>
            </div>
            <div className="text-xs text-text-secondary">XP</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`cyber-card p-6 ${className}`}>
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <TrendingUp className="text-primary" size={24} />
        Прогресс обучения
      </h3>

      {/* Main Stats Grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Lessons Completed */}
        <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <BookOpen size={20} className="text-green-400" />
              </div>
              <span className="text-sm text-text-secondary">Уроков пройдено</span>
            </div>
            <span className="text-2xl font-bold text-green-400">{stats.total_lessons_completed}</span>
          </div>
        </div>

        {/* Time Spent */}
        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Clock size={20} className="text-blue-400" />
              </div>
              <span className="text-sm text-text-secondary">Время обучения</span>
            </div>
            <span className="text-2xl font-bold text-blue-400">{formatTime(stats.total_time_spent)}</span>
          </div>
        </div>

        {/* Average Score */}
        <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Award size={20} className="text-yellow-400" />
              </div>
              <span className="text-sm text-text-secondary">Средняя оценка</span>
            </div>
            <span className="text-2xl font-bold text-yellow-400">
              {stats.average_score > 0 ? `${stats.average_score}%` : '-'}
            </span>
          </div>
        </div>

        {/* Current Streak */}
        <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Flame size={20} className="text-orange-400" />
              </div>
              <span className="text-sm text-text-secondary">Текущая серия</span>
            </div>
            <span className="text-2xl font-bold text-orange-400">{user.streak} дней</span>
          </div>
        </div>
      </div>

      {/* Course Progress */}
      <div className="p-4 bg-white/5 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-primary" />
            <span className="text-sm font-medium">Курсы</span>
          </div>
          <span className="text-sm text-text-secondary">
            {stats.completed_courses} / {stats.total_courses} завершено
          </span>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar mb-3">
          <div
            className="progress-fill"
            style={{
              width: `${stats.total_courses > 0 ? (stats.completed_courses / stats.total_courses) * 100 : 0}%`
            }}
          />
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-primary">{stats.total_courses}</div>
            <div className="text-xs text-text-secondary">Всего</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-400">{stats.courses_in_progress}</div>
            <div className="text-xs text-text-secondary">В процессе</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-400">{stats.completed_courses}</div>
            <div className="text-xs text-text-secondary">Завершено</div>
          </div>
        </div>
      </div>

      {/* XP and Level */}
      <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-primary" />
            <span className="text-sm font-medium">Уровень {user.level}</span>
          </div>
          <span className="text-sm text-text-secondary">
            {user.xp?.toLocaleString()} / {((user.level || 1) * 1000).toLocaleString()} XP
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min((user.xp || 0) / ((user.level || 1) * 1000) * 100, 100)}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}
