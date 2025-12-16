'use client';

import Link from 'next/link';

interface CatalogueHeroProps {
  language: 'fr' | 'en';
}

export default function CatalogueHero({ language }: CatalogueHeroProps) {
  const texts = {
    fr: {
      title: 'Catalogue de matériel professionnel',
      subtitle: 'Sonorisation, DJ, micros, lumières, packs clé-en-main. Livraison, installation et urgence 24/7 disponibles.',
      ctaPrimary: 'Trouver le bon pack',
      ctaSecondary: 'Je ne sais pas quoi choisir',
    },
    en: {
      title: 'Professional Equipment Catalog',
      subtitle: 'Sound, DJ, microphones, lights, turnkey packs. Delivery, installation and 24/7 emergency available.',
      ctaPrimary: 'Find the right pack',
      ctaSecondary: 'I don\'t know what to choose',
    },
  };

  const currentTexts = texts[language];

  return (
    <div className="bg-white py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center space-y-6">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black">
            {currentTexts.title}
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            {currentTexts.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openChatWithDraft', { detail: { message: undefined } }));
              }}
              className="w-full sm:w-auto bg-[#F2431E] text-white px-8 py-4 rounded-lg font-semibold text-base hover:bg-[#E63A1A] transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {currentTexts.ctaPrimary}
            </button>

            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openChatWithDraft', { detail: { message: undefined } }));
              }}
              className="w-full sm:w-auto bg-white text-gray-700 px-8 py-4 rounded-lg font-semibold text-base border-2 border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {currentTexts.ctaSecondary}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
