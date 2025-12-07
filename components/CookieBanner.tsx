'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CookieBannerProps {
  language?: 'fr' | 'en';
}

export default function CookieBanner({ language }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<'fr' | 'en'>('fr');

  useEffect(() => {
    // Détecter la langue depuis localStorage ou depuis l'attribut lang du HTML
    const detectLanguage = () => {
      if (language) {
        setDetectedLanguage(language);
        return;
      }
      
      // Vérifier localStorage pour la langue
      const storedLanguage = localStorage.getItem('language') as 'fr' | 'en' | null;
      if (storedLanguage && (storedLanguage === 'fr' || storedLanguage === 'en')) {
        setDetectedLanguage(storedLanguage);
        return;
      }
      
      // Vérifier l'attribut lang du HTML
      if (typeof window !== 'undefined') {
        const htmlLang = document.documentElement.lang;
        if (htmlLang === 'en' || htmlLang.startsWith('en-')) {
          setDetectedLanguage('en');
        } else {
          setDetectedLanguage('fr');
        }
      }
    };

    detectLanguage();

    // Écouter les changements de langue
    const handleLanguageChange = () => {
      detectLanguage();
    };
    
    window.addEventListener('languageChanged', handleLanguageChange);
    window.addEventListener('storage', handleLanguageChange);

    // Vérifier si l'utilisateur a déjà fait un choix
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Afficher la bannière après un court délai pour une meilleure UX
      setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 1000);
    }

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
      window.removeEventListener('storage', handleLanguageChange);
    };
  }, [language]);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    // Déclencher un événement pour notifier les autres composants
    window.dispatchEvent(new Event('cookieConsentChanged'));
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    // Déclencher un événement pour notifier les autres composants
    window.dispatchEvent(new Event('cookieConsentChanged'));
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  const texts = {
    fr: {
      title: 'Nous utilisons des cookies',
      description: 'Ce site utilise des cookies pour améliorer votre expérience de navigation et analyser notre trafic.',
      accept: 'Tout accepter',
      reject: 'Refuser',
      learnMore: 'En savoir plus',
      privacyPolicy: 'Politique de confidentialité',
    },
    en: {
      title: 'We use cookies',
      description: 'This site uses cookies to improve your browsing experience and analyze our traffic.',
      accept: 'Accept all',
      reject: 'Reject',
      learnMore: 'Learn more',
      privacyPolicy: 'Privacy policy',
    },
  };

  const currentTexts = texts[detectedLanguage];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl transition-transform duration-300 ${
        isAnimating ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-[#F2431E]/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#F2431E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                  {currentTexts.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {currentTexts.description}
                </p>
                <Link
                  href="/politique-de-confidentialite"
                  className="text-sm text-[#F2431E] hover:underline font-medium"
                >
                  {currentTexts.learnMore} - {currentTexts.privacyPolicy}
                </Link>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleReject}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              {currentTexts.reject}
            </button>
            <button
              onClick={handleAccept}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#F2431E] text-white rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              {currentTexts.accept}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

