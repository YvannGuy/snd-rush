
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PackSelection from './PackSelection';
import ReservationForm from './ReservationForm';

function ReserverContent() {
  const searchParams = useSearchParams();
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [selectedPack, setSelectedPack] = useState<number | null>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const packId = searchParams.get('pack');
    if (packId) {
      setSelectedPack(parseInt(packId));
      setStep(2);
    }
  }, [searchParams]);

  const handleLanguageChange = (lang: 'fr' | 'en') => {
    setLanguage(lang);
  };

  const handlePackSelect = (packId: number) => {
    setSelectedPack(packId);
    setStep(2);
  };

  const handleBackToSelection = () => {
    setSelectedPack(null);
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header language={language} onLanguageChange={handleLanguageChange} />
      
      <main className="pt-20">
        {step === 1 && (
          <PackSelection 
            language={language} 
            onPackSelect={handlePackSelect}
          />
        )}
        
        {step === 2 && selectedPack && (
          <ReservationForm 
            language={language}
            packId={selectedPack}
            onBack={handleBackToSelection}
          />
        )}
      </main>
      
      <Footer language={language} />
    </div>
  );
}

export default function ReserverPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-xl">Chargement...</div></div>}>
      <ReserverContent />
    </Suspense>
  );
}
