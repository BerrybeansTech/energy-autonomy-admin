import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Global ScrollToTop Component
 * 1. Automatically scrolls to top on route navigation.
 * 2. Renders a modern floating button when scrolled down > 200px.
 * 3. Smoothly scrolls both the window and any scrollable container (like <main>).
 */
const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { pathname } = useLocation();

  // Automatically scroll to top on route change
  useEffect(() => {
    const scrollToTopImmediate = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTo(0, 0);
      document.body.scrollTo(0, 0);
      const scrollableElements = document.querySelectorAll('main, .overflow-y-auto');
      scrollableElements.forEach((el) => {
        el.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
    };

    scrollToTopImmediate();
    const timer = setTimeout(scrollToTopImmediate, 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Track scroll position to toggle the floating button
  useEffect(() => {
    const handleScroll = () => {
      const windowScroll =
        window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;

      let containerScroll = 0;
      const scrollable = document.querySelector('main') || document.querySelector('.overflow-y-auto');
      if (scrollable) {
        containerScroll = scrollable.scrollTop;
      }

      setIsVisible(windowScroll > 200 || containerScroll > 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const scrollable = document.querySelector('main') || document.querySelector('.overflow-y-auto');
    if (scrollable) {
      scrollable.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollable) {
        scrollable.removeEventListener('scroll', handleScroll);
      }
    };
  }, [pathname]);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
    const scrollableElements = document.querySelectorAll('main, .overflow-y-auto');
    scrollableElements.forEach((el) => {
      el.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={handleScrollToTop}
      aria-label="Scroll to top"
      className="fixed bottom-7 right-7 z-50 w-11 h-11 rounded-full border border-slate-300 hover:border-[#8F3EC9] text-slate-500 hover:text-[#8F3EC9] bg-white/95 backdrop-blur-xs flex items-center justify-center transition-colors duration-150 shadow-xs cursor-pointer select-none"
      title="Scroll to top"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
};

export default ScrollToTop;
