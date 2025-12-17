'use client';

import Link from 'next/link';

interface SolutionsSectionProps {
  language: 'fr' | 'en';
  onReservePack?: (packId: number) => void;
}

export default function SolutionsSection({ language, onReservePack }: SolutionsSectionProps) {
  const texts = {
    fr: {
      sectionTitle: 'NOS SOLUTIONS',
      title: 'Des solutions adaptées à chaque type d\'événement',
      intro: 'Chaque événement est différent. Nos solutions sont conçues pour garantir un son clair, une installation fiable et une tranquillité totale le jour J.',
      packs: [
        {
          id: 1,
          image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
          name: 'Pack Conférence',
          description: 'Pour réunions, conférences, prises de parole, cultes et événements institutionnels.',
          features: [
            'Sonorisation claire et équilibrée',
            'Micros adaptés à la voix',
            'Livraison, installation et récupération incluses'
          ],
          price: '279 €',
          priceNote: 'solution clé en main',
          cta: 'Demande de réservation'
        },
        {
          id: 2,
          image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
          name: 'Pack Soirée',
          recommended: true,
          description: 'Pour soirées privées, anniversaires et événements festifs.',
          features: [
            'Son puissant et homogène',
            'Ambiance maîtrisée',
            'Livraison, installation et récupération incluses'
          ],
          price: '329 €',
          priceNote: 'solution clé en main',
          cta: 'Demande de réservation'
        },
        {
          id: 3,
          image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop',
          name: 'Pack Mariage',
          description: 'Pour mariages, soirées DJ et événements à fort enjeu.',
          features: [
            'Son haute puissance',
            'Gestion des basses et de l\'équilibre sonore',
            'Livraison, installation et récupération incluses'
          ],
          price: '449 €',
          priceNote: 'solution clé en main',
          cta: 'Demande de réservation'
        }
      ]
    },
    en: {
      sectionTitle: 'OUR SOLUTIONS',
      title: 'Solutions adapted to each type of event',
      intro: 'Every event is different. Our solutions are designed to guarantee clear sound, reliable installation and complete peace of mind on the big day.',
      packs: [
        {
          id: 1,
          image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
          name: 'Conference Pack',
          description: 'For meetings, conferences, speeches, services and institutional events.',
          features: [
            'Clear and balanced sound system',
            'Voice-adapted microphones',
            'Delivery, installation and pickup included'
          ],
          price: '€279',
          priceNote: 'turnkey solution',
          cta: 'Reservation request'
        },
        {
          id: 2,
          image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
          name: 'Party Pack',
          recommended: true,
          description: 'For private parties, birthdays and festive events.',
          features: [
            'Powerful and homogeneous sound',
            'Controlled atmosphere',
            'Delivery, installation and pickup included'
          ],
          price: '€329',
          priceNote: 'turnkey solution',
          cta: 'Reservation request'
        },
        {
          id: 3,
          image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop',
          name: 'Wedding Pack',
          description: 'For weddings, DJ parties and high-stakes events.',
          features: [
            'High-power sound',
            'Bass and sound balance management',
            'Delivery, installation and pickup included'
          ],
          price: '€449',
          priceNote: 'turnkey solution',
          cta: 'Reservation request'
        }
      ]
    }
  };

  const currentTexts = texts[language];

  const handleReservationRequest = () => {
    window.dispatchEvent(new CustomEvent('openChatWithDraft', { detail: { message: undefined } }));
  };

  return (
    <section id="solutions" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-4">
          <p className="text-sm font-bold text-[#F2431E] uppercase tracking-wider mb-6">
            {currentTexts.sectionTitle}
          </p>
        </div>

        {/* Main Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            {language === 'fr' ? (
              <>
                Des solutions adaptées{' '}
                <span className="text-[#F2431E]">à chaque type d'événement</span>
              </>
            ) : (
              <>
                Solutions adapted{' '}
                <span className="text-[#F2431E]">to each type of event</span>
              </>
            )}
          </h2>
        </div>

        {/* Intro */}
        <div className="text-center mb-16">
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {currentTexts.intro}
          </p>
        </div>

        {/* Packs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {currentTexts.packs.map((pack) => (
            <div
              key={pack.id}
              className="bg-white rounded-2xl p-8 lg:p-10 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 flex flex-col h-full relative group"
            >
              {/* Recommended Badge */}
              {pack.recommended && (
                <div className="absolute -top-3 right-6 z-10">
                  <span className="bg-[#F2431E] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <span>⭐</span>
                    <span>Recommandé</span>
                  </span>
                </div>
              )}

              {/* Image */}
              <div className="mb-6 -mx-8 lg:-mx-10 -mt-8 lg:-mt-10 rounded-t-2xl overflow-hidden">
                <img 
                  src={pack.image} 
                  alt={pack.name}
                  className="w-full h-48 object-cover"
                />
              </div>

              {/* Name */}
              <h3 className="text-xl lg:text-2xl font-bold text-[#F2431E] mb-4 leading-tight">
                {pack.name}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-6 text-base leading-relaxed">
                {pack.description}
              </p>

              {/* Features */}
              <div className="mb-6 flex-grow">
                <ul className="space-y-3">
                  {pack.features.map((feature, index) => (
                    <li key={index} className="text-base text-gray-800 flex items-start leading-relaxed font-medium">
                      <span className="text-[#F2431E] mr-3 mt-1 text-lg">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price - More visible */}
              <div className="mb-4">
                <div className="text-xl lg:text-2xl font-bold text-[#F2431E]">
                  À partir de {pack.price}
                </div>
              </div>

              {/* Button */}
              <button
                onClick={handleReservationRequest}
                className="w-full bg-[#F2431E] text-white px-6 py-4 rounded-xl font-semibold hover:bg-[#E63A1A] transition-all duration-300 mt-auto flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 mb-2"
              >
                <span>👉</span>
                {pack.cta}
              </button>

              {/* Price Note - Discreet */}
              <p className="text-xs text-gray-500 text-center">
                {pack.priceNote}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

