'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface WhatsAppButtonProps {
  language: 'fr' | 'en';
}

export default function WhatsAppButton({ language }: WhatsAppButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const texts = {
    fr: {
      urgentNeed: 'Un besoin urgent ?',
      contactWhatsApp: 'Contactez-nous sur WhatsApp'
    },
    en: {
      urgentNeed: 'An urgent need?',
      contactWhatsApp: 'Contact us on WhatsApp'
    }
  };

  const currentTexts = texts[language] || texts.fr;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {!isExpanded ? (
        /* Icône flottante fermée */
        <button
          onClick={() => setIsExpanded(true)}
          className="w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-[#1FA551] cursor-pointer"
          aria-label="Ouvrir WhatsApp"
        >
          <i className="ri-whatsapp-fill text-2xl"></i>
        </button>
      ) : (
        /* Bouton déplié */
        <div className="relative">
          {/* Bouton croix pour fermer */}
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center text-sm transition-colors z-10 shadow-md"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Bouton WhatsApp déplié */}
          <a
            href="https://wa.me/33651084994"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-[#25D366] text-white px-6 py-4 rounded-full shadow-lg hover:bg-[#1FA551] transition-all duration-300 hover:scale-105 cursor-pointer group animate-in slide-in-from-left-2"
            onClick={() => setIsExpanded(false)}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <i className="ri-whatsapp-fill text-2xl"></i>
            </div>
            <div className="block">
              <div className="font-medium text-sm leading-tight whitespace-nowrap">
                {currentTexts.urgentNeed}
              </div>
              <div className="text-xs opacity-90 whitespace-nowrap">
                {currentTexts.contactWhatsApp}
              </div>
            </div>
          </a>
        </div>
      )}
    </div>
  );
}
