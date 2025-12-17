'use client';

import { useEffect, useState, useRef } from 'react';

interface SemiDonutChartProps {
  percentage: number;
  title: string;
  subtitle?: string;
  icon?: string;
}

export default function SemiDonutChart({ percentage, title, subtitle, icon }: SemiDonutChartProps) {
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate from 0 to percentage
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = percentage / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(currentStep * increment, percentage);
      setProgress(newProgress);

      if (newProgress >= percentage) {
        clearInterval(timer);
        setIsComplete(true);
        // Pulse effect on completion
        setTimeout(() => setIsComplete(false), 600);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [percentage]);

  // Calculate SVG path for semi-donut
  const size = 200;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center w-full">
      <div
        ref={chartRef}
        className={`relative bg-gradient-to-br from-dark-card/40 to-dark-primary/60 backdrop-blur-glass rounded-3xl p-8 shadow-card transition-all duration-300 ${
          isHovered ? 'shadow-card-hover scale-105' : ''
        } ${isComplete ? 'animate-glow-pulse' : ''}`}
        onMouseEnter={() => {
          setIsHovered(true);
          setShowTooltip(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowTooltip(false);
        }}
      >
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-dark-card/95 backdrop-blur-sm px-4 py-2 rounded-lg border border-neon-purple/30 shadow-neon-purple whitespace-nowrap z-10 animate-fade-in">
            <p className="text-sm text-text-secondary">{progress.toFixed(0)}% завершено</p>
          </div>
        )}

        {/* SVG Ring Chart */}
        <div className="relative w-[200px] h-[120px] flex items-center justify-center">
          <svg
            width={size}
            height={size / 2 + 20}
            className="transform rotate-180"
            viewBox={`0 0 ${size} ${size / 2 + 20}`}
          >
            <defs>
              {/* Gradient for the ring */}
              <linearGradient id={`ring-gradient-${title}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3DE0FF" /> {/* Turquoise */}
                <stop offset="50%" stopColor="#4DBDFF" /> {/* Blue */}
                <stop offset="100%" stopColor="#7A3DFF" /> {/* Violet */}
              </linearGradient>

              {/* Glow filter */}
              <filter id={`glow-${title}`}>
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background arc */}
            <path
              d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
              fill="none"
              stroke="rgba(177, 60, 255, 0.15)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Animated progress arc */}
            <path
              d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
              fill="none"
              stroke={`url(#ring-gradient-${title})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-300 ease-out"
              style={{
                filter: isHovered ? `url(#glow-${title})` : 'none',
              }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 flex flex-col items-center">
            <div className="text-5xl font-bold gradient-text glow-cyan mb-1">
              {progress.toFixed(0)}%
            </div>
            {subtitle && (
              <div className="text-xs text-text-muted mt-1">{subtitle}</div>
            )}
          </div>
        </div>
      </div>

      {/* Title below chart */}
      <h3 className="text-lg font-semibold text-text-secondary mt-4 text-center">
        {title}
      </h3>
    </div>
  );
}
