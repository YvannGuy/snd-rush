
'use client';

import { useState } from 'react';

interface PackSelectionStepProps {
  language: 'fr' | 'en';
  onPackSelect: (pack: any) => void;
}

export default function PackSelectionStep({ language, onPackSelect }: PackSelectionStepProps) {
  const [hoveredPack, setHoveredPack] = useState<number | null>(null);

  const texts = {
    fr: {
      title: 'Choisissez votre pack',
      subtitle: 'Sélectionnez le pack qui correspond le mieux à votre événement',
      selectPack: 'Choisir ce pack',
      mostPopular: 'Le plus populaire',
      professional: 'Premium',
      plugPlay: 'Essentiel'
    },
    en: {
      title: 'Choose your pack',
      subtitle: 'Select the pack that best fits your event',
      selectPack: 'Choose this pack',
      mostPopular: 'Most popular',
      professional: 'Premium',
      plugPlay: 'Essential'
    }
  };

  const packs = {
    fr: [
      {
        id: 1,
        name: "Pack BASIC",
        tagline: "L'essentiel pour débuter",
        description: "Équipement sonore de base parfait pour les petits événements et réunions intimes.",
        price: "89€",
        originalPrice: "",
        duration: "/jour",
        popular: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/6cd244ab7117ff935d97606790e384b9.jfif",
        features: ["2 enceintes actives 300W", "Table de mixage 2 voies", "Pieds d'enceintes", "Câbles audio inclus", "Configuration simple"],
        highlight: "Essentiel",
        ideal: "Idéal pour 20-50 personnes"
      },
      {
        id: 2,
        name: "Pack STANDARD",
        tagline: "Le choix équilibré",
        description: "Solution complète avec micro sans fil pour une sonorisation professionnelle adaptée à tous vos événements.",
        price: "129€",
        originalPrice: "",
        duration: "/jour",
        popular: true,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/5c261792f7820115100dfa4492f866a6.jfif",
        features: ["2 enceintes 500W", "Table de mixage 4 voies", "1 micro sans fil", "Pieds + câbles inclus", "Égaliseur intégré"],
        highlight: "Le + demandé",
        ideal: "Idéal pour 50-100 personnes"
      },
      {
        id: 3,
        name: "Pack PREMIUM",
        tagline: "La qualité supérieure",
        description: "Système professionnel avec caisson de basses pour une expérience sonore immersive et puissante.",
        price: "169€",
        originalPrice: "",
        duration: "/jour",
        popular: false,
        image: "https://readdy.ai/api/search-image?query=premium%20sound%20system%20with%20subwoofer%20and%20professional%20mixing%20console%2C%20high-end%20audio%20equipment%20in%20elegant%20event%20space%2C%20black%20and%20white%20photography%20with%20red%20lighting%20effects&width=400&height=300&seq=premium-pack-modal&orientation=landscape",
        features: ["2 enceintes 800W + caisson", "Table de mixage 6 voies", "2 micros sans fil", "Éclairage LED inclus", "Installation incluse"],
        highlight: "Qualité Pro",
        ideal: "Idéal pour 100-200 personnes"
      },
      {
        id: 4,
        name: "Pack CONFORT",
        tagline: "Le service complet",
        description: "Solution tout-en-un avec technicien dédié pour une tranquillité d'esprit absolue pendant votre événement.",
        price: "229€",
        originalPrice: "",
        duration: "/jour",
        popular: false,
        image: "https://readdy.ai/api/search-image?query=complete%20sound%20system%20with%20technician%20support%2C%20professional%20audio%20setup%20with%20multiple%20speakers%20and%20mixing%20equipment%2C%20service-oriented%20event%20venue%2C%20black%20and%20white%20photography%20with%20warm%20red%20accents&width=400&height=300&seq=confort-pack-modal&orientation=landscape",
        features: ["Système complet 1000W", "Technicien sur site", "3 micros sans fil", "Éclairage professionnel", "Réglages personnalisés", "Support technique"],
        highlight: "Service +",
        ideal: "Idéal pour 150-300 personnes"
      },
      {
        id: 5,
        name: "Pack PRESTIGE",
        tagline: "L'excellence absolue",
        description: "Système haut de gamme avec équipement premium et service VIP pour des événements d'exception.",
        price: "319€",
        originalPrice: "",
        duration: "/jour",
        popular: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/fddc9abdeba1d6e4aff14662a1c018a0.jfif",
        features: ["Système line array 1500W", "Console numérique", "4 micros sans fil premium", "Éclairage scénique", "Ingénieur du son", "Enregistrement HD"],
        highlight: "Haut de gamme",
        ideal: "Idéal pour 250-500 personnes"
      },

    ],
    en: [
      {
        id: 1,
        name: "Pack BASIC",
        tagline: "The essential to get started",
        description: "Basic sound equipment perfect for small events and intimate meetings.",
        price: "89€",
        originalPrice: "",
        duration: "/day",
        popular: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/6cd244ab7117ff935d97606790e384b9.jfif",
        features: ["2 active speakers 300W", "2-channel mixing table", "Speaker stands", "Audio cables included", "Simple setup"],
        highlight: "Essential",
        ideal: "Ideal for 20-50 people"
      },
      {
        id: 2,
        name: "Pack STANDARD",
        tagline: "The balanced choice",
        description: "Complete solution with wireless microphone for professional sound suited to all your events.",
        price: "129€",
        originalPrice: "",
        duration: "/day",
        popular: true,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/5c261792f7820115100dfa4492f866a6.jfif",
        features: ["2 speakers 500W", "4-channel mixing table", "1 wireless microphone", "Stands + cables included", "Integrated equalizer"],
        highlight: "Most requested",
        ideal: "Ideal for 50-100 people"
      },
      {
        id: 3,
        name: "Pack PREMIUM",
        tagline: "Superior quality",
        description: "Professional system with subwoofer for an immersive and powerful sound experience.",
        price: "169€",
        originalPrice: "",
        duration: "/day",
        popular: false,
        image: "https://readdy.ai/api/search-image?query=premium%20sound%20system%20with%20subwoofer%20and%20professional%20mixing%20console%2C%20high-end%20audio%20equipment%20in%20elegant%20event%20space%2C%20black%20and%20white%20photography%20with%20red%20lighting%20effects&width=400&height=300&seq=premium-pack-modal&orientation=landscape",
        features: ["2 speakers 800W + subwoofer", "6-channel mixing table", "2 wireless microphones", "LED lighting included", "Installation included"],
        highlight: "Pro Quality",
        ideal: "Ideal for 100-200 people"
      },
      {
        id: 4,
        name: "Pack COMFORT",
        tagline: "Complete service",
        description: "All-in-one solution with dedicated technician for absolute peace of mind during your event.",
        price: "229€",
        originalPrice: "",
        duration: "/day",
        popular: false,
        image: "https://readdy.ai/api/search-image?query=complete%20sound%20system%20with%20technician%20support%2C%20professional%20audio%20setup%20with%20multiple%20speakers%20and%20mixing%20equipment%2C%20service-oriented%20event%20venue%2C%20black%20and%20white%20photography%20with%20warm%20red%20accents&width=400&height=300&seq=confort-pack-modal&orientation=landscape",
        features: ["Complete 1000W system", "On-site technician", "3 wireless microphones", "Professional lighting", "Custom settings", "Technical support"],
        highlight: "Service +",
        ideal: "Ideal for 150-300 people"
      },
      {
        id: 5,
        name: "Pack PRESTIGE",
        tagline: "Absolute excellence",
        description: "High-end system with premium equipment and VIP service for exceptional events.",
        price: "319€",
        originalPrice: "",
        duration: "/day",
        popular: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/fddc9abdeba1d6e4aff14662a1c018a0.jfif",
        features: ["Line array system 1500W", "Digital console", "4 premium wireless mics", "Stage lighting", "Sound engineer", "HD recording"],
        highlight: "High-end",
        ideal: "Ideal for 250-500 people"
      },

    ]
  };

  const currentPacks = packs[language];

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-black mb-4">
          {texts[language].title}
        </h2>
        <p className="text-gray-600 text-lg">
          {texts[language].subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentPacks.map((pack) => (
          <div
            key={pack.id}
            className={`relative cursor-pointer transition-all duration-300 ${
              hoveredPack === pack.id ? 'scale-105' : ''
            } ${pack.popular ? 'lg:scale-105' : ''}`}
            onMouseEnter={() => setHoveredPack(pack.id)}
            onMouseLeave={() => setHoveredPack(null)}
          >
            <div className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border h-full ${
              pack.popular
                ? 'border-[#F2431E]/30 ring-2 ring-[#F2431E]/20'
                : 'border-gray-100'
            }`}>
              {/* Badge */}
              <div className={`absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-semibold ${
                pack.popular
                  ? 'bg-[#F2431E] text-white'
                  : 'bg-black/80 text-white'
              }`}>
                {pack.highlight}
              </div>

              {/* Popular Badge */}
              {pack.popular && (
                <div className="absolute top-4 right-4 z-10 px-2 py-1 bg-yellow-400 text-black rounded-full text-xs font-semibold">
                  ⭐ {texts[language].mostPopular}
                </div>
              )}

              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={pack.image}
                  alt={pack.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  style={{
                    filter: 'grayscale(100%) contrast(110%) brightness(95%) sepia(10%) hue-rotate(345deg) saturate(130%)'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-black mb-1">
                      {pack.name}
                    </h3>
                    <p className="text-[#F2431E] font-medium text-sm mb-1">
                      {pack.tagline}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {pack.ideal}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-black">{pack.price}</span>
                    </div>
                    {pack.duration && <div className="text-xs text-gray-500">{pack.duration}</div>}
                  </div>
                </div>

                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {pack.description}
                </p>

                {/* Features */}
                <div className="space-y-1 mb-6">
                  {pack.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#F2431E] rounded-full"></div>
                      <span className="text-xs text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => onPackSelect(pack)}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
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
    </div>
  );
}
