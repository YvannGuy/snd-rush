
'use client';

import Link from 'next/link';
import { useState } from 'react';
import LegalNoticeModal from './LegalNoticeModal';

interface FooterProps {
  language: 'fr' | 'en';
  onLegalNoticeClick?: () => void;
  onRentalConditionsClick?: () => void;
}

export default function Footer({ language }: FooterProps) {
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
      privacyPolicy: "Mentions légales",
      terms: "Conditions de location",
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
      privacyPolicy: "Legal notice",
      terms: "Rental conditions",
      allRightsReserved: "All rights reserved",
      emergencyService: "24/7 emergency service",
      followUs: "Follow us"
    }
  };

  const footerTexts = {
    fr: {
      solutions: 'Solutions',
      wedding: 'Mariage',
      birthday: 'Anniversaire',
      privateParty: 'Soirée privée',
      conference: 'Conférence',
      shortTerm: 'Location courte durée',
      longTerm: 'Location longue durée',
      catalogue: 'Catalogue',
      micros: 'Micros',
      speakers: 'Enceintes',
      mixingDesks: 'Tables de mixage',
      lights: 'Lumières',
      accessories: 'Accessoires',
      packs: 'Packs',
      contact: 'Contact',
      getQuote: 'Appeler'
    },
    en: {
      solutions: 'Solutions',
      wedding: 'Wedding',
      birthday: 'Birthday',
      privateParty: 'Private party',
      conference: 'Conference',
      shortTerm: 'Short-term rental',
      longTerm: 'Long-term rental',
      catalogue: 'Catalogue',
      micros: 'Microphones',
      speakers: 'Speakers',
      mixingDesks: 'Mixing desks',
      lights: 'Lights',
      accessories: 'Accessories',
      packs: 'Packs',
      contact: 'Contact',
      getQuote: 'Call'
    }
  };

  const currentFooterTexts = footerTexts[language];

  return (
    <>
      <footer className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Logo et baseline */}
            <div className="space-y-4">
              <Link href="/" className="inline-block">
                <span className="text-3xl font-bold tracking-tight">
                  <span className="text-[#F2431E]">SoundRush</span>
                  <span className="text-white"> Paris</span>
                </span>
              </Link>
              <p className="text-gray-300 text-sm">
                {texts[language].baseline}
              </p>
              <a
                href="tel:+33651084994"
                className="inline-block bg-[#F2431E] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors mt-4"
              >
                {currentFooterTexts.getQuote}
              </a>
            </div>

            {/* Solutions */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                {currentFooterTexts.solutions}
              </h3>
              <nav className="flex flex-col space-y-2">
                <span className="text-gray-300 text-sm">
                  {currentFooterTexts.wedding}
                </span>
                <span className="text-gray-300 text-sm">
                  {currentFooterTexts.birthday}
                </span>
                <span className="text-gray-300 text-sm">
                  {currentFooterTexts.privateParty}
                </span>
                <span className="text-gray-300 text-sm">
                  {currentFooterTexts.conference}
                </span>
                <span className="text-gray-300 text-sm">
                  {currentFooterTexts.shortTerm}
                </span>
                <span className="text-gray-300 text-sm">
                  {currentFooterTexts.longTerm}
                </span>
              </nav>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                {currentFooterTexts.contact}
              </h3>
              <div className="space-y-3">
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
                    <i className="ri-mail-line text-[#F2431E]"></i>
                  </div>
                  <a href="mailto:contact@guylocationevents.com" className="text-gray-300 hover:text-white transition-colors text-sm cursor-pointer">
                    {texts[language].email}
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-map-pin-line text-[#F2431E]"></i>
                  </div>
                  <span className="text-gray-300 text-sm">{texts[language].parisAddress}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Moyens de paiement */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="w-full px-2 sm:px-4">
              <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6 overflow-x-auto scrollbar-hide min-w-0">
                {/* CB Logo */}
                <div className="flex items-center justify-center w-12 h-8 sm:w-14 sm:h-9 md:w-16 md:h-10 bg-gradient-to-b from-blue-600 to-green-500 rounded px-1.5 sm:px-2 flex-shrink-0">
                  <span className="text-white font-bold text-sm sm:text-base md:text-lg">CB</span>
                </div>
                
                {/* Mastercard Logo */}
                <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 flex-shrink-0">
                  <div className="flex items-center">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-red-500 -mr-0.5 sm:-mr-1 md:-mr-2"></div>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-yellow-500"></div>
                  </div>
                  <span className="text-white font-bold text-[9px] sm:text-[10px] md:text-xs ml-0.5 sm:ml-1 md:ml-2 whitespace-nowrap">MASTERCARD</span>
                </div>
                
                {/* American Express Logo */}
                <div className="flex items-center justify-center w-16 h-8 sm:w-20 sm:h-9 md:w-24 md:h-10 bg-blue-600 rounded px-1.5 sm:px-2 flex-shrink-0">
                  <span className="text-white font-bold text-[8px] sm:text-[9px] md:text-xs leading-tight text-center">AMERICAN<br />EXPRESS</span>
                </div>
                
                {/* Apple Pay Logo */}
                <div className="flex items-center justify-center w-16 h-8 sm:w-20 sm:h-9 md:w-24 md:h-10 border border-gray-300 rounded px-1.5 sm:px-2 md:px-3 bg-white flex-shrink-0">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-black sm:w-4 sm:h-4 md:w-5 md:h-5">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    <span className="text-black font-semibold text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Pay</span>
                  </div>
                </div>
              </div>
            </div>
            <style jsx>{`
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>

          {/* Bottom bar */}
          <div className="pt-4 border-t border-gray-800">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
              <p className="text-gray-400 text-sm">
                © 2025 <span className="text-[#F2431E]">SoundRush</span><span className="text-white"> Paris</span> - Tous droits réservés.
              </p>
              <div className="flex items-center gap-4 md:gap-6">
                <Link 
                  href="/cgv"
                  className="text-gray-400 hover:text-[#F2431E] transition-colors text-sm"
                >
                  {texts[language].terms}
                </Link>
                <Link 
                  href="/mentions-legales"
                  className="text-gray-400 hover:text-[#F2431E] transition-colors text-sm"
                >
                  {texts[language].privacyPolicy}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>


      <LegalNoticeModal
        isOpen={isLegalNoticeOpen}
        onClose={() => setIsLegalNoticeOpen(false)}
        language={language}
      />
    </>
  );
}