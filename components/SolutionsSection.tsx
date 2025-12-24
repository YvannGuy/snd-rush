'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface SolutionsSectionProps {
  language: 'fr' | 'en';
}

export default function SolutionsSection({ language }: SolutionsSectionProps) {
  const router = useRouter();
  
  const texts = {
    fr: {
      sectionTitle: 'NOS SOLUTIONS',
      title: 'Des solutions clé en main pour votre événement',
      intro: 'Nous gérons tout : livraison, installation, support et récupération. Vous vous concentrez sur votre événement, nous nous occupons du reste.',
      packs: [
        {
          id: 1,
          image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
          name: 'Solution Conférence',
          description: 'Pour réunions, conférences, prises de parole, cultes et événements institutionnels.',
          features: [
            'Livraison et installation par nos techniciens',
            'Support disponible pendant votre événement',
            'Récupération après l\'événement'
          ],
          price: '279 €',
          priceNote: 'solution clé en main',
          cta: 'Préparer mon événement'
        },
        {
          id: 2,
          image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
          name: 'Solution Soirée',
          recommended: true,
          description: 'Pour soirées privées, anniversaires et événements festifs.',
          features: [
            'Livraison et installation par nos techniciens',
            'Support disponible pendant votre événement',
            'Récupération après l\'événement'
          ],
          price: '329 €',
          priceNote: 'solution clé en main',
          cta: 'Préparer mon événement'
        },
        {
          id: 3,
          image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop',
          name: 'Solution Mariage',
          description: 'Pour mariages, soirées DJ et événements à fort enjeu.',
          features: [
            'Livraison et installation par nos techniciens',
            'Support disponible pendant votre événement',
            'Récupération après l\'événement'
          ],
          price: '449 €',
          priceNote: 'solution clé en main',
          cta: 'Préparer mon événement'
        }
      ]
    },
    en: {
      sectionTitle: 'OUR SOLUTIONS',
      title: 'Turnkey solutions for your event',
      intro: 'We handle everything: delivery, installation, support and pickup. You focus on your event, we take care of the rest.',
      packs: [
        {
          id: 1,
          image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
          name: 'Conference Solution',
          description: 'For meetings, conferences, speeches, services and institutional events.',
          features: [
            'Delivery and installation by our technicians',
            'Support available during your event',
            'Pickup after the event'
          ],
          price: '€279',
          priceNote: 'turnkey solution',
          cta: 'Prepare my event'
        },
        {
          id: 2,
          image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
          name: 'Party Solution',
          recommended: true,
          description: 'For private parties, birthdays and festive events.',
          features: [
            'Delivery and installation by our technicians',
            'Support available during your event',
            'Pickup after the event'
          ],
          price: '€329',
          priceNote: 'turnkey solution',
          cta: 'Prepare my event'
        },
        {
          id: 3,
          image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop',
          name: 'Wedding Solution',
          description: 'For weddings, DJ parties and high-stakes events.',
          features: [
            'Delivery and installation by our technicians',
            'Support available during your event',
            'Pickup after the event'
          ],
          price: '€449',
          priceNote: 'turnkey solution',
          cta: 'Prepare my event'
        }
      ]
    }
  };

  const currentTexts = texts[language];

  const handleReservationRequest = (packKey: 'conference' | 'soiree' | 'mariage') => {
    // Vérifier que le packKey est valide
    if (!['conference', 'soiree', 'mariage'].includes(packKey)) {
      console.error('[SolutionsSection] PackKey invalide:', packKey);
      return;
    }
    
    // NOUVEAU FLOW : Redirection directe vers la page de réservation
    router.push(`/book/${packKey}`);
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
            {currentTexts.title}
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
              <div className="mb-6 -mx-8 lg:-mx-10 -mt-8 lg:-mt-10 rounded-t-2xl overflow-hidden relative w-full h-48">
                <Image 
                  src={pack.image} 
                  alt={pack.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
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
                  {language === 'fr' ? 'À partir de' : 'From'} {pack.price}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {language === 'fr' ? 'Acompte 30% pour bloquer votre date' : '30% deposit to secure your date'}
                </div>
              </div>

              {/* Buttons - 2 CTA */}
              <div className="mt-auto space-y-3">
                {/* CTA Principal : Réserver maintenant */}
                <button
                  onClick={() => {
                    // Mapper l'ID du pack au packKey
                    const packKeyMap: Record<number, 'conference' | 'soiree' | 'mariage'> = {
                      1: 'conference',
                      2: 'soiree',
                      3: 'mariage'
                    };
                    const packKey = packKeyMap[pack.id];
                    if (packKey) {
                      handleReservationRequest(packKey);
                    }
                  }}
                  className="w-full bg-[#F2431E] text-white px-6 py-4 rounded-xl font-semibold hover:bg-[#E63A1A] transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <span>✨</span>
                  {language === 'fr' ? 'Réserver maintenant' : 'Book now'}
                </button>

                {/* CTA Secondaire : L'assistant me guide */}
                <button
                  onClick={() => {
                    const packKeyMap: Record<number, 'conference' | 'soiree' | 'mariage'> = {
                      1: 'conference',
                      2: 'soiree',
                      3: 'mariage'
                    };
                    const packKey = packKeyMap[pack.id];
                    if (packKey) {
                      // Ouvrir le wizard guidé
                      window.dispatchEvent(new CustomEvent('openBookingWizard', { 
                        detail: { packKey } 
                      }));
                    }
                  }}
                  className="w-full bg-white text-[#F2431E] border-2 border-[#F2431E] px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>💬</span>
                  {language === 'fr' ? 'L\'assistant me guide' : 'Get guided help'}
                </button>
              </div>

              {/* Price Note - Discreet */}
              <p className="text-xs text-gray-500 text-center mt-3">
                {pack.priceNote}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

