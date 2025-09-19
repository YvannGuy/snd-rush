
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

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
      title: 'Le bon son. Sans compromis.',
      titleHighlight: 'Clé en main.',
      subtitle: 'Choisissez votre pack clé en main : livraison, installation, technicien, démontage & reprise inclus. Zéro caution, acompte 30% pour bloquer votre date.',
      reserveNow: 'Réserver maintenant',
      requestQuote: 'Demander un devis précis',
      keyInHand: 'Clé en main',
      allIncluded: 'Tout inclus : Livraison, Installation, Technicien, Démontage & Reprise',
      parisPrice: 'Paris intra-muros',
      horsParisPrice: 'Hors Paris',
      transportFee: '+80 € transport',
      reassurance: '✅ Zéro caution sur les formules clé en main · ✅ Technicien qualifié · ✅ Matériel pro · ✅ Date bloquée avec 30 % d\'acompte',
      supplementsInfo: 'Les micros filaires et sans fil, accessoires (enrouleurs, prises, RCA, jack) et présence de technicien pendant l\'événement sont en supplément.'
    },
    en: {
      title: 'The right sound. No compromise.',
      titleHighlight: 'Turnkey.',
      subtitle: 'Choose your turnkey pack: delivery, installation, technician, dismantling & pickup included. Zero deposit, 30% down payment to secure your date.',
      reserveNow: 'Book now',
      requestQuote: 'Request precise quote',
      keyInHand: 'Turnkey',
      allIncluded: 'All included: Delivery, Installation, Technician, Dismantling & Pickup',
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
        name: "Pack STANDARD",
        tagline: "Jusqu'à 150 personnes",
        description: "Sonorisation professionnelle complète avec installation et technicien inclus.",
        priceParis: "À partir de 550 € TTC",
        priceHorsParis: "630 € TTC",
        featured: true,
        image: "/pack2c.jpg",
        features: [
          "Sonorisation pour 150 pers",
          "1 micro filaire",
          "Livraison & Reprise",
          "Installation & réglages par technicien",
          "Démontage après l'événement"
        ],
        highlight: "Clé en main",
        ideal: "Jusqu'à 150 personnes",
        note: "Parfait pour réceptions intimistes, cultes, conférences, soirées conviviales."
      },
      {
        id: 3,
        name: "Pack PREMIUM",
        tagline: "Jusqu'à 250 personnes",
        description: "Système professionnel complet avec assistance technique pendant l'événement.",
        priceParis: "À partir de 700 € TTC",
        priceHorsParis: "780 € TTC",
        featured: false,
        image: "/pack2cc.jpg",
        features: [
          "Sonorisation 250 pers",
          "2 micros filaires",
          "Livraison & Reprise",
          "Installation + assistance technicien",
          "Démontage complet"
        ],
        highlight: "Clé en main",
        ideal: "Jusqu'à 250 personnes",
        note: "Idéal mariages, associations, soirées d'entreprise."
      },
      {
        id: 5,
        name: "Pack PRESTIGE",
        tagline: "Jusqu'à 500 personnes",
        description: "Configuration maximale avec supervision technique pendant l'événement.",
        priceParis: "À partir de 1 100 € TTC",
        priceHorsParis: "1 180 € TTC",
        featured: false,
        image: "/pack4cc.jpg",
        features: [
          "Sonorisation pro 500 pers",
          "2 micros sans fil",
          "Livraison & Reprise en camion",
          "Installation complète + assistance technicien",
          "Démontage & rangement"
        ],
        highlight: "Clé en main",
        ideal: "Jusqu'à 500 personnes",
        note: "Grandes réceptions, concerts, cultes, festivals."
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
        image: "/pack2c.jpg",
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
        image: "/pack2cc.jpg",
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
        image: "/pack4cc.jpg",
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
          {/* Bandeau Clé en main */}
          <div className="bg-[#F2431E] text-white px-6 py-3 rounded-full inline-block mb-8">
            <span className="font-semibold text-lg">{texts[language].keyInHand}</span>
          </div>

          {/* Puces Tout inclus */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 max-w-4xl mx-auto">
            <p className="text-green-800 font-medium text-center">
              {texts[language].allIncluded}
            </p>
          </div>
        </div>



        {/* Packs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {currentPacks.map((pack, index) => (
            <div
              key={pack.id}
              className={`group cursor-pointer transition-all duration-500 ease-in-out transform hover:scale-[1.05] hover:-translate-y-2 ${
                pack.featured ? 'lg:scale-105' : ''
              }`}
            >
              <div
                className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out overflow-visible border h-full ${
                  pack.featured
                    ? 'border-[#F2431E]/30 ring-2 ring-[#F2431E]/20'
                    : 'border-gray-100'
                }`}
              >
                {/* Badge */}
                <div
                  className={`absolute top-6 left-6 z-10 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    pack.featured ? 'bg-[#F2431E] text-white' : 'bg-black/80 text-white'
                  }`}
                >
                  {pack.highlight}
                </div>

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
                          
                          {/* Fenêtre d'information collée à l'icône */}
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
                              {/* Flèche pointant vers l'icône */}
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

                  {/* Features */}
                  <div className="space-y-2 sm:space-y-3 mb-4">
                    {pack.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3 transition-all duration-300 hover:transform hover:translate-x-1">
                        <div className="w-2 h-2 bg-[#F2431E] rounded-full"></div>
                        <span className="text-sm sm:text-base text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Note bas de carte */}
                  <div className="mb-6 sm:mb-8">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 bg-gray-50 px-3 sm:px-4 py-2 rounded-lg text-center">
                      {pack.note}
                    </p>
                  </div>

                  {/* Bouton CTA */}
                  <button
                    onClick={() => handleReservePack(pack.id)}
                    className="w-full py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-105 bg-[#F2431E] text-white hover:bg-[#E63A1A] whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-calendar-line mr-2"></i>
                    {texts[language].reserveNow}
                  </button>
                </div>
              </div>
            </div>
          ))}
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

      </div>
    </section>
  );
}
