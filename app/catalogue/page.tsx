'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CatalogueContent from '@/components/CatalogueContent';
import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';

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
      <SEOHead
        title={language === 'fr'
          ? 'Catalogue Matériel Sonore Professionnel | SoundRush Paris'
          : 'Professional Sound Equipment Catalog | SoundRush Paris'}
        description={language === 'fr'
          ? 'Découvrez notre catalogue complet de matériel sonore professionnel à Paris. Enceintes, micros, consoles, éclairage. Location avec livraison et installation incluse. Disponible 24/7.'
          : 'Discover our complete catalog of professional sound equipment in Paris. Speakers, microphones, consoles, lighting. Rental with delivery and installation included. Available 24/7.'}
        canonicalUrl="https://www.sndrush.com/catalogue"
        keywords={language === 'fr' ? [
          'catalogue matériel sonore Paris',
          'location enceinte professionnelle Paris',
          'location micro Paris',
          'location console mixage Paris',
          'location éclairage événement Paris',
          'catalogue sono professionnelle',
          'matériel audio location Paris',
        ] : [
          'sound equipment catalog Paris',
          'professional speaker rental Paris',
          'microphone rental Paris',
          'mixing console rental Paris',
          'event lighting rental Paris',
          'professional sound catalog',
          'audio equipment rental Paris',
        ]}
      />
      <Header 
        language={language} 
        onLanguageChange={setLanguage}
      />
      
      <main className="pt-[112px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb
            items={[
              { label: language === 'fr' ? 'Accueil' : 'Home', href: '/' },
              { label: language === 'fr' ? 'Catalogue' : 'Catalog', href: '/catalogue' },
            ]}
            language={language}
          />
        </div>
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

