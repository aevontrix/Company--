'use client';

import { useRef, useState, MouseEvent as ReactMouseEvent } from 'react';

/**
 * DragSlider - Горизонтальный drag-to-scroll слайдер из Diego
 *
 * Особенности:
 * - Drag to scroll функционал
 * - Cursor: grabbing во время drag
 * - Smooth scroll
 * - Course cards с AI match badges
 */

interface CourseCardProps {
  title: string;
  description: string;
  tags: string[];
  match: number;
  matchEmoji: string;
  imageUrl: string;
  reason: string;
}

const CourseCard = ({ title, description, tags, match, matchEmoji, imageUrl, reason }: CourseCardProps) => {
  return (
    <div className="course-card min-w-[350px] h-[480px] bg-[rgba(20,16,35,0.6)] rounded-3xl border border-white/8 overflow-hidden relative transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:border-neon-cyan">
      {/* Course Thumbnail */}
      <div
        className="h-[220px] bg-cover bg-center relative"
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        {/* AI Match Badge */}
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-[10px] px-3 py-1.5 rounded-full text-sm border border-neon-cyan text-neon-cyan font-semibold flex items-center gap-2">
          {matchEmoji} {match}% Match
        </div>
      </div>

      {/* Course Info */}
      <div className="p-6">
        {/* Tags */}
        <div className="flex gap-2.5 mb-3">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-xs px-2.5 py-1 bg-white/5 rounded text-white/70"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold mb-2.5 leading-tight">{title}</h3>

        {/* Description */}
        <p className="text-white/60 text-sm">{description}</p>

        {/* AI Reason */}
        <div className="text-sm text-neon-lavender mt-4 pt-4 border-t border-white/8 flex items-start gap-2">
          <span>💡</span> {reason}
        </div>
      </div>
    </div>
  );
};

export default function DragSlider() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const courses = [
    {
      title: 'Highload Architect: System Design',
      description: 'Проектирование систем, выдерживающих миллионы RPS.',
      tags: ['Backend', 'Advanced'],
      match: 98,
      matchEmoji: '🔥',
      imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
      reason: 'Вы недавно изучали Go и Docker',
    },
    {
      title: 'Ethical Hacking & Pentest',
      description: 'Полный курс по тестированию на проникновение.',
      tags: ['Cybersec', 'Intermediate'],
      match: 94,
      matchEmoji: '⚡',
      imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
      reason: 'Популярно в вашем регионе',
    },
    {
      title: 'Machine Learning A-Z',
      description: 'От линейной регрессии до Deep Learning.',
      tags: ['AI/ML', 'Beginner'],
      match: 88,
      matchEmoji: '🚀',
      imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
      reason: 'Based on your math skills',
    },
    {
      title: 'Three.js & WebGL Mastery',
      description: 'Создание award-winning сайтов с 3D графикой.',
      tags: ['Frontend', 'Senior'],
      match: 85,
      matchEmoji: '💎',
      imageUrl: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?auto=format&fit=crop&w=800&q=80',
      reason: 'Вы интересовались анимацией',
    },
  ];

  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    setIsDown(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!isDown || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2; // scroll-fast
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <section
      id="courses"
      className="py-24 relative"
      style={{
        background: 'linear-gradient(180deg, transparent, rgba(177,60,255,0.05), transparent)',
      }}
    >
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-[rgba(106,92,255,0.1)] border border-[rgba(106,92,255,0.3)] mb-6">
              <span className="w-2 h-2 bg-neon-cyan rounded-full mr-2.5 shadow-[0_0_10px_var(--neon-cyan)] animate-pulse-glow" />
              AI Picks For You
            </div>
            <h2 className="font-['Syne'] text-5xl font-bold">Рекомендации</h2>
          </div>
          <div className="flex gap-2.5">
            <button className="w-12 h-12 rounded-full border border-white/20 bg-transparent text-white hover:border-neon-cyan hover:shadow-[0_0_15px_rgba(77,189,255,0.2)_inset] hover:text-neon-cyan transition">
              ←
            </button>
            <button className="w-12 h-12 rounded-full border border-white/20 bg-transparent text-white hover:border-neon-cyan hover:shadow-[0_0_15px_rgba(77,189,255,0.2)_inset] hover:text-neon-cyan transition">
              →
            </button>
          </div>
        </div>

        {/* Drag Slider */}
        <div className="w-full overflow-hidden relative">
          <div
            ref={sliderRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex gap-8 py-8 ${isDown ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
            style={{ scrollBehavior: isDown ? 'auto' : 'smooth' }}
          >
            {courses.map((course, idx) => (
              <CourseCard key={idx} {...course} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
