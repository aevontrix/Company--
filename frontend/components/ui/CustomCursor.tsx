'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * CustomCursor - Минималистичный курсор
 *
 * Реализация:
 * - Dot: 6px cyan
 * - Outline: 24px, склеен с точкой (одно целое)
 * - Hover: увеличение до 20px МАКСИМУМ
 * - Только для desktop (>1024px, без touch)
 */
export default function CustomCursor() {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkDevice = () => {
      const isDesktopDevice = window.innerWidth > 1024 && !('ontouchstart' in window);
      setIsDesktop(isDesktopDevice);

      if (isDesktopDevice) {
        document.body.classList.add('custom-cursor-enabled');
      } else {
        document.body.classList.remove('custom-cursor-enabled');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    if (!isDesktop) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Оба элемента следуют ВМЕСТЕ - склеены как одно целое
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    const handleEnter = () => setIsHovered(true);
    const handleLeave = () => setIsHovered(false);

    // Optimize: Track elements to avoid duplicate listeners
    const trackedElements = new WeakSet<Element>();

    const addHoverListeners = () => {
      const elements = document.querySelectorAll(
        'a, button, [role="button"], .course-card, .bento-item, .faq-item, input, textarea'
      );
      elements.forEach((el) => {
        // Only add listeners to new elements
        if (!trackedElements.has(el)) {
          el.addEventListener('mouseenter', handleEnter);
          el.addEventListener('mouseleave', handleLeave);
          trackedElements.add(el);
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    addHoverListeners();

    // Optimize: Debounce MutationObserver callback to prevent excessive DOM queries
    const debouncedAddListeners = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        addHoverListeners();
      }, 250); // Wait 250ms after last DOM change
    };

    const observer = new MutationObserver(debouncedAddListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', checkDevice);
      document.body.classList.remove('custom-cursor-enabled');
      const elements = document.querySelectorAll(
        'a, button, [role="button"], .course-card, .bento-item, .faq-item, input, textarea'
      );
      elements.forEach((el) => {
        el.removeEventListener('mouseenter', handleEnter);
        el.removeEventListener('mouseleave', handleLeave);
      });
      observer.disconnect();
    };
  }, [isDesktop]);

  if (!isDesktop) return null;

  return (
    <>
      {/* Cursor Dot - 6px cyan, склеен с outline */}
      <div
        className="cursor-dot"
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
        }}
      />

      {/* Cursor Outline - 24px, склеен с dot, hover до 20px */}
      <div
        className={`cursor-outline ${isHovered ? 'hovered' : ''}`}
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
        }}
      />

      {/* Enable custom cursor globally */}
      <style jsx global>{`
        body.custom-cursor-enabled * {
          cursor: none !important;
        }
      `}</style>
    </>
  );
}
