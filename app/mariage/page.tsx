'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PackDetailContent from '@/components/PackDetailContent';

export default function MariagePage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  // Ouvrir le chat simplifié avec packKey 'mariage' si activé
  useEffect(() => {
    // Nouveau système simplifié
    if (process.env.NEXT_PUBLIC_USE_SIMPLIFIED_CHAT === 'true') {
      const handleOpenChat = () => {
        window.dispatchEvent(new CustomEvent('openChatWithPack', { detail: { packKey: 'mariage' } }));
      };
      
      // Écouter les événements pour ouvrir le chat
      window.addEventListener('openAssistantModal', handleOpenChat as EventListener);
      window.addEventListener('openChatWithDraft', handleOpenChat as EventListener);
      
      return () => {
        window.removeEventListener('openAssistantModal', handleOpenChat as EventListener);
        window.removeEventListener('openChatWithDraft', handleOpenChat as EventListener);
      };
    } else {
      // Ancien système (fallback)
      const handleOpenAssistantModal = () => {
        window.dispatchEvent(new CustomEvent('openChatWithDraft', { detail: { message: undefined } }));
      };
      
      window.addEventListener('openAssistantModal', handleOpenAssistantModal as EventListener);
      
      return () => {
        window.removeEventListener('openAssistantModal', handleOpenAssistantModal as EventListener);
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header 
        language={language} 
        onLanguageChange={setLanguage}
      />
      
      <main className="pt-[180px] sm:pt-[190px]">
        <PackDetailContent packId="11" language={language} />
      </main>

      <Footer 
        language={language} 
        onLegalNoticeClick={() => {}}
        onRentalConditionsClick={() => {}}
      />
    </div>
  );
}
