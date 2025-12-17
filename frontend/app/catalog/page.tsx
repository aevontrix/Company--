'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Grid, TrendingUp, Sparkles, BookOpen, ArrowRight, Filter, Star, Clock, Users, ChevronDown } from 'lucide-react';

const CatalogPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedSort, setSelectedSort] = useState('recommended');

  const categories = [
    { id: 'programming', name: 'Programming', icon: '💻', coursesCount: 2847 },
    { id: 'data-science', name: 'Data Science', icon: '📊', coursesCount: 1923 },
    { id: 'design', name: 'Design', icon: '🎨', coursesCount: 1456 },
    { id: 'business', name: 'Business', icon: '💼', coursesCount: 2134 },
    { id: 'languages', name: 'Languages', icon: '🌍', coursesCount: 987 },
    { id: 'mathematics', name: 'Mathematics', icon: '🔢', coursesCount: 1245 },
    { id: 'science', name: 'Science', icon: '🔬', coursesCount: 1567 },
    { id: 'music', name: 'Music', icon: '🎵', coursesCount: 678 },
  ];

  const popularCourses = [
    { id: '1', title: 'Machine Learning Fundamentals', category: 'Data Science', thumbnail: '🤖', level: 'Intermediate', matchScore: 95, students: 12500, rating: 4.8, duration: '8 weeks' },
    { id: '2', title: 'Full-Stack Web Development', category: 'Programming', thumbnail: '💻', level: 'Beginner', matchScore: 92, students: 18200, rating: 4.9, duration: '12 weeks' },
    { id: '3', title: 'UI/UX Design Masterclass', category: 'Design', thumbnail: '🎨', level: 'Intermediate', matchScore: 88, students: 9800, rating: 4.7, duration: '6 weeks' },
    { id: '4', title: 'Python for Data Science', category: 'Programming', thumbnail: '🐍', level: 'Beginner', matchScore: 90, students: 15600, rating: 4.8, duration: '10 weeks' },
    { id: '5', title: 'Digital Marketing Strategy', category: 'Business', thumbnail: '📱', level: 'Beginner', matchScore: 85, students: 7200, rating: 4.6, duration: '8 weeks' },
    { id: '6', title: 'Advanced React & Next.js', category: 'Programming', thumbnail: '⚛️', level: 'Advanced', matchScore: 93, students: 11400, rating: 4.9, duration: '10 weeks' },
  ];

  const allCourses = [
    { id: '7', title: 'JavaScript Basics', category: 'Programming', thumbnail: '📘', level: 'Beginner', matchScore: 87, students: 22000, rating: 4.7, duration: '6 weeks' },
    { id: '8', title: 'Data Analysis with Python', category: 'Data Science', thumbnail: '📊', level: 'Intermediate', matchScore: 89, students: 13800, rating: 4.8, duration: '8 weeks' },
    { id: '9', title: 'Graphic Design Essentials', category: 'Design', thumbnail: '✏️', level: 'Beginner', matchScore: 84, students: 8500, rating: 4.5, duration: '7 weeks' },
    { id: '10', title: 'Business Analytics', category: 'Business', thumbnail: '📈', level: 'Intermediate', matchScore: 82, students: 6700, rating: 4.6, duration: '9 weeks' },
    { id: '11', title: 'Spanish for Beginners', category: 'Languages', thumbnail: '🇪🇸', level: 'Beginner', matchScore: 78, students: 15200, rating: 4.4, duration: '12 weeks' },
    { id: '12', title: 'Calculus I', category: 'Mathematics', thumbnail: '∫', level: 'Intermediate', matchScore: 80, students: 9100, rating: 4.7, duration: '10 weeks' },
  ];

  const filteredCourses = [...popularCourses, ...allCourses].filter(course => {
    if (selectedCategory !== 'all' && course.category.toLowerCase() !== selectedCategory) return false;
    if (selectedLevel !== 'all' && course.level.toLowerCase() !== selectedLevel) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display flex items-center gap-3 mb-2">
          <Grid className="text-primary" />
          Каталог курсов
        </h1>
        <p className="text-text-secondary">
          Изучайте тысячи курсов по различным направлениям с персональными рекомендациями
        </p>
      </div>

      {/* Filters */}
      <div className="cyber-card p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="text-primary" size={20} />
          <h2 className="text-lg font-bold">Фильтры</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div>
            <label className="text-sm text-text-secondary mb-2 block">Категория</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none"
              style={{ colorScheme: 'dark' }}
            >
              <option value="all" style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>Все категории</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <label className="text-sm text-text-secondary mb-2 block">Уровень</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none"
              style={{ colorScheme: 'dark' }}
            >
              <option value="all" style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>Все уровни</option>
              <option value="beginner" style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>Начальный</option>
              <option value="intermediate" style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>Средний</option>
              <option value="advanced" style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>Продвинутый</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="text-sm text-text-secondary mb-2 block">Сортировка</label>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none"
              style={{ colorScheme: 'dark' }}
            >
              <option value="recommended" style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>Рекомендуемые</option>
              <option value="trending" style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>Популярные</option>
              <option value="new" style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>Новые</option>
              <option value="rating" style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>По рейтингу</option>
            </select>
          </div>
        </div>
      </div>

      {/* Popular Courses */}
      {selectedCategory === 'all' && selectedLevel === 'all' && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold font-display flex items-center gap-2 mb-6">
            <TrendingUp className="text-primary" size={28} />
            Популярные курсы
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="cyber-card p-5 hover:border-primary/40 transition-all group cursor-pointer"
              >
                {/* Match Score Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">{course.thumbnail}</div>
                  <div className="px-3 py-1 rounded-lg bg-primary/20 border border-primary/30 text-xs font-bold text-primary">
                    {course.matchScore}% совпадение
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {course.title}
                </h3>

                <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-xs">{course.category}</span>
                  <span className="px-2 py-0.5 rounded bg-secondary/20 text-xs text-secondary">{course.level}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    {course.rating}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    {(course.students / 1000).toFixed(1)}k
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {course.duration}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {selectedCategory === 'all' && selectedLevel === 'all' && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold font-display flex items-center gap-2 mb-6">
            <Sparkles className="text-secondary" size={28} />
            Все категории
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="cyber-card p-5 hover:border-primary/40 transition-all group cursor-pointer text-center"
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{category.icon}</div>
                <h3 className="font-bold mb-1 group-hover:text-primary transition-colors">{category.name}</h3>
                <p className="text-xs text-text-secondary">{category.coursesCount} курсов</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtered Courses */}
      {(selectedCategory !== 'all' || selectedLevel !== 'all') && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-display">
              Найдено курсов: {filteredCourses.length}
            </h2>
            <button
              onClick={() => { setSelectedCategory('all'); setSelectedLevel('all'); }}
              className="text-sm text-primary hover:text-secondary transition-colors"
            >
              Сбросить фильтры
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="cyber-card p-5 hover:border-primary/40 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">{course.thumbnail}</div>
                  <div className="px-3 py-1 rounded-lg bg-primary/20 border border-primary/30 text-xs font-bold text-primary">
                    {course.matchScore}%
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {course.title}
                </h3>

                <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-xs">{course.category}</span>
                  <span className="px-2 py-0.5 rounded bg-secondary/20 text-xs text-secondary">{course.level}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    {course.rating}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    {(course.students / 1000).toFixed(1)}k
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {course.duration}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="cyber-card p-8 text-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <h2 className="text-3xl font-bold mb-4">Не нашли подходящий курс?</h2>
        <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
          Используйте AI-репетитора для персональных рекомендаций или изучите весь каталог
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/ai-chat"
            className="px-6 py-3 bg-primary/20 border border-primary/40 rounded-xl font-medium hover:bg-primary/30 transition-all flex items-center gap-2"
          >
            <Sparkles size={20} />
            AI Репетитор
          </Link>
          <Link
            href="/courses"
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <BookOpen size={20} />
            Все курсы
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;
