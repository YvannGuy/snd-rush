
'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

interface Pack {
  id: number;
  name: string;
  tagline: string;
  description: string;
  priceParis: string;
  priceHorsParis: string;
  featured: boolean;
  image: string;
  features: string[];
  highlight: string;
  ideal: string;
  note: string;
}

interface PacksSectionProps {
  language: 'fr' | 'en';
  onReservePack?: (packId: number) => void;
}

export default function PacksSection({ language, onReservePack }: PacksSectionProps) {
  const [showSupplementsInfo, setShowSupplementsInfo] = useState<number | null>(null);

  // Fermer la fenêtre d'information quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.supplements-info-container')) {
        setShowSupplementsInfo(null);
      }
    };

    if (showSupplementsInfo !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSupplementsInfo]);

  const texts = {
    fr: {
      title: 'Des packs personnalisés pour',
      titleHighlight: 'tous vos événements',
      subtitle: 'Mariage, anniversaire, conférence, entreprise… choisissez la solution adaptée.',
      reserveNow: 'Réserver maintenant',
      requestQuote: 'Demander un devis précis',
      keyInHand: 'Clé en main',
      parisPrice: 'Paris intra-muros',
      horsParisPrice: 'Hors Paris',
      transportFee: '+80 € transport',
      reassurance: '✅ Zéro caution sur les formules clé en main · ✅ Technicien qualifié · ✅ Matériel pro · ✅ Date bloquée avec 30 % d\'acompte',
      supplementsInfo: 'Les micros filaires et sans fil, accessoires (enrouleurs, prises, RCA, jack) et présence de technicien pendant l\'événement sont en supplément.'
    },
    en: {
      title: 'Personalized packs for',
      titleHighlight: 'all your events',
      subtitle: 'Wedding, birthday, conference, corporate… pick the right fit.',
      reserveNow: 'Book now',
      requestQuote: 'Request precise quote',
      keyInHand: 'Turnkey',
      parisPrice: 'Paris intra-muros',
      horsParisPrice: 'Outside Paris',
      transportFee: '+80 € transport',
      reassurance: '✅ Zero deposit on turnkey formulas · ✅ Qualified technician · ✅ Professional equipment · ✅ Date secured with 30% down payment',
      supplementsInfo: 'Wired and wireless microphones, accessories (cable reels, plugs, RCA, jack) and technician presence during the event are additional.'
    }
  };

  const packs: { fr: Pack[], en: Pack[] } = {
    fr: [
      {
        id: 2,
        name: "Conférence",
        tagline: "Séminaires & formations",
        description: "Sonorisation claire et professionnelle pour vos événements d'entreprise et formations.",
        priceParis: "À partir de 550 € TTC",
        priceHorsParis: "630 € TTC",
        featured: true,
        image: "/conference.jpg",
        features: [
          "Sonorisation claire et professionnelle",
          "Micro pour présentations",
          "Livraison & installation",
          "Technicien pendant l'événement",
          "Démontage après la conférence"
        ],
        highlight: "Clé en main",
        ideal: "Jusqu'à 150 personnes",
        note: "Idéal conférences, séminaires, formations, présentations d'entreprise."
      },
      {
        id: 3,
        name: "Mariage",
        tagline: "Grand jour & réceptions",
        description: "Sonorisation romantique et élégante pour votre plus beau jour.",
        priceParis: "À partir de 700 € TTC",
        priceHorsParis: "780 € TTC",
        featured: false,
        image: "/mariage.jpg",
        features: [
          "Sonorisation romantique et élégante",
          "Micros pour discours et toasts",
          "Livraison & installation",
          "Technicien discret pendant la cérémonie",
          "Démontage après la réception"
        ],
        highlight: "Clé en main",
        ideal: "Jusqu'à 250 personnes",
        note: "Parfait pour mariages, anniversaires de mariage, réceptions élégantes."
      },
      {
        id: 5,
        name: "Concert",
        tagline: "Spectacles & festivals",
        description: "Sonorisation puissante et professionnelle pour vos événements musicaux.",
        priceParis: "À partir de 1 100 € TTC",
        priceHorsParis: "1 180 € TTC",
        featured: false,
        image: "/concert.jpg",
        features: [
          "Sonorisation puissante et professionnelle",
          "Micros sans fil pour les artistes",
          "Livraison & installation complète",
          "Technicien son pendant le spectacle",
          "Démontage après le concert"
        ],
        highlight: "Clé en main",
        ideal: "Jusqu'à 500 personnes",
        note: "Idéal concerts, festivals, spectacles, événements musicaux."
      }
    ],
    en: [
      {
        id: 2,
        name: "Pack STANDARD",
        tagline: "Up to 150 people",
        description: "Complete professional sound system with installation and technician included.",
        priceParis: "À partir de 550 € TTC",
        priceHorsParis: "630 € TTC",
        featured: true,
        image: "/conference.jpg",
        features: [
          "Sound system for 150 people",
          "1 wired microphone",
          "Delivery & Pickup",
          "Installation & tuning by technician",
          "Dismantling after event"
        ],
        highlight: "Turnkey",
        ideal: "Up to 150 people",
        note: "Perfect for intimate receptions, worship, conferences, friendly evenings."
      },
      {
        id: 3,
        name: "Pack PREMIUM",
        tagline: "Up to 250 people",
        description: "Complete professional system with technical assistance during the event.",
        priceParis: "À partir de 700 € TTC",
        priceHorsParis: "780 € TTC",
        featured: false,
        image: "/mariage.jpg",
        features: [
          "Sound system for 250 people",
          "2 wired microphones",
          "Delivery & Pickup",
          "Installation + technician assistance",
          "Complete dismantling"
        ],
        highlight: "Turnkey",
        ideal: "Up to 250 people",
        note: "Ideal for weddings, associations, corporate evenings."
      },
      {
        id: 5,
        name: "Pack PRESTIGE",
        tagline: "Up to 500 people",
        description: "Maximum configuration with technical supervision during the event.",
        priceParis: "À partir de 1 100 € TTC",
        priceHorsParis: "1 180 € TTC",
        featured: false,
        image: "/concert.jpg",
        features: [
          "Professional sound system for 500 people",
          "2 wireless microphones",
          "Delivery & Pickup by truck",
          "Complete installation + technician assistance",
          "Dismantling & storage"
        ],
        highlight: "Turnkey",
        ideal: "Up to 500 people",
        note: "Large receptions, concerts, worship, festivals."
      }
    ]
  };

  const currentPacks = packs[language];
  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollByAmount = (amount: number) => {
    if (listRef.current) {
      listRef.current.scrollBy({ 
        left: amount, 
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  };

  const handleReservePack = (packId: number) => {
    if (onReservePack) {
      onReservePack(packId);
    }
  };

  return (
    <section id="packs" className="py-20 lg:py-32 bg-gradient-to-b from-gray-50 to-white transition-all duration-1000 ease-in-out relative mx-4 mb-8 rounded-3xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 transform transition-all duration-1000 ease-in-out">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-black leading-tight mb-8 transition-all duration-1000 ease-in-out">
            {texts[language].title}
            <span className="text-[#F2431E]"> {texts[language].titleHighlight}</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 ease-in-out mb-8">
            {texts[language].subtitle}
          </p>

          {/* Bouton Réservez votre pack */}
          <div className="mt-8">
            <button
              onClick={() => {
                // Déclencher l'ouverture du modal assistant
                const event = new CustomEvent('openAssistantModal');
                window.dispatchEvent(event);
              }}
              className="bg-[#F2431E] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#E63A1A] transition-colors shadow-lg hover:shadow-xl"
            >
              <i className="ri-robot-line mr-2 text-xl"></i>
              Réservez votre pack
            </button>
          </div>

        </div>



        {/* Packs Carrousel avec flèches en haut */}
        <div className="relative">
          <style jsx>{`
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="flex items-center justify-end gap-3 mb-4">
          <button
              aria-label="Précédent"
              onClick={() => scrollByAmount(-320)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 hover:shadow-xl transition-all duration-200"
          >
              <span className="text-xl leading-none">‹</span>
          </button>
              <button
              aria-label="Suivant"
              onClick={() => scrollByAmount(320)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 hover:shadow-xl transition-all duration-200"
            >
              <span className="text-xl leading-none">›</span>
          </button>
        </div>

          <div ref={listRef} className="flex gap-6 sm:gap-8 lg:gap-12 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 scrollbar-hide" style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {currentPacks.map((pack, index) => (
                    <div
                      key={pack.id}
                className={`snap-start min-w-[280px] sm:min-w-[360px] lg:min-w-[400px] group transition-all duration-300 ease-out`}
                    >
                      <div
                  className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out overflow-visible border h-full ${
                          pack.featured
                            ? 'border-[#F2431E]/30 ring-2 ring-[#F2431E]/20'
                            : 'border-gray-100'
                        }`}
                      >

                        {/* Image */}
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <img
                            src={pack.image}
                            alt={pack.name}
                            className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                            style={{
                              filter:
                                'grayscale(100%) contrast(110%) brightness(95%) sepia(10%) hue-rotate(345deg) saturate(130%)'
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-500 ease-in-out"></div>
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-6 lg:p-8 transform transition-all duration-500 ease-in-out">
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 sm:mb-3 relative">
                          <h3 className="text-xl sm:text-2xl font-bold text-black transition-all duration-300">
                                {pack.name}
                              </h3>
                          <div className="relative supplements-info-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowSupplementsInfo(showSupplementsInfo === pack.id ? null : pack.id);
                              }}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              aria-label="Informations sur les suppléments"
                            >
                              <i className="ri-information-line text-lg"></i>
                            </button>
                            {showSupplementsInfo === pack.id && (
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-30 w-[300px]">
                                <div className="text-sm">
                                  <h4 className="font-semibold text-gray-800 mb-2">
                                    {language === 'fr' ? 'Suppléments disponibles' : 'Available supplements'}
                                  </h4>
                                  <p className="text-gray-600 leading-relaxed mb-3">
                                    {texts[language].supplementsInfo}
                                  </p>
                                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                    <p className="text-xs text-blue-800">
                                      <i className="ri-information-line mr-1"></i>
                                      {language === 'fr' 
                                        ? 'À préciser dans la section détails'
                                        : 'To be specified in the details section'
                                      }
                              </p>
                            </div>
                              </div>
                                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white border-l border-t border-gray-200 rotate-45"></div>
                                </div>
                              )}
                          </div>
                        </div>
                        <p className="text-[#F2431E] font-medium text-sm sm:text-base transition-all duration-300">
                          {pack.tagline}
                        </p>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base transition-all duration-300">
                            {pack.description}
                          </p>

                          <div className="space-y-2 sm:space-y-3 mb-4">
                            {pack.features.map((feature, featureIndex) => (
                              <div key={featureIndex} className="flex items-center gap-3 transition-all duration-300 hover:transform hover:translate-x-1">
                                <div className="w-2 h-2 bg-[#F2431E] rounded-full"></div>
                                <span className="text-sm sm:text-base text-gray-700">{feature}</span>
                              </div>
                            ))}
                          </div>

                          <div className="mb-6 sm:mb-8">
                            <p className="text-xs sm:text-sm font-medium text-gray-600 bg-gray-50 px-3 sm:px-4 py-2 rounded-lg text-center">
                        {pack.note}
                            </p>
                          </div>

                        </div>
                      </div>
                    </div>
                  ))}

            {/* Carte supplémentaire: Anniversaire (même style que les autres) */}
            <div className="snap-start min-w-[280px] sm:min-w-[360px] lg:min-w-[400px] group transition-all duration-300 ease-out">
              <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out overflow-visible border h-full border-gray-100">

                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src="/anniversaire.jpg"
                    alt={language === 'fr' ? 'Anniversaire' : 'Birthday'}
                    className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                    style={{
                      filter: 'grayscale(100%) contrast(110%) brightness(95%) sepia(10%) hue-rotate(345deg) saturate(130%)'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-500 ease-in-out"></div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 lg:p-8 transform transition-all duration-500 ease-in-out">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 sm:mb-3 relative">
                        <h3 className="text-xl sm:text-2xl font-bold text-black transition-all duration-300">
                          {language === 'fr' ? 'Anniversaire' : 'Birthday'}
                        </h3>
                      </div>
                      <p className="text-[#F2431E] font-medium text-sm sm:text-base transition-all duration-300">
                        {language === 'fr' ? 'Fête & célébrations' : 'Party & celebrations'}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base transition-all duration-300">
                    {language === 'fr' ? 'Sonorisation festive pour vos anniversaires et célébrations privées.' : 'Festive sound system for your birthdays and private celebrations.'}
                  </p>

                  {/* Features */}
                  <div className="space-y-2 sm:space-y-3 mb-4">
                    <div className="flex items-center gap-3 transition-all duration-300 hover:transform hover:translate-x-1">
                      <div className="w-2 h-2 bg-[#F2431E] rounded-full"></div>
                      <span className="text-sm sm:text-base text-gray-700">{language === 'fr' ? 'Sonorisation festive et conviviale' : 'Festive and friendly sound'}</span>
                    </div>
                    <div className="flex items-center gap-3 transition-all duration-300 hover:transform hover:translate-x-1">
                      <div className="w-2 h-2 bg-[#F2431E] rounded-full"></div>
                      <span className="text-sm sm:text-base text-gray-700">{language === 'fr' ? 'Micros pour discours & toasts' : 'Micros for speeches & toasts'}</span>
                    </div>
                    <div className="flex items-center gap-3 transition-all duration-300 hover:transform hover:translate-x-1">
                      <div className="w-2 h-2 bg-[#F2431E] rounded-full"></div>
                      <span className="text-sm sm:text-base text-gray-700">{language === 'fr' ? 'Livraison & installation' : 'Delivery & installation'}</span>
                    </div>
                    <div className="flex items-center gap-3 transition-all duration-300 hover:transform hover:translate-x-1">
                      <div className="w-2 h-2 bg-[#F2431E] rounded-full"></div>
                      <span className="text-sm sm:text-base text-gray-700">{language === 'fr' ? 'Technicien discret pendant l\'événement' : 'Discrete technician during event'}</span>
                    </div>
                    <div className="flex items-center gap-3 transition-all duration-300 hover:transform hover:translate-x-1">
                      <div className="w-2 h-2 bg-[#F2431E] rounded-full"></div>
                      <span className="text-sm sm:text-base text-gray-700">{language === 'fr' ? 'Démontage après la fête' : 'Dismantling after party'}</span>
                    </div>
                  </div>

                  {/* Note bas de carte */}
                  <div className="mb-6 sm:mb-8">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 bg-gray-50 px-3 sm:px-4 py-2 rounded-lg text-center">
                      {language === 'fr' ? 'Parfait pour anniversaires, fêtes privées, célébrations.' : 'Perfect for birthdays, private parties, celebrations.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Encart de réassurance */}
        <div className="mt-16 bg-gradient-to-r from-[#F2431E]/10 to-[#F2431E]/5 rounded-2xl p-8 border border-[#F2431E]/20">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-black mb-6">Pourquoi nous choisir ?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#F2431E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-sound-module-line text-white text-2xl"></i>
                </div>
                <h4 className="font-semibold text-black mb-2">Matériel professionnel</h4>
                <p className="text-sm text-gray-600">Enceintes, micros, consoles haut de gamme</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#F2431E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-user-settings-line text-white text-2xl"></i>
                </div>
                <h4 className="font-semibold text-black mb-2">Techniciens qualifiés</h4>
                <p className="text-sm text-gray-600">Installation et réglages sur place</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#F2431E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-map-pin-line text-white text-2xl"></i>
                </div>
                <h4 className="font-semibold text-black mb-2">Couverture Paris & Île-de-France</h4>
                <p className="text-sm text-gray-600">+80 € hors Paris intra-muros</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#F2431E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-time-line text-white text-2xl"></i>
                </div>
                <h4 className="font-semibold text-black mb-2">Réservation rapide</h4>
                <p className="text-sm text-gray-600">Acompte 30 % en ligne, solde à J-3</p>
              </div>
            </div>
            <div className="mt-8 p-4 bg-white rounded-xl border border-[#F2431E]/20">
              <p className="text-sm text-gray-700 font-medium">
                {texts[language].reassurance}
              </p>
            </div>
          </div>
        </div>

        {/* Nouvelle section: Découvrez notre matériel */}
        <div className="mt-20 lg:mt-28">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight">
              Découvrez notre{' '}
              <span className="text-[#F2431E]">matériel</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Du matériel professionnel sélectionné pour sa fiabilité, sa puissance et sa clarté
            </p>
          </div>

          {/* Carrousel de matériel */}
          <div className="relative">
            <div ref={listRef} className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 scrollbar-hide" style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {[
                { 
                  name: 'Enceinte amplifiée', 
                  image: '/enceintefbt.png',
                  specs: 'Son puissant et clair pour tous vos événements'
                },
                { 
                  name: 'Micro sans fil', 
                  image: '/microshure.png',
                  specs: 'Liberté de mouvement, qualité professionnelle'
                },
                { 
                  name: 'Caisson de basse', 
                  image: '/caissonbasse.png',
                  specs: 'Ajoutez de la profondeur à votre son'
                },
                { 
                  name: 'Console de mixage', 
                  image: '/tablemixage16.png',
                  specs: 'Contrôle total de votre sonorisation'
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="snap-start w-[200px] sm:w-[240px] lg:w-[280px] group transition-all duration-300 ease-out flex-shrink-0"
                >
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out overflow-hidden border border-gray-100 h-[320px] sm:h-[360px] lg:h-[400px] flex flex-col">
                    <div className="relative h-[200px] sm:h-[240px] lg:h-[280px] overflow-hidden rounded-t-2xl flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover object-center transition-transform duration-300 ease-in-out group-hover:scale-105"
                        style={{ objectPosition: 'center' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-center text-center">
                      <h3 className="text-xl font-bold text-[#F2431E] mb-3 leading-tight">{item.name}</h3>
                      <p className="text-gray-600 leading-relaxed">{item.specs}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

      </div>
    </section>
  );
}
