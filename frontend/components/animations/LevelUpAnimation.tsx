'use client';

import { useEffect, useState } from 'react';
import { Trophy, Star, Sparkles } from 'lucide-react';

interface LevelUpAnimationProps {
  level: number;
  onComplete?: () => void;
}

export default function LevelUpAnimation({ level, onComplete }: LevelUpAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    // Phase 1: Entrance (0-500ms)
    setTimeout(() => {
      setIsVisible(true);
      setPhase('show');
    }, 50);

    // Phase 2: Display (500-3500ms)
    setTimeout(() => {
      setPhase('exit');
    }, 3500);

    // Phase 3: Exit and cleanup (3500-4000ms)
    setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 4000);
  }, [onComplete]);

  if (!isVisible && phase === 'exit') return null;

  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none transition-opacity duration-500 ${
        phase === 'enter' ? 'opacity-0' : phase === 'show' ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Content */}
      <div
        className={`relative transition-all duration-700 ${
          phase === 'enter'
            ? 'scale-50 opacity-0'
            : phase === 'show'
            ? 'scale-100 opacity-100'
            : 'scale-150 opacity-0'
        }`}
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary blur-3xl opacity-50 animate-spin-slow" />
        </div>

        {/* Main Card */}
        <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 border-2 border-primary/50 rounded-3xl p-12 shadow-2xl">
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full animate-float-up"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative text-center space-y-6">
            {/* Trophy Icon with Animation */}
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-xl animate-pulse" />
              <div className="relative w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border-4 border-primary/40 flex items-center justify-center">
                <Trophy size={64} className="text-primary animate-bounce-slow" />

                {/* Stars around trophy */}
                <Star
                  size={24}
                  className="absolute -top-2 -right-2 text-yellow-400 animate-spin-slow"
                />
                <Star
                  size={20}
                  className="absolute -bottom-1 -left-1 text-yellow-400 animate-spin-slow"
                  style={{ animationDelay: '0.5s' }}
                />
                <Sparkles
                  size={22}
                  className="absolute top-0 left-0 text-yellow-400 animate-ping"
                />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h2 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient">
                LEVEL UP!
              </h2>
              <div className="text-8xl font-black text-white drop-shadow-2xl animate-scale-pulse">
                {level}
              </div>
              <p className="text-xl text-text-secondary animate-fade-in" style={{ animationDelay: '0.5s' }}>
                Поздравляем с новым достижением!
              </p>
            </div>

            {/* Decorative lines */}
            <div className="flex items-center justify-center gap-4">
              <div className="h-1 w-20 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
              <div className="h-1 w-20 bg-gradient-to-r from-transparent via-secondary to-transparent rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Additional effects */}
      <style jsx global>{`
        @keyframes float-up {
          0% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(1);
            opacity: 0;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes scale-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-float-up {
          animation: float-up linear infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-scale-pulse {
          animation: scale-pulse 2s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-in forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
