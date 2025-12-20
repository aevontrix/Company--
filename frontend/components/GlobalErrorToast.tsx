/**
 * ✅ FIX: Global Error Toast Component
 * Shows async errors that ErrorBoundary can't catch
 */

'use client';

import { useGlobalErrorHandler } from '@/lib/hooks/useGlobalErrorHandler';
import { X, AlertTriangle } from 'lucide-react';

export default function GlobalErrorToast() {
  const { lastError, showError, dismissError } = useGlobalErrorHandler();

  if (!showError || !lastError) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] max-w-md animate-slide-up"
      role="alert"
    >
      <div className="bg-red-900/90 backdrop-blur-lg border border-red-500/50 rounded-xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-200">
              Произошла ошибка
            </p>
            <p className="mt-1 text-sm text-red-300/80 break-words">
              {lastError.message}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissError}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-red-800/50 transition-colors"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
