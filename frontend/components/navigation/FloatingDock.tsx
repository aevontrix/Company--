'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * FloatingDock - Парящая навигация ONTHEGO
 *
 * Концепция: Cyberpunk Floating Island навигация
 * Анимации: Particle effects на клик, pulse glow для активного
 * Центральная кнопка: Focus приподнята на 8px выше
 */

interface DockButton {
  id: string;
  icon: string;
  label: string;
  path: string;
  color: string;
  elevated?: boolean;
}

const DOCK_BUTTONS: DockButton[] = [
  {
    id: 'mission',
    icon: '🏠',
    label: 'Mission Control',
    path: '/dashboard',
    color: '#4DBDFF', // neon-cyan
  },
  {
    id: 'discover',
    icon: '🔍',
    label: 'Discover',
    path: '/courses',
    color: '#4DBDFF', // neon-cyan
  },
  {
    id: 'focus',
    icon: '🔥',
    label: 'Focus',
    path: '/focus',
    color: '#FF4DFF', // neon-pink
    elevated: true, // Центральная кнопка
  },
  {
    id: 'neural',
    icon: '💬',
    label: 'Neural Link',
    path: '/ai-chat',
    color: '#B13CFF', // neon-purple
  },
  {
    id: 'identity',
    icon: '👤',
    label: 'Identity',
    path: '/profile',
    color: '#4DBDFF', // neon-cyan
  },
];

export default function FloatingDock() {
  const pathname = usePathname();
  const router = useRouter();
  const [clickedButton, setClickedButton] = useState<string | null>(null);

  const isActive = (path: string) => pathname === path;

  const handleClick = (button: DockButton) => {
    // Particle effect trigger
    setClickedButton(button.id);
    setTimeout(() => setClickedButton(null), 300);

    // Navigate
    router.push(button.path);
  };

  return (
    <>
      {/* Floating Dock Container */}
      <nav
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000]"
        role="navigation"
        aria-label="Main navigation"
      >
        <div
          className="flex items-end gap-1 px-4 rounded-[36px] transition-all duration-300"
          style={{
            background: 'rgba(20, 16, 35, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(177, 60, 255, 0.3)',
            boxShadow: `
              0 0 40px rgba(177, 60, 255, 0.2),
              0 8px 32px rgba(0, 0, 0, 0.6)
            `,
          }}
        >
          {DOCK_BUTTONS.map((button) => {
            const active = isActive(button.path);
            const isElevated = button.elevated;

            return (
              <button
                key={button.id}
                onClick={() => handleClick(button)}
                className={`
                  relative flex flex-col items-center justify-center
                  transition-all duration-300 ease-out
                  ${isElevated ? 'py-3' : 'py-4'}
                  px-4
                  group
                `}
                style={{
                  height: isElevated ? '80px' : '72px',
                  transform: isElevated ? 'translateY(-8px)' : 'none',
                }}
                aria-label={button.label}
                aria-current={active ? 'page' : undefined}
              >
                {/* Icon Container */}
                <div
                  className={`
                    relative text-4xl
                    transition-all duration-200
                    ${clickedButton === button.id ? 'scale-0' : 'scale-100'}
                    ${active ? 'scale-110' : 'group-hover:scale-110'}
                  `}
                  style={{
                    filter: active
                      ? `drop-shadow(0 0 20px ${button.color})`
                      : 'none',
                  }}
                >
                  {button.icon}

                  {/* Pulse Glow for Active */}
                  {active && (
                    <div
                      className="absolute inset-0 rounded-full animate-pulse-glow"
                      style={{
                        boxShadow: `0 0 30px ${button.color}`,
                      }}
                    />
                  )}

                  {/* Particle Effect Placeholder */}
                  {clickedButton === button.id && (
                    <div className="absolute inset-0">
                      {[...Array(12)].map((_, i) => {
                        const angle = (i / 12) * Math.PI * 2;
                        const distance = 20;
                        const x = Math.cos(angle) * distance;
                        const y = Math.sin(angle) * distance;

                        return (
                          <div
                            key={i}
                            className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full animate-particle-explode"
                            style={{
                              background: button.color,
                              transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                              opacity: 0,
                              animationDelay: `${i * 10}ms`,
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Label (hidden by default, show on hover) */}
                <span
                  className="
                    absolute -top-12 left-1/2 -translate-x-1/2
                    px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-200
                    pointer-events-none
                  "
                  style={{
                    background: 'rgba(20, 16, 35, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                  }}
                >
                  {button.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes particle-explode {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(0);
            opacity: 0;
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-particle-explode {
          animation: particle-explode 300ms ease-out forwards;
        }
      `}</style>
    </>
  );
}
