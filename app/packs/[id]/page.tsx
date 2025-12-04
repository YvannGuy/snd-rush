'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PackDetailContent from '@/components/PackDetailContent';
import AssistantModal from '@/components/AssistantModalRefactored';

export default function PackDetailPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [assistantModal, setAssistantModal] = useState(false);
  const params = useParams();
  const packId = params?.id as string;

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

