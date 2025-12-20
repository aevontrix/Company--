'use client';

import { useState, useEffect, useCallback } from 'react';

interface OnlineStatusState {
  isOnline: boolean;
  wasOffline: boolean; // Track if we were offline and came back
  lastOnline: Date | null;
}

/**
 * Hook to detect online/offline status
 *
 * @returns {object} Online status and utilities
 *
 * @example
 * const { isOnline, wasOffline } = useOnlineStatus();
 *
 * if (!isOnline) {
 *   return <OfflineBanner />;
 * }
 */
export function useOnlineStatus() {
  const [state, setState] = useState<OnlineStatusState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    lastOnline: null,
  });

  const handleOnline = useCallback(() => {
    setState((prev) => ({
      isOnline: true,
      wasOffline: !prev.isOnline, // Was offline if previous state was offline
      lastOnline: new Date(),
    }));
  }, []);

  const handleOffline = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOnline: false,
    }));
  }, []);

  // Clear "wasOffline" after a delay
  useEffect(() => {
    if (state.wasOffline) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, wasOffline: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.wasOffline]);

  useEffect(() => {
    // Initial check
    if (typeof navigator !== 'undefined') {
      setState((prev) => ({
        ...prev,
        isOnline: navigator.onLine,
      }));
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline: state.isOnline,
    wasOffline: state.wasOffline,
    lastOnline: state.lastOnline,
  };
}

export default useOnlineStatus;
