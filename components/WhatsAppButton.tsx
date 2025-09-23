
'use client';

import { useState } from 'react';

interface WhatsAppButtonProps {
  language: 'fr' | 'en';
}

export default function WhatsAppButton({ language }: WhatsAppButtonProps) {
  const [isVisible, setIsVisible] = useState(true);

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

  if (!isVisible) return null;

  const currentTexts = texts[language] || texts.fr;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div className="relative">
        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center text-sm transition-colors z-10"
        >
          ×
        </button>

        {/* WhatsApp Button */}
        <a
          href="https://wa.me/33651084994"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-[#25D366] text-white px-6 py-4 rounded-full shadow-lg hover:bg-[#1FA551] transition-all duration-300 hover:scale-105 cursor-pointer group"
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <i className="ri-whatsapp-fill text-2xl"></i>
          </div>
          <div className="hidden sm:block">
            <div className="font-medium text-sm leading-tight">
              {currentTexts.urgentNeed}
            </div>
            <div className="text-xs opacity-90">
              {currentTexts.contactWhatsApp}
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
