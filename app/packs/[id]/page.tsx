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
        onAssistantClick={() => {
          window.dispatchEvent(new CustomEvent('openAssistantModal'));
        }}
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

