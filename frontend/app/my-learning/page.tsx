'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { coursesAPI, learningAPI } from '@/lib/api';
import { BookOpen, Trophy, Flame, Clock, Award, Play, CheckCircle, BookMarked, ChevronRight } from 'lucide-react';
import UserProgress from '@/components/UserProgress';

interface EnrolledCourse {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;
  category: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lastAccessedDate: string;
  nextLesson: string;
  estimatedTimeLeft: string;
  status: 'in-progress' | 'completed' | 'not-started';
  hasCertificate: boolean;
  certificateEarned: boolean;
}

type ViewMode = 'in-progress' | 'completed' | 'all';

export default function MyLearningPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('in-progress');
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEnrolledCourses = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const courses = await coursesAPI.getEnrolledCourses();

        const transformedCourses: EnrolledCourse[] = (courses.results || []).map((course: any) => ({
          id: course.id.toString(),
          slug: course.slug,
          title: course.title,
          thumbnail: course.thumbnail || '📚',
          category: course.category_name || 'General',
          progress: 0,
          totalLessons: course.modules_count || 0,
          completedLessons: 0,
          lastAccessedDate: 'Недавно',
          nextLesson: 'Продолжить обучение',
          estimatedTimeLeft: course.duration_hours ? `${course.duration_hours} ч` : 'N/A',
          status: 'in-progress' as const,
          hasCertificate: true,
          certificateEarned: false,
        }));

        setEnrolledCourses(transformedCourses);
      } catch (error) {
        console.error('Failed to load enrolled courses:', error);
        setEnrolledCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadEnrolledCourses();
  }, [user]);

  const handleContinueLearning = async (course: EnrolledCourse) => {
    try {
      const lastLesson = await learningAPI.getLastLesson(course.id) as any;
      if (lastLesson && lastLesson.lesson_id) {
        router.push(`/courses/${course.slug}/${lastLesson.lesson_id}`);
      } else {
        router.push(`/courses/${course.slug}`);
      }
    } catch (error) {
      router.push(`/courses/${course.slug}`);
    }
  };

  const stats = useMemo(() => ({
    enrolledCourses: user?.enrolled_courses?.length || 0,
    completedCourses: user?.completed_courses?.length || 0,
    totalXP: user?.xp || 0,
    currentStreak: user?.streak || 0,
  }), [user]);

  const filteredCourses = useMemo(() => {
    switch (viewMode) {
      case 'in-progress':
        return enrolledCourses.filter((c) => c.status === 'in-progress');
      case 'completed':
        return enrolledCourses.filter((c) => c.status === 'completed');
      default:
        return enrolledCourses;
    }
  }, [viewMode, enrolledCourses]);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display mb-2 flex items-center gap-3">
          <BookOpen className="text-primary" />
          Моё обучение
        </h1>
        <p className="text-text-secondary">Отслеживайте прогресс и продолжайте учиться</p>
      </div>

      {/* User Progress Component */}
      <UserProgress variant="compact" className="mb-8" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="cyber-card p-4 text-center">
          <BookOpen className="mx-auto mb-2 text-primary" size={24} />
          <div className="text-2xl font-bold text-primary">{stats.enrolledCourses}</div>
          <div className="text-xs text-text-secondary">Записан на курсы</div>
        </div>
        <div className="cyber-card p-4 text-center">
          <CheckCircle className="mx-auto mb-2 text-green-400" size={24} />
          <div className="text-2xl font-bold text-green-400">{stats.completedCourses}</div>
          <div className="text-xs text-text-secondary">Завершено</div>
        </div>
        <div className="cyber-card p-4 text-center">
          <Trophy className="mx-auto mb-2 text-yellow-400" size={24} />
          <div className="text-2xl font-bold text-yellow-400">{stats.totalXP.toLocaleString()}</div>
          <div className="text-xs text-text-secondary">Всего XP</div>
        </div>
        <div className="cyber-card p-4 text-center">
          <Flame className="mx-auto mb-2 text-orange-400" size={24} />
          <div className="text-2xl font-bold text-orange-400">{stats.currentStreak}</div>
          <div className="text-xs text-text-secondary">Дней подряд</div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { id: 'in-progress', label: 'В процессе', icon: Play, count: enrolledCourses.filter((c) => c.status === 'in-progress').length },
          { id: 'completed', label: 'Завершённые', icon: CheckCircle, count: enrolledCourses.filter((c) => c.status === 'completed').length },
          { id: 'all', label: 'Все курсы', icon: BookMarked, count: enrolledCourses.length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setViewMode(tab.id as ViewMode)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              viewMode === tab.id
                ? 'bg-primary/20 border-primary/40 text-white'
                : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10'
            } border`}
          >
            <tab.icon size={16} />
            {tab.label}
            <span className={`px-2 py-0.5 rounded-md text-xs ${
              viewMode === tab.id ? 'bg-primary/30' : 'bg-white/10'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="cyber-card p-16 text-center">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Загрузка курсов...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && enrolledCourses.length === 0 && (
        <div className="cyber-card p-16 text-center">
          <BookOpen size={64} className="mx-auto mb-4 text-text-secondary opacity-50" />
          <h2 className="text-2xl font-bold mb-2">У вас пока нет курсов</h2>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Перейдите в каталог курсов и начните своё обучение
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary/20 border border-primary/40 rounded-xl text-white font-medium hover:bg-primary/30 transition-all"
          >
            <BookOpen size={18} />
            Перейти к курсам
          </Link>
        </div>
      )}

      {/* Courses List */}
      {!loading && filteredCourses.length > 0 && (
        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="cyber-card p-5 hover:border-primary/30 transition-all group"
            >
              <div className="flex gap-5 items-start">
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-4xl flex-shrink-0">
                  {course.thumbnail}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-secondary mb-1">{course.category}</div>
                  <h3 className="font-bold text-lg mb-2 truncate">{course.title}</h3>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary">
                        {course.completedLessons} / {course.totalLessons} уроков
                      </span>
                      <span className={course.progress === 100 ? 'text-green-400' : 'text-primary'}>
                        {course.progress}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-text-secondary flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {course.estimatedTimeLeft}
                    </span>
                    {course.status === 'completed' && course.certificateEarned && (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <Award size={12} />
                        Сертификат получен
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => handleContinueLearning(course)}
                  className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all flex-shrink-0 ${
                    course.status === 'completed'
                      ? 'bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30'
                      : 'bg-primary/20 border border-primary/40 text-white hover:bg-primary/30'
                  }`}
                >
                  {course.status === 'completed' ? (
                    <>
                      <Award size={16} />
                      Сертификат
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Продолжить
                    </>
                  )}
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results for Filter */}
      {!loading && enrolledCourses.length > 0 && filteredCourses.length === 0 && (
        <div className="cyber-card p-12 text-center">
          <BookMarked size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
          <p className="text-text-secondary">Нет курсов в этой категории</p>
        </div>
      )}
    </div>
  );
}
