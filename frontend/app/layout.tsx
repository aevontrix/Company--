'use client';

import './globals.css';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { GamificationProvider } from '@/contexts/GamificationContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import AuthGuard from '@/components/auth/AuthGuard';
import ErrorBoundary from '@/components/ErrorBoundary';
import GlobalErrorToast from '@/components/GlobalErrorToast';
import { AchievementNotificationProvider } from '@/components/ui/AchievementNotification';
import OfflineBanner from '@/components/ui/OfflineBanner';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  GraduationCap,
  Search,
  Layers,
  Zap,
  Bot,
  MessageSquare,
  Trophy,
  User,
  Bell,
  Flame,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

// Navigation items with Lucide icons
const NAV_SECTIONS = [
  {
    title: 'ПЛАТФОРМА',
    items: [
      { href: '/', icon: LayoutDashboard, label: 'Главная' },
      { href: '/courses', icon: BookOpen, label: 'Курсы' },
      { href: '/catalog', icon: Search, label: 'Каталог' },
      { href: '/my-learning', icon: GraduationCap, label: 'Моё обучение' },
      { href: '/flashcards', icon: Layers, label: 'Карточки' },
      { href: '/focus', icon: Zap, label: 'Режим фокуса' },
    ],
  },
  {
    title: 'СООБЩЕСТВО',
    items: [
      { href: '/ai-chat', icon: Bot, label: 'AI Репетитор' },
      { href: '/messages', icon: MessageSquare, label: 'Сообщения' },
      { href: '/leaderboard', icon: Trophy, label: 'Рейтинг' },
      { href: '/profile', icon: User, label: 'Профиль' },
    ],
  },
];

