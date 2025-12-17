'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import Link from 'next/link';
import { coursesAPI, type Course } from '@/lib/api';
import { Search, Clock, Users, Star, BookOpen } from 'lucide-react';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

type FilterLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';

// Difficulty Badge
const DifficultyBadge = memo(({ level }: { level: string }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    beginner: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Начальный' },
    intermediate: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Средний' },
    advanced: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Продвинутый' },
  };

  const style = config[level] || config.beginner;

  return (
    <span className={`badge ${style.bg} ${style.text} border-current/20`}>
      {style.label}
    </span>
  );
});
DifficultyBadge.displayName = 'DifficultyBadge';

// Course Card
const CourseCard = memo(({ course }: { course: Course }) => {
  return (
    <Link href={`/courses/${course.slug}`} className="block">
      <div className="cyber-card module-card group h-full">
        {/* Thumbnail */}
        <div className="w-full h-44 rounded-xl mb-4 flex items-center justify-center text-5xl bg-gradient-to-br from-primary/20 to-secondary/20">
          {course.thumbnail || <BookOpen size={48} className="text-primary" />}
        </div>

        {/* Category & Difficulty */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <span className="badge bg-primary/10 text-primary border-primary/20">
            {course.category_name}
          </span>
          <DifficultyBadge level={course.difficulty} />
        </div>

        {/* Title */}
        <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition line-clamp-2 min-h-[3.5rem]">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-text-secondary mb-4 line-clamp-2 min-h-[2.5rem]">
          {course.short_description || 'Описание отсутствует'}
        </p>

        {/* Instructor */}
        <div className="text-sm text-text-secondary mb-4">
          от <span className="text-white">{course.instructor_name}</span>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs text-text-secondary mb-4">
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {course.duration_hours}ч
          </span>
          <span className="flex items-center gap-1">
            <Users size={14} />
            {course.enrolled_count}
          </span>
          <span className="flex items-center gap-1">
            <Star size={14} className="text-yellow-400" />
            {parseFloat(course.rating).toFixed(1)}
          </span>
        </div>

        {/* Price */}
        <div className="pt-4 border-t border-white/10">
          {course.is_free ? (
            <span className="text-lg font-bold text-green-400">БЕСПЛАТНО</span>
          ) : (
            <span className="text-lg font-bold text-white">Платный</span>
          )}
        </div>
      </div>
    </Link>
  );
});
CourseCard.displayName = 'CourseCard';

// Filter Button
const FilterButton = memo(({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-primary/20 border-primary/40 text-white'
          : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10 hover:text-white'
      } border`}
    >
      {children}
    </button>
  );
});
FilterButton.displayName = 'FilterButton';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<FilterLevel>('all');

  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const isSearching = searchQuery !== debouncedSearchQuery;

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const response = await coursesAPI.getAllCourses();
        setCourses(response.results || []);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Не удалось загрузить курсы');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        debouncedSearchQuery === '' ||
        course.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        course.short_description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        course.instructor_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      const matchesLevel = levelFilter === 'all' || course.difficulty === levelFilter;

      return matchesSearch && matchesLevel;
    });
  }, [courses, debouncedSearchQuery, levelFilter]);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display mb-2">Каталог курсов</h1>
        <p className="text-text-secondary">
          {loading ? 'Загрузка...' : `${filteredCourses.length} ${filteredCourses.length === 1 ? 'курс' : filteredCourses.length > 1 && filteredCourses.length < 5 ? 'курса' : 'курсов'} доступно`}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
          <input
            type="text"
            placeholder="Поиск курсов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-search w-full pl-12"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          )}
        </div>

        {/* Level Filters */}
        <div className="flex gap-3 flex-wrap">
          <FilterButton active={levelFilter === 'all'} onClick={() => setLevelFilter('all')}>
            Все уровни
          </FilterButton>
          <FilterButton active={levelFilter === 'beginner'} onClick={() => setLevelFilter('beginner')}>
            Начальный
          </FilterButton>
          <FilterButton active={levelFilter === 'intermediate'} onClick={() => setLevelFilter('intermediate')}>
            Средний
          </FilterButton>
          <FilterButton active={levelFilter === 'advanced'} onClick={() => setLevelFilter('advanced')}>
            Продвинутый
          </FilterButton>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="cyber-card p-6 border-red-500/30 bg-red-500/10 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCourses.length === 0 && (
        <div className="text-center py-16">
          <BookOpen size={64} className="mx-auto mb-4 text-text-secondary" />
          <h3 className="text-xl font-bold mb-2">Курсы не найдены</h3>
          <p className="text-text-secondary">
            {searchQuery || levelFilter !== 'all'
              ? 'Попробуйте изменить фильтры'
              : 'Курсы пока не доступны'}
          </p>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && !error && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
