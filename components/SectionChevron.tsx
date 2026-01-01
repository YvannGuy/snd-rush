'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SectionChevronProps {
  nextSectionId: string;
  className?: string;
}

export default function SectionChevron({ nextSectionId, className = '' }: SectionChevronProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const nextSection = document.getElementById(nextSectionId);
      if (nextSection) {
        const rect = nextSection.getBoundingClientRect();
        // Masquer le chevron si la section suivante est déjà visible
        setIsVisible(rect.top > window.innerHeight * 0.3);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Vérifier au chargement

    return () => window.removeEventListener('scroll', handleScroll);
  }, [nextSectionId]);

  const scrollToNext = () => {
    const nextSection = document.getElementById(nextSectionId);
    if (nextSection) {
      nextSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`flex justify-center py-8 ${className}`}>
      <button
        onClick={scrollToNext}
        className="group flex flex-col items-center gap-2 text-gray-400 hover:text-[#F2431E] transition-all duration-300 animate-bounce"
        aria-label="Aller à la section suivante"
      >
        <ChevronDown className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
        <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Suivant
        </span>
      </button>
    </div>
  );
}

