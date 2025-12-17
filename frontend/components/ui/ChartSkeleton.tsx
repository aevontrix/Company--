export default function ChartSkeleton() {
  return (
    <div className="flex flex-col items-center w-full animate-pulse">
      <div className="bg-gradient-to-br from-dark-card/40 to-dark-primary/60 backdrop-blur-glass rounded-3xl p-8 shadow-card w-full">
        {/* Chart area skeleton */}
        <div className="h-[200px] bg-dark-card/30 rounded-lg mb-4 relative overflow-hidden">
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-neon-purple/10 to-transparent" />

          {/* Fake bars/lines */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-around gap-2">
            {[60, 80, 45, 90, 70].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-neon-purple/20 rounded-t-lg transition-all"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        {/* Legend skeleton */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neon-purple/20" />
          <div className="h-3 w-24 bg-dark-card/30 rounded" />
        </div>
      </div>

      {/* Title skeleton */}
      <div className="h-5 w-40 bg-dark-card/30 rounded mt-4" />
    </div>
  );
}
