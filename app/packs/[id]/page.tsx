'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PackDetailContent from '@/components/PackDetailContent';
import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';

// Données des packs pour le SEO (même structure que PackDetailContent)
const packsData: Record<string, { fr: { name: string; description: string; tagline: string; image: string; priceParis: string; ideal: string }; en: { name: string; description: string; tagline: string; image: string; priceParis: string; ideal: string } }> = {
  '1': {
    fr: {
      name: 'Pack S Petit',
      description: 'Pack S parfait pour les petits événements jusqu\'à 70 personnes, avec 1 enceinte Mac Mah AS 115 et console de mixage. Location sono express à Paris.',
      tagline: 'Solution basique pour petits événements',
      image: 'https://www.sndrush.com/packs.png',
      priceParis: '109 € /jour TTC',
      ideal: '30 à 70 personnes',
    },
    en: {
      name: 'Pack S Small',
      description: 'Pack S perfect for small events up to 70 people, with 1 Mac Mah AS 115 speaker and mixing console. Express sound rental in Paris.',
      tagline: 'Basic solution for small events',
      image: 'https://www.sndrush.com/packs.png',
      priceParis: '109 € /day TTC',
      ideal: '30 to 70 people',
    },
  },
  '2': {
    fr: {
      name: 'Pack M Confort',
      description: 'Pack M pour événements moyens jusqu\'à 150 personnes, avec 2 enceintes Mac Mah AS 115 et console HPA Promix 8. Location sono professionnelle à Paris.',
      tagline: 'Solution complète pour événements moyens',
      image: 'https://www.sndrush.com/packM.png',
      priceParis: '129 € /jour TTC',
      ideal: '70 à 150 personnes',
    },
    en: {
      name: 'Pack M Comfort',
      description: 'Pack M for medium events up to 150 people, with 2 Mac Mah AS 115 speakers and HPA Promix 8 console. Professional sound rental in Paris.',
      tagline: 'Complete solution for medium events',
      image: 'https://www.sndrush.com/packM.png',
      priceParis: '129 € /day TTC',
      ideal: '70 to 150 people',
    },
  },
  '3': {
    fr: {
      name: 'Pack L Grand',
      description: 'Pack L idéal pour événements jusqu\'à 250 personnes, avec 2 enceintes FBT X-Lite 115A, 1 caisson X-Sub 118SA et console HPA Promix 16. Sonorisation professionnelle Paris.',
      tagline: 'Solution professionnelle pour grands événements',
      image: 'https://www.sndrush.com/packL.png',
      priceParis: '179 € /jour TTC',
      ideal: '150 à 250 personnes',
    },
    en: {
      name: 'Pack L Large',
      description: 'Pack L ideal for events up to 250 people, with 2 FBT X-Lite 115A speakers, 1 X-Sub 118SA subwoofer and HPA Promix 16 console. Professional sound system Paris.',
      tagline: 'Professional solution for large events',
      image: 'https://www.sndrush.com/packL.png',
      priceParis: '179 € /day TTC',
      ideal: '150 to 250 people',
    },
  },
  '6': {
    fr: {
      name: 'Pack DJ Essentiel',
      description: 'Pack DJ Essentiel parfait pour les petits événements jusqu\'à 70 personnes, avec 1 enceinte Mac Mah AS 115 et console DJ Pioneer. Location sono DJ Paris.',
      tagline: 'Solution DJ compacte pour petits événements',
      image: 'https://www.sndrush.com/packdjs.png',
      priceParis: '109 € /jour TTC',
      ideal: '30 à 70 personnes',
    },
    en: {
      name: 'Pack DJ Essential',
      description: 'Pack DJ Essential perfect for small events up to 70 people, with 1 Mac Mah AS 115 speaker and Pioneer DJ console. DJ sound rental Paris.',
      tagline: 'Compact DJ solution for small events',
      image: 'https://www.sndrush.com/packdjs.png',
      priceParis: '109 € /day TTC',
      ideal: '30 to 70 people',
    },
  },
  '7': {
    fr: {
      name: 'Pack DJ Performance',
      description: 'Pack DJ Performance pour événements moyens jusqu\'à 100 personnes, avec 2 enceintes FBT sur pied et console DJ Pioneer. Location sono DJ professionnelle Paris.',
      tagline: 'Solution DJ complète pour événements moyens',
      image: 'https://www.sndrush.com/packdjM.png',
      priceParis: '159 € /jour TTC',
      ideal: '50 à 100 personnes',
    },
    en: {
      name: 'Pack DJ Performance',
      description: 'Pack DJ Performance for medium events up to 100 people, with 2 FBT speakers on stands and Pioneer DJ console. Professional DJ sound rental Paris.',
      tagline: 'Complete DJ solution for medium events',
      image: 'https://www.sndrush.com/packdjM.png',
      priceParis: '159 € /day TTC',
      ideal: '50 to 100 people',
    },
  },
  '8': {
    fr: {
      name: 'Pack DJ Premium',
      description: 'Pack DJ Premium idéal pour événements jusqu\'à 150 personnes, avec 2 enceintes FBT sur pied, 1 caisson de basses et console DJ Pioneer. Sonorisation DJ haute qualité Paris.',
      tagline: 'Solution DJ professionnelle avec basses renforcées',
      image: 'https://www.sndrush.com/packdjL.png',
      priceParis: '219 € /jour TTC',
      ideal: '80 à 150 personnes',
    },
    en: {
      name: 'Pack DJ Premium',
      description: 'Pack DJ Premium ideal for events up to 150 people, with 2 FBT speakers on stands, 1 subwoofer and Pioneer DJ console. High quality DJ sound system Paris.',
      tagline: 'Professional DJ solution with enhanced bass',
      image: 'https://www.sndrush.com/packdjL.png',
      priceParis: '219 € /day TTC',
      ideal: '80 to 150 people',
    },
  },
};

