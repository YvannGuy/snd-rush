
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface HeaderProps {
  language: 'fr' | 'en';
  onLanguageChange: (lang: 'fr' | 'en') => void;
  onReservationClick?: () => void;
}

export default function Header({ language, onLanguageChange, onReservationClick }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'fr' ? 'en' : 'fr';
    onLanguageChange(newLanguage);
  };

  const handleCallClick = () => {
    window.location.href = 'tel:+33651084994';
    setIsMobileMenuOpen(false);
  };

  const texts = {
    fr: {
      packs: 'Packs',
      faq: 'FAQ',
      contact: 'Contact',
      callNow: 'Appeler',
      banner: '1er spécialiste de l\'urgence sonore • Paris et Île-de-France • 24h/24 7j/7 • Intervention rapide • Devis gratuit'
    },
    en: {
      packs: 'Packs',
      faq: 'FAQ',
      contact: 'Contact',
      callNow: 'Call',
      banner: '1st sound emergency specialist • Paris and Île-de-France • 24/7 • Fast intervention • Free quote'
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Bandeau orange en haut */}
      <div className="bg-[#F2431E] text-white py-2 px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <p className="text-sm font-medium text-center">
            {texts[language].banner}
          </p>
        </div>
      </div>

      {/* Header principal */}
      <div className="bg-white shadow-md">
        <div className="px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-3xl font-bold tracking-tight">
                <span className="text-[#F2431E]">snd</span>
                <span className="text-black">•</span>
                <span className="text-[#F2431E]">rush</span>
              </span>
            </Link>

            {/* Navigation - Encore plus décalée à droite */}
            <nav className="hidden lg:flex items-center justify-center space-x-12 flex-1 ml-24">
              <button 
                onClick={() => scrollToSection('packs')}
                className="text-black hover:text-gray-600 transition-colors font-medium cursor-pointer"
              >
                {texts[language].packs}
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="text-black hover:text-gray-600 transition-colors font-medium cursor-pointer"
              >
                {texts[language].faq}
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-black hover:text-gray-600 transition-colors font-medium cursor-pointer"
              >
                {texts[language].contact}
              </button>
            </nav>

            {/* Language switcher and CTA */}
            <div className="flex items-center space-x-8">
              {/* Language switcher */}
              <button
                onClick={toggleLanguage}
                className="hidden lg:flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-black transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  {language === 'fr' ? (
                    <span className="text-lg">🇫🇷</span>
                  ) : (
                    <span className="text-lg">🇬🇧</span>
                  )}
                </div>
                <span className="uppercase">{language}</span>
              </button>

              {/* CTA Button */}
              <button
                onClick={handleCallClick}
                className="bg-[#F2431E] text-white px-4 py-2.5 text-sm lg:px-6 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
              >
                <span className="text-white text-base">🚨</span>
                {texts[language].callNow}
              </button>

              {/* Mobile menu button */}
              <button 
                className="lg:hidden p-2 cursor-pointer"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className={`ri-${isMobileMenuOpen ? 'close' : 'menu'}-line text-xl`}></i>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 bg-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button 
                  onClick={() => scrollToSection('packs')}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer"
                >
                  {texts[language].packs}
                </button>
                <button 
                  onClick={() => scrollToSection('faq')}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer"
                >
                  {texts[language].faq}
                </button>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer"
                >
                  {texts[language].contact}
                </button>

                {/* Language switcher for mobile */}
                <button
                  onClick={toggleLanguage}
                  className="flex items-center space-x-2 w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer"
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    {language === 'fr' ? (
                      <span className="text-lg">🇫🇷</span>
                    ) : (
                      <span className="text-lg">🇬🇧</span>
                    )}
                  </div>
                  <span className="uppercase">{language}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
