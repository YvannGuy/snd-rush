
'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import AISearchBox from '@/components/AISearchBox';
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

export default function Home() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [reservationModal, setReservationModal] = useState(false);
  const [legalNoticeModal, setLegalNoticeModal] = useState(false);
  const [rentalConditionsModal, setRentalConditionsModal] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<number | undefined>(undefined);

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
        
        {/* AI Search Section */}
        <section className="bg-gradient-to-br from-[#F2431E] via-[#E63A1A] to-[#D6341A] py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AISearchBox 
              language={language} 
              onPackSelected={handleReservePack}
            />
          </div>
        </section>
        
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

    </div>
  );
}
