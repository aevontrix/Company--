'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Hero - Точная копия hero секции из diego.html
 *
 * Структура:
 * - 2-column grid (1.2fr 0.8fr)
 * - Left: Badge + Title + Subtitle + Actions + Stats
 * - Right: AI Card with skills progress bars
 * - GSAP animations replicated with CSS
 */
export default function Hero() {
  useEffect(() => {
    // Progress bars animation
    const progressBars = document.querySelectorAll('.hero-progress-fill');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const bar = entry.target as HTMLElement;
            const width = bar.getAttribute('data-width');
            if (width) {
              bar.style.width = width;
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    progressBars.forEach((bar) => observer.observe(bar));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-[100px] overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-16 items-center">
          {/* Left Column - Content */}
          <div className="hero-content">
            {/* Hero Badge */}
            <div
              className="inline-flex items-center px-4 py-2 rounded-full mb-6 animate-fade-in"
              style={{
                background: 'rgba(106, 92, 255, 0.1)',
                border: '1px solid rgba(106, 92, 255, 0.3)',
              }}
            >
              <span
                className="w-2 h-2 bg-neon-cyan rounded-full mr-2.5 animate-pulse-glow"
                style={{
                  boxShadow: '0 0 10px #4DBDFF',
                }}
              />
              AI-Powered Learning v2.0
            </div>

            {/* Hero Title */}
            <h1
              className="font-['Syne'] text-[clamp(3rem,5vw,5.5rem)] leading-[1.1] font-bold mb-8 animate-slide-up"
              style={{
                animationDelay: '0.2s',
                opacity: 0,
                animationFillMode: 'forwards',
              }}
            >
              Учитесь в любом месте с <br />
              <span className="text-gradient-primary">ONTHEGO</span>
            </h1>

            {/* Hero Subtitle */}
            <p
              className="text-xl text-white/70 max-w-[600px] mb-16 leading-relaxed animate-slide-up"
              style={{
                animationDelay: '0.4s',
                opacity: 0,
                animationFillMode: 'forwards',
              }}
            >
              Образовательная экосистема будущего. Персональные курсы, адаптирующиеся под ваш
              нейропрофиль в реальном времени.
            </p>

            {/* Hero Actions */}
            <div
              className="flex gap-6 mb-16 animate-slide-up"
              style={{
                animationDelay: '0.6s',
                opacity: 0,
                animationFillMode: 'forwards',
              }}
            >
              {/* Primary CTA */}
              <Link
                href="/courses"
                className="relative px-10 py-4 rounded-full font-semibold text-lg bg-white text-black overflow-hidden z-[1] transition-all duration-300 hover:text-white inline-flex items-center gap-2"
                onMouseEnter={(e) => {
                  const before = e.currentTarget.querySelector('.btn-gradient');
                  if (before) {
                    (before as HTMLElement).style.transform = 'scaleX(1)';
                  }
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(177, 60, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  const before = e.currentTarget.querySelector('.btn-gradient');
                  if (before) {
                    (before as HTMLElement).style.transform = 'scaleX(0)';
                  }
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span
                  className="btn-gradient absolute top-0 left-0 w-full h-full -z-[1] transition-transform duration-500"
                  style={{
                    background: 'linear-gradient(90deg, #B13CFF, #FF4DFF)',
                    transformOrigin: 'left',
                    transform: 'scaleX(0)',
                    transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
                  }}
                />
                🚀 Начать обучение
              </Link>

              {/* Secondary CTA */}
              <Link
                href="/register"
                className="px-10 py-4 rounded-full font-semibold text-lg bg-transparent border border-white/20 text-white transition-all duration-300 hover:border-neon-cyan hover:text-neon-cyan inline-flex items-center gap-2"
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(77, 189, 255, 0.2) inset';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                ✨ Регистрация
              </Link>
            </div>

            {/* Stats Row */}
            <div className="flex gap-10 border-t border-white/10 pt-8">
              <div>
                <h3 className="text-[2.5rem] font-bold">15k+</h3>
                <p className="text-white/50">Активных студентов</p>
              </div>
              <div>
                <h3 className="text-[2.5rem] font-bold text-neon-cyan">94%</h3>
                <p className="text-white/50">Трудоустройство</p>
              </div>
            </div>
          </div>

          {/* Right Column - 3D AI Card - Exact from diego.html */}
          <div className="relative h-[600px] hidden lg:block" style={{ perspective: '1000px' }}>
            <div
              className="ai-card absolute top-1/2 left-1/2 w-[340px] p-[30px] rounded-[30px] border border-white/10 transition-all duration-500 z-[2]"
              style={{
                transform: 'translate(-50%, -50%) rotateY(-15deg) rotateX(10deg)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.01))',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)',
                transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-50%, -55%) rotateY(0deg) rotateX(0deg) scale(1.05)';
                e.currentTarget.style.borderColor = '#B13CFF';
                e.currentTarget.style.boxShadow = '0 0 50px rgba(177, 60, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate(-50%, -50%) rotateY(-15deg) rotateX(10deg)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.boxShadow = '0 50px 100px -20px rgba(0,0,0,0.5)';
              }}
            >
              {/* AI Avatar with purple glow */}
              <div
                className="w-[60px] h-[60px] rounded-full mb-[20px] flex items-center justify-center text-2xl"
                style={{
                  background: '#B13CFF',
                  boxShadow: '0 0 20px #B13CFF',
                }}
              >
                🧠
              </div>

              <h3 className="text-xl font-bold mb-2">Анализ навыков</h3>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                AI сканирует ваш прогресс
              </p>

              {/* Progress Bars - Exact colors from diego.html */}
              <div className="w-full mt-[20px]">
                {/* Python - Purple #B13CFF */}
                <div className="mb-2">
                  <div className="flex justify-between mb-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <span>Python</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full h-[6px] rounded-[3px] overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div
                      className="hero-progress-fill h-full transition-all duration-1500 ease-out"
                      data-width="85%"
                      style={{
                        width: '0%',
                        background: 'linear-gradient(90deg, #4DBDFF, #6A5CFF)',
                      }}
                    />
                  </div>
                </div>

                {/* React Logic - Cyan #4DBDFF */}
                <div className="mb-2" style={{ marginTop: '15px' }}>
                  <div className="flex justify-between mb-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <span>React Logic</span>
                    <span>62%</span>
                  </div>
                  <div className="w-full h-[6px] rounded-[3px] overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div
                      className="hero-progress-fill h-full transition-all duration-1500 ease-out"
                      data-width="62%"
                      style={{
                        width: '0%',
                        background: '#4DBDFF',
                      }}
                    />
                  </div>
                </div>

                {/* System Design - Pink #FF4DFF */}
                <div style={{ marginTop: '15px' }}>
                  <div className="flex justify-between mb-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <span>System Design</span>
                    <span>94%</span>
                  </div>
                  <div className="w-full h-[6px] rounded-[3px] overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div
                      className="hero-progress-fill h-full transition-all duration-1500 ease-out"
                      data-width="94%"
                      style={{
                        width: '0%',
                        background: '#FF4DFF',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
