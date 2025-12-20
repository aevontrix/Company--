'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DOMPurify from 'dompurify';
import { lessonsAPI, learningAPI, coursesAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLessonTimeTracking, formatTime } from '@/lib/hooks/useLessonTimeTracking';
import { useToastStore } from '@/lib/store/toastStore';
import { ArrowLeft, ArrowRight, Play, Pause, Maximize, Check, X, Clock, CheckCircle, Award, Star } from 'lucide-react';

// ✅ FIX: Sanitize HTML content to prevent XSS attacks
const sanitizeHTML = (html: string): string => {
  if (typeof window === 'undefined') return html;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'img', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
};

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation: string;
}

interface LessonData {
  id: string;
  courseSlug: string;
  courseTitle: string;
  sectionTitle: string;
  title: string;
  type: 'video' | 'quiz' | 'reading' | 'project';
  duration: string;
  content: string;
  videoUrl?: string;
  quizQuestions?: QuizQuestion[];
  resources?: Array<{ name: string; url: string; type: string }>;
  nextLessonId?: string;
  prevLessonId?: string;
  xpReward: number;
  userScore?: number;
}

// Lesson Rating Component
const LessonRating = ({
  lessonProgressId,
  currentScore,
  onRatingChange,
}: {
  lessonProgressId: number | null;
  currentScore?: number;
  onRatingChange: (score: number) => void;
}) => {
  const [score, setScore] = useState(currentScore || 0);
  const [hoveredScore, setHoveredScore] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleRating = async (newScore: number) => {
    if (!lessonProgressId) return;

    try {
      setSaving(true);
      setScore(newScore);
      await learningAPI.updateLessonScore(lessonProgressId, newScore);
      onRatingChange(newScore);
    } catch (error) {
      console.error('Failed to save rating:', error);
    } finally {
      setSaving(false);
    }
  };

  const ratings = [
    { value: 20, label: 'Не понял', emoji: '😕', color: 'text-red-400' },
    { value: 40, label: 'Сложно', emoji: '😐', color: 'text-orange-400' },
    { value: 60, label: 'Нормально', emoji: '🙂', color: 'text-yellow-400' },
    { value: 80, label: 'Хорошо', emoji: '😊', color: 'text-green-400' },
    { value: 100, label: 'Отлично', emoji: '🤩', color: 'text-primary' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-2 justify-center flex-wrap">
        {ratings.map((rating) => (
          <button
            key={rating.value}
            type="button"
            onClick={() => handleRating(rating.value)}
            onMouseEnter={() => setHoveredScore(rating.value)}
            onMouseLeave={() => setHoveredScore(0)}
            disabled={saving}
            className={`flex-1 min-w-[80px] p-3 rounded-xl transition-all ${
              score === rating.value
                ? 'bg-primary/20 border-2 border-primary/60 scale-105'
                : hoveredScore === rating.value
                ? 'bg-white/10 border-2 border-white/30'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            <div className={`text-2xl mb-1 ${score === rating.value ? rating.color : ''}`}>
              {rating.emoji}
            </div>
            <div className="text-xs font-medium">{rating.label}</div>
            <div className="text-xs text-text-secondary">{rating.value}%</div>
          </button>
        ))}
      </div>
      {score > 0 && (
        <div className="text-center text-sm text-green-400 flex items-center justify-center gap-2">
          <CheckCircle size={16} />
          Оценка сохранена: {score}%
        </div>
      )}
    </div>
  );
};

// Video Player Component
const VideoPlayer = ({ lesson, onComplete }: { lesson: LessonData; onComplete?: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [hasTriggeredCompletion, setHasTriggeredCompletion] = useState(false);

  const isYouTubeVideo = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoUrl = lesson.videoUrl || '';
  const isYouTube = isYouTubeVideo(videoUrl);
  const youtubeId = isYouTube ? getYouTubeId(videoUrl) : null;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (!hasTriggeredCompletion && video.duration > 0) {
        const progress = (video.currentTime / video.duration) * 100;
        if (progress >= 90) {
          setHasTriggeredCompletion(true);
          onComplete?.();
        }
      }
    };

    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [hasTriggeredCompletion, onComplete]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const togglePlay = () => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = clickX / rect.width;
    videoRef.current.currentTime = duration * newProgress;
  };

  if (isYouTube && youtubeId) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-primary/30">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
          title={lesson.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      className="relative w-full aspect-video rounded-xl bg-black border border-primary/30 overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(isPlaying ? false : true)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onClick={togglePlay}
      >
        {videoUrl && <source src={videoUrl} type="video/mp4" />}
      </video>

      {/* Custom Controls */}
      {showControls && videoUrl && (
        <div
          className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress Bar */}
          <div
            className="w-full h-1.5 bg-white/20 rounded-full mb-3 cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={togglePlay}
              className="text-white text-2xl hover:text-primary transition"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
            </button>

            <div className="text-sm text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <div className="flex-1" />

            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs cursor-pointer"
              style={{ colorScheme: 'dark' }}
              aria-label="Скорость воспроизведения"
            >
              <option value="0.5" style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>0.5x</option>
              <option value="0.75" style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>0.75x</option>
              <option value="1" style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>1x</option>
              <option value="1.25" style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>1.25x</option>
              <option value="1.5" style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>1.5x</option>
              <option value="2" style={{ backgroundColor: '#0a0a0c', color: '#ffffff' }}>2x</option>
            </select>

            <button
              type="button"
              onClick={() => videoRef.current?.requestFullscreen?.()}
              className="text-white text-xl hover:text-primary transition"
              aria-label="Полноэкранный режим"
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>
      )}

      {/* No Video Message */}
      {!videoUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary">
          <div className="text-5xl mb-4">📹</div>
          <div>Видео недоступно</div>
          <div className="text-sm mt-2">Добавьте video_url в админ-панели Django</div>
        </div>
      )}
    </div>
  );
};

// ✅ Quiz state persistence key
const getQuizStorageKey = (lessonId: string) => `onthego_quiz_${lessonId}`;

interface QuizState {
  currentQuestionIndex: number;
  score: number;
  timeElapsed: number; // in seconds
  startedAt: number;
  answers: Record<number, string>; // questionIndex -> selectedAnswer
}

// Quiz Component with Timer Persistence
const QuizInterface = ({ lesson, onComplete }: { lesson: LessonData; onComplete: () => void }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // ✅ Timer state
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const questions = lesson.quizQuestions || [];
  const storageKey = getQuizStorageKey(lesson.id);

  // ✅ Load saved quiz state on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const state: QuizState = JSON.parse(saved);
        // Calculate time elapsed since last save
        const additionalTime = Math.floor((Date.now() - state.startedAt) / 1000);
        setTimeElapsed(state.timeElapsed);
        setCurrentQuestionIndex(state.currentQuestionIndex);
        setScore(state.score);
        // Note: We don't restore answers to allow re-answering
      } catch (e) {
        console.error('Failed to restore quiz state:', e);
      }
    }
  }, [storageKey]);

  // ✅ Timer effect
  useEffect(() => {
    if (completed || !isTimerRunning) return;

    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [completed, isTimerRunning]);

  // ✅ Save state periodically and on navigation
  useEffect(() => {
    const saveState = () => {
      if (completed) return;

      const state: QuizState = {
        currentQuestionIndex,
        score,
        timeElapsed,
        startedAt: Date.now(),
        answers: {},
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    };

    // Save every 5 seconds
    const saveInterval = setInterval(saveState, 5000);

    // Save on beforeunload
    const handleBeforeUnload = () => {
      saveState();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(saveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [storageKey, currentQuestionIndex, score, timeElapsed, completed]);

  // ✅ Clear saved state when quiz is completed
  useEffect(() => {
    if (completed) {
      localStorage.removeItem(storageKey);
    }
  }, [completed, storageKey]);

  // ✅ Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const currentQuestion = questions[currentQuestionIndex];

  // ✅ FIX: Show error if no quiz questions are available
  if (questions.length === 0) {
    return (
      <div className="cyber-card p-12 text-center">
        <div className="text-8xl mb-6">⚠️</div>
        <h2 className="text-3xl font-bold mb-4">Тест не настроен</h2>
        <p className="text-text-secondary mb-8">
          К сожалению, для этого урока ещё не добавлены вопросы теста.
          <br />
          Пожалуйста, свяжитесь с администратором курса.
        </p>
      </div>
    );
  }

  const handleAnswerSelect = (optionId: string) => {
    if (showExplanation) return;
    setSelectedAnswer(optionId);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || !currentQuestion) return;
    const isCorrect = currentQuestion.options.find((o) => o.id === selectedAnswer)?.isCorrect;
    if (isCorrect) setScore(score + 1);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setCompleted(true);
      // ✅ FIX: Only call onComplete if passing score (>=70%)
      if (currentQuestion && selectedAnswer) {
        const finalScore = score + (currentQuestion.options.find((o) => o.id === selectedAnswer)?.isCorrect ? 1 : 0);
        const percentage = Math.round((finalScore / questions.length) * 100);
        if (percentage >= 70) {
          onComplete();
        }
      }
    }
  };

  if (completed) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <div className="cyber-card p-12 text-center">
        <div className="text-8xl mb-6">
          {passed ? (percentage >= 80 ? '🏆' : '🎯') : '📚'}
        </div>
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Тест завершён!
        </h2>
        <div className="text-2xl mb-3">
          Результат: {score} / {questions.length} ({percentage}%)
        </div>
        {/* ✅ Show time taken */}
        <div className="text-sm text-text-secondary mb-4 flex items-center justify-center gap-2">
          <Clock size={14} />
          Время: {formatTime(timeElapsed)}
        </div>
        <div className={`text-lg mb-8 ${passed ? 'text-green-400' : 'text-red-400'}`}>
          {passed ? '✅ Поздравляем! Вы успешно прошли тест!' : '❌ Недостаточно правильных ответов. Попробуйте ещё раз!'}
          <div className="text-sm mt-2 text-text-secondary">
            {passed ? 'Минимум для прохождения: 70%' : 'Для прохождения нужно минимум 70% правильных ответов'}
          </div>
        </div>
        {passed ? (
          <div className="inline-block px-6 py-3 rounded-xl bg-primary/20 border border-primary/40 text-primary font-semibold">
            +{lesson.xpReward} XP получено!
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setCompleted(false);
              setCurrentQuestionIndex(0);
              setScore(0);
              setSelectedAnswer(null);
              setShowExplanation(false);
            }}
            className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:shadow-lg transition-all"
          >
            🔄 Попробовать снова
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="cyber-card p-8">
      {/* Progress & Timer */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-text-secondary">
            Вопрос {currentQuestionIndex + 1} из {questions.length}
          </div>
          {/* ✅ Timer Display */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
            <Clock size={14} className="text-primary" />
            <span className="text-sm font-mono text-primary">{formatTime(timeElapsed)}</span>
          </div>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h3 className="text-2xl font-semibold mb-8 leading-relaxed">
        {currentQuestion.question}
      </h3>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {currentQuestion.options.map((option) => {
          const isSelected = selectedAnswer === option.id;
          const isCorrect = option.isCorrect;
          const showResult = showExplanation;

          let borderColor = 'border-white/10';
          let bgColor = 'bg-white/5';
          let textColor = 'text-white';

          if (showResult) {
            if (isCorrect) {
              borderColor = 'border-green-500/50';
              bgColor = 'bg-green-500/10';
              textColor = 'text-green-400';
            } else if (isSelected && !isCorrect) {
              borderColor = 'border-red-500/50';
              bgColor = 'bg-red-500/10';
              textColor = 'text-red-400';
            }
          } else if (isSelected) {
            borderColor = 'border-primary/50';
            bgColor = 'bg-primary/10';
          }

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleAnswerSelect(option.id)}
              disabled={showExplanation}
              className={`w-full p-5 text-left font-medium ${bgColor} border-2 ${borderColor} ${textColor} rounded-xl transition-all hover:bg-white/10 disabled:cursor-default flex items-center gap-3`}
            >
              <div className={`w-6 h-6 rounded-full border-2 ${isSelected ? `border-current` : 'border-gray-600'} flex items-center justify-center text-sm`}>
                {showResult && isCorrect && '✓'}
                {showResult && isSelected && !isCorrect && '✗'}
              </div>
              <span>{option.text}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 mb-6">
          <div className="text-sm font-semibold text-primary mb-2">💡 Пояснение</div>
          <div className="text-sm text-text-secondary leading-relaxed">
            {currentQuestion.explanation}
          </div>
        </div>
      )}

      {/* Action Button */}
      {!showExplanation ? (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedAnswer}
          className={`px-8 py-3.5 text-base font-bold rounded-xl transition-all ${
            selectedAnswer
              ? 'bg-gradient-to-r from-primary to-secondary text-black shadow-lg shadow-primary/30 hover:shadow-primary/50'
              : 'bg-white/10 text-gray-600 cursor-not-allowed'
          }`}
        >
          Отправить ответ
        </button>
      ) : (
        <button
          type="button"
          onClick={handleNext}
          className="px-8 py-3.5 text-base font-bold text-black bg-gradient-to-r from-primary to-secondary rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
        >
          {currentQuestionIndex < questions.length - 1 ? 'Следующий вопрос →' : 'Завершить тест 🎉'}
        </button>
      )}
    </div>
  );
};

// Reading Component
const ReadingInterface = ({ lesson, onComplete, isCompleted }: { lesson: LessonData; onComplete?: () => void; isCompleted?: boolean }) => {
  return (
    <div className="cyber-card p-0 overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-white/10 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/40 flex items-center justify-center">
            <span className="text-2xl">📖</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">{lesson.title}</h2>
            <div className="text-sm text-text-secondary">Чтение • {lesson.duration} мин</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-10">
        <div
          className="lesson-content max-w-4xl mx-auto"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(lesson.content || '') }}
        />
      </div>

      {/* Custom styles for lesson content */}
      <style jsx global>{`
        .lesson-content p {
          font-size: 1.125rem;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 1.5rem;
        }

        .lesson-content p:first-child {
          font-size: 1.25rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.95);
        }

        .lesson-content br {
          content: "";
          display: block;
          margin-top: 0.5rem;
        }

        .lesson-content strong {
          color: #a78bfa;
          font-weight: 600;
        }

        .lesson-content em {
          color: #7c3aed;
          font-style: normal;
        }

        .lesson-content code {
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.3);
          padding: 0.2rem 0.5rem;
          border-radius: 0.375rem;
          font-family: 'Courier New', monospace;
          color: #a78bfa;
        }

        .lesson-content ul, .lesson-content ol {
          margin: 1.5rem 0;
          padding-left: 2rem;
        }

        .lesson-content li {
          font-size: 1.125rem;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 0.75rem;
        }

        .lesson-content h1, .lesson-content h2, .lesson-content h3 {
          color: #ffffff;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }

        .lesson-content h1 {
          font-size: 2rem;
          background: linear-gradient(135deg, #7c3aed, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .lesson-content h2 {
          font-size: 1.5rem;
          color: #a78bfa;
        }

        .lesson-content h3 {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.95);
        }
      `}</style>
    </div>
  );
};

// Project Component
const ProjectInterface = ({ lesson, onComplete, isCompleted }: { lesson: LessonData; onComplete?: () => void; isCompleted?: boolean }) => {
  return (
    <div className="cyber-card p-10">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🚀</div>
        <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Практический проект
        </h3>
      </div>

      <div className="text-base leading-relaxed text-text-secondary mb-8">
        {lesson.content}
      </div>

      <div className="p-6 rounded-xl bg-secondary/5 border border-secondary/20">
        <div className="text-sm font-semibold text-secondary mb-3">📋 Требования к проекту</div>
        <ul className="text-sm text-text-secondary space-y-2 list-disc list-inside">
          <li>Выполните все этапы реализации</li>
          <li>Тщательно протестируйте ваш код</li>
          <li>Задокументируйте ваш подход</li>
          <li>Отправьте финальный проект</li>
        </ul>
      </div>
    </div>
  );
};

// Main Lesson Viewer Page
export default function LessonViewerPage() {
  const params = useParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { addToast } = useToastStore();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;

  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [lessonProgressId, setLessonProgressId] = useState<number | null>(null);
  const [completionPending, setCompletionPending] = useState(false);

  // Time tracking
  const { timeSpent, isTracking } = useLessonTimeTracking(lessonId, (time) => {
    // Отправляем время на сервер каждые 30 секунд
    if (lessonProgressId) {
      learningAPI.updateLessonTime(lessonProgressId, time).catch(console.error);
    }
  });

  // Load lesson data
  useEffect(() => {
    const loadLesson = async () => {
      try {
        setLoading(true);
        setError(null);

        const lessonData = await lessonsAPI.getLesson(parseInt(lessonId));

        // Map backend content_type to frontend type
        const mapContentType = (backendType: string): 'video' | 'quiz' | 'reading' | 'project' => {
          if (backendType === 'text') return 'reading';
          if (backendType === 'video') return 'video';
          if (backendType === 'quiz') return 'quiz';
          if (backendType === 'project') return 'project';
          return 'reading'; // default
        };

        // Format text content to HTML
        const formatContent = (content: string, type: string): string => {
          if (!content) return '<p>Контент недоступен</p>';
          // Format for text, reading, and video types
          if (type === 'text' || type === 'reading' || type === 'video') {
            // Convert plain text to HTML paragraphs
            return content
              .split(/\r?\n\r?\n/)  // Split by double newlines
              .map(para => para.trim())
              .filter(para => para.length > 0)
              .map(para => `<p>${para.replace(/\r?\n/g, '<br>')}</p>`)
              .join('');
          }
          return content;
        };

        // ✅ FIX: Get course structure to find next/prev lessons
        let nextLessonId: string | undefined;
        let prevLessonId: string | undefined;

        try {
          const structure = await coursesAPI.getCourseStructure(slug);
          // Flatten all lessons from all modules
          const allLessons: any[] = [];
          structure.modules.forEach((module: any) => {
            module.lessons.forEach((lesson: any) => {
              allLessons.push(lesson);
            });
          });

          // Find current lesson index
          const currentIndex = allLessons.findIndex(l => l.id.toString() === lessonId);
          if (currentIndex !== -1) {
            if (currentIndex > 0) {
              prevLessonId = allLessons[currentIndex - 1].id.toString();
            }
            if (currentIndex < allLessons.length - 1) {
              nextLessonId = allLessons[currentIndex + 1].id.toString();
            }
          }
        } catch (err) {
          console.error('Failed to load course structure:', err);
        }

        // ✅ FIX: Load quiz questions if this is a quiz lesson
        let quizQuestions: QuizQuestion[] = [];
        if (lessonData.content_type === 'quiz') {
          try {
            const quizData = await lessonsAPI.getLessonQuiz(parseInt(lessonId)) as any;
            if (quizData && quizData.questions) {
              quizQuestions = quizData.questions.map((q: any) => ({
                id: q.id.toString(),
                question: q.text,
                options: q.options.map((opt: any, idx: number) => ({
                  id: `option_${idx}`,
                  text: opt.text,
                  isCorrect: opt.is_correct || false
                })),
                explanation: q.explanation || ''
              }));
            }
          } catch (quizErr) {
            console.error('Failed to load quiz questions:', quizErr);
          }
        }

        setLesson({
          id: lessonData.id.toString(),
          courseSlug: slug,
          courseTitle: 'Загрузка...',
          sectionTitle: 'Модуль ' + lessonData.module,
          title: lessonData.title,
          type: mapContentType(lessonData.content_type),
          duration: lessonData.duration_minutes?.toString() || '0',
          content: formatContent(lessonData.content, lessonData.content_type),
          videoUrl: lessonData.video_url || undefined,
          quizQuestions,
          resources: [],
          nextLessonId,
          prevLessonId,
          xpReward: 50,
        });

        try {
          const progressData = await learningAPI.getLessonProgress(parseInt(lessonId));
          if (progressData && Array.isArray(progressData) && progressData.length > 0) {
            const progress = progressData[0];
            setLessonProgressId(progress.id);
            setIsCompleted(progress.status === 'completed');
          }
        } catch (progressErr) {
          console.log('No existing lesson progress found');
        }
      } catch (err: any) {
        console.error('Failed to load lesson:', err);
        setError(err?.message || 'Не удалось загрузить урок');
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      loadLesson();
    }
  }, [lessonId, slug]);

  const handleComplete = async () => {
    if (!lesson || isCompleted || completionPending) return;

    try {
      setCompletionPending(true);

      // ✅ FIX: Create lesson progress if it doesn't exist
      let progressId = lessonProgressId;
      if (!progressId) {
        try {
          // Try to get or create lesson progress
          const progressData = await learningAPI.getLessonProgress(parseInt(lessonId));
          if (progressData && Array.isArray(progressData) && progressData.length > 0) {
            progressId = progressData[0].id;
            setLessonProgressId(progressId);
          }
        } catch (err) {
          console.error('Failed to get/create lesson progress:', err);
        }
      }

      if (progressId) {
        const response = await learningAPI.markLessonCompleted(progressId) as any;
        setIsCompleted(true);
        await refreshUser();

        const xpAwarded = response?.xp_awarded || lesson.xpReward;

        if (xpAwarded > 0) {
          addToast({
            type: 'success',
            title: '✅ Урок завершён!',
            message: `+${xpAwarded} XP получено! 🎉`,
            duration: 3000,
          });

          // ✅ FIX: Auto-redirect to next lesson after 1.5 seconds
          if (lesson.nextLessonId) {
            setTimeout(() => {
              router.push(`/courses/${slug}/${lesson.nextLessonId}`);
            }, 1500);
          }
        } else {
          addToast({
            type: 'info',
            title: 'Уже завершено',
            message: 'Вы уже завершили этот урок',
            duration: 3000,
          });
        }
      } else {
        addToast({
          type: 'error',
          title: 'Невозможно сохранить прогресс',
          message: 'Пожалуйста, запишитесь на этот курс сначала',
        });
      }
    } catch (err: any) {
      console.error('Failed to mark lesson as complete:', err);
      addToast({
        type: 'error',
        title: 'Не удалось сохранить прогресс',
        message: err?.message || 'Пожалуйста, попробуйте снова',
      });
    } finally {
      setCompletionPending(false);
    }
  };

  const handleNextLesson = () => {
    if (lesson?.nextLessonId) {
      router.push(`/courses/${slug}/${lesson.nextLessonId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-3">Ошибка загрузки урока</h2>
          <p className="text-text-secondary mb-6">{error || 'Урок не найден'}</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary/20 border border-primary/40 rounded-xl hover:bg-primary/30 transition-all"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/courses/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-secondary transition mb-4"
        >
          <ArrowLeft size={16} />
          Назад к курсу
        </Link>
        <div className="text-xs text-text-secondary mb-2">{lesson.sectionTitle}</div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">{lesson.title}</h1>
          {/* Time Tracker */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <Clock size={16} className={isTracking ? 'text-green-400' : 'text-text-secondary'} />
              <span className="text-sm font-mono">{formatTime(timeSpent)}</span>
            </div>
          </div>
        </div>
        <div className="text-sm text-text-secondary">
          {lesson.type === 'video' && `📹 Видео • ${lesson.duration} мин`}
          {lesson.type === 'quiz' && `❓ Тест • ${lesson.quizQuestions?.length} вопросов`}
          {lesson.type === 'reading' && `📖 Чтение • ${lesson.duration} мин`}
          {lesson.type === 'project' && `🚀 Проект • ${lesson.duration} мин`}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {lesson.type === 'video' && (
            <>
              <VideoPlayer lesson={lesson} onComplete={handleComplete} />
              {/* Video Content/Transcript */}
              {lesson.content && (
                <div className="cyber-card p-6">
                  <h3 className="text-lg font-bold mb-4">📝 Содержание урока</h3>
                  <div
                    className="lesson-content prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(lesson.content || '') }}
                  />
                </div>
              )}
            </>
          )}
          {lesson.type === 'quiz' && <QuizInterface lesson={lesson} onComplete={handleComplete} />}
          {lesson.type === 'reading' && <ReadingInterface lesson={lesson} onComplete={handleComplete} isCompleted={isCompleted} />}
          {lesson.type === 'project' && <ProjectInterface lesson={lesson} onComplete={handleComplete} isCompleted={isCompleted} />}

          {/* Lesson Rating */}
          {isCompleted && (
            <div className="cyber-card p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Award size={20} className="text-yellow-400" />
                Оцените урок
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Насколько хорошо вы поняли материал?
              </p>
              <LessonRating
                lessonProgressId={lessonProgressId}
                currentScore={lesson.userScore}
                onRatingChange={(score) => {
                  // Update local state if needed
                }}
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-wrap gap-4">
            {/* Previous Button - Hide for first lesson */}
            {lesson.prevLessonId && (
              <Link
                href={`/courses/${slug}/${lesson.prevLessonId}`}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <ArrowLeft size={18} />
                Предыдущий
              </Link>
            )}

            {/* Spacer to push next buttons to the right */}
            <div className="flex-1" />

            {/* Mark as Completed Button - ✅ FIX: Hide for quiz/project types */}
            {lesson.type !== 'quiz' && lesson.type !== 'project' && (
              <button
                type="button"
                onClick={handleComplete}
                disabled={completionPending || isCompleted}
                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  isCompleted
                    ? 'bg-green-500/20 border border-green-500/40 text-green-400 cursor-not-allowed'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                {completionPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Сохранение...
                  </>
                ) : isCompleted ? (
                  <>
                    <CheckCircle size={18} />
                    Выполнено
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Пометить как выполненное
                  </>
                )}
              </button>
            )}

            {/* Next Button - ✅ FIX: Block if quiz/project not completed */}
            {lesson.nextLessonId && (
              <button
                type="button"
                onClick={handleNextLesson}
                disabled={(lesson.type === 'quiz' || lesson.type === 'project') && !isCompleted}
                className={`px-6 py-3 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 ${
                  (lesson.type === 'quiz' || lesson.type === 'project') && !isCompleted
                    ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-500/30'
                    : 'bg-gradient-to-r from-primary to-secondary text-white shadow-primary/30 hover:shadow-primary/50'
                }`}
                title={(lesson.type === 'quiz' || lesson.type === 'project') && !isCompleted ? 'Пройдите задание, чтобы продолжить' : ''}
              >
                Следующий
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resources */}
          {lesson.resources && lesson.resources.length > 0 && (
            <div className="cyber-card p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                📎 Ресурсы
              </h3>
              <div className="space-y-2">
                {lesson.resources.map((resource, idx) => (
                  <a
                    key={idx}
                    href={resource.url}
                    className="block p-3 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span>{resource.name}</span>
                      <span className="text-xs text-text-secondary">{resource.type}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="cyber-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">📝 Мои заметки</h3>
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className="text-primary hover:text-secondary transition"
              >
                {showNotes ? <X size={20} /> : '+'}
              </button>
            </div>
            {showNotes && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Делайте заметки во время обучения..."
                className="w-full min-h-[200px] p-3 text-sm bg-black/30 border border-white/10 rounded-lg resize-vertical focus:border-primary focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
