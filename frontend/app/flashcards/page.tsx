'use client';

import { useState } from 'react';
import { BookOpen, RotateCcw, Brain, Zap, Trophy, Clock, ChevronLeft, Lightbulb } from 'lucide-react';

interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  courseTitle: string;
  lastReviewed?: Date;
  nextReview: Date;
  easeFactor: number;
  interval: number;
  repetitions: number;
  masteryLevel: 'new' | 'learning' | 'reviewing' | 'mastered';
}

interface Deck {
  id: string;
  title: string;
  courseSlug: string;
  icon: string;
  totalCards: number;
  dueToday: number;
  mastered: number;
}

const FlashcardDisplay = ({
  card,
  onRate,
}: {
  card: Flashcard;
  onRate: (rating: 'again' | 'hard' | 'good' | 'easy') => void;
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  const handleFlip = () => {
    setIsFlipped(true);
    setTimeout(() => setShowButtons(true), 300);
  };

  const handleRate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    setShowButtons(false);
    setIsFlipped(false);
    setTimeout(() => onRate(rating), 200);
  };

  const masteryConfig = {
    new: { label: '🆕 Новая', className: 'bg-primary/20 border-primary/40 text-primary' },
    learning: { label: '📚 Изучение', className: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' },
    reviewing: { label: '🔄 Повторение', className: 'bg-secondary/20 border-secondary/40 text-secondary' },
    mastered: { label: '⭐ Освоено', className: 'bg-green-500/20 border-green-500/40 text-green-400' },
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Mastery Badge */}
      <div className="text-center mb-6">
        <span className={`inline-block px-4 py-2 rounded-xl text-sm font-medium border ${masteryConfig[card.masteryLevel].className}`}>
          {masteryConfig[card.masteryLevel].label}
        </span>
        <p className="text-text-secondary text-sm mt-2">{card.courseTitle}</p>
      </div>

      {/* Card with 3D Flip */}
      <div
        onClick={!isFlipped ? handleFlip : undefined}
        className={`relative w-full h-96 cursor-${!isFlipped ? 'pointer' : 'default'}`}
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
          }}
        >
          {/* Front */}
          <div
            className="absolute w-full h-full p-10 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30 backdrop-blur-lg flex flex-col items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-2xl font-bold text-center leading-relaxed mb-6">
              {card.front}
            </div>
            <p className="text-text-secondary text-sm mt-auto">
              Нажмите, чтобы увидеть ответ
            </p>
          </div>

          {/* Back */}
          <div
            className="absolute w-full h-full p-10 rounded-2xl bg-gradient-to-br from-secondary/10 to-primary/10 border-2 border-secondary/30 backdrop-blur-lg flex flex-col items-center justify-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="text-xl font-semibold text-center leading-relaxed">
              {card.back}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Buttons */}
      {showButtons && (
        <div className="grid grid-cols-4 gap-3 mt-8">
          <button
            type="button"
            onClick={() => handleRate('again')}
            className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-white hover:bg-red-500/30 transition-all flex flex-col items-center gap-1"
          >
            <span className="text-xl">❌</span>
            <span className="font-medium">Не помню</span>
            <span className="text-xs text-red-400">&lt;1м</span>
          </button>

          <button
            type="button"
            onClick={() => handleRate('hard')}
            className="p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-white hover:bg-yellow-500/30 transition-all flex flex-col items-center gap-1"
          >
            <span className="text-xl">😕</span>
            <span className="font-medium">С трудом</span>
            <span className="text-xs text-yellow-400">&lt;6м</span>
          </button>

          <button
            type="button"
            onClick={() => handleRate('good')}
            className="p-4 rounded-xl bg-primary/20 border border-primary/40 text-white hover:bg-primary/30 transition-all flex flex-col items-center gap-1"
          >
            <span className="text-xl">😊</span>
            <span className="font-medium">Знаю</span>
            <span className="text-xs text-primary">&lt;10м</span>
          </button>

          <button
            type="button"
            onClick={() => handleRate('easy')}
            className="p-4 rounded-xl bg-green-500/20 border border-green-500/40 text-white hover:bg-green-500/30 transition-all flex flex-col items-center gap-1"
          >
            <span className="text-xl">🎯</span>
            <span className="font-medium">Отлично</span>
            <span className="text-xs text-green-400">4д</span>
          </button>
        </div>
      )}

      {!showButtons && !isFlipped && (
        <p className="text-center text-text-secondary text-sm mt-6">
          💡 Попробуйте вспомнить ответ перед переворотом
        </p>
      )}
    </div>
  );
};

