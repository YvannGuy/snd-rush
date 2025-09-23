
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
        id: 1,
        name: "Mariage Express",
        tagline: "Le son parfait pour le plus beau jour",
        description: "Sonorisation complète pour votre mariage avec installation professionnelle et accompagnement dédié.",
        price: "190€",
        originalPrice: "240€",
        duration: "12h",
        popular: true,
        image: "https://readdy.ai/api/search-image?query=elegant%20wedding%20ceremony%20with%20professional%20audio%20equipment%20microphones%20and%20speakers%20in%20romantic%20venue%20with%20soft%20lighting%20minimal%20background%20black%20and%20white%20photography%20style%20with%20subtle%20red%20accent%20lighting&width=600&height=400&seq=wedding-pack-reserve&orientation=landscape",
        features: ["Micros sans fil premium", "Enceintes haute définition", "Table de mixage pro", "Installation incluse", "Technicien sur site", "Éclairage ambiance"],
        highlight: "Le + demandé",
        ideal: "Idéal pour 50-150 invités"
      },
      {
        id: 2,
        name: "Événement Pro",
        tagline: "L'audio corporate sans fausse note",
        description: "Solution complète pour conférences, séminaires et événements d'entreprise avec technicien dédié.",
        price: "280€",
        originalPrice: "350€",
        duration: "8h",
        popular: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/5c261792f7820115100dfa4492f866a6.jfif",
        features: ["Système complet", "Technicien sur site", "Micros-cravates", "Sonorisation salle", "Enregistrement possible", "Support technique"],
        highlight: "Professionnel",
        ideal: "Idéal pour 20-100 participants"
      },
      {
        id: 3,
        name: "Soirée Privée",
        tagline: "L'ambiance qui fait vibrer vos invités",
        description: "Équipement plug-and-play pour anniversaires, fêtes et célébrations privées avec éclairage ambiance.",
        price: "120€",
        originalPrice: "160€",
        duration: "6h",
        popular: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/201ad9cfef58b6b9553a19fa999690f2.jfif",
        features: ["Enceintes Bluetooth pro", "Éclairage LED ambiance", "Micros karaoké", "Configuration simple", "Playlist incluse", "Contrôle à distance"],
        highlight: "Plug & Play",
        ideal: "Idéal pour 10-50 invités"
      }
    ],
    en: [
      {
        id: 1,
        name: "Wedding Express",
        tagline: "Perfect sound for the most beautiful day",
        description: "Complete sound system for your wedding with professional installation and dedicated support.",
        price: "190€",
        originalPrice: "240€",
        duration: "12h",
        popular: true,
        image: "https://readdy.ai/api/search-image?query=elegant%20wedding%20ceremony%20with%20professional%20audio%20equipment%20microphones%20and%20speakers%20in%20romantic%20venue%20with%20soft%20lighting%20minimal%20background%20black%20and%20white%20photography%20style%20with%20subtle%20red%20accent%20lighting&width=600&height=400&seq=wedding-pack-reserve&orientation=landscape",
        features: ["Premium wireless mics", "High-definition speakers", "Pro mixing console", "Installation included", "On-site technician", "Ambient lighting"],
        highlight: "Most requested",
        ideal: "Ideal for 50-150 guests"
      },
      {
        id: 2,
        name: "Corporate Event",
        tagline: "Corporate audio without a false note",
        description: "Complete solution for conferences, seminars and corporate events with dedicated technician.",
        price: "280€",
        originalPrice: "350€",
        duration: "8h",
        popular: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/5c261792f7820115100dfa4492f866a6.jfif",
        features: ["Complete system", "On-site technician", "Lapel microphones", "Room sound system", "Recording possible", "Technical support"],
        highlight: "Professional",
        ideal: "Ideal for 20-100 participants"
      },
      {
        id: 3,
        name: "Private Party",
        tagline: "The atmosphere that makes your guests vibrate",
        description: "Plug-and-play equipment for birthdays, parties and private celebrations with ambient lighting.",
        price: "120€",
        originalPrice: "160€",
        duration: "6h",
        popular: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/201ad9cfef58b6b9553a19fa999690f2.jfif",
        features: ["Pro Bluetooth speakers", "LED ambient lighting", "Karaoke microphones", "Simple setup", "Playlist included", "Remote control"],
        highlight: "Plug & Play",
        ideal: "Ideal for 10-50 guests"
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
