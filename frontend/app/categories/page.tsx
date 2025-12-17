'use client';

import Link from 'next/link';
import { Grid, TrendingUp, Sparkles, BookOpen, ArrowRight } from 'lucide-react';

const CategoriesPage = () => {
  const categories = [
    { id: 'programming', name: 'Programming', icon: '💻', description: 'Master coding languages and software development', coursesCount: 2847, subcategories: ['Web Development', 'Mobile Development', 'Game Development', 'DevOps'] },
    { id: 'data-science', name: 'Data Science', icon: '📊', description: 'Learn data analysis, machine learning, and AI', coursesCount: 1923, subcategories: ['Machine Learning', 'Data Analysis', 'Deep Learning', 'Big Data'] },
    { id: 'design', name: 'Design', icon: '🎨', description: 'Create stunning visuals and user experiences', coursesCount: 1456, subcategories: ['UI/UX Design', 'Graphic Design', '3D Design', 'Animation'] },
    { id: 'business', name: 'Business', icon: '💼', description: 'Develop business skills and entrepreneurship', coursesCount: 2134, subcategories: ['Marketing', 'Finance', 'Management', 'Entrepreneurship'] },
    { id: 'languages', name: 'Languages', icon: '🌍', description: 'Learn new languages and cultures', coursesCount: 987, subcategories: ['English', 'Spanish', 'French', 'Japanese'] },
    { id: 'mathematics', name: 'Mathematics', icon: '🔢', description: 'From basic math to advanced calculus', coursesCount: 1245, subcategories: ['Algebra', 'Calculus', 'Statistics', 'Geometry'] },
    { id: 'science', name: 'Science', icon: '🔬', description: 'Explore physics, chemistry, and biology', coursesCount: 1567, subcategories: ['Physics', 'Chemistry', 'Biology', 'Astronomy'] },
    { id: 'music', name: 'Music', icon: '🎵', description: 'Learn instruments and music theory', coursesCount: 678, subcategories: ['Piano', 'Guitar', 'Music Theory', 'Production'] },
    { id: 'photography', name: 'Photography', icon: '📷', description: 'Master photography and video editing', coursesCount: 892, subcategories: ['Portrait', 'Landscape', 'Photo Editing', 'Videography'] },
    { id: 'health', name: 'Health & Fitness', icon: '💪', description: 'Improve your physical and mental wellbeing', coursesCount: 1023, subcategories: ['Yoga', 'Nutrition', 'Mental Health', 'Fitness'] },
    { id: 'personal-development', name: 'Personal Development', icon: '🌟', description: 'Build confidence and life skills', coursesCount: 1345, subcategories: ['Productivity', 'Leadership', 'Communication', 'Career'] },
    { id: 'cooking', name: 'Cooking', icon: '🍳', description: 'Learn culinary skills and recipes', coursesCount: 567, subcategories: ['Baking', 'World Cuisine', 'Healthy Cooking', 'Meal Prep'] },
  ];

  const popularCategories = categories.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display flex items-center gap-3 mb-2">
          <Grid className="text-primary" />
          Категории
        </h1>
        <p className="text-text-secondary">
          Изучайте тысячи курсов по различным направлениям и найдите свое призвание
        </p>
      </div>

      {/* Popular Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold font-display flex items-center gap-2 mb-6">
          <TrendingUp className="text-primary" size={28} />
          Популярные категории
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularCategories.map((category) => (
            <Link
              key={category.id}
              href={`/courses?category=${category.id}`}
              className="cyber-card p-6 hover:border-primary/40 transition-all group cursor-pointer"
            >
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                {category.icon}
              </div>

              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                {category.name}
              </h3>

              <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                {category.description}
              </p>

              <div className="flex items-center gap-1 text-xs text-text-secondary mb-4">
                <BookOpen size={14} />
                {category.coursesCount.toLocaleString()} курсов
              </div>

              <div className="flex flex-wrap gap-2">
                {category.subcategories.slice(0, 3).map((sub, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs rounded-lg bg-primary/10 border border-primary/30 text-primary"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* All Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold font-display flex items-center gap-2 mb-6">
          <Sparkles className="text-secondary" size={28} />
          Все категории
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/courses?category=${category.id}`}
              className="cyber-card p-5 hover:border-primary/40 transition-all group cursor-pointer flex items-center gap-4"
            >
              <div className="text-5xl">{category.icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors truncate">
                  {category.name}
                </h3>
                <p className="text-xs text-text-secondary">
                  {category.coursesCount.toLocaleString()} курсов
                </p>
              </div>
              <ArrowRight className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="cyber-card p-8 text-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <h2 className="text-3xl font-bold mb-4">Не нашли то, что искали?</h2>
        <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
          Используйте AI-поиск или просмотрите полный каталог курсов, чтобы найти идеальный путь обучения
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/courses"
            className="px-6 py-3 bg-primary/20 border border-primary/40 rounded-xl font-medium hover:bg-primary/30 transition-all flex items-center gap-2"
          >
            <BookOpen size={20} />
            Все курсы
          </Link>
          <Link
            href="/discover"
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Sparkles size={20} />
            Рекомендации
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
