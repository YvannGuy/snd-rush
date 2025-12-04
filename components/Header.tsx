
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import MiniCart from '@/components/cart/MiniCart';

interface HeaderProps {
  language: 'fr' | 'en';
  onLanguageChange: (lang: 'fr' | 'en') => void;
}

export default function Header({ language, onLanguageChange }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const { getCartItemCount } = useCart();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartItemCount());
    
    const handleCartUpdate = () => {
      setCartCount(getCartItemCount());
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [getCartItemCount]);

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

  const texts = {
    fr: {
      catalogue: 'Catalogue',
      packs: 'Packs',
      urgence: 'Urgence 24/7',
      faq: 'FAQ',
      callNow: 'Appelez',
      banner: '1er spécialiste de l\'urgence sonore • Paris et Île-de-France • 24h/24 7j/7 • Intervention rapide • Devis gratuit'
    },
    en: {
      catalogue: 'Catalogue',
      packs: 'Packs',
      urgence: 'Emergency 24/7',
      faq: 'FAQ',
      callNow: 'Call',
      banner: '1st sound emergency specialist • Paris and Île-de-France • 24/7 • Fast intervention • Free quote'
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Header principal avec fond sombre */}
      <div className="bg-black shadow-md relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo SndRush */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-[#F2431E]">
                SndRush
              </span>
            </Link>

            {/* Navigation complète */}
            <nav className="hidden lg:flex items-center justify-center space-x-6 flex-1">
              <Link 
                href="/catalogue"
                className="text-white hover:text-[#F2431E] transition-colors font-medium cursor-pointer"
              >
                {texts[language].catalogue}
              </Link>
              <Link 
                href="/packs"
                className="text-white hover:text-[#F2431E] transition-colors font-medium cursor-pointer"
              >
                {texts[language].packs}
              </Link>
              <button 
                onClick={() => scrollToSection('urgency')}
                className="text-white hover:text-[#F2431E] transition-colors font-medium cursor-pointer"
              >
                {texts[language].urgence}
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="text-white hover:text-[#F2431E] transition-colors font-medium cursor-pointer"
              >
                {texts[language].faq}
              </button>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Language switcher - Desktop only */}
              <button
                onClick={toggleLanguage}
                className="hidden lg:flex items-center space-x-1 text-sm font-medium text-white hover:text-[#F2431E] transition-colors cursor-pointer"
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

              {/* Panier - Desktop only */}
              <button
                onClick={() => setIsMiniCartOpen(true)}
                className="hidden lg:flex relative p-2 text-white hover:text-[#F2431E] transition-colors cursor-pointer"
                aria-label="Panier"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {/* Panier Mobile */}
              <button
                onClick={() => setIsMiniCartOpen(true)}
                className="lg:hidden relative p-2 text-white"
                aria-label="Panier"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {/* Bouton Appeler - Desktop only */}
              <a
                href="tel:+33651084994"
                className="hidden lg:flex bg-[#F2431E] text-white px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg font-medium hover:bg-[#E63A1A] transition-colors cursor-pointer whitespace-nowrap items-center gap-2"
              >
                <span>📞</span>
                <span>{texts[language].callNow}</span>
              </a>

              {/* Mobile buttons - Toggle et Téléphone côte à côte */}
              <div className="lg:hidden flex items-center gap-2">
                {/* Mobile menu button */}
                <button 
                  className="p-3 cursor-pointer text-white hover:bg-gray-800 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                  aria-expanded={isMobileMenuOpen}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    {isMobileMenuOpen ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Bouton Téléphone - Mobile en orange */}
                <a
                  href="tel:+33651084994"
                  className="p-3 cursor-pointer bg-[#F2431E] hover:bg-[#E63A1A] rounded-lg transition-colors"
                  aria-label="Appeler"
                >
                  <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu - Complètement séparé du conteneur bg-black */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed top-16 left-0 right-0 border-t border-white/20 z-40 overflow-hidden"
          style={{ 
            background: 'transparent',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            width: '100vw',
            maxWidth: '100%'
          }}
        >
          <div className="pt-3 pb-4 space-y-2" style={{ paddingLeft: '1rem', paddingRight: '1rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <Link 
              href="/catalogue"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-left px-2 py-2.5 text-sm font-medium text-white hover:text-[#F2431E] hover:bg-white/10 rounded-md cursor-pointer transition-colors"
            >
              {texts[language].catalogue}
            </Link>
            <Link 
              href="/packs"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-left px-2 py-2.5 text-sm font-medium text-white hover:text-[#F2431E] hover:bg-white/10 rounded-md cursor-pointer transition-colors"
            >
              {texts[language].packs}
            </Link>
            <button 
              onClick={() => {
                scrollToSection('urgency');
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-left px-2 py-2.5 text-sm font-medium text-white hover:text-[#F2431E] hover:bg-white/10 rounded-md cursor-pointer transition-colors"
            >
              {texts[language].urgence}
            </button>
            <button 
              onClick={() => {
                scrollToSection('faq');
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-left px-2 py-2.5 text-sm font-medium text-white hover:text-[#F2431E] hover:bg-white/10 rounded-md cursor-pointer transition-colors"
            >
              {texts[language].faq}
            </button>

            {/* Language switcher for mobile */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 w-full text-left px-2 py-2.5 text-sm font-medium text-white hover:text-[#F2431E] hover:bg-white/10 rounded-md cursor-pointer transition-colors"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                {language === 'fr' ? (
                  <span className="text-base">🇫🇷</span>
                ) : (
                  <span className="text-base">🇬🇧</span>
                )}
              </div>
              <span className="uppercase text-xs">{language}</span>
            </button>

          </div>
        </div>
      )}

      {/* Mini Cart */}
      <MiniCart
        isOpen={isMiniCartOpen}
        onClose={() => setIsMiniCartOpen(false)}
        language={language}
      />
    </header>
  );
}
