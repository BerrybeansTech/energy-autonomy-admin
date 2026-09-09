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
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-purple-200/90 text-slate-800 shadow-[0_10px_30px_rgba(143,62,201,0.2)] hover:shadow-[0_14px_40px_rgba(143,62,201,0.3)] hover:border-[#8F3EC9] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 animate-scale-in group cursor-pointer select-none"
      title="Scroll to top"
    >
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#8F3EC9] via-[#A06BC6] to-[#FE9B40] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-200">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      </div>
      <span className="text-xs font-bold text-slate-700 group-hover:text-[#8F3EC9] transition-colors pr-1">
        Top
      </span>
    </button>
  );
};

export default ScrollToTop;
