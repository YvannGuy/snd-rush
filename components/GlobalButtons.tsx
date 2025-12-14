'use client';

import { useState, useEffect } from 'react';
import WhatsAppButton from './WhatsAppButton';
import ScrollToTopButton from './ScrollToTopButton';

export default function GlobalButtons() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Détecter la langue depuis localStorage ou depuis l'attribut lang du HTML
    const detectLanguage = () => {
      // Vérifier localStorage pour la langue
      const storedLanguage = localStorage.getItem('language') as 'fr' | 'en' | null;
      if (storedLanguage && (storedLanguage === 'fr' || storedLanguage === 'en')) {
        setLanguage(storedLanguage);
        return;
      }
      
      // Vérifier l'attribut lang du HTML
      if (typeof window !== 'undefined') {
        const htmlLang = document.documentElement.lang;
        if (htmlLang === 'en' || htmlLang.startsWith('en-')) {
          setLanguage('en');
        } else {
          setLanguage('fr');
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

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
      window.removeEventListener('storage', handleLanguageChange);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      <WhatsAppButton language={language} />
      <ScrollToTopButton />
    </>
  );
}
