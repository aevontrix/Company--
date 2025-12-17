import { useEffect, useRef, useState } from 'react';

interface TimeTrackingHook {
  timeSpent: number;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  resetTracking: () => void;
}

/**
 * Hook для отслеживания времени, проведённого в уроке
 * @param lessonId ID урока
 * @param onTimeUpdate Callback для отправки данных на сервер
 */
export function useLessonTimeTracking(
  lessonId: string,
  onTimeUpdate?: (timeSpent: number) => void
): TimeTrackingHook {
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef(0);

  // Start tracking
  const startTracking = () => {
    if (isTracking) return;
    setIsTracking(true);
  };

  // Stop tracking
  const stopTracking = () => {
    setIsTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Reset tracking
  const resetTracking = () => {
    stopTracking();
    setTimeSpent(0);
    lastUpdateRef.current = 0;
  };

  // Track time when active
  useEffect(() => {
    if (isTracking) {
      intervalRef.current = setInterval(() => {
        setTimeSpent((prev) => {
          const newTime = prev + 1;

          // Отправляем обновление на сервер каждые 30 секунд
          if (onTimeUpdate && newTime - lastUpdateRef.current >= 30) {
            onTimeUpdate(newTime);
            lastUpdateRef.current = newTime;
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, onTimeUpdate]);

  // Auto-start tracking on mount
  useEffect(() => {
    startTracking();

    // Отправляем финальное время при unmount
    return () => {
      if (onTimeUpdate && timeSpent > 0) {
        onTimeUpdate(timeSpent);
      }
    };
  }, []);

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTracking();
      } else {
        startTracking();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    timeSpent,
    isTracking,
    startTracking,
    stopTracking,
    resetTracking,
  };
}

/**
 * Форматирует секунды в читаемый формат
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}с`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}м ${remainingSeconds}с`
      : `${minutes}м`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours}ч ${remainingMinutes}м`
    : `${hours}ч`;
}
