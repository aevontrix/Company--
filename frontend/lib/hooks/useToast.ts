/**
 * useToast Hook
 * Convenient hook for showing toast notifications
 */

import { useToastStore, type ToastType } from '@/lib/store/toastStore';
import { useCallback } from 'react';

interface ToastOptions {
  title: string;
  message?: string;
  duration?: number;
}

export function useToast() {
  const { addToast } = useToastStore();

  const toast = useCallback(
    (type: ToastType, options: ToastOptions) => {
      return addToast({
        type,
        ...options,
      });
    },
    [addToast]
  );

  return {
    // Convenience methods
    success: (options: ToastOptions) => toast('success', options),
    error: (options: ToastOptions) => toast('error', options),
    warning: (options: ToastOptions) => toast('warning', options),
    info: (options: ToastOptions) => toast('info', options),

    // Generic toast method
    toast,
  };
}
