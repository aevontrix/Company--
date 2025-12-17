/**
 * Toast Notification Component
 * Displays feedback messages to users
 * Follows WCAG AA accessibility standards
 */

'use client';

import { useEffect } from 'react';
import { useToastStore, type Toast as ToastType } from '@/lib/store/toastStore';

const toastStyles = {
  success: {
    bg: 'bg-green-500/20',
    border: 'border-green-400/50',
    text: 'text-green-400',
    icon: '✓',
  },
  error: {
    bg: 'bg-red-500/20',
    border: 'border-red-400/50',
    text: 'text-red-400',
    icon: '✕',
  },
  warning: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-400/50',
    text: 'text-yellow-400',
    icon: '⚠',
  },
  info: {
    bg: 'bg-neon-cyan/20',
    border: 'border-neon-cyan/50',
    text: 'text-neon-cyan',
    icon: 'ℹ',
  },
} as const;

interface ToastItemProps {
  toast: ToastType;
}

function ToastItem({ toast }: ToastItemProps) {
  const { hideToast } = useToastStore();
  const style = toastStyles[toast.type];

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`
        ${style.bg} ${style.border}
        border backdrop-blur-glass rounded-xl p-4 shadow-lg
        transition-all duration-300 ease-out
        ${toast.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
        min-w-[320px] max-w-md
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${style.bg} border ${style.border} flex items-center justify-center ${style.text} font-bold text-lg`}>
          {style.icon}
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <h3 className={`font-bold ${style.text} mb-1`}>
            {toast.title}
          </h3>
          {toast.message && (
            <p className="text-text-secondary text-sm leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => hideToast(toast.id)}
          className={`flex-shrink-0 ${style.text} hover:opacity-80 transition-opacity p-1 rounded focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-dark-primary`}
          aria-label="Закрыть уведомление"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="mt-3 h-1 bg-dark-card/60 rounded-full overflow-hidden">
          <div
            className={`h-full ${style.bg} ${style.border} border-t animate-toast-progress`}
            style={{
              animationDuration: `${toast.duration}ms`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToastStore();

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
