'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Compass, Target, TrendingUp, Sparkles, Star, Users, Clock } from 'lucide-react';

interface RecommendedCourse {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;
  category: string;
  level: string;
  duration: string;
  rating: number;
  studentsCount: number;
  reason: string;
  matchScore: number;
}

type CategoryFilter = 'all' | 'for-you' | 'trending' | 'new';

export default function DiscoverPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('for-you');

  const forYouCourses: RecommendedCourse[] = [
    {
      id: '1',
      slug: 'advanced-react-patterns',
      title: 'Продвинутые паттерны React',
      thumbnail: '⚛️',
      category: 'Программирование',
      level: 'Продвинутый',
      duration: '18ч',
      rating: 4.9,
      studentsCount: 34521,
      reason: 'На основе ваших навыков в Python',
      matchScore: 95,
    },
    {
      id: '2',
      slug: 'deep-learning-specialization',
      title: 'Специализация по Deep Learning',
      thumbnail: '🧠',
      category: 'Data Science',
      level: 'Продвинутый',
      duration: '42ч',
      rating: 4.8,
      studentsCount: 89234,
      reason: 'Следующий шаг после ML',
      matchScore: 92,
    },
    {
      id: '3',
      slug: 'system-design-interview',
      title: 'System Design для собеседований',
      thumbnail: '🏗️',
      category: 'Программирование',
      level: 'Эксперт',
      duration: '24ч',
      rating: 4.9,
      studentsCount: 45678,
      reason: 'Дополнит ваши знания',
      matchScore: 88,
    },
  ];

  const trendingCourses: RecommendedCourse[] = [
    {
      id: '4',
      slug: 'chatgpt-prompt-engineering',
      title: 'ChatGPT и Prompt Engineering',
      thumbnail: '🤖',
      category: 'AI',
      level: 'Начинающий',
      duration: '8ч',
      rating: 4.7,
      studentsCount: 127893,
      reason: '50K+ записей на этой неделе',
      matchScore: 85,
    },
    {
      id: '5',
      slug: 'ai-generated-art',
      title: 'AI-генерация изображений',
      thumbnail: '🎨',
      category: 'Дизайн',
      level: 'Начинающий',
      duration: '12ч',
      rating: 4.8,
      studentsCount: 98765,
      reason: 'В тренде creative AI',
      matchScore: 82,
    },
  ];

  const newCourses: RecommendedCourse[] = [
    {
      id: '6',
      slug: 'rust-programming-2024',
      title: 'Полный курс Rust 2024',
      thumbnail: '🦀',
      category: 'Программирование',
      level: 'Средний',
      duration: '32ч',
      rating: 4.9,
      studentsCount: 12456,
      reason: 'Только что вышел',
      matchScore: 78,
    },
  ];

  const getCurrentCourses = () => {
    switch (selectedCategory) {
      case 'for-you':
        return forYouCourses;
      case 'trending':
        return trendingCourses;
      case 'new':
        return newCourses;
      default:
        return [...forYouCourses, ...trendingCourses, ...newCourses];
    }
  };

  const tabs = [
    { id: 'for-you', label: 'Для вас', icon: Target },
    { id: 'trending', label: 'В тренде', icon: TrendingUp },
    { id: 'new', label: 'Новые', icon: Sparkles },
    { id: 'all', label: 'Все', icon: Compass },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display mb-2 flex items-center gap-3">
          <Compass className="text-primary" />
          Discover
        </h1>
        <p className="text-text-secondary">AI-рекомендации на основе вашего прогресса</p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id as CategoryFilter)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              selectedCategory === tab.id
                ? 'bg-primary/20 border-primary/40 text-white'
                : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10'
            } border`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getCurrentCourses().map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.slug}`}
            className="cyber-card module-card group"
          >
            {/* Match Score Badge */}
            <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-primary/20 border border-primary/30 text-xs font-bold text-primary">
              {course.matchScore}% совпадение
            </div>

            {/* Thumbnail */}
            <div className="w-full h-36 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-6xl mb-4">
              {course.thumbnail}
            </div>

            {/* Title */}
            <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
              {course.title}
            </h3>

            {/* Reason */}
            <div className="flex items-center gap-2 text-sm text-primary mb-3">
              <Sparkles size={14} />
              {course.reason}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-text-secondary mb-3">
              <span className="flex items-center gap-1">
                <Star size={12} className="text-yellow-400" />
                {course.rating}
              </span>
              <span className="flex items-center gap-1">
                <Users size={12} />
                {course.studentsCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {course.duration}
              </span>
            </div>

            {/* Level Badge */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">
                {course.category}
              </span>
              <span className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/30 text-xs text-primary">
                {course.level}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {getCurrentCourses().length === 0 && (
        <div className="cyber-card p-16 text-center">
          <Compass size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
          <p className="text-text-secondary">Нет курсов в этой категории</p>
        </div>
      )}
    </div>
  );
}
