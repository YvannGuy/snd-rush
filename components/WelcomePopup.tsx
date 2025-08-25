'use client';

import { useState, useEffect } from 'react';

interface WelcomePopupProps {
  language: 'fr' | 'en';
  onClose: () => void;
}

export default function WelcomePopup({ language, onClose }: WelcomePopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Afficher le popup à chaque ouverture du site
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const texts = {
    fr: {
      title: '🎉 Offre Spéciale Rentrée',
      subtitle: '-10% sur tous les packs sono',
      description: '(Remise applicable uniquement si l\'option livraison + installation est sélectionnée lors de la réservation)',
      cta: 'Découvrir les offres',
      close: 'Fermer'
    },
    en: {
      title: '🎉 Special Back to School Offer',
      subtitle: '-10% on all sound packs',
      description: '(Discount applicable only if delivery + installation option is selected during booking)',
      cta: 'Discover offers',
      close: 'Close'
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F2431E] text-white rounded-2xl p-6 sm:p-8 max-w-sm sm:max-w-2xl w-full mx-auto relative animate-fade-in overflow-hidden">
        {/* Bouton fermer */}
        <button
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white hover:text-gray-200 transition-colors z-10"
        >
          <i className="ri-close-line text-xl sm:text-2xl"></i>
        </button>

        {/* Contenu */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Image en haut sur mobile, à gauche sur desktop */}
          <div className="w-full sm:flex-1 order-1 sm:order-1">
            <img 
              src="/back-to-school-popup.jpg" 
              alt="Offre rentrée - Design moderne et vibrant" 
              className="w-full h-48 sm:h-64 object-cover rounded-xl"
            />
          </div>

          {/* Texte et boutons en bas sur mobile, à droite sur desktop */}
          <div className="w-full sm:flex-1 text-center sm:text-left order-2 sm:order-2">
            {/* Titre */}
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              {texts[language].title}
            </h2>

            {/* Sous-titre */}
            <h3 className="text-xl sm:text-2xl font-semibold mb-2">
              {texts[language].subtitle}
            </h3>

            {/* Description */}
            <p className="text-sm sm:text-lg mb-4 sm:mb-6 opacity-90 px-2 sm:px-0">
              {texts[language].description}
            </p>

            {/* Bouton CTA */}
            <button
              onClick={() => {
                setIsVisible(false);
                onClose();
                // Scroll vers la section des packs
                const packsSection = document.getElementById('packs');
                if (packsSection) {
                  packsSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-white text-[#F2431E] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-gray-100 transition-colors mb-3 sm:mb-4 w-full"
            >
              {texts[language].cta}
            </button>

            {/* Bouton fermer */}
            <button
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
              className="text-white opacity-80 hover:opacity-100 transition-opacity text-xs sm:text-sm"
            >
              {texts[language].close}
            </button>
          </div>
        </div>

        {/* Éléments décoratifs - masqués sur mobile */}
        <div className="hidden sm:block absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full opacity-20"></div>
        <div className="hidden sm:block absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full opacity-20"></div>
        <div className="hidden sm:block absolute top-1/2 -left-3 w-3 h-3 bg-white rounded-full opacity-20"></div>
        <div className="hidden sm:block absolute top-1/2 -right-3 w-3 h-3 bg-white rounded-full opacity-20"></div>
      </div>
    </div>
  );
}
