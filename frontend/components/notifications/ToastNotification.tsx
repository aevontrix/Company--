'use client';

import { useEffect, useState } from 'react';
import { Trophy, Star, Flame, Award, CheckCircle, X } from 'lucide-react';

export interface ToastData {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'xp' | 'level_up' | 'achievement' | 'streak';
  title: string;
  message?: string;
  duration?: number;
  icon?: React.ReactNode;
}

interface ToastNotificationProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

export function ToastNotification({ toast, onClose }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss
    const timer = setTimeout(() => {
      handleClose();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  // Icon based on type
  const getIcon = () => {
    if (toast.icon) return toast.icon;

    switch (toast.type) {
      case 'xp':
        return <Star className="text-yellow-400" size={24} />;
      case 'level_up':
        return <Trophy className="text-primary" size={24} />;
      case 'achievement':
        return <Award className="text-purple-400" size={24} />;
      case 'streak':
        return <Flame className="text-orange-400" size={24} />;
      case 'success':
        return <CheckCircle className="text-green-400" size={24} />;
      default:
        return <Star className="text-blue-400" size={24} />;
    }
  };

  // Color scheme based on type
  const getColorClasses = () => {
    switch (toast.type) {
      case 'xp':
        return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/40';
      case 'level_up':
        return 'from-primary/20 to-secondary/10 border-primary/40';
      case 'achievement':
        return 'from-purple-500/20 to-purple-500/5 border-purple-500/40';
      case 'streak':
        return 'from-orange-500/20 to-orange-500/5 border-orange-500/40';
      case 'success':
        return 'from-green-500/20 to-green-500/5 border-green-500/40';
      case 'error':
        return 'from-red-500/20 to-red-500/5 border-red-500/40';
      default:
        return 'from-blue-500/20 to-blue-500/5 border-blue-500/40';
    }
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl
        bg-gradient-to-r ${getColorClasses()}
        transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        min-w-[320px] max-w-md shadow-lg
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-white mb-0.5">{toast.title}</h4>
        {toast.message && (
          <p className="text-sm text-text-secondary line-clamp-2">{toast.message}</p>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 w-6 h-6 rounded-md hover:bg-white/10 transition-colors flex items-center justify-center text-text-secondary hover:text-white"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// Toast Container Component
interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">
        {toasts.map((toast) => (
          <ToastNotification key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </div>
    </div>
  );
}

// Toast Hook for easy usage
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = (toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const closeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Convenience methods
  const success = (title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  };

  const error = (title: string, message?: string) => {
    showToast({ type: 'error', title, message });
  };

  const xpGained = (amount: number, total: number) => {
    showToast({
      type: 'xp',
      title: `+${amount} XP!`,
      message: `Всего: ${total.toLocaleString()} XP`,
      duration: 4000,
    });
  };

  const levelUp = (newLevel: number) => {
    showToast({
      type: 'level_up',
      title: `Новый уровень ${newLevel}!`,
      message: 'Поздравляем с достижением!',
      duration: 6000,
    });
  };

  const achievement = (name: string, description: string) => {
    showToast({
      type: 'achievement',
      title: `Достижение разблокировано!`,
      message: `${name}: ${description}`,
      duration: 7000,
    });
  };

  const streakUpdated = (streak: number) => {
    showToast({
      type: 'streak',
      title: `Серия: ${streak} дней!`,
      message: 'Продолжайте учиться каждый день!',
      duration: 5000,
    });
  };

  return {
    toasts,
    showToast,
    closeToast,
    success,
    error,
    xpGained,
    levelUp,
    achievement,
    streakUpdated,
    ToastContainer: () => <ToastContainer toasts={toasts} onClose={closeToast} />,
  };
}
