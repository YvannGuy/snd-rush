
'use client';

import Link from 'next/link';
import { useState } from 'react';
import RentalConditionsModal from './RentalConditionsModal';
import LegalNoticeModal from './LegalNoticeModal';

interface FooterProps {
  language: 'fr' | 'en';
  onLegalNoticeClick?: () => void;
  onRentalConditionsClick?: () => void;
}

export default function Footer({ language }: FooterProps) {
  const [isRentalConditionsOpen, setIsRentalConditionsOpen] = useState(false);
  const [isLegalNoticeOpen, setIsLegalNoticeOpen] = useState(false);

  const texts = {
    fr: {
      baseline: "Votre solution sono de dernière minute.",
      home: "Accueil",
      packs: "Packs",
      rentalConditions: "Conditions location",
      legalNotice: "Mentions légales",
      faq: "FAQ",
      zone: "Paris & Île-de-France",
      schedule: "24h/24 - 7j/7",
      phone: "06 51 08 49 94",
      whatsapp: "WhatsApp",
      email: "contact@guylocationevents.com",
      rights: " 2025 snd•rush. Tous droits réservés.",
      about: "À propos",
      address: "Adresse",
      parisAddress: "Paris, Île-de-France",
      quickLinks: "Liens rapides",
      privacyPolicy: "Politique de confidentialité",
      terms: "Conditions générales",
      allRightsReserved: "Tous droits réservés",
      emergencyService: "Service d'urgence 24h/24 - 7j/7",
      followUs: "Suivez-nous"
    },
    en: {
      baseline: "Your last-minute sound solution.",
      home: "Home",
      packs: "Packs",
      rentalConditions: "Rental conditions",
      legalNotice: "Legal notice",
      faq: "FAQ",
      zone: "Paris & Île-de-France",
      schedule: "24/7",
      phone: "06 51 08 49 94",
      whatsapp: "WhatsApp",
      email: "contact@guylocationevents.com",
      rights: " 2025 snd•rush. All rights reserved.",
      about: "About",
      address: "Address",
      parisAddress: "Paris, Île-de-France",
      quickLinks: "Quick links",
      privacyPolicy: "Privacy policy",
      terms: "Terms and conditions",
      allRightsReserved: "All rights reserved",
      emergencyService: "24/7 emergency service",
      followUs: "Follow us"
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <footer className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Logo et baseline */}
            <div className="space-y-4">
              <Link href="/" className="inline-block">
                <span className="text-3xl font-bold tracking-tight">
                  <span className="text-[#F2431E]">snd</span>
                  <span className="text-white">•</span>
                  <span className="text-[#F2431E]">rush</span>
                </span>
              </Link>
              <p className="text-gray-300 text-sm font-medium italic">
                {texts[language].baseline}
              </p>
            </div>

            {/* Navigation */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                Navigation
              </h3>
              <nav className="flex flex-col space-y-3">
                <Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm cursor-pointer">
                  {texts[language].home}
                </Link>
                <button 
                  onClick={() => scrollToSection('packs')}
                  className="text-gray-300 hover:text-white transition-colors text-sm text-left cursor-pointer"
                >
                  {texts[language].packs}
                </button>
                <button 
                  onClick={() => setIsRentalConditionsOpen(true)}
                  className="text-gray-300 hover:text-[#F2431E] transition-colors text-sm text-left cursor-pointer"
                >
                  {texts[language].rentalConditions}
                </button>
                <button 
                  onClick={() => setIsLegalNoticeOpen(true)}
                  className="text-gray-300 hover:text-white transition-colors text-sm text-left cursor-pointer"
                >
                  {texts[language].legalNotice}
                </button>
                <button 
                  onClick={() => scrollToSection('faq')}
                  className="text-gray-300 hover:text-white transition-colors text-sm text-left cursor-pointer"
                >
                  {texts[language].faq}
                </button>
              </nav>
            </div>

            {/* Infos pratiques */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                Contact
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-map-pin-line text-[#F2431E]"></i>
                  </div>
                  <span className="text-gray-300 text-sm">{texts[language].zone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-time-line text-[#F2431E]"></i>
                  </div>
                  <span className="text-gray-300 text-sm">{texts[language].schedule}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-phone-line text-[#F2431E]"></i>
                  </div>
                  <a href="tel:+33651084994" className="text-gray-300 hover:text-white transition-colors text-sm cursor-pointer">
                    {texts[language].phone}
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-whatsapp-line text-[#F2431E]"></i>
                  </div>
                  <a href="https://wa.me/33651084994" className="text-gray-300 hover:text-white transition-colors text-sm cursor-pointer">
                    {texts[language].whatsapp}
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-mail-line text-[#F2431E]"></i>
                  </div>
                  <a href="mailto:contact@guylocationevents.com" className="text-gray-300 hover:text-white transition-colors text-sm cursor-pointer">
                    {texts[language].email}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-6">
                <a href="https://www.instagram.com/snd_rush?igsh=dTIzYm80cWZma3I5&utm_source=qr" className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-instagram-line text-lg"></i>
                  </div>
                </a>
                <a href="https://www.tiktok.com/@snd.rush?_t=ZN-90BQyvub7W2&_r=1" className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-tiktok-line text-lg"></i>
                  </div>
                </a>
              </div>
              <p className="text-gray-400 text-sm">
                {texts[language].rights}
              </p>
            </div>
          </div>
        </div>
      </footer>

      <RentalConditionsModal
        isOpen={isRentalConditionsOpen}
        onClose={() => setIsRentalConditionsOpen(false)}
        language={language}
      />

      <LegalNoticeModal
        isOpen={isLegalNoticeOpen}
        onClose={() => setIsLegalNoticeOpen(false)}
        language={language}
      />
    </>
  );
}