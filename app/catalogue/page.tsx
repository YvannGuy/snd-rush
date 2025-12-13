'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CatalogueContent from '@/components/CatalogueContent';

export default function CataloguePage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  // Rediriger openAssistantModal vers la chatbox flottante
  useEffect(() => {
    const handleOpenAssistantModal = () => {
      window.dispatchEvent(new CustomEvent('openChatWithDraft', { detail: { message: undefined } }));
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
      />
      
      <main>
        <CatalogueContent language={language} />
      </main>

      <Footer 
        language={language} 
        onLegalNoticeClick={() => {}}
        onRentalConditionsClick={() => {}}
      />

    </div>
  );
}

