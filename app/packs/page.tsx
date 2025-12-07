'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import AssistantModal from '@/components/AssistantModalRefactored';

export default function AllPacksPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [assistantModal, setAssistantModal] = useState(false);

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

  const handleReservePack = (packId: number) => {
    window.location.href = `/packs/${packId}`;
  };

  const texts = {
    fr: {
      title: 'Voir tous les packs',
      subtitle: 'Découvrez nos packs de sonorisation adaptés à tous vos événements',
      packs: [
        {
          id: 1,
          name: 'Pack S Petit',
          price: '109€',
          capacity: 'Pour 30 à 70 personnes',
          includes: [
            '1 enceinte Mac Mah AS 115',
            '1 console de mixage',
            'Options : micros, câbles, installation, livraison'
          ],
          image: '/pack2c.jpg'
        },
        {
          id: 2,
          name: 'Pack M Confort',
          price: '129€',
          capacity: 'Pour 70 à 150 personnes',
          includes: [
            '2 enceintes Mac Mah AS 115',
            '1 console HPA Promix 8',
            'Options : micros, câbles, installation, livraison'
          ],
          image: '/pack2cc.jpg'
        },
        {
          id: 3,
          name: 'Pack L Grand',
          price: '179€',
          capacity: 'Pour 150 à 250 personnes',
          includes: [
            '2 enceintes FBT X-Lite 115A',
            '1 caisson X-Sub 118SA',
            '1 console HPA Promix 16',
            'Options : micros, câbles, installation, livraison'
          ],
          image: '/pack4cc.jpg'
        },
        {
          id: 5,
          name: 'Pack XL Maxi / Sur mesure',
          price: 'Sur devis',
          capacity: 'Plus de 300 personnes',
          includes: [
            'Sonorisation pro',
            'Micros HF & instruments',
            'Technicien & régie',
            'Logistique complète'
          ],
          image: '/concert.jpg'
        }
      ],
      viewPack: 'Voir ce pack',
      requestQuote: 'Demander un devis',
      needHelp: 'Besoin d\'aide pour choisir ?',
      needHelpDescription: 'Répondez à 3 questions et trouvez le pack idéal pour votre événement',
      openAssistant: 'Ouvrir l\'assistant'
    },
    en: {
      title: 'View all packs',
      subtitle: 'Discover our sound system packs adapted to all your events',
      packs: [
        {
          id: 1,
          name: 'Pack S Small',
          price: '109€',
          capacity: 'For 30 to 70 people',
          includes: [
            '1 Mac Mah AS 115 speaker',
            '1 mixing console',
            'Options: mics, cables, installation, delivery'
          ],
          image: '/pack2c.jpg'
        },
        {
          id: 2,
          name: 'Pack M Comfort',
          price: '129€',
          capacity: 'For 70 to 150 people',
          includes: [
            '2 Mac Mah AS 115 speakers',
            '1 HPA Promix 8 console',
            'Options: mics, cables, installation, delivery'
          ],
          image: '/pack2cc.jpg'
        },
        {
          id: 3,
          name: 'Pack L Large',
          price: '179€',
          capacity: 'For 150 to 250 people',
          includes: [
            '2 FBT X-Lite 115A speakers',
            '1 X-Sub 118SA subwoofer',
            '1 HPA Promix 16 console',
            'Options: mics, cables, installation, delivery'
          ],
          image: '/pack4cc.jpg'
        },
        {
          id: 5,
          name: 'Pack XL Maxi / Custom',
          price: 'On quote',
          capacity: 'More than 300 people',
          includes: [
            'Pro sound system',
            'Wireless mics & instruments',
            'Technician & control room',
            'Complete logistics'
          ],
          image: '/concert.jpg'
        }
      ],
      viewPack: 'View this pack',
      requestQuote: 'Request a quote',
      needHelp: 'Need help choosing?',
      needHelpDescription: 'Answer 3 questions and find the ideal pack for your event',
      openAssistant: 'Open assistant'
    }
  };

  const currentTexts = texts[language];

  return (
    <div className="min-h-screen bg-white">
      <Header 
        language={language} 
        onLanguageChange={setLanguage}
      />
      
      <main className="pt-16">
        {/* Header Section */}
        <div className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
                {currentTexts.title}
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {currentTexts.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Packs Grid */}
        <div className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {currentTexts.packs.map((pack) => (
                <div
                  key={pack.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden flex flex-col"
                >
                  {/* Pack Image */}
                  <div className="relative h-48 bg-gray-200">
                    <img
                      src={pack.image}
                      alt={pack.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="text-2xl">⭐</span>
                    </div>
                  </div>

                  {/* Pack Info */}
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-black mb-2">
                      {pack.name}
                    </h3>
                    <div className="text-3xl font-bold text-[#F2431E] mb-3">
                      {pack.price}
                    </div>
                    <p className="text-gray-600 mb-4 text-sm">
                      {pack.capacity}
                    </p>

                    {/* Includes */}
                    <div className="mb-6 flex-grow">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Inclut :</p>
                      <ul className="space-y-1">
                        {pack.includes.map((item, index) => (
                          <li key={index} className="text-sm text-gray-600">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Button */}
                    {pack.price === 'Sur devis' || pack.price === 'On quote' ? (
                      <Link
                        href="/devis"
                        className="w-full bg-[#F2431E] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors text-center mt-auto"
                      >
                        {currentTexts.requestQuote}
                      </Link>
                    ) : (
                      <Link
                        href={`/packs/${pack.id}`}
                        className="w-full bg-[#F2431E] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors text-center mt-auto"
                      >
                        {currentTexts.viewPack}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white py-16">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <div className="text-6xl mb-6">🤖</div>
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              {currentTexts.needHelp}
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {currentTexts.needHelpDescription}
            </p>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openAssistantModal'));
              }}
              className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#E63A1A] transition-colors"
            >
              {currentTexts.openAssistant}
            </button>
          </div>
        </div>
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

