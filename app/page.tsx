
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import SolutionsSection from '@/components/SolutionsSection';
import UrgencySection from '@/components/UrgencySection';
import PourQuiSection from '@/components/PourQuiSection';
import AboutSection from '@/components/AboutSection';
import TrustindexReviews from '@/components/TrustindexReviews';
import FaqInteractive from '@/components/FaqInteractive';
import Footer from '@/components/Footer';
import SectionAnimation from '@/components/SectionAnimation';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import WhatsAppButton from '@/components/WhatsAppButton';
import ReservationModal from '@/components/ReservationModal';
import LegalNoticeModal from '@/components/LegalNoticeModal';
import RentalConditionsModal from '@/components/RentalConditionsModal';
import AssistantModal from '@/components/AssistantModalRefactored';

export default function Home() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [reservationModal, setReservationModal] = useState(false);
  const [legalNoticeModal, setLegalNoticeModal] = useState(false);
  const [rentalConditionsModal, setRentalConditionsModal] = useState(false);
  const [assistantModal, setAssistantModal] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<number | undefined>(undefined);

  const handleReservePack = (packId: number) => {
    setSelectedPackId(packId);
    setReservationModal(true);
  };

  const handleCloseReservationModal = () => {
    setReservationModal(false);
    setSelectedPackId(undefined);
  };

  // Écouter l'événement de réservation depuis l'assistant
  useEffect(() => {
    const handleOpenReservationModal = (event: CustomEvent) => {
      const { packId, message } = event.detail;
      setSelectedPackId(packId);
      setReservationModal(true);
      
      // Préremplir le message après ouverture du modal
      setTimeout(() => {
        const messageField = document.querySelector('textarea[name*="message"], textarea[name*="comment"]') as HTMLTextAreaElement;
        if (messageField) {
          messageField.value = message;
          messageField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 100);
    };

    window.addEventListener('openReservationModal', handleOpenReservationModal as EventListener);
    
    // Écouteur pour ouvrir le modal assistant
    const handleOpenAssistantModal = () => {
      setAssistantModal(true);
    };
    
    window.addEventListener('openAssistantModal', handleOpenAssistantModal as EventListener);
    
    return () => {
      window.removeEventListener('openReservationModal', handleOpenReservationModal as EventListener);
      window.removeEventListener('openAssistantModal', handleOpenAssistantModal as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header 
        language={language} 
        onLanguageChange={setLanguage}
        onReservationClick={() => setReservationModal(true)}
        onAssistantClick={() => setAssistantModal(true)}
      />
      
      <main>
        <HeroSection 
          language={language}
        />

        {/* Section Nos Solutions */}
        <SectionAnimation delay={0.1}>
          <SolutionsSection 
            language={language}
            onReservePack={handleReservePack}
          />
        </SectionAnimation>

        {/* Section Besoin d'une sono maintenant ? */}
        <SectionAnimation delay={0.2}>
          <UrgencySection language={language} />
        </SectionAnimation>

        {/* Section Pour Qui ? */}
        <SectionAnimation delay={0.3}>
          <PourQuiSection language={language} />
        </SectionAnimation>

        {/* Section Pourquoi SoundRush */}
        <SectionAnimation delay={0.4}>
          <AboutSection language={language} />
        </SectionAnimation>

        {/* Section Témoignages Clients */}
        <SectionAnimation delay={0.5}>
          <TrustindexReviews />
        </SectionAnimation>

        {/* Section Questions Fréquentes */}
        <SectionAnimation delay={0.6}>
          <FaqInteractive onOpenAssistant={() => setAssistantModal(true)} />
        </SectionAnimation>
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

      <AssistantModal 
        isOpen={assistantModal} 
        onClose={() => setAssistantModal(false)}
        language={language}
        onPackSelected={handleReservePack}
        onRentalConditionsClick={() => setRentalConditionsModal(true)}
      />

    </div>
  );
}
