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
          name: 'Pack Essentiel',
          price: '300€',
          capacity: 'Pour 30 à 70 personnes, intérieur',
          includes: [
            '2 enceintes pro',
            '1 micro',
            'Câblage',
            'Installation & reprise'
          ],
          image: '/pack2c.jpg'
        },
        {
          id: 2,
          name: 'Pack Standard',
          price: '450€',
          capacity: 'Pour 70 à 150 personnes',
          includes: [
            '2 enceintes + 1 caisson de basse',
            '2 micros',
            'Console de mixage',
            'Installation & reprise'
          ],
          image: '/pack2cc.jpg'
        },
        {
          id: 3,
          name: 'Pack Premium',
          price: '650€',
          capacity: 'Pour 150 à 300 personnes, live / DJ',
          includes: [
            '2 enceintes + 2 caissons',
            'Console pro',
            '4 micros',
            'Technicien sur place',
            'Installation & reprise'
          ],
          image: '/pack4cc.jpg'
        },
        {
          id: 5,
          name: 'Pack Événement',
          price: 'Sur devis',
          capacity: 'Pour 300 à 600 personnes',
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
          name: 'Essential Pack',
          price: '300€',
          capacity: 'For 30 to 70 people, indoor',
          includes: [
            '2 pro speakers',
            '1 microphone',
            'Cabling',
            'Installation & pickup'
          ],
          image: '/pack2c.jpg'
        },
        {
          id: 2,
          name: 'Standard Pack',
          price: '450€',
          capacity: 'For 70 to 150 people',
          includes: [
            '2 speakers + 1 subwoofer',
            '2 microphones',
            'Mixing console',
            'Installation & pickup'
          ],
          image: '/pack2cc.jpg'
        },
        {
          id: 3,
          name: 'Premium Pack',
          price: '650€',
          capacity: 'For 150 to 300 people, live / DJ',
          includes: [
            '2 speakers + 2 subwoofers',
            'Pro console',
            '4 microphones',
            'On-site technician',
            'Installation & pickup'
          ],
          image: '/pack4cc.jpg'
        },
        {
          id: 5,
          name: 'Event Pack',
          price: 'On quote',
          capacity: 'For 300 to 600 people',
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
        onReservationClick={() => {
          const element = document.getElementById('contact');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onAssistantClick={() => setAssistantModal(true)}
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

