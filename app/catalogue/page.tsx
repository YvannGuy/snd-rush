'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CatalogueContent from '@/components/CatalogueContent';
import AssistantModal from '@/components/AssistantModalRefactored';

export default function CataloguePage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [assistantModal, setAssistantModal] = useState(false);

  // Écouter l'événement pour ouvrir l'assistant
  useEffect(() => {
    const handleOpenAssistantModal = () => {
      setAssistantModal(true);
    };
    
    window.addEventListener('openAssistantModal', handleOpenAssistantModal as EventListener);
    
    return () => {
      window.removeEventListener('openAssistantModal', handleOpenAssistantModal as EventListener);
    };
  }, []);

  const handleReservePack = (packId: number) => {
    window.location.href = `/packs/${packId}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        language={language} 
        onLanguageChange={setLanguage}
        onReservationClick={() => {
          const element = document.getElementById('contact');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onAssistantClick={() => setAssistantModal(true)}
      />
      
      <main>
        <CatalogueContent language={language} />
      </main>

      <Footer 
        language={language} 
        onLegalNoticeClick={() => {}}
        onRentalConditionsClick={() => {}}
      />

      {/* Assistant Modal */}
      <AssistantModal 
        isOpen={assistantModal} 
        onClose={() => setAssistantModal(false)}
        language={language}
        onPackSelected={handleReservePack}
      />
    </div>
  );
}

