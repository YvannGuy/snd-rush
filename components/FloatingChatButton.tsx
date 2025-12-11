'use client';

import { useState, useEffect } from 'react';

interface FloatingChatButtonProps {
  onOpen: () => void;
  language?: 'fr' | 'en';
}

export default function FloatingChatButton({ onOpen, language = 'fr' }: FloatingChatButtonProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(false);

  useEffect(() => {
    // Afficher le message après 15 secondes si l'utilisateur n'a pas encore interagi
    const timer = setTimeout(() => {
      if (!hasInteracted) {
        setTimerElapsed(true);
        setShowPrompt(true);
      }
    }, 15000); // 15 secondes

    return () => clearTimeout(timer);
  }, []); // Ne dépend d'aucune variable pour ne pas se réinitialiser

  const handleClick = () => {
    setHasInteracted(true);
    setShowPrompt(false);
    onOpen();
  };

  const handleMouseEnter = () => {
    // Afficher le prompt seulement si le timer est écoulé
    if (timerElapsed && !hasInteracted) {
      setShowPrompt(true);
    }
  };

  const handleMouseLeave = () => {
    if (!hasInteracted && timerElapsed) {
      // Ne pas cacher immédiatement, laisser un délai
      setTimeout(() => {
        setShowPrompt(false);
      }, 2000);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2 sm:gap-3">
      {/* Message d'invitation */}
      {showPrompt && (
        <div 
          className="bg-white rounded-lg shadow-xl p-3 sm:p-4 max-w-[calc(100vw-120px)] sm:max-w-xs animate-fadeIn"
          style={{ animation: 'fadeIn 0.3s ease-in' }}
        >
          <p className="text-xs sm:text-sm text-gray-800 font-medium">
            {language === 'fr' 
              ? 'Vous ne savez pas quoi prendre ?' 
              : 'Not sure what to choose?'}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {language === 'fr' 
              ? 'Trouvez votre formule en 2 minutes' 
              : 'Find your pack in 2 minutes'}
          </p>
          <div className="absolute bottom-0 right-3 sm:right-4 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white transform translate-y-full"></div>
        </div>
      )}

      {/* Bouton flottant */}
      <button
        data-floating-button
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#F2431E] to-[#e27431] rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center text-white text-xl sm:text-2xl relative group touch-manipulation"
        aria-label={language === 'fr' ? 'Ouvrir l\'assistant SoundRush' : 'Open SoundRush Assistant'}
      >
        <svg 
          className="w-5 h-5 sm:w-6 sm:h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
          />
        </svg>
        
        {/* Indicateur de notification */}
        <span className="absolute top-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full border-2 border-[#F2431E] animate-pulse"></span>
      </button>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in;
        }
      `}</style>
    </div>
  );
}
