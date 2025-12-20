'use client';

import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * OfflineBanner - Shows when user loses internet connection
 *
 * Features:
 * - Automatically detects online/offline status
 * - Shows reconnection message when coming back online
 * - Retry button to refresh the page
 */
export default function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [isVisible, setIsVisible] = useState(false);
  const [isReconnected, setIsReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
      setIsReconnected(false);
    } else if (wasOffline) {
      // Show reconnected message briefly
      setIsReconnected(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsReconnected(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOnline, wasOffline]);

  const handleRetry = () => {
    window.location.reload();
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div
        className={`px-4 py-3 flex items-center justify-center gap-3 text-sm font-medium ${
          isReconnected
            ? 'bg-green-500/90 text-white'
            : 'bg-red-500/90 text-white'
        }`}
        style={{ backdropFilter: 'blur(8px)' }}
      >
        {isReconnected ? (
          <>
            <Wifi size={18} className="animate-pulse" />
            <span>Подключение восстановлено!</span>
          </>
        ) : (
          <>
            <WifiOff size={18} />
            <span>Нет подключения к интернету</span>
            <button
              onClick={handleRetry}
              className="ml-2 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-1"
              aria-label="Попробовать снова"
            >
              <RefreshCw size={14} />
              Повторить
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * OfflineFallback - Full-page offline fallback
 *
 * Use this when the app needs to show a full offline page
 */
export function OfflineFallback() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-primary p-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <WifiOff size={48} className="text-red-400" />
        </div>

        <h1 className="text-3xl font-bold mb-4">Нет подключения</h1>

        <p className="text-text-secondary mb-8">
          Похоже, вы не подключены к интернету. Проверьте соединение и попробуйте снова.
        </p>

        <div className="space-y-4">
          <button
            onClick={handleRetry}
            className="w-full px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Попробовать снова
          </button>

          <div className="text-sm text-text-secondary">
            <p>Возможные причины:</p>
            <ul className="mt-2 space-y-1 text-left list-disc list-inside">
              <li>Проблемы с Wi-Fi соединением</li>
              <li>Проблемы с мобильной сетью</li>
              <li>Сервер временно недоступен</li>
            </ul>
          </div>
        </div>

        {/* Cached content hint */}
        <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-sm text-text-secondary">
            Некоторые страницы могут быть доступны офлайн, если вы их уже посещали.
          </p>
        </div>
      </div>
    </div>
  );
}
