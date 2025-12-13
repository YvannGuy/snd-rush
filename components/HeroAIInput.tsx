'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';

interface HeroAIInputProps {
  onSend: (message: string) => void;
  language?: 'fr' | 'en';
}

const PLACEHOLDERS_FR = [
  'Mariage en intérieur pour 100 personnes',
  'Anniversaire avec musique et micro',
  'Soirée DJ, grande salle',
  'Je ne sais pas quoi choisir',
];

const PLACEHOLDERS_EN = [
  'Indoor wedding for 100 people',
  'Birthday with music and microphone',
  'DJ party, large venue',
  'I don\'t know what to choose',
];

export default function HeroAIInput({ onSend, language = 'fr' }: HeroAIInputProps) {
  const [placeholder, setPlaceholder] = useState('');
  const [inputValue, setInputValue] = useState('');
  const placeholderIndexRef = useRef(0);
  const placeholders = language === 'fr' ? PLACEHOLDERS_FR : PLACEHOLDERS_EN;
  
  // Animation du mot dans la phrase d'accroche
  const [currentWord, setCurrentWord] = useState(0);
  const words = language === 'fr' 
    ? ['sono', 'DJ gear', 'lumière']
    : ['sound', 'DJ gear', 'lighting'];

  // Cycle des placeholders toutes les 2-3 secondes
  useEffect(() => {
    setPlaceholder(placeholders[0]);

    const interval = setInterval(() => {
      placeholderIndexRef.current = (placeholderIndexRef.current + 1) % placeholders.length;
      setPlaceholder(placeholders[placeholderIndexRef.current]);
    }, 2500);

    return () => clearInterval(interval);
  }, [placeholders]);

  // Cycle des mots dans la phrase d'accroche
  useEffect(() => {
    const wordInterval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 2000);

    return () => clearInterval(wordInterval);
  }, [words.length]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        onSend(inputValue.trim());
        setInputValue('');
      } else {
        // Si vide, ouvrir quand même le chat
        onSend('');
      }
    }
  };

  const hookPrefix = language === 'fr' ? 'Besoin de ' : 'Need ';
  const hookSuffix = language === 'fr' ? ' ? ' : '? ';
  const hookEnd = language === 'fr' 
    ? 'Obtenez une recommandation instantanée'
    : 'Get an instant recommendation';

  return (
    <div className="w-full max-w-2xl mx-auto">
      <p className="mb-4 text-lg sm:text-xl md:text-2xl text-white/95 text-center font-medium">
        {hookPrefix}
        <span className="text-white transition-all duration-500">{words[currentWord]}</span>
        <span className="text-white">{hookSuffix}</span>
        <span className="text-[#F2431E]">{hookEnd}</span>
      </p>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-14 md:h-16 px-6 pr-16 text-lg rounded-full shadow-lg border-2 border-white/20 bg-white/95 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#F2431E] focus:border-transparent text-gray-900 placeholder:text-gray-500"
        />
        <button
          onClick={() => {
            if (inputValue.trim()) {
              onSend(inputValue.trim());
              setInputValue('');
            } else {
              onSend('');
            }
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#F2431E] text-white rounded-full hover:bg-[#E63A1A] transition-colors flex items-center justify-center"
          aria-label="Envoyer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      <p className="mt-3 text-sm text-white/80 text-center">
        Réponse instantanée • 24/7 • Conseils humains
      </p>
    </div>
  );
}
