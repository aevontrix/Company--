/**
 * Toast Notification Store
 * Global state management for toast notifications
 */

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  isVisible: boolean;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id' | 'isVisible'>) => string;
  removeToast: (id: string) => void;
  hideToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      isVisible: true,
      duration: toast.duration ?? 5000, // Default 5 seconds
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-hide after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.map((t) =>
            t.id === id ? { ...t, isVisible: false } : t
          ),
        }));

        // Remove from DOM after animation
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        }, 300); // Match animation duration
      }, newToast.duration);
    }

    return id;
  },

  hideToast: (id) => {
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, isVisible: false } : t
      ),
    }));

    // Remove from DOM after animation
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 300);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
