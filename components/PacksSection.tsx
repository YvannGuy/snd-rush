
'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Pack {
  id: number;
  name: string;
  tagline: string;
  description: string;
  price: string;
  originalPrice: string;
  duration: string;
  featured: boolean;
  image: string;
  features: string[];
  highlight: string;
  ideal: string;
  caution?: string;
}

interface PacksSectionProps {
  language: 'fr' | 'en';
  onReservePack?: (packId: number) => void;
}

export default function PacksSection({ language, onReservePack }: PacksSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentDjSlide, setCurrentDjSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<'advance' | 'express'>('advance');
  const [showDjPacks, setShowDjPacks] = useState(false);

  const texts = {
    fr: {
      title: 'Le bon son. Sans compromis.',
      titleHighlight: 'En un éclair.',
      subtitle: 'Choisissez un pack conçu pour votre événement, prêt à être livré en avance (jusqu\'à plusieurs mois) ou en urgence (moins de 24h jusqu\'à moins de 1h selon la distance).',
      reservePack: 'Réserver maintenant',
      callNow: 'Appeler maintenant',
      previous: 'Précédent',
      next: 'Suivant',
      reserveNow: 'Réserver',
      advanceTab: 'Réservation à l\'avance',
      expressTab: 'Intervention express',
      packSubtitle: 'Selon le type de service'
    },
    en: {
      title: 'The right sound. No compromise.',
      titleHighlight: 'In a flash.',
      subtitle: 'Choose a pack designed for your event, ready to be delivered in advance (up to several months) or urgently (less than 24h to less than 1h depending on distance).',
      reservePack: 'Book now',
      callNow: 'Call now',
      previous: 'Previous',
      next: 'Next',
      reserveNow: 'Book',
      advanceTab: 'Advance booking',
      expressTab: 'Express intervention',
      packSubtitle: 'According to service type'
    }
  };

  const packs: { fr: Pack[], en: Pack[] } = {
    fr: [
      {
        id: 1,
        name: "Enceinte Starter",
        tagline: "Enceinte Bluetooth professionnelle",
        description: "Solution simple et efficace avec enceinte sans fil pour vos événements.",
        price: "109€",
        originalPrice: "",
        duration: " TTC / jour",
        featured: false,
        image: "/enceintebt.jpg",
        features: ["1x Enceinte active ANNY 10 – Bluetooth intégrée", "Connexion simple : Bluetooth, câble Jack ou RCA", "Option : Micro filaire ou sans fil (+10 €)", "Câblage inclus"],
        highlight: "Starter",
        ideal: "Idéal pour petits événements",
        caution: "600€"
      },
      {
        id: 2,
        name: "Pack STANDARD",
        tagline: "Le choix équilibré pour tous vos événements",
        description: "Solution complète avec micro sans fil pour une sonorisation professionnelle.",
        price: "139€",
        originalPrice: "",
        duration: "/jour",
        featured: true,
        image: "/pack2c.jpg",
        features: ["2 enceintes", "Console de mixage", "Micro, technicien et livraison en option", "Pieds + câbles inclus"],
        highlight: "Le + demandé",
        ideal: "Idéal jusqu'à 100 personnes",
        caution: "1000€"
      },
      {
        id: 3,
        name: "Pack PREMIUM",
        tagline: "L'excellence sonore pour vos grands événements",
        description: "Système professionnel complet avec installation incluse pour une expérience premium.",
        price: "169€",
        originalPrice: "",
        duration: "/jour",
        featured: false,
        image: "/pack2cc.jpg",
        features: ["2 enceintes + 1 caisson de basse", "Console de mixage", "Micro, technicien et installation en option", "Pieds et câbles inclus"],
        highlight: "Premium",
        ideal: "Idéal jusqu'à 200 personnes",
        caution: "1500€"
      },
      {
        id: 5,
        name: "Pack PRESTIGE",
        tagline: "L'excellence absolue pour vos événements d'exception",
        description: "Configuration maximale pour des événements nécessitant une puissance sonore exceptionnelle.",
        price: "319€",
        originalPrice: "",
        duration: "/jour",
        featured: false,
        image: "/pack4cc.jpg",
        features: ["4 enceintes actives 15'' avec trépieds", "1 mixeur professionnel", "1 caisson de basse", "Câblage complet", "Installation & technicien inclus", "Micro et livraison en option"],
        highlight: "Haut de gamme",
        ideal: "Idéal jusqu'à 500 personnes",
        caution: "2200€"
      },

    ],
    en: [
      {
        id: 1,
        name: "Starter Speaker",
        tagline: "Professional Bluetooth speaker",
        description: "Simple and effective solution with wireless speaker for your events.",
        price: "109€",
        originalPrice: "",
        duration: " TTC / day",
        featured: false,
        image: "/enceintebt.jpg",
        features: ["1x Active ANNY 10 speaker – Built-in Bluetooth", "Simple connection: Bluetooth, Jack cable or RCA", "Option: Wired or wireless microphone (+10 €)", "Cabling included"],
        highlight: "Starter",
        ideal: "Perfect for small events",
        caution: "600€"
      },
      {
        id: 2,
        name: "Pack STANDARD",
        tagline: "The balanced choice for all your events",
        description: "Complete solution with wireless microphone for professional sound.",
        price: "139€",
        originalPrice: "",
        duration: "/day",
        featured: true,
        image: "/pack2c.jpg",
        features: ["2 speakers", "Mixing console", "Microphone, technician and delivery optional", "Stands + cables included"],
        highlight: "Most requested",
        ideal: "Ideal for up to 100 people",
        caution: "1000€"
      },
      {
        id: 3,
        name: "Pack PREMIUM",
        tagline: "Sound excellence for your major events",
        description: "Complete professional system with installation included for a premium experience.",
        price: "169€",
        originalPrice: "",
        duration: "/day",
        featured: false,
        image: "/pack2cc.jpg",
        features: ["2 speakers + 1 subwoofer", "Mixing console", "Microphone, technician and installation optional", "Stands and cables included"],
        highlight: "Premium",
        ideal: "Ideal for up to 200 people",
        caution: "1500€"
      },
      {
        id: 5,
        name: "Pack PRESTIGE",
        tagline: "Absolute excellence for exceptional events",
        description: "Maximum configuration for events requiring exceptional sound power.",
        price: "319€",
        originalPrice: "",
        duration: "/day",
        featured: false,
        image: "/pack4cc.jpg",
        features: ["4 active speakers 15'' with tripods", "1 professional mixer", "1 subwoofer", "Complete wiring", "Installation & technician included", "Microphone and delivery optional"],
        highlight: "High-end",
        ideal: "Ideal for up to 500 people",
        caution: "2200€"
      },

    ]
  };

  const expressPacks: { fr: Pack[], en: Pack[] } = {
    fr: [
      {
        id: 101,
        name: "Pack BASIC",
        tagline: "La solution essentielle pour débuter",
        description: "Équipement sonore de base pour vos événements intimes et réunions.",
        price: "299€ TTC",
        originalPrice: "89€",
        duration: "",
        featured: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/6cd244ab7117ff935d97606790e384b9.jfif",
        features: ["1 enceinte active", "Console de mixage", "Pieds d'enceintes", "Tous les câbles inclus"],
        highlight: "Essentiel",
        ideal: "Idéal jusqu'à 50 personnes"
      },
      {
        id: 102,
        name: "Pack STANDARD",
        tagline: "Le choix équilibré pour tous vos événements",
        description: "Solution complète avec micro sans fil pour une sonorisation professionnelle.",
        price: "379€ TTC",
        originalPrice: "129€",
        duration: "",
        featured: true,
        image: "/pack2c.jpg",
        features: ["2 enceintes", "Console de mixage", "Micro, technicien et livraison en option", "Pieds + câbles inclus"],
        highlight: "Le + demandé",
        ideal: "Idéal jusqu'à 100 personnes"
      },
      {
        id: 103,
        name: "Pack PREMIUM",
        tagline: "L'excellence sonore pour vos grands événements",
        description: "Système professionnel complet avec installation incluse pour une expérience premium.",
        price: "449€ TTC",
        originalPrice: "169€",
        duration: "",
        featured: false,
        image: "/pack2cc.jpg",
        features: ["2 enceintes + 1 caisson de basse", "Console de mixage", "Micro, technicien et installation en option", "Pieds et câbles inclus"],
        highlight: "Premium",
        ideal: "Idéal jusqu'à 200 personnes"
      },
      {
        id: 104,
        name: "Pack PRESTIGE",
        tagline: "L'excellence absolue pour vos événements d'exception",
        description: "Configuration maximale pour des événements nécessitant une puissance sonore exceptionnelle.",
        price: "599€ TTC",
        originalPrice: "319€",
        duration: "",
        featured: false,
        image: "/pack4cc.jpg",
        features: ["4 enceintes actives 15'' avec trépieds", "1 mixeur professionnel", "1 caisson de basse", "Câblage complet", "Installation & technicien inclus", "Micro et livraison en option"],
        highlight: "Haut de gamme",
        ideal: "Idéal jusqu'à 500 personnes"
      },
      {
        id: 105,
        name: "Pack SUR-MESURE",
        tagline: "Sur mesure et exclusif pour l'unique",
        description: "Base incluse avec possibilité d'ajouter des équipements selon vos besoins spécifiques.",
        price: "Sur devis",
        originalPrice: "",
        duration: "",
        featured: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/6cd244ab7117ff935d97606790e384b9.jfif",
        features: ["1 enceinte active avec trépied", "1 console de mixage", "Câblage standard", "Options : enceintes, micro, caisson, trépieds, installation, technicien"],
        highlight: "Sur-mesure",
        ideal: "Événements sur mesure"
      }
    ],
    en: [
      {
        id: 101,
        name: "Pack BASIC",
        tagline: "The essential solution to get started",
        description: "Basic sound equipment for your intimate events and meetings.",
        price: "299€ TTC",
        originalPrice: "89€",
        duration: "",
        featured: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/6cd244ab7117ff935d97606790e384b9.jfif",
        features: ["1 active speaker", "Mixing console", "Speaker stands", "All cables included"],
        highlight: "Essential",
        ideal: "Ideal for up to 50 people"
      },
      {
        id: 102,
        name: "Pack STANDARD",
        tagline: "The balanced choice for all your events",
        description: "Complete solution with wireless microphone for professional sound.",
        price: "379€ TTC",
        originalPrice: "129€",
        duration: "",
        featured: true,
        image: "/pack2c.jpg",
        features: ["2 speakers", "Mixing console", "Microphone, technician and delivery optional", "Stands + cables included"],
        highlight: "Most requested",
        ideal: "Ideal for up to 100 people"
      },
      {
        id: 103,
        name: "Pack PREMIUM",
        tagline: "Sound excellence for your major events",
        description: "Complete professional system with installation included for a premium experience.",
        price: "449€ TTC",
        originalPrice: "169€",
        duration: "",
        featured: false,
        image: "/pack2cc.jpg",
        features: ["2 speakers + 1 subwoofer", "Mixing console", "Microphone, technician and installation optional", "Stands and cables included"],
        highlight: "Premium",
        ideal: "Ideal for up to 200 people"
      },
      {
        id: 104,
        name: "Pack PRESTIGE",
        tagline: "Absolute excellence for exceptional events",
        description: "Maximum configuration for events requiring exceptional sound power.",
        price: "599€ TTC",
        originalPrice: "319€",
        duration: "",
        featured: false,
        image: "/pack4cc.jpg",
        features: ["4 active speakers 15'' with tripods", "1 professional mixer", "1 subwoofer", "Complete wiring", "Installation & technician included", "Microphone and delivery optional"],
        highlight: "High-end",
        ideal: "Ideal for up to 500 people"
      },
      {
        id: 105,
        name: "Pack CUSTOM",
        tagline: "Custom and exclusive for the unique",
        description: "Base included with possibility to add equipment according to your specific needs.",
        price: "Quote",
        originalPrice: "",
        duration: "",
        featured: false,
        image: "https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/6cd244ab7117ff935d97606790e384b9.jfif",
        features: ["1 active speaker with tripod", "1 mixing console", "Standard wiring", "Options: speakers, microphone, subwoofer, tripods, installation, technician"],
        highlight: "Custom",
        ideal: "Custom events"
      }
    ]
  };

  const djPacks: { fr: Pack[], en: Pack[] } = {
    fr: [
      {
        id: 201,
        name: "DJ Compact",
        tagline: "Contrôleur DJ tout-en-un professionnel",
        description: "Solution DJ complète avec contrôleur Pioneer XDJ-RR pour vos performances.",
        price: "99€",
        originalPrice: "",
        duration: " TTC",
        featured: false,
        image: "/pack2c.jpg",
        features: ["1x Contrôleur Pioneer XDJ-RR (tout-en-un)", "Équipement professionnel", "Câblage inclus", "Prêt à l'emploi"],
        highlight: "Compact",
        ideal: "Idéal pour débuter",
        caution: "1000€"
      },
      {
        id: 202,
        name: "Pack DJ Compact + DJ Booth",
        tagline: "DJ Compact avec stand professionnel",
        description: "Solution DJ complète avec contrôleur Pioneer XDJ-RR et DJ Booth professionnel.",
        price: "149€",
        originalPrice: "",
        duration: " TTC",
        featured: false,
        image: "/pack4cc.jpg",
        features: ["1x Contrôleur Pioneer XDJ-RR (platines + table intégrée)", "1x DJ Booth (stand pro) – structure stable et esthétique", "Câblage inclus"],
        highlight: "Booth",
        ideal: "Idéal pour événements",
        caution: "1500€"
      },
      {
        id: 203,
        name: "Pack Sono Standard DJ",
        tagline: "DJ + Sonorisation complète",
        description: "Pack complet avec contrôleur DJ et système de sonorisation professionnel.",
        price: "199€",
        originalPrice: "",
        duration: " TTC",
        featured: true,
        image: "/pack2cc.jpg",
        features: ["1x Pioneer XDJ-RR", "2x Enceintes actives (1000W chacune)", "Pieds + câblage inclus", "Système complet"],
        highlight: "Standard",
        ideal: "Idéal pour événements",
        caution: "1800€"
      },
      {
        id: 204,
        name: "Pack Sono Premium DJ",
        tagline: "L'excellence DJ avec sonorisation premium",
        description: "Configuration DJ premium avec caisson de basses pour des performances exceptionnelles.",
        price: "279€",
        originalPrice: "",
        duration: " TTC",
        featured: false,
        image: "/pack4cc.jpg",
        features: ["1x Pioneer XDJ-RR", "2x Enceintes actives (1000W chacune)", "1x Caisson de basses (1500W)", "Pieds + câblage inclus"],
        highlight: "Premium",
        ideal: "Professionnels confirmés",
        caution: "2500€"
      }
    ],
    en: [
      {
        id: 201,
        name: "DJ Compact",
        tagline: "Professional all-in-one DJ controller",
        description: "Complete DJ solution with Pioneer XDJ-RR controller for your performances.",
        price: "99€",
        originalPrice: "",
        duration: " TTC",
        featured: false,
        image: "/pack2c.jpg",
        features: ["1x Pioneer XDJ-RR controller (all-in-one)", "Professional equipment", "Cabling included", "Ready to use"],
        highlight: "Compact",
        ideal: "Perfect for beginners",
        caution: "1000€"
      },
      {
        id: 202,
        name: "DJ Compact + DJ Booth Pack",
        tagline: "DJ Compact with professional stand",
        description: "Complete DJ solution with Pioneer XDJ-RR controller and professional DJ Booth.",
        price: "149€",
        originalPrice: "",
        duration: " TTC",
        featured: false,
        image: "/pack4cc.jpg",
        features: ["1x Pioneer XDJ-RR controller (turntables + integrated table)", "1x DJ Booth (pro stand) – stable and aesthetic structure", "Cabling included"],
        highlight: "Booth",
        ideal: "Perfect for events",
        caution: "1500€"
      },
      {
        id: 203,
        name: "Standard Sound DJ Pack",
        tagline: "DJ + Complete Sound System",
        description: "Complete pack with DJ controller and professional sound system.",
        price: "199€",
        originalPrice: "",
        duration: " TTC",
        featured: true,
        image: "/pack2cc.jpg",
        features: ["1x Pioneer XDJ-RR", "2x Active speakers (1000W each)", "Stands + cabling included", "Complete system"],
        highlight: "Standard",
        ideal: "Perfect for events",
        caution: "1800€"
      },
      {
        id: 204,
        name: "Premium Sound DJ Pack",
        tagline: "DJ excellence with premium sound",
        description: "Premium DJ configuration with subwoofer for exceptional performances.",
        price: "279€",
        originalPrice: "",
        duration: " TTC",
        featured: false,
        image: "/pack4cc.jpg",
        features: ["1x Pioneer XDJ-RR", "2x Active speakers (1000W each)", "1x Subwoofer (1500W)", "Stands + cabling included"],
        highlight: "Premium",
        ideal: "Confirmed professionals",
        caution: "2500€"
      }
    ]
  };

  const currentPacks = activeTab === 'express' ? expressPacks[language] : packs[language];
  const packsPerSlide = 3;
  const totalSlides = Math.ceil(currentPacks.length / packsPerSlide);
  
  const djPacksPerSlide = 3;
  const totalDjSlides = Math.ceil(djPacks[language].length / djPacksPerSlide);

  const handleReservePack = (packId: number) => {
    if (onReservePack) {
      onReservePack(packId);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const nextDjSlide = () => {
    setCurrentDjSlide((prev) => (prev + 1) % totalDjSlides);
  };

  const prevDjSlide = () => {
    setCurrentDjSlide((prev) => (prev - 1 + totalDjSlides) % totalDjSlides);
  };

  const getCurrentPacks = () => {
    const start = currentSlide * packsPerSlide;
    const end = start + packsPerSlide;
    return currentPacks.slice(start, end);
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
          <p className="text-lg text-gray-600 mb-8">
            {texts[language].packSubtitle}
          </p>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-full p-2 shadow-lg">
              <button
                onClick={() => setActiveTab('advance')}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                  activeTab === 'advance'
                    ? 'bg-[#F2431E] text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {texts[language].advanceTab}
              </button>
              <button
                onClick={() => setActiveTab('express')}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                  activeTab === 'express'
                    ? 'bg-[#F2431E] text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {texts[language].expressTab}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-center items-center gap-6 mb-12">
          <button
            onClick={prevSlide}
            className="w-14 h-14 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 flex items-center justify-center group hover:bg-gray-50"
          >
            <i className="ri-arrow-left-line text-xl text-gray-600 group-hover:text-black transition-colors"></i>
          </button>

          {/* Slide Indicators */}
          <div className="flex gap-2">
            {Array.from({ length: totalSlides }, (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'bg-[#F2431E]' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="w-14 h-14 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 flex items-center justify-center group hover:bg-gray-50"
          >
            <i className="ri-arrow-right-line text-xl text-gray-600 group-hover:text-black transition-colors"></i>
          </button>
        </div>

        {/* Packs Grid */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {Array.from({ length: totalSlides }, (_, slideIndex) => (
              <div key={slideIndex} className="w-full flex-shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
                  {currentPacks.slice(slideIndex * packsPerSlide, (slideIndex + 1) * packsPerSlide).map((pack, index) => (
                    <div
                      key={pack.id}
                      className={`group cursor-pointer transition-all duration-500 ease-in-out transform hover:scale-[1.05] hover:-translate-y-2 ${
                        pack.featured ? 'lg:scale-105' : ''
                      }`}
                    >
                      <div
                        className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out overflow-hidden border h-full ${
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
                              <h3 className="text-xl sm:text-2xl font-bold text-black mb-2 sm:mb-3 transition-all duration-300">
                                {pack.name}
                              </h3>
                              <p className="text-[#F2431E] font-medium text-sm sm:text-base transition-all duration-300">
                                {pack.tagline}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <div className="flex items-baseline gap-1">
                                <span className="text-lg sm:text-2xl font-bold text-black">{pack.price}</span>
                                {pack.duration && <span className="text-xs sm:text-sm text-gray-500">{pack.duration}</span>}
                              </div>
                              {pack.caution && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Caution: {pack.caution}
                                </div>
                              )}
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

                          {/* Ideal for */}
                          <div className="mb-6 sm:mb-8">
                            <p className="text-xs sm:text-sm font-medium text-gray-600 bg-gray-50 px-3 sm:px-4 py-2 rounded-lg text-center">
                              {pack.ideal}
                            </p>
                          </div>

                          {/* Dynamic Button based on active tab */}
                          {activeTab === 'advance' ? (
                            <button
                              onClick={() => handleReservePack(pack.id)}
                              className="w-full py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-105 bg-[#F2431E] text-white hover:bg-[#E63A1A] whitespace-nowrap cursor-pointer"
                            >
                              <i className="ri-calendar-line mr-2"></i>
                              {texts[language].reserveNow}
                            </button>
                          ) : (
                            <a
                              href="tel:+33651084994"
                              className="w-full py-4 rounded-xl font-semibold text-base transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-105 bg-[#F2431E] text-white hover:bg-[#E63A1A] whitespace-nowrap cursor-pointer flex items-center justify-center"
                            >
                              <i className="ri-phone-line mr-2"></i>
                              {texts[language].callNow}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pack Counter */}
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            {currentSlide * packsPerSlide + 1} - {Math.min((currentSlide + 1) * packsPerSlide, currentPacks.length)} sur {currentPacks.length} packs
          </p>
        </div>

        {/* Section Packs DJ */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-black mb-6">
              🎧 Packs DJ
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Équipement DJ professionnel pour vos performances et événements
            </p>
          </div>

          {/* Navigation Controls for DJ Packs */}
          <div className="flex justify-center items-center gap-6 mb-12">
            <button
              onClick={prevDjSlide}
              className="w-14 h-14 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 flex items-center justify-center group hover:bg-gray-50"
            >
              <i className="ri-arrow-left-line text-xl text-gray-600 group-hover:text-black transition-colors"></i>
            </button>

            {/* Slide Indicators for DJ Packs */}
            <div className="flex gap-2">
              {Array.from({ length: totalDjSlides }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentDjSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentDjSlide ? 'bg-[#F2431E]' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextDjSlide}
              className="w-14 h-14 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 flex items-center justify-center group hover:bg-gray-50"
            >
              <i className="ri-arrow-right-line text-xl text-gray-600 group-hover:text-black transition-colors"></i>
            </button>
          </div>

          {/* DJ Packs Grid */}
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentDjSlide * 100}%)` }}
            >
              {Array.from({ length: totalDjSlides }, (_, slideIndex) => (
                <div key={slideIndex} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
                    {djPacks[language].slice(slideIndex * djPacksPerSlide, (slideIndex + 1) * djPacksPerSlide).map((pack, index) => (
                      <div
                        key={pack.id}
                        className={`group cursor-pointer transition-all duration-500 ease-in-out transform hover:scale-[1.05] hover:-translate-y-2 ${
                          pack.featured ? 'lg:scale-105' : ''
                        }`}
                      >
                        <div
                          className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out overflow-hidden border h-full ${
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
                                <h3 className="text-xl sm:text-2xl font-bold text-black mb-2 sm:mb-3 transition-all duration-300">
                                  {pack.name}
                                </h3>
                                <p className="text-[#F2431E] font-medium text-sm sm:text-base transition-all duration-300">
                                  {pack.tagline}
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-lg sm:text-2xl font-bold text-black">{pack.price}</span>
                                  {pack.duration && <span className="text-xs sm:text-sm text-gray-500">{pack.duration}</span>}
                                </div>
                                {pack.caution && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    Caution: {pack.caution}
                                  </div>
                                )}
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

                            {/* Ideal for */}
                            <div className="mb-6 sm:mb-8">
                              <p className="text-xs sm:text-sm font-medium text-gray-600 bg-gray-50 px-3 sm:px-4 py-2 rounded-lg text-center">
                                {pack.ideal}
                              </p>
                            </div>

                            {/* Button */}
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
                </div>
              ))}
            </div>
          </div>

          {/* DJ Pack Counter */}
          <div className="text-center mt-12">
            <p className="text-gray-500 text-sm">
              {currentDjSlide * djPacksPerSlide + 1} - {Math.min((currentDjSlide + 1) * djPacksPerSlide, djPacks[language].length)} sur {djPacks[language].length} packs DJ
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