export default function PackDetailPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const params = useParams();
  const packId = params?.id as string;

  // Récupérer les données du pack pour le SEO
  const packInfo = packsData[packId];
  const currentPack = packInfo ? packInfo[language] : null;

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

  // Générer les structured data pour le pack
  const structuredData = currentPack ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: currentPack.name,
    description: currentPack.description,
    image: currentPack.image.startsWith('http') ? currentPack.image : `https://www.sndrush.com${currentPack.image}`,
    brand: {
      '@type': 'Brand',
      name: 'SoundRush Paris',
    },
    manufacturer: {
      '@type': 'Brand',
      name: 'SoundRush Paris',
    },
    offers: {
      '@type': 'Offer',
      price: currentPack.priceParis.replace(/[^0-9,.]/g, '').replace(',', '.'),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `https://www.sndrush.com/packs/${packId}`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: currentPack.priceParis.replace(/[^0-9,.]/g, '').replace(',', '.'),
        priceCurrency: 'EUR',
        unitCode: 'DAY',
        unitText: language === 'fr' ? 'jour' : 'day',
      },
      availabilityStarts: new Date().toISOString(),
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
    },
    sku: `pack-${packId}`,
  } : null;

  return (
    <div className="min-h-screen bg-white">
      {currentPack && (
        <SEOHead
          title={currentPack.name}
          description={currentPack.description}
          canonicalUrl={`https://www.sndrush.com/packs/${packId}`}
          ogImage={currentPack.image.startsWith('http') ? currentPack.image : `https://www.sndrush.com${currentPack.image}`}
          structuredData={structuredData || undefined}
          keywords={[
            `location sono ${currentPack.name.toLowerCase()}`,
            `pack sono ${currentPack.ideal}`,
            'location sono Paris',
            'sonorisation professionnelle',
            'location matériel audio Paris',
            'pack sonorisation événement',
          ]}
        />
      )}
      
      <Header 
        language={language} 
        onLanguageChange={setLanguage}
      />
      
      <main className="pt-[180px] sm:pt-[190px]">
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

