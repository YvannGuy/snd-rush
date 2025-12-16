
'use client';

import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import LegalNoticeModal from './LegalNoticeModal';
import NewsletterBanner from './NewsletterBanner';

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
      {/* Bandeau Newsletter - En haut du Footer */}
      <NewsletterBanner language={language} />
      
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
            <div className="w-full px-2 sm:px-4 flex justify-center">
              <Image
                src="/pay.png"
                alt="Moyens de paiement acceptés"
                width={250}
                height={30}
                className="max-w-[250px] h-auto opacity-90"
                style={{ width: '250px', height: 'auto' }}
                priority
              />
            </div>
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