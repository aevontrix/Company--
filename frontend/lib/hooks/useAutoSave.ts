// lib/hooks/useAutoSave.ts
import { useEffect, useRef, useCallback } from 'react';

interface AutoSaveOptions {
  onSave: () => Promise<void>;
  interval?: number; // milliseconds
  enabled?: boolean;
}

export const useAutoSave = ({ 
  onSave, 
  interval = 30000, // default 30 seconds
  enabled = true 
}: AutoSaveOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (isSavingRef.current || !enabled) return;

    try {
      isSavingRef.current = true;
      await onSave();
      console.log('✅ Auto-saved successfully');
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, enabled]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start auto-save interval
    intervalRef.current = setInterval(save, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [save, interval, enabled]);

  // Manual save trigger
  const triggerSave = useCallback(() => {
    return save();
  }, [save]);

  return { triggerSave };
};

export default useAutoSave;