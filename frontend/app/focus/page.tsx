'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Coffee, Target, Zap, Trophy, Lightbulb, Save } from 'lucide-react';

type TimerMode = 'focus' | 'break' | 'longBreak';
type TimerStatus = 'idle' | 'running' | 'paused';

interface FocusState {
  mode: TimerMode;
  status: TimerStatus;
  timeLeft: number;
  completedSessions: number;
  totalXP: number;
  sessionStartTime: number | null;
}

const STORAGE_KEY = 'onthego_focus_state';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function FocusModePage() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const statusRef = useRef(status);
  const modeRef = useRef(mode);
  const timeLeftRef = useRef(timeLeft);

  // Update refs on state changes
  useEffect(() => {
    statusRef.current = status;
    modeRef.current = mode;
    timeLeftRef.current = timeLeft;
  }, [status, mode, timeLeft]);

  const durations: Record<TimerMode, number> = {
    focus: 25 * 60,
    break: 5 * 60,
    longBreak: 15 * 60,
  };

  // ✅ Save session to API
  const saveSessionToAPI = useCallback(async (completed: boolean) => {
    if (modeRef.current !== 'focus') return; // Only save focus sessions

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    const elapsed = durations.focus - timeLeftRef.current;
    const duration = Math.ceil(elapsed / 60); // Convert to minutes

    if (duration < 1) return; // Don't save sessions less than 1 minute

    try {
      setIsSaving(true);
      await fetch(`${API_BASE}/gamification/focus-session/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          duration,
          xp_earned: completed ? 100 : 0,
          completed,
          mode: 'focus',
        }),
      });
    } catch (error) {
      console.error('Failed to save focus session:', error);
    } finally {
      setIsSaving(false);
    }
  }, [durations.focus]);

  // ✅ Save state to localStorage
  const saveStateToStorage = useCallback(() => {
    const state: FocusState = {
      mode: modeRef.current,
      status: statusRef.current,
      timeLeft: timeLeftRef.current,
      completedSessions,
      totalXP,
      sessionStartTime,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [completedSessions, totalXP, sessionStartTime]);

  // ✅ Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const state: FocusState = JSON.parse(saved);

        // Calculate elapsed time if was running
        if (state.status === 'running' && state.sessionStartTime) {
          const elapsed = Math.floor((Date.now() - state.sessionStartTime) / 1000);
          const adjustedTimeLeft = Math.max(0, state.timeLeft - elapsed);

          if (adjustedTimeLeft > 0) {
            setTimeLeft(adjustedTimeLeft);
            setStatus('paused'); // Resume as paused
          } else {
            // Timer finished while away
            setTimeLeft(durations[state.mode]);
            setStatus('idle');
          }
        } else {
          setTimeLeft(state.timeLeft);
          setStatus(state.status === 'running' ? 'paused' : state.status);
        }

        setMode(state.mode);
        setCompletedSessions(state.completedSessions);
        setTotalXP(state.totalXP);
      } catch (e) {
        console.error('Failed to restore focus state:', e);
      }
    }
  }, []);

  // ✅ Beforeunload warning and session save
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Save state first
      saveStateToStorage();

      // Warn if timer is running
      if (statusRef.current === 'running') {
        // Save partial session to API
        saveSessionToAPI(false);

        e.preventDefault();
        e.returnValue = 'У вас активна сессия фокусировки. Вы уверены, что хотите покинуть страницу?';
        return e.returnValue;
      }
    };

    // Save state periodically (every 10 seconds when running)
    const saveInterval = setInterval(() => {
      if (statusRef.current === 'running') {
        saveStateToStorage();
      }
    }, 10000);

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(saveInterval);
    };
  }, [saveStateToStorage, saveSessionToAPI]);

  // ✅ Timer effect with session tracking
  useEffect(() => {
    if (status !== 'running') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus('idle');
          if (mode === 'focus') {
            setCompletedSessions((s) => s + 1);
            setTotalXP((xp) => xp + 100);
            // ✅ Save completed session to API
            saveSessionToAPI(true);
            setMode('break');
            return durations.break;
          }
          return durations[mode];
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, mode, saveSessionToAPI]);

  // ✅ Track session start time when starting
  const handleStart = () => {
    if (status !== 'running') {
      setSessionStartTime(Date.now());
    }
    setStatus('running');
  };

  const handlePause = () => {
    setStatus('paused');
    saveStateToStorage();
  };

  const handleReset = () => {
    setStatus('idle');
    setTimeLeft(durations[mode]);
    setSessionStartTime(null);
    // Clear saved state on reset
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    setStatus('idle');
    setTimeLeft(durations[newMode]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((durations[mode] - timeLeft) / durations[mode]) * 100;
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const modes = [
    { id: 'focus', label: 'Фокус', time: '25 мин', icon: Target },
    { id: 'break', label: 'Перерыв', time: '5 мин', icon: Coffee },
    { id: 'longBreak', label: 'Длинный перерыв', time: '15 мин', icon: Zap },
  ];

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-display mb-2 flex items-center justify-center gap-3">
          <Timer className="text-primary" />
          Focus Mode
        </h1>
        <p className="text-text-secondary">Глубокая работа с техникой Pomodoro</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="cyber-card p-4 text-center">
          <Target className="mx-auto mb-2 text-primary" size={24} />
          <div className="text-2xl font-bold">{completedSessions}</div>
          <div className="text-xs text-text-secondary">Сессий</div>
        </div>
        <div className="cyber-card p-4 text-center">
          <Trophy className="mx-auto mb-2 text-yellow-400" size={24} />
          <div className="text-2xl font-bold text-yellow-400">{totalXP}</div>
          <div className="text-xs text-text-secondary">XP заработано</div>
        </div>
        <div className="cyber-card p-4 text-center">
          <Zap className="mx-auto mb-2 text-secondary" size={24} />
          <div className="text-2xl font-bold text-secondary">
            {Math.floor((completedSessions * 25) / 60)}ч
          </div>
          <div className="text-xs text-text-secondary">Время фокуса</div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 justify-center mb-8 flex-wrap">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => handleModeChange(m.id as TimerMode)}
            disabled={status === 'running'}
            className={`px-5 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              mode === m.id
                ? 'bg-primary/20 border-primary/40 text-white'
                : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10'
            } border ${status === 'running' && mode !== m.id ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <m.icon size={16} />
            <div className="text-left">
              <div>{m.label}</div>
              <div className="text-xs opacity-70">{m.time}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Circular Timer */}
      <div className="flex justify-center mb-8">
        <div className="relative w-80 h-80">
          {/* SVG Circle */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 300 300">
            {/* Background Circle */}
            <circle
              cx="150"
              cy="150"
              r="140"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="8"
            />
            {/* Progress Circle */}
            <circle
              cx="150"
              cy="150"
              r="140"
              fill="none"
              stroke="url(#timerGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 linear"
              style={{ filter: 'drop-shadow(0 0 10px rgba(124, 58, 237, 0.5))' }}
            />
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>

          {/* Timer Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-6xl font-bold font-display bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {formatTime(timeLeft)}
            </div>
            <div className="text-text-secondary mt-2">
              {mode === 'focus' ? 'Фокус' : mode === 'break' ? 'Перерыв' : 'Длинный перерыв'}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              {status === 'running' && <span className="text-green-400">● Активно</span>}
              {status === 'paused' && <span className="text-yellow-400">● Пауза</span>}
              {status === 'idle' && <span className="text-text-secondary">● Готов</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 justify-center mb-8">
        {status === 'running' ? (
          <button
            type="button"
            onClick={handlePause}
            className="px-8 py-4 rounded-xl font-bold flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 text-orange-400 hover:bg-orange-500/30 transition-all"
          >
            <Pause size={20} />
            Пауза
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            className="px-8 py-4 rounded-xl font-bold flex items-center gap-2 bg-primary/20 border border-primary/40 text-white hover:bg-primary/30 transition-all"
          >
            <Play size={20} />
            {status === 'paused' ? 'Продолжить' : 'Старт'}
          </button>
        )}

        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-4 rounded-xl font-medium flex items-center gap-2 bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10 transition-all"
        >
          <RotateCcw size={18} />
          Сброс
        </button>
      </div>

      {/* Tips */}
      <div className="cyber-card p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Lightbulb className="text-yellow-400" size={20} />
          Советы для фокусировки
        </h3>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Устраните все отвлекающие факторы перед началом
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Выберите одну конкретную задачу для работы
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Перерывы важны - они помогают поддерживать продуктивность
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            После 4 фокус-сессий сделайте длинный перерыв
          </li>
        </ul>
      </div>
    </div>
  );
}
