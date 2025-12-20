'use client';

import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'text' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'shimmer' | 'none';
}

/**
 * Skeleton loading placeholder component
 */
export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseStyles = 'bg-dark-card/30 rounded';

  const variantStyles = {
    default: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4',
    rectangular: 'rounded-none',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    shimmer: 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
    none: '',
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], animationStyles[animation], className)}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

/**
 * Card skeleton for course cards, profile cards, etc.
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-dark-card/30 rounded-2xl p-6 animate-pulse', className)}>
      {/* Image placeholder */}
      <Skeleton className="w-full h-40 mb-4" />
      {/* Title */}
      <Skeleton variant="text" className="w-3/4 mb-2" />
      {/* Subtitle */}
      <Skeleton variant="text" className="w-1/2 mb-4" />
      {/* Progress bar */}
      <Skeleton className="w-full h-2 mb-2" />
      {/* Meta info */}
      <div className="flex justify-between">
        <Skeleton variant="text" className="w-20" />
        <Skeleton variant="text" className="w-16" />
      </div>
    </div>
  );
}

/**
 * List item skeleton
 */
export function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 p-4 animate-pulse', className)}>
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <Skeleton variant="text" className="w-3/4 mb-2" />
        <Skeleton variant="text" className="w-1/2" height={12} />
      </div>
      <Skeleton variant="text" className="w-16" />
    </div>
  );
}

/**
 * Stats card skeleton
 */
export function StatsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-dark-card/30 rounded-xl p-4 animate-pulse', className)}>
      <Skeleton variant="text" className="w-20 mb-2" height={12} />
      <Skeleton variant="text" className="w-24" height={28} />
    </div>
  );
}

/**
 * Avatar skeleton
 */
export function AvatarSkeleton({ size = 48 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />;
}

/**
 * Button skeleton
 */
export function ButtonSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-10 w-24 rounded-lg', className)} />;
}

/**
 * Table row skeleton
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" className="flex-1" />
      ))}
    </div>
  );
}

/**
 * Dashboard skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header stats */}
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatsSkeleton key={i} />
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Chart area */}
        <div className="col-span-2">
          <Skeleton className="w-full h-64 rounded-2xl" />
        </div>
        {/* Side panel */}
        <div className="space-y-4">
          <ListItemSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
        </div>
      </div>

      {/* Course cards */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default Skeleton;
