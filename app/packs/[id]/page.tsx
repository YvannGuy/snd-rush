'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PackDetailContent from '@/components/PackDetailContent';

export default function PackDetailPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const params = useParams();
  const packId = params?.id as string;

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

  const handleReservePack = (selectedPackId: number) => {
    // Rediriger vers la page de réservation
    window.location.href = `/packs/${selectedPackId}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        language={language} 
        onLanguageChange={setLanguage}
      />
      
      <main>
        <PackDetailContent packId={packId} language={language} />
      </main>

      <Footer 
        language={language} 
        onLegalNoticeClick={() => {}}
        onRentalConditionsClick={() => {}}
      />

    </div>
  );
}

