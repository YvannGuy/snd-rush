'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface TopBannerProps {
  language: 'fr' | 'en';
}

export default function TopBanner({ language }: TopBannerProps) {
  const pathname = usePathname();

  const texts = {
    fr: {
      catalogue: 'Catalogue',
      packs: 'Packs',
      tutos: 'Tutos',
      testimonials: 'Avis clients',
      faq: 'FAQ',
      contact: {
        phone: 'Appeler',
        whatsapp: 'WhatsApp'
      }
    },
    en: {
      catalogue: 'Catalog',
      packs: 'Packs',
      tutos: 'Tutorials',
      testimonials: 'Client reviews',
      faq: 'FAQ',
      contact: {
        phone: 'Call',
        whatsapp: 'WhatsApp'
      }
    }
  };

  const currentTexts = texts[language];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };



  return (
    <div className="bg-[#F2431E] text-white py-2 px-4 relative z-40" data-no-border style={{ border: 'none', boxShadow: 'none', margin: 0, outline: 'none' }}>
      <div className="max-w-7xl mx-auto flex flex-row items-center justify-between">
        {/* Espaceur gauche pour équilibrer */}
        <div className="flex-1"></div>

        {/* Navigation Links - Centrés et espacés uniformément */}
        {/* Masquer Catalogue et Packs pour les utilisateurs non-admin (solution clé en main uniquement) */}
        <div className="flex flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 flex-1">
          {/* Catalogue et Packs masqués - les clients utilisent uniquement les 3 solutions via le chat */}
          <Link 
            href="/#tutos"
            onClick={(e) => {
              if (pathname === '/') {
                e.preventDefault();
                scrollToSection('tutos');
              }
            }}
            className="text-white hover:text-white/80 transition-colors font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap"
          >
            {currentTexts.tutos}
          </Link>
          <Link 
            href="/#testimonials"
            onClick={(e) => {
              if (pathname === '/') {
                e.preventDefault();
                scrollToSection('testimonials');
              }
            }}
            className="text-white hover:text-white/80 transition-colors font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap"
          >
            {currentTexts.testimonials}
          </Link>
          <Link 
            href="/#faq"
            onClick={(e) => {
              if (pathname === '/') {
                e.preventDefault();
                scrollToSection('faq');
              }
            }}
            className="text-white hover:text-white/80 transition-colors font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap"
          >
            {currentTexts.faq}
          </Link>
        </div>

        {/* Contacts - Alignés à droite */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
          {/* Bouton téléphone */}
          <a
            href="tel:+33651084994"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transition-colors text-sm font-medium min-w-[44px] h-[38px]"
          >
            <span>📞</span>
            <span className="hidden sm:inline">{currentTexts.contact.phone}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

