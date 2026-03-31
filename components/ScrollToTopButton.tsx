
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
      onClick={scrollToTop}
      className="fixed bottom-24 right-5 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#F2431E] text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[#E63A1A] sm:bottom-28 sm:right-6"
      aria-label="Retour en haut"
    >
      <i className="ri-arrow-up-line text-xl"></i>
    </button>
  );
}