// Sidebar Component (main.html style)
const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartX = useRef(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const width = isMobile ? '0px' : isCollapsed ? '80px' : '280px';
    document.documentElement.style.setProperty('--sidebar-width', width);
  }, [isCollapsed, isMobile]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Touch gestures for mobile
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (!isMobileMenuOpen && touchStartX.current < 50 && diff > 80) {
      setIsMobileMenuOpen(true);
    }
    if (isMobileMenuOpen && diff < -80) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobile) return;
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, handleTouchStart, handleTouchEnd]);

  const sidebarWidth = isMobile ? '280px' : isCollapsed ? '80px' : '280px';

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed top-4 left-4 z-[1001] w-12 h-12 flex items-center justify-center rounded-xl glass-panel"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/75 z-[999] animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className="glass-panel fixed left-0 top-0 h-full z-[1000] flex flex-col border-r border-l-0 border-y-0"
        style={{
          width: sidebarWidth,
          transform: isMobile ? (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
          transition: 'transform 0.3s ease, width 0.3s ease',
        }}
      >
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            {(!isCollapsed || isMobile) && (
              <span className="font-display font-bold text-xl tracking-tight">ONTHEGO</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {(!isCollapsed || isMobile) && (
                <div className="text-xs font-mono text-gray-500 mb-3 px-2">{section.title}</div>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => isMobile && setIsMobileMenuOpen(false)}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                    style={{
                      justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
                      padding: isCollapsed && !isMobile ? '12px' : '12px 16px',
                    }}
                  >
                    <Icon size={20} />
                    {(!isCollapsed || isMobile) && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Profile - Информационный виджет */}
        {(!isCollapsed || isMobile) && user && (
          <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                {user.first_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">
                  {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                </div>
                <div className="text-xs text-secondary">
                  Lvl {user.level || 1} • Студент
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collapse Button (Desktop only) */}
        {!isMobile && (
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="m-4 p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}
      </aside>
    </>
  );
};

// Header Component (main.html style) - with Live Search
const Header = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Mock data для поиска
  const mockCourses = [
    { id: '1', title: 'Python for Data Science', category: 'Programming', type: 'course' },
    { id: '2', title: 'Machine Learning Fundamentals', category: 'Data Science', type: 'course' },
    { id: '3', title: 'Web Development Bootcamp', category: 'Programming', type: 'course' },
    { id: '4', title: 'UI/UX Design Masterclass', category: 'Design', type: 'course' },
    { id: '5', title: 'Business Analytics', category: 'Business', type: 'course' },
  ];

  const mockCategories = [
    { id: 'programming', name: 'Programming', type: 'category' },
    { id: 'design', name: 'Design', type: 'category' },
    { id: 'business', name: 'Business', type: 'category' },
    { id: 'data-science', name: 'Data Science', type: 'category' },
  ];

  // Live search
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const courseResults = mockCourses.filter(
      course => course.title.toLowerCase().includes(query) || course.category.toLowerCase().includes(query)
    );
    const categoryResults = mockCategories.filter(
      category => category.name.toLowerCase().includes(query)
    );

    setSearchResults([...courseResults, ...categoryResults].slice(0, 8));
    setShowResults(true);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-20 px-8 flex items-center justify-center sticky top-0 z-40 glass-panel border-x-0 border-t-0">
      {/* Centered Search */}
      <div ref={searchRef} className="relative w-full max-w-2xl mx-auto group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary w-4 h-4" />
        <input
          type="text"
          placeholder="Поиск курсов, категорий..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setShowResults(true)}
          className="input-search"
        />

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full mt-2 w-full cyber-card p-2 max-h-96 overflow-y-auto">
            {searchResults.map((result, index) => (
              <Link
                key={index}
                href={result.type === 'course' ? `/courses/${result.id}` : `/catalog?category=${result.id}`}
                onClick={() => {
                  setShowResults(false);
                  setSearchQuery('');
                }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  {result.type === 'course' ? <BookOpen size={16} /> : <FolderOpen size={16} />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{result.title || result.name}</div>
                  {result.category && (
                    <div className="text-xs text-text-secondary">{result.category}</div>
                  )}
                </div>
                <div className="text-xs text-text-secondary">
                  {result.type === 'course' ? 'Курс' : 'Категория'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Right side badges */}
      <div className="flex items-center gap-4 ml-4">
        {/* Streak Badge - Real-time */}
        {user && (
          <div className="streak-badge hidden sm:flex">
            <Flame size={16} />
            <span>{user.streak || 0} Day Streak</span>
          </div>
        )}

        {/* XP Badge - Real-time */}
        {user && (
          <div className="xp-badge hidden sm:flex">
            <Zap size={16} />
            <span>{user.xp?.toLocaleString() || 0} XP</span>
          </div>
        )}

        {/* Notifications */}
        <button type="button" className="btn-icon" aria-label="Notifications">
          <Bell size={20} />
          <span className="notification-dot" />
        </button>
      </div>
    </header>
  );
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages without sidebar
  const noSidebarPages = ['/welcome', '/login', '/register', '/landing-v2', '/about', '/diego', '/landing', '/'];
  const shouldShowSidebar = !noSidebarPages.includes(pathname) && !pathname.startsWith('/landing/');

  return (
    <html lang="ru">
      <head>
        <title>ONTHEGO - AI-Powered Educational Platform</title>
        <meta name="description" content="Учитесь в любом месте с персонализированными курсами" />
      </head>
      <body>
        <ErrorBoundary>
          <AuthProvider>
            <GamificationProvider>
              <WebSocketProvider>
                <AuthGuard>
                  <AchievementNotificationProvider>
                  {/* ✅ Offline Status Banner */}
                  <OfflineBanner />

                  {/* Background Effects */}
                  <div className="bg-noise" />
                  <div className="ambient-glow glow-1" />
                  <div className="ambient-glow glow-2" />

                  {shouldShowSidebar && <Sidebar />}

                  {/* Main Content */}
                  <main
                    style={{
                      marginLeft: shouldShowSidebar ? 'var(--sidebar-width, 280px)' : '0',
                      minHeight: '100vh',
                      position: 'relative',
                      zIndex: 10,
                      transition: 'margin-left 0.3s ease',
                    }}
                  >
                    {shouldShowSidebar && <Header />}
                    <div className="flex-1 overflow-y-auto p-8">
                      {children}
                    </div>
                  </main>

                  {/* Global Styles */}
                  <style jsx global>{`
                    :root {
                      --sidebar-width: 280px;
                    }

                    @media (max-width: 1024px) {
                      :root {
                        --sidebar-width: 0px;
                      }

                      main {
                        margin-left: 0 !important;
                        padding-top: 80px;
                      }
                    }
                  `}</style>

                  {/* ✅ FIX: Global error toast for async errors */}
                  <GlobalErrorToast />
                </AchievementNotificationProvider>
              </AuthGuard>
              </WebSocketProvider>
            </GamificationProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}