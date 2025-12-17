'use client';

import { useEffect, useState, useRef } from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface SmoothLineChartProps {
  title: string;
  data?: DataPoint[];
}

const defaultData: DataPoint[] = [
  { label: 'Янв', value: 45 },
  { label: 'Фев', value: 52 },
  { label: 'Мар', value: 58 },
  { label: 'Апр', value: 72 },
  { label: 'Май', value: 68 },
  { label: 'Июн', value: 85 },
];

export default function SmoothLineChart({ title, data = defaultData }: SmoothLineChartProps) {
  const [drawProgress, setDrawProgress] = useState(0);
  const [showPoints, setShowPoints] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 400;
  const height = 200;
  const padding = 40;
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const valueRange = maxValue - minValue;

  // Calculate points positions
  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * (width - 2 * padding),
    y: padding + ((maxValue - d.value) / valueRange) * (height - 2 * padding),
    value: d.value,
    label: d.label,
  }));

  // Create smooth curve path using quadratic bezier curves
  const createSmoothPath = () => {
    if (points.length === 0) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      const controlY = (current.y + next.y) / 2;

      if (i === 0) {
        path += ` Q ${controlX} ${current.y}, ${controlX} ${controlY}`;
      } else {
        path += ` T ${controlX} ${controlY}`;
      }
    }

    const lastPoint = points[points.length - 1];
    path += ` Q ${lastPoint.x} ${lastPoint.y}, ${lastPoint.x} ${lastPoint.y}`;

    return path;
  };

  const smoothPath = createSmoothPath();

  // Create area path (same as line but closing to bottom)
  const createAreaPath = () => {
    if (!smoothPath) return '';
    const lastPoint = points[points.length - 1];
    return `${smoothPath} L ${lastPoint.x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  };

  const areaPath = createAreaPath();

  useEffect(() => {
    // Animate line drawing from left to right
    const duration = 2000;
    const steps = 100;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setDrawProgress(progress);

      if (progress >= 1) {
        clearInterval(timer);
        // Show points after line is fully drawn
        setTimeout(() => setShowPoints(true), 200);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  // Get the total path length for animation
  const pathLength = (svgRef.current?.querySelector('.line-path') as SVGPathElement | null)?.getTotalLength() || 1000;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="bg-gradient-to-br from-dark-card/40 to-dark-primary/60 backdrop-blur-glass rounded-3xl p-8 shadow-card transition-all duration-300 hover:shadow-card-hover w-full">
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
        >
          <defs>
            {/* Line gradient */}
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3DE0FF" /> {/* Turquoise */}
              <stop offset="100%" stopColor="#4DBDFF" /> {/* Blue */}
            </linearGradient>

            {/* Area gradient (transparent) */}
            <linearGradient id="area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3DE0FF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4DBDFF" stopOpacity="0.05" />
            </linearGradient>

            {/* Glow filter for points */}
            <filter id="point-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = padding + (i / 4) * (height - 2 * padding);
            return (
              <line
                key={i}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="rgba(177, 60, 255, 0.1)"
                strokeWidth="1"
              />
            );
          })}

          {/* Area fill */}
          <path
            d={areaPath}
            fill="url(#area-gradient)"
            strokeWidth="0"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: pathLength * (1 - drawProgress),
            }}
            className="transition-all duration-100"
          />

          {/* Smooth line */}
          <path
            d={smoothPath}
            fill="none"
            stroke="url(#line-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="line-path transition-all duration-100"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: pathLength * (1 - drawProgress),
              filter: 'drop-shadow(0 0 8px rgba(61, 224, 255, 0.6))',
            }}
          />

          {/* Data points */}
          {showPoints &&
            points.map((point, index) => {
              const isHovered = hoveredIndex === index;
              const delay = index * 100;

              return (
                <g
                  key={index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                  style={{
                    animation: `fade-in 0.4s ease-out ${delay}ms both`,
                  }}
                >
                  {/* Point glow circle */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isHovered ? 10 : 6}
                    fill="#3DE0FF"
                    filter="url(#point-glow)"
                    className="transition-all duration-300"
                  />

                  {/* Point solid circle */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isHovered ? 6 : 4}
                    fill="white"
                    className="transition-all duration-300"
                  />

                  {/* Label */}
                  <text
                    x={point.x}
                    y={height - padding + 20}
                    textAnchor="middle"
                    className="text-xs fill-text-muted"
                  >
                    {point.label}
                  </text>

                  {/* Tooltip on hover */}
                  {isHovered && (
                    <g>
                      <rect
                        x={point.x - 30}
                        y={point.y - 40}
                        width="60"
                        height="30"
                        rx="8"
                        fill="rgba(18, 16, 31, 0.95)"
                        stroke="rgba(177, 60, 255, 0.3)"
                        strokeWidth="1"
                        filter="drop-shadow(0 0 10px rgba(177, 60, 255, 0.5))"
                      />
                      <text
                        x={point.x}
                        y={point.y - 20}
                        textAnchor="middle"
                        className="text-sm font-semibold fill-text-secondary"
                      >
                        {point.value}%
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
        </svg>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="w-3 h-0.5 bg-gradient-to-r from-neon-teal to-neon-cyan rounded" />
          <span className="text-xs text-text-muted">
            Прогресс за 6 месяцев
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
