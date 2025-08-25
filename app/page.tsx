
'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import PacksSection from '@/components/PacksSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import WhatsAppButton from '@/components/WhatsAppButton';
import ReservationModal from '@/components/ReservationModal';
import LegalNoticeModal from '@/components/LegalNoticeModal';
import RentalConditionsModal from '@/components/RentalConditionsModal';
import FAQSection from '@/components/FAQSection';
import WelcomePopup from '@/components/WelcomePopup';

export default function Home() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [reservationModal, setReservationModal] = useState(false);
  const [legalNoticeModal, setLegalNoticeModal] = useState(false);
  const [rentalConditionsModal, setRentalConditionsModal] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<number | undefined>(undefined);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);

  const handleReservePack = (packId: number) => {
    setSelectedPackId(packId);
    setReservationModal(true);
  };

  const handleCloseReservationModal = () => {
    setReservationModal(false);
    setSelectedPackId(undefined);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        language={language} 
        onLanguageChange={setLanguage}
        onReservationClick={() => setReservationModal(true)}
      />
      
      <main>
        <HeroSection 
          language={language} 
        />
        <AboutSection language={language} />
        <PacksSection 
          language={language} 
          onReservePack={handleReservePack}
        />
        <TestimonialsSection language={language} />
        <FAQSection language={language} />
        <ContactSection language={language} />
      </main>

      <Footer 
        language={language} 
        onLegalNoticeClick={() => setLegalNoticeModal(true)}
        onRentalConditionsClick={() => setRentalConditionsModal(true)}
      />

      <ScrollToTopButton />
      <WhatsAppButton language={language} />

      {/* Modals */}
      <ReservationModal 
        isOpen={reservationModal} 
        onClose={handleCloseReservationModal}
        language={language}
        preselectedPackId={selectedPackId}
      />
      
      <LegalNoticeModal 
        isOpen={legalNoticeModal} 
        onClose={() => setLegalNoticeModal(false)}
        language={language}
      />
      
      <RentalConditionsModal 
        isOpen={rentalConditionsModal} 
        onClose={() => setRentalConditionsModal(false)}
        language={language}
      />

      {/* Popup de bienvenue */}
      <WelcomePopup 
        language={language}
        onClose={() => setShowWelcomePopup(false)}
      />
    </div>
  );
}
