// lib/hooks/useCourseProgress.ts
import { useState, useEffect, useCallback } from 'react';
import { learningAPI } from '../api';
import { connectProgress } from '../websocket';

interface CourseProgress {
  course_id: number;
  course_slug: string;
  progress_percentage: number;
  completed_lessons: number;
  total_lessons: number;
  last_accessed: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

export const useCourseProgress = (courseSlug?: string) => {
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load progress
  const loadProgress = useCallback(async () => {
    if (!courseSlug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await learningAPI.getProgress(courseSlug);
      // API может вернуть массив или объект, обрабатываем оба случая
      if (Array.isArray(data)) {
        setProgress(data[0] || null);
      } else {
        setProgress(data as any);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load progress');
      console.error('Failed to load progress:', err);
    } finally {
      setLoading(false);
    }
  }, [courseSlug]);

  // Handle real-time progress updates
  const handleProgressUpdate = useCallback((data: any) => {
    if (data.type === 'lesson_completed' || data.type === 'progress_update') {
      setProgress((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          progress_percentage: data.progress_percentage || prev.progress_percentage,
          completed_lessons: data.completed_lessons || prev.completed_lessons,
          last_accessed: data.last_accessed || prev.last_accessed,
          status: data.status || prev.status,
        };
      });
    }
  }, []);

  // Update lesson progress (mark as completed)
  const updateLessonProgress = useCallback(async (lessonId: number, completed: boolean) => {
    try {
      await learningAPI.updateLessonProgress(lessonId, completed);
      await loadProgress(); // Reload progress after update
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update lesson progress:', err);
      return { success: false, error: err.message };
    }
  }, [loadProgress]);

  useEffect(() => {
    loadProgress();

    // ✅ FIX: Connect to WebSocket (async, use wsService for cleanup)
    connectProgress(handleProgressUpdate);

    return () => {
      // Use wsService.disconnect instead of ws.close() for proper cleanup
      const wsService = require('../websocket').wsService;
      wsService.disconnect('progress');
    };
  }, [loadProgress, handleProgressUpdate]);

  return {
    progress,
    loading,
    error,
    reload: loadProgress,
    updateLessonProgress,
  };
};

export default useCourseProgress;