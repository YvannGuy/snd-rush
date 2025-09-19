
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface PackSelectionProps {
  language: 'fr' | 'en';
  onPackSelect: (packId: number) => void;
}

export default function PackSelection({ language, onPackSelect }: PackSelectionProps) {
  const [hoveredPack, setHoveredPack] = useState<number | null>(null);

  const texts = {
    fr: {
      title: 'Choisissez votre pack',
      subtitle: 'Sélectionnez le pack qui correspond le mieux à votre événement',
      customNeed: 'Besoin sur mesure ?',
      customDescription: 'Contactez-nous pour une solution personnalisée',
      contact: 'Nous contacter',
      selectPack: 'Sélectionner ce pack',
      mostPopular: 'Le plus populaire',
      professional: 'Professionnel',
      plugPlay: 'Plug & Play'
    },
    en: {
      title: 'Choose your pack',
      subtitle: 'Select the pack that best fits your event',
      customNeed: 'Custom need?',
      customDescription: 'Contact us for a personalized solution',
      contact: 'Contact us',
      selectPack: 'Select this pack',
      mostPopular: 'Most popular',
      professional: 'Professional',
      plugPlay: 'Plug & Play'
    }
  };

  const packs = {
    fr: [
      {
        id: 2,
        name: "Pack STANDARD",
        tagline: "Jusqu'à 150 personnes",
        description: "Sonorisation professionnelle complète avec installation et technicien inclus.",
        price: "À partir de 550€",
        duration: "Clé en main",
        popular: true,
        image: "/pack2c.jpg",
        features: [
          "Sonorisation pour 150 pers",
          "1 micro filaire",
          "Livraison & Reprise",
          "Installation & réglages par technicien",
          "Démontage après l'événement"
        ],
        highlight: "Clé en main",
        ideal: "Jusqu'à 150 personnes"
      },
      {
        id: 3,
        name: "Pack PREMIUM",
        tagline: "Jusqu'à 250 personnes",
        description: "Système professionnel complet avec assistance technique pendant l'événement.",
        price: "À partir de 700€",
        duration: "Clé en main",
        popular: false,
        image: "/pack2cc.jpg",
        features: [
          "Sonorisation 250 pers",
          "2 micros filaires",
          "Livraison & Reprise",
          "Installation + assistance technicien",
          "Démontage complet"
        ],
        highlight: "Clé en main",
        ideal: "Jusqu'à 250 personnes"
      },
      {
        id: 5,
        name: "Pack PRESTIGE",
        tagline: "Jusqu'à 500 personnes",
        description: "Configuration maximale avec supervision technique pendant l'événement.",
        price: "À partir de 1 100€",
        duration: "Clé en main",
        popular: false,
        image: "/pack4cc.jpg",
        features: [
          "Sonorisation pro 500 pers",
          "Micros sans fil & accessoires",
          "Livraison & Reprise en camion",
          "Installation complète",
          "Supervision technique (max 5h)",
          "Démontage & rangement"
        ],
        highlight: "Clé en main",
        ideal: "Jusqu'à 500 personnes"
      }
    ],
    en: [
      {
        id: 2,
        name: "Pack STANDARD",
        tagline: "Up to 150 people",
        description: "Complete professional sound system with installation and technician included.",
        price: "From 550€",
        duration: "Turnkey",
        popular: true,
        image: "/pack2c.jpg",
        features: [
          "Sound system for 150 people",
          "1 wired microphone",
          "Delivery & Pickup",
          "Installation & tuning by technician",
          "Dismantling after event"
        ],
        highlight: "Turnkey",
        ideal: "Up to 150 people"
      },
      {
        id: 3,
        name: "Pack PREMIUM",
        tagline: "Up to 250 people",
        description: "Complete professional system with technical assistance during the event.",
        price: "From 700€",
        duration: "Turnkey",
        popular: false,
        image: "/pack2cc.jpg",
        features: [
          "Sound system for 250 people",
          "2 wired microphones",
          "Delivery & Pickup",
          "Installation + technician assistance",
          "Complete dismantling"
        ],
        highlight: "Turnkey",
        ideal: "Up to 250 people"
      },
      {
        id: 5,
        name: "Pack PRESTIGE",
        tagline: "Up to 500 people",
        description: "Maximum configuration with technical supervision during the event.",
        price: "From 1 100€",
        duration: "Turnkey",
        popular: false,
        image: "/pack4cc.jpg",
        features: [
          "Professional sound system for 500 people",
          "Wireless microphones & accessories",
          "Delivery & Pickup by truck",
          "Complete installation",
          "Technical supervision (max 5h)",
          "Dismantling & storage"
        ],
        highlight: "Turnkey",
        ideal: "Up to 500 people"
      }
    ]
  };

  const currentPacks = packs[language];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-black mb-6">
            {texts[language].title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {texts[language].subtitle}
          </p>
        </div>

        {/* Packs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {currentPacks.map((pack) => (
            <div
              key={pack.id}
              className={`relative group cursor-pointer transition-all duration-500 ease-in-out transform ${
                hoveredPack === pack.id ? 'scale-105 -translate-y-2' : ''
              } ${pack.popular ? 'lg:scale-105' : ''}`}
              onMouseEnter={() => setHoveredPack(pack.id)}
              onMouseLeave={() => setHoveredPack(null)}
            >
              <div className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out overflow-hidden border h-full ${
                pack.popular
                  ? 'border-[#F2431E]/30 ring-2 ring-[#F2431E]/20'
                  : 'border-gray-100'
              }`}>
                
                {/* Badge */}
                <div className={`absolute top-6 left-6 z-10 px-4 py-2 rounded-full text-sm font-semibold ${
                  pack.popular
                    ? 'bg-[#F2431E] text-white'
                    : 'bg-black/80 text-white'
                }`}>
                  {pack.highlight}
                </div>

                {/* Popular Badge */}
                {pack.popular && (
                  <div className="absolute top-6 right-6 z-10 px-3 py-1 bg-yellow-400 text-black rounded-full text-sm font-semibold">
                    {texts[language].mostPopular}
                  </div>
                )}
                
                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img 
                    src={pack.image}
                    alt={pack.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                    style={{
                      filter: 'grayscale(100%) contrast(110%) brightness(95%) sepia(10%) hue-rotate(345deg) saturate(130%)'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-black mb-2">
                        {pack.name}
                      </h3>
                      <p className="text-[#F2431E] font-medium text-base mb-2">
                        {pack.tagline}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {pack.ideal}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-black">{pack.price}</span>
                      </div>
                      <div className="text-sm text-gray-500">{pack.duration}</div>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {pack.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-2 mb-8">
                    {pack.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[#F2431E] rounded-full"></div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => onPackSelect(pack.id)}
                    className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-105 ${
                      pack.popular
                        ? 'bg-[#F2431E] text-white hover:bg-[#E63A1A]'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {texts[language].selectPack}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Solution */}
        <div className="bg-black rounded-3xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-6">
            {texts[language].customNeed}
          </h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {texts[language].customDescription}
          </p>
          <Link href="/contact">
            <button className="bg-[#F2431E] text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-[#E63A1A] transition-colors">
              {texts[language].contact}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
