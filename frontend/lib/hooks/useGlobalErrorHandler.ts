/**
 * ✅ FIX: Global error handler for async operations
 * Catches unhandled promise rejections and provides error state
 */

import { useEffect, useState, useCallback } from 'react';

interface GlobalError {
  message: string;
  timestamp: Date;
  type: 'unhandled_rejection' | 'error' | 'api_error';
}

let globalErrorCallback: ((error: GlobalError) => void) | null = null;

export function useGlobalErrorHandler() {
  const [lastError, setLastError] = useState<GlobalError | null>(null);
  const [showError, setShowError] = useState(false);

  const handleError = useCallback((error: GlobalError) => {
    console.error('🚨 Global Error:', error);
    setLastError(error);
    setShowError(true);

    // Auto-hide after 5 seconds
    setTimeout(() => setShowError(false), 5000);
  }, []);

  useEffect(() => {
    globalErrorCallback = handleError;

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();

      const errorMessage = event.reason?.message ||
                          event.reason?.toString() ||
                          'Произошла неизвестная ошибка';

      // Don't show errors for expected auth failures
      if (errorMessage.includes('Unauthorized') ||
          errorMessage.includes('401') ||
          errorMessage.includes('Session expired')) {
        console.log('Auth error, redirecting to login...');
        return;
      }

      handleError({
        message: errorMessage,
        timestamp: new Date(),
        type: 'unhandled_rejection'
      });
    };

    // Handle global errors
    const handleGlobalError = (event: ErrorEvent) => {
      // Skip React hydration errors
      if (event.message.includes('Hydration')) return;

      handleError({
        message: event.message,
        timestamp: new Date(),
        type: 'error'
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
      globalErrorCallback = null;
    };
  }, [handleError]);

  const dismissError = useCallback(() => {
    setShowError(false);
    setLastError(null);
  }, []);

  return { lastError, showError, dismissError };
}

// Helper to report errors from catch blocks
export function reportError(error: Error | string, type: GlobalError['type'] = 'api_error') {
  const message = typeof error === 'string' ? error : error.message;

  if (globalErrorCallback) {
    globalErrorCallback({
      message,
      timestamp: new Date(),
      type
    });
  }
}
