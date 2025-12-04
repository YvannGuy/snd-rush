'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import QuoteWizard from '@/components/QuoteWizard';

export default function QuotePage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  return (
    <div className="min-h-screen bg-white">
      <Header 
        language={language} 
        onLanguageChange={setLanguage}
      />
      
      <main>
        <QuoteWizard language={language} />
      </main>

      <Footer 
        language={language} 
        onLegalNoticeClick={() => {}}
        onRentalConditionsClick={() => {}}
      />
    </div>
  );
}

