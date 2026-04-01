
'use client';

import { useState, useEffect, useRef } from 'react';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const rafIdRef = useRef<number | null>(null);
  const lastValueRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      // Annuler le RAF précédent si pas encore exécuté
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      rafIdRef.current = requestAnimationFrame(() => {
        const shouldBeVisible = window.pageYOffset > 300;
        
        // Ne mettre à jour que si la valeur change réellement
        if (shouldBeVisible !== lastValueRef.current) {
          lastValueRef.current = shouldBeVisible;
          setIsVisible(shouldBeVisible);
        }
        
        rafIdRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="fixed bottom-28 right-5 z-[35] flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#F2431E] text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[#E63A1A] sm:bottom-32 sm:right-6"
      aria-label="Retour en haut"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 shrink-0"
        aria-hidden
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
