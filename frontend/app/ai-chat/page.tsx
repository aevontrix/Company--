'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, Zap, Brain, Target, Rocket, Lock, AlertCircle, Wifi } from 'lucide-react';
import GroqService from './groq-service';
import { config, isConfigured } from './config';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  responseTime?: number;
}

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  prompt: string;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Привет! Я твой AI-помощник в обучении на базе Groq (Llama 3.3). Могу помочь разобраться с концепциями, объяснить сложные темы, дать персональные рекомендации и провести по учебному материалу. Что хотите изучить сегодня?',
      timestamp: new Date(),
      responseTime: 12,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [aiService, setAIService] = useState<GroqService | null>(null);
  const [configError, setConfigError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions: QuickAction[] = [
    {
      id: '1',
      icon: <Zap size={20} className="text-yellow-400" />,
      title: 'Быстрый тест',
      description: 'Проверьте знания за 5 минут',
      prompt: 'Проведи быстрый тест по текущей теме обучения',
    },
    {
      id: '2',
      icon: <Brain size={20} className="text-primary" />,
      title: 'Объясни тему',
      description: 'Визуальное объяснение концепции',
      prompt: 'Объясни подробно концепцию, которую я сейчас изучаю',
    },
    {
      id: '3',
      icon: <Target size={20} className="text-green-400" />,
      title: 'Практика',
      description: 'Решение задач пошагово',
      prompt: 'Дай практическую задачу с пошаговым решением',
    },
    {
      id: '4',
      icon: <Rocket size={20} className="text-orange-400" />,
      title: 'Идея проекта',
      description: 'Персональный проект для практики',
      prompt: 'Предложи идею проекта на основе моих навыков',
    },
  ];

  // Инициализация Groq сервиса
  useEffect(() => {
    if (!isConfigured()) {
      setConfigError(true);
      console.error('⚠️ API ключ не настроен! Откройте config.ts и вставьте ваш бесплатный ключ Groq');
      return;
    }
    
    const service = new GroqService(config.groq.apiKey);
    setAIService(service);
    setConfigError(false);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Проверка конфигурации
    if (!aiService || configError) {
      alert('⚠️ AI помощник не настроен. Проверьте config.ts файл.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsThinking(true);

    // Подготовка истории для контекста
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      // Реальный запрос к Groq API (БЕСПЛАТНО и БЫСТРО!)
      const result = await aiService.sendMessage(inputValue, conversationHistory);

      if (result.success && result.message) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.message,
          timestamp: new Date(),
          responseTime: result.responseTime,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        // Обработка ошибки
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Извините, произошла ошибка: ${result.error || 'Неизвестная ошибка'}. Пожалуйста, попробуйте ещё раз.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Произошла непредвиденная ошибка. Проверьте подключение к интернету и попробуйте снова.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    setInputValue(action.prompt);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold font-display mb-2 flex items-center gap-3">
          <Bot className="text-primary" />
          AI Помощник
        </h1>
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${configError ? 'bg-red-400' : 'bg-green-400'} animate-pulse`} />
            {configError ? 'Не настроен' : 'Онлайн'}
          </span>
          <span className="flex items-center gap-1 text-green-400">
            <Lock size={14} />
            E2E шифрование
          </span>
          <span className="flex items-center gap-1 text-blue-400">
            <Wifi size={14} />
            Groq AI
          </span>
        </div>
        
        {/* Предупреждение о конфигурации */}
        {configError && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-medium text-red-400 mb-1">API ключ не настроен</div>
              <div className="text-sm text-text-secondary">
                Настройте ключ в <code className="px-1 py-0.5 bg-white/10 rounded">config.ts</code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto cyber-card p-4 mb-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-primary/20 border border-primary/30'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Bot size={14} />
                    </div>
                    <span className="text-xs font-medium text-primary">AI Помощник</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                  <span>
                    {message.timestamp.toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {message.responseTime && (
                    <span className="text-primary">{message.responseTime}ms</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
                    <Bot size={14} />
                  </div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-text-secondary">AI думает...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && !configError && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3 text-sm text-text-secondary">
            <Sparkles size={16} className="text-primary" />
            Быстрые действия
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => handleQuickAction(action)}
                className="p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 hover:border-primary/30 transition-all group"
              >
                <div className="mb-2 group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
                <div className="font-medium text-sm mb-1">{action.title}</div>
                <div className="text-xs text-text-secondary">{action.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="cyber-card p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Задайте вопрос... (Shift+Enter для новой строки)"
              rows={2}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-text-secondary resize-none focus:outline-none focus:border-primary/40 transition-all"
              disabled={configError}
            />
            <div className="absolute bottom-2 right-3 text-xs text-text-secondary">
              {inputValue.length}/2000
            </div>
          </div>
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isThinking || configError}
            className={`px-6 rounded-xl font-medium flex items-center gap-2 transition-all ${
              inputValue.trim() && !isThinking && !configError
                ? 'bg-primary/20 border border-primary/40 text-white hover:bg-primary/30'
                : 'bg-white/5 border border-white/10 text-text-secondary cursor-not-allowed'
            }`}
          >
            <Send size={18} />
            Отправить
          </button>
        </div>
        <div className="mt-3 text-center text-xs text-text-secondary">
          Ответы персонализированы на основе вашего прогресса обучения
        </div>
      </div>
    </div>
  );
}