export default function FlashcardsPage() {
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [reviewedToday, setReviewedToday] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const decks: Deck[] = [
    { id: 'python-basics', title: 'Основы Python', courseSlug: 'python-for-data-science', icon: '🐍', totalCards: 45, dueToday: 12, mastered: 28 },
    { id: 'data-structures', title: 'Структуры данных', courseSlug: 'algorithms-course', icon: '🔧', totalCards: 67, dueToday: 8, mastered: 42 },
    { id: 'machine-learning', title: 'Machine Learning', courseSlug: 'ml-fundamentals', icon: '🤖', totalCards: 89, dueToday: 15, mastered: 51 },
    { id: 'web-dev', title: 'Web Development', courseSlug: 'fullstack-bootcamp', icon: '🌐', totalCards: 52, dueToday: 6, mastered: 35 },
  ];

  const flashcards: Flashcard[] = [
    { id: '1', deckId: 'python-basics', front: 'Что такое переменная в Python?', back: 'Контейнер для хранения данных. Создается при присваивании значения.', courseTitle: 'Python для Data Science', nextReview: new Date(), easeFactor: 2.5, interval: 1, repetitions: 0, masteryLevel: 'new' },
    { id: '2', deckId: 'python-basics', front: 'Какие четыре основных типа данных в Python?', back: 'int (целые числа), float (десятичные), str (строки), bool (True/False)', courseTitle: 'Python для Data Science', nextReview: new Date(), easeFactor: 2.5, interval: 1, repetitions: 1, masteryLevel: 'learning' },
    { id: '3', deckId: 'python-basics', front: 'Как создать список в Python?', back: 'Используйте квадратные скобки: my_list = [1, 2, 3, 4, 5]', courseTitle: 'Python для Data Science', nextReview: new Date(), easeFactor: 2.5, interval: 3, repetitions: 2, masteryLevel: 'reviewing' },
    { id: '4', deckId: 'python-basics', front: 'Что делает функция len()?', back: 'Возвращает количество элементов в объекте (длина списка, строки и т.д.)', courseTitle: 'Python для Data Science', lastReviewed: new Date(), nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), easeFactor: 2.8, interval: 7, repetitions: 5, masteryLevel: 'mastered' },
    { id: '5', deckId: 'python-basics', front: 'В чем разница между списком и кортежем?', back: 'Списки изменяемые (mutable) [], кортежи неизменяемые (immutable) ()', courseTitle: 'Python для Data Science', nextReview: new Date(), easeFactor: 2.5, interval: 1, repetitions: 0, masteryLevel: 'new' },
  ];

  const selectedDeckData = selectedDeck ? decks.find((d) => d.id === selectedDeck) : null;
  const deckCards = selectedDeck ? flashcards.filter((c) => c.deckId === selectedDeck) : [];
  const currentCard = deckCards[currentCardIndex];

  const handleRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    setReviewedToday(reviewedToday + 1);
    const xpRewards = { again: 5, hard: 10, good: 15, easy: 20 };
    setXpEarned(xpEarned + xpRewards[rating]);

    if (currentCardIndex < deckCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        setSelectedDeck(null);
        setCurrentCardIndex(0);
      }, 3000);
    }
  };

  const totalDueToday = decks.reduce((acc, deck) => acc + deck.dueToday, 0);
  const totalMastered = decks.reduce((acc, deck) => acc + deck.mastered, 0);
  const totalCards = decks.reduce((acc, deck) => acc + deck.totalCards, 0);

  // Celebration Screen
  if (showCelebration) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fade-in">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            Колода завершена!
          </h1>
          <p className="text-xl text-text-secondary mb-8">
            Вы повторили {deckCards.length} карточек
          </p>
          <div className="inline-block px-6 py-3 rounded-xl bg-primary/20 border border-primary/40 text-primary text-xl font-bold">
            +{xpEarned} XP
          </div>
        </div>
      </div>
    );
  }

  // Study Mode
  if (selectedDeck && currentCard) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => { setSelectedDeck(null); setCurrentCardIndex(0); }}
            className="flex items-center gap-2 text-primary hover:text-secondary transition-colors mb-4"
          >
            <ChevronLeft size={20} />
            Назад к колодам
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-display flex items-center gap-3">
                <span className="text-3xl">{selectedDeckData?.icon}</span>
                {selectedDeckData?.title}
              </h1>
              <p className="text-text-secondary mt-1">
                Карточка {currentCardIndex + 1} из {deckCards.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{reviewedToday}</div>
              <div className="text-xs text-text-secondary">повторено сегодня</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar mb-10">
          <div
            className="progress-fill"
            style={{ width: `${((currentCardIndex + 1) / deckCards.length) * 100}%` }}
          />
        </div>

        {/* Flashcard */}
        <FlashcardDisplay card={currentCard} onRate={handleRating} />
      </div>
    );
  }

  // Decks Overview
  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display flex items-center gap-3 mb-2">
          <BookOpen className="text-primary" />
          Карточки
        </h1>
        <p className="text-text-secondary">
          Используйте интервальное повторение для эффективного запоминания
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="cyber-card p-5 text-center">
          <Clock className="mx-auto mb-2 text-primary" size={24} />
          <div className="text-3xl font-bold text-primary">{totalDueToday}</div>
          <div className="text-xs text-text-secondary">На сегодня</div>
        </div>
        <div className="cyber-card p-5 text-center">
          <Trophy className="mx-auto mb-2 text-green-400" size={24} />
          <div className="text-3xl font-bold text-green-400">{totalMastered}</div>
          <div className="text-xs text-text-secondary">Освоено</div>
        </div>
        <div className="cyber-card p-5 text-center">
          <Brain className="mx-auto mb-2 text-secondary" size={24} />
          <div className="text-3xl font-bold text-secondary">{totalCards}</div>
          <div className="text-xs text-text-secondary">Всего карточек</div>
        </div>
        <div className="cyber-card p-5 text-center">
          <Zap className="mx-auto mb-2 text-yellow-400" size={24} />
          <div className="text-3xl font-bold text-yellow-400">{reviewedToday}</div>
          <div className="text-xs text-text-secondary">Повторено сегодня</div>
        </div>
      </div>

      {/* Decks Grid */}
      <h2 className="text-2xl font-bold font-display mb-6">Ваши колоды</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {decks.map((deck) => (
          <div
            key={deck.id}
            onClick={() => setSelectedDeck(deck.id)}
            className="cyber-card p-6 cursor-pointer hover:border-primary/40 transition-all group"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="text-5xl group-hover:scale-110 transition-transform">
                {deck.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                  {deck.title}
                </h3>
                <p className="text-sm text-text-secondary">{deck.totalCards} карточек</p>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <div className="flex-1 p-3 rounded-xl bg-primary/10 border border-primary/30 text-center">
                <div className="text-lg font-bold text-primary">{deck.dueToday}</div>
                <div className="text-xs text-text-secondary">Сегодня</div>
              </div>
              <div className="flex-1 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                <div className="text-lg font-bold text-green-400">{deck.mastered}</div>
                <div className="text-xs text-text-secondary">Освоено</div>
              </div>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(deck.mastered / deck.totalCards) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="cyber-card p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Lightbulb className="text-yellow-400" size={24} />
          Как работает интервальное повторение
        </h3>
        <div className="text-text-secondary leading-relaxed">
          <p className="mb-3">
            Наша система карточек использует научно доказанный алгоритм интервального повторения:
          </p>
          <ul className="space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Сложные карточки появляются чаще
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Освоенные карточки показываются с увеличивающимся интервалом
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Система адаптируется к вашему темпу обучения
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Оптимизировано для максимального запоминания
            </li>
          </ul>
          <p className="text-primary font-medium">
            💡 Совет: Повторяйте карточки каждый день по 10-15 минут для лучших результатов!
          </p>
        </div>
      </div>
    </div>
  );
}
