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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F2431E] text-white rounded-2xl p-8 max-w-4xl mx-auto relative animate-fade-in">
        {/* Bouton fermer */}
        <button
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
        >
          <i className="ri-close-line text-2xl"></i>
        </button>

        {/* Contenu */}
        <div className="flex items-center gap-6">
          {/* Image à gauche */}
          <div className="flex-1">
            <img 
              src="/back-to-school-popup.jpg" 
              alt="Offre rentrée - Design moderne et vibrant" 
              className="w-full h-64 object-cover rounded-xl"
            />
          </div>

          {/* Texte et boutons à droite */}
          <div className="flex-1 text-left">
            {/* Titre */}
            <h2 className="text-3xl font-bold mb-2">
              {texts[language].title}
            </h2>

            {/* Sous-titre */}
            <h3 className="text-2xl font-semibold mb-2">
              {texts[language].subtitle}
            </h3>

            {/* Description */}
            <p className="text-lg mb-6 opacity-90">
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
              className="bg-white text-[#F2431E] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors mb-4 w-full"
            >
              {texts[language].cta}
            </button>

            {/* Bouton fermer */}
            <button
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
              className="text-white opacity-80 hover:opacity-100 transition-opacity text-sm"
            >
              {texts[language].close}
            </button>
          </div>
        </div>

        {/* Éléments décoratifs */}
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full opacity-20"></div>
        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full opacity-20"></div>
        <div className="absolute top-1/2 -left-3 w-3 h-3 bg-white rounded-full opacity-20"></div>
        <div className="absolute top-1/2 -right-3 w-3 h-3 bg-white rounded-full opacity-20"></div>
      </div>
    </div>
  );
}
