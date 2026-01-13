
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
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-[#F2431E] hover:bg-[#E63A1A] text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-pointer"
      aria-label="Retour en haut"
    >
      <i className="ri-arrow-up-line text-xl"></i>
    </button>
  );
}
