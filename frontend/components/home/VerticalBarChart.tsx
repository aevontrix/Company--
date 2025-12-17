'use client';

import { useEffect, useState } from 'react';

interface BarData {
  label: string;
  value: number;
  color: string;
  gradient: string;
  shadow: string;
}

interface VerticalBarChartProps {
  title: string;
  data?: BarData[];
}

const defaultData: BarData[] = [
  {
    label: 'Пн',
    value: 85,
    color: '#B13CFF',
    gradient: 'from-neon-purple to-neon-violet',
    shadow: 'shadow-neon-purple',
  },
  {
    label: 'Вт',
    value: 92,
    color: '#6A5CFF',
    gradient: 'from-neon-blue to-neon-purple',
    shadow: 'shadow-neon-blue',
  },
  {
    label: 'Ср',
    value: 78,
    color: '#4DBDFF',
    gradient: 'from-neon-cyan to-neon-blue',
    shadow: 'shadow-neon-cyan',
  },
  {
    label: 'Чт',
    value: 95,
    color: '#3DE0FF',
    gradient: 'from-neon-teal to-neon-cyan',
    shadow: 'shadow-neon-cyan',
  },
  {
    label: 'Пт',
    value: 88,
    color: '#7A3DFF',
    gradient: 'from-neon-violet to-neon-blue',
    shadow: 'shadow-neon-purple',
  },
];

export default function VerticalBarChart({ title, data = defaultData }: VerticalBarChartProps) {
  const [animatedHeights, setAnimatedHeights] = useState<number[]>(data.map(() => 0));
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    // Animate bars growing from bottom to top with staggered delay
    data.forEach((bar, index) => {
      setTimeout(() => {
        setAnimatedHeights((prev) => {
          const newHeights = [...prev];

          let currentHeight = 0;
          const targetHeight = bar.value;
          const duration = 1000;
          const steps = 50;
          const increment = targetHeight / steps;

          const timer = setInterval(() => {
            currentHeight += increment;
            if (currentHeight >= targetHeight) {
              currentHeight = targetHeight;
              clearInterval(timer);
            }
            setAnimatedHeights((heights) => {
              const updated = [...heights];
              updated[index] = currentHeight;
              return updated;
            });
          }, duration / steps);

          return newHeights;
        });
      }, index * 150); // Staggered animation
    });
  }, [data]);

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="flex flex-col items-center w-full">
      <div className="bg-gradient-to-br from-dark-card/40 to-dark-primary/60 backdrop-blur-glass rounded-3xl p-8 shadow-card transition-all duration-300 hover:shadow-card-hover w-full">
        {/* Chart container */}
        <div className="flex items-end justify-around gap-4 h-[200px] relative">
          {/* Y-axis grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[100, 75, 50, 25, 0].map((value) => (
              <div key={value} className="w-full border-t border-neon-purple/10" />
            ))}
          </div>

          {/* Bars */}
          {data.map((bar, index) => {
            const heightPercentage = (animatedHeights[index] / maxValue) * 100;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={bar.label}
                className="flex-1 flex flex-col items-center justify-end relative group"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-dark-card/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-neon-purple/30 shadow-neon-purple whitespace-nowrap z-10 animate-fade-in">
                    <p className="text-sm text-text-secondary font-semibold">
                      {animatedHeights[index].toFixed(0)}%
                    </p>
                  </div>
                )}

                {/* Bar */}
                <div
                  className={`w-full rounded-t-2xl bg-gradient-to-t ${bar.gradient} ${bar.shadow} transition-all duration-300 ${
                    isHovered ? 'scale-105 opacity-100' : 'opacity-90'
                  }`}
                  style={{
                    height: `${heightPercentage}%`,
                    minHeight: heightPercentage > 0 ? '8px' : '0px',
                  }}
                />

                {/* Label */}
                <div className="mt-3 text-sm font-medium text-text-secondary">
                  {bar.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend - показываем среднее значение */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-neon-purple to-neon-cyan" />
          <span className="text-xs text-text-muted">
            Среднее: {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Title below chart */}
      <h3 className="text-lg font-semibold text-text-secondary mt-4 text-center">
        {title}
      </h3>
    </div>
  );
}
