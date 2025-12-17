'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ============================================================
// WELCOME PAGE - ПРИВЕТСТВЕННЫЙ ЭКРАН
// ============================================================
export default function WelcomePage() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #05040F 0%, #0A0814 50%, #05040F 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(124, 58, 237, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124, 58, 237, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.3,
        }}
      />

      {/* Floating Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: '#7c3aed',
            borderRadius: '50%',
            opacity: 0.6,
            animation: `float ${5 + Math.random() * 3}s ease-in-out ${particle.delay}s infinite`,
            boxShadow: '0 0 10px rgba(124, 58, 237, 0.5)',
          }}
        />
      ))}

      {/* Glowing Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.3) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
        }}
      />

      {/* Main Content */}
      <div
        style={{
          position: 'relative',
          maxWidth: '900px',
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa, #FF4DFF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '24px',
            letterSpacing: '-2px',
            textShadow: '0 0 40px rgba(124, 58, 237, 0.5)',
          }}
        >
          ONTHEGO
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '28px',
            color: '#FFFFFF',
            fontWeight: 600,
            marginBottom: '16px',
            lineHeight: 1.4,
          }}
        >
          Учитесь в любом месте. Развивайтесь каждый день.
        </div>

        <div
          style={{
            fontSize: '18px',
            color: '#888888',
            marginBottom: '48px',
            lineHeight: 1.6,
          }}
        >
          Персонализированная образовательная платформа с AI-поддержкой, геймификацией и
          адаптивным обучением. Достигайте своих целей быстрее.
        </div>

        {/* Feature Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '48px',
          }}
        >
          {[
            { icon: '🎯', title: 'Персональный путь', desc: 'Адаптивное обучение' },
            { icon: '🤖', title: 'AI-помощник', desc: '24/7 поддержка' },
            { icon: '🏆', title: 'Геймификация', desc: 'Достижения и рейтинги' },
            { icon: '⚡', title: 'Быстрый прогресс', desc: 'Эффективные методы' },
          ].map((feature, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                borderRadius: '16px',
                padding: '24px 20px',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(124, 58, 237, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.2)';
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>{feature.icon}</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  marginBottom: '6px',
                }}
              >
                {feature.title}
              </div>
              <div style={{ fontSize: '13px', color: '#888888' }}>{feature.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/register"
            style={{
              padding: '18px 48px',
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              border: 'none',
              borderRadius: '12px',
              color: '#FFFFFF',
              fontSize: '18px',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.15s',
              boxShadow: '0 0 30px rgba(124, 58, 237, 0.3)',
              display: 'inline-block',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.97) translateY(2px)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.05) translateY(0)';
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 0 50px rgba(124, 58, 237, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(124, 58, 237, 0.3)';
            }}
          >
            Начать обучение
          </Link>

          <Link
            href="/login"
            style={{
              padding: '18px 48px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: '#FFFFFF',
              fontSize: '18px',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.15s',
              display: 'inline-block',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.97) translateY(2px)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.05) translateY(0)';
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = '#7c3aed';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            Войти
          </Link>
        </div>
      </div>

      {/* Keyframes animations */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
          }
          75% {
            transform: translateY(-15px) translateX(5px);
          }
        }
      `}</style>
    </div>
  );
}
