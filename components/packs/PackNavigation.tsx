'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface PackNavigationProps {
  currentPackId: string;
  language: 'fr' | 'en';
}

// Liste des packs disponibles (IDs utilisés dans les URLs)
const AVAILABLE_PACKS = [
  { id: '1', name: 'Pack S Petit' },
  { id: '2', name: 'Pack M Confort' },
  { id: '3', name: 'Pack L Grand' },
  { id: '6', name: 'Pack DJ Essentiel' },
  { id: '7', name: 'Pack DJ Performance' },
  { id: '8', name: 'Pack DJ Premium' },
];

export default function PackNavigation({ currentPackId, language }: PackNavigationProps) {
  const texts = {
    fr: {
      previous: 'Précédent',
      next: 'Suivant',
    },
    en: {
      previous: 'Previous',
      next: 'Next',
    },
  };

  const currentTexts = texts[language];

  // Trouver l'index du pack actuel
  const currentIndex = AVAILABLE_PACKS.findIndex(p => p.id === currentPackId);

  const previousPack = currentIndex > 0 ? AVAILABLE_PACKS[currentIndex - 1] : null;
  const nextPack = currentIndex < AVAILABLE_PACKS.length - 1 ? AVAILABLE_PACKS[currentIndex + 1] : null;

  // Si le pack actuel n'est pas dans la liste (ex: Pack Custom id=4 ou 5), ne rien afficher
  if (currentIndex === -1) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Navigation Précédent/Suivant */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {previousPack ? (
          <Link 
            href={`/packs/${previousPack.id}`}
            className="flex items-center gap-2 text-gray-600 hover:text-[#F2431E] transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">{currentTexts.previous}</span>
          </Link>
        ) : (
          <div></div>
        )}

        {nextPack ? (
          <Link 
            href={`/packs/${nextPack.id}`}
            className="flex items-center gap-2 text-gray-600 hover:text-[#F2431E] transition-colors group ml-auto"
          >
            <span className="hidden sm:inline">{currentTexts.next}</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
}
