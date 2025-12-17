'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PackDetailContent from '@/components/PackDetailContent';

export default function SoireePage() {
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

  return (
    <div className="min-h-screen bg-white">
      <Header 
        language={language} 
        onLanguageChange={setLanguage}
      />
      
      <main className="pt-[180px] sm:pt-[190px]">
        <PackDetailContent packId="10" language={language} />
      </main>

      <Footer 
        language={language} 
        onLegalNoticeClick={() => {}}
        onRentalConditionsClick={() => {}}
      />
    </div>
  );
}
