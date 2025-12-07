'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { AvailabilityResponse, CalendarDisabledRange, ProductAddon, CartItem } from '@/types/db';

interface PackDetailContentProps {
  packId: string;
  language: 'fr' | 'en';
}

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

export default function PackDetailContent({ packId, language }: PackDetailContentProps) {
  const { addToCart } = useCart();
  
  // État pour le calendrier et la réservation
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [quantity] = useState(1);
  const [rentalDays, setRentalDays] = useState(1);
  const [selectedAddons] = useState<ProductAddon[]>([]);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_disabledRanges, setDisabledRanges] = useState<CalendarDisabledRange[]>([]); // Préfixé avec _ pour indiquer qu'il n'est pas utilisé pour l'instant

  const packs: { fr: Pack[], en: Pack[] } = {
    fr: [
      {
        id: 1,
        name: "Pack S Petit",
        tagline: "Solution basique pour petits événements",
        description: "Pack S parfait pour les petits événements jusqu'à 70 personnes, avec 1 enceinte Mac Mah AS 115 et console de mixage.",
        priceParis: "109 € TTC",
        priceHorsParis: "109 € TTC",
        featured: false,
        image: "/pack2c.jpg",
        features: [
          "1 enceinte Mac Mah AS 115",
          "1 console de mixage",
          "Options : micros, câbles, installation, livraison"
        ],
        highlight: "Caution : 700 €",
        ideal: "30 à 70 personnes",
        note: "Idéal pour conférences, mariages, DJ sets."
      },
      {
        id: 2,
        name: "Pack M Confort",
        tagline: "Solution complète pour événements moyens",
        description: "Pack M pour événements moyens jusqu'à 150 personnes, avec 2 enceintes Mac Mah AS 115 et console HPA Promix 8.",
        priceParis: "129 € TTC",
        priceHorsParis: "129 € TTC",
        featured: true,
        image: "/pack2cc.jpg",
        features: [
          "2 enceintes Mac Mah AS 115",
          "1 console HPA Promix 8",
          "Options : micros, câbles, installation, livraison"
        ],
        highlight: "Caution : 1100 €",
        ideal: "70 à 150 personnes",
        note: "Parfait pour conférences, fêtes, DJ sets."
      },
      {
        id: 3,
        name: "Pack L Grand",
        tagline: "Solution professionnelle pour grands événements",
        description: "Pack L idéal pour événements jusqu'à 250 personnes, avec 2 enceintes FBT X-Lite 115A, 1 caisson X-Sub 118SA et console HPA Promix 16.",
        priceParis: "179 € TTC",
        priceHorsParis: "179 € TTC",
        featured: false,
        image: "/pack4cc.jpg",
        features: [
          "2 enceintes FBT X-Lite 115A",
          "1 caisson X-Sub 118SA",
          "1 console HPA Promix 16",
          "Options : micros, câbles, installation, livraison"
        ],
        highlight: "Caution : 1600 €",
        ideal: "150 à 250 personnes",
        note: "Idéal pour concerts, DJ sets, grandes conférences."
      },
      {
        id: 4,
        name: "Pack XL Maxi / Sur mesure",
        tagline: "Solution sur mesure pour très grands événements",
        description: "Pack XL avec sonorisation professionnelle complète pour événements de plus de 300 personnes.",
        priceParis: "Sur devis",
        priceHorsParis: "Sur devis",
        featured: false,
        image: "/pack4cc.jpg",
        features: [
          "Sonorisation pro",
          "Micros HF & instruments",
          "Technicien & régie",
          "Logistique complète"
        ],
        highlight: "Caution : selon devis",
        ideal: "Plus de 300 personnes",
        note: "Parfait pour très grands événements, festivals, concerts, événements corporate."
      }
    ],
    en: [
      {
        id: 1,
        name: "Pack S Small",
        tagline: "Basic solution for small events",
        description: "Pack S perfect for small events up to 70 people, with 1 Mac Mah AS 115 speaker and mixing console.",
        priceParis: "109 € TTC",
        priceHorsParis: "109 € TTC",
        featured: false,
        image: "/pack2c.jpg",
        features: [
          "1 Mac Mah AS 115 speaker",
          "1 mixing console",
          "Options: mics, cables, installation, delivery"
        ],
        highlight: "Deposit: 700 €",
        ideal: "30 to 70 people",
        note: "Ideal for conferences, weddings, DJ sets."
      },
      {
        id: 2,
        name: "Pack M Comfort",
        tagline: "Complete solution for medium events",
        description: "Pack M for medium events up to 150 people, with 2 Mac Mah AS 115 speakers and HPA Promix 8 console.",
        priceParis: "129 € TTC",
        priceHorsParis: "129 € TTC",
        featured: true,
        image: "/pack2cc.jpg",
        features: [
          "2 Mac Mah AS 115 speakers",
          "1 HPA Promix 8 console",
          "Options: mics, cables, installation, delivery"
        ],
        highlight: "Deposit: 1100 €",
        ideal: "70 to 150 people",
        note: "Perfect for conferences, parties, DJ sets."
      },
      {
        id: 3,
        name: "Pack L Large",
        tagline: "Professional solution for large events",
        description: "Pack L ideal for events up to 250 people, with 2 FBT X-Lite 115A speakers, 1 X-Sub 118SA subwoofer and HPA Promix 16 console.",
        priceParis: "179 € TTC",
        priceHorsParis: "179 € TTC",
        featured: false,
        image: "/pack4cc.jpg",
        features: [
          "2 FBT X-Lite 115A speakers",
          "1 X-Sub 118SA subwoofer",
          "1 HPA Promix 16 console",
          "Options: mics, cables, installation, delivery"
        ],
        highlight: "Deposit: 1600 €",
        ideal: "150 to 250 people",
        note: "Ideal for concerts, DJ sets, large conferences."
      },
      {
        id: 4,
        name: "Pack XL Maxi / Custom",
        tagline: "Custom solution for very large events",
        description: "Pack XL with complete professional sound system for events with more than 300 people.",
        priceParis: "On quote",
        priceHorsParis: "On quote",
        featured: false,
        image: "/pack4cc.jpg",
        features: [
          "Pro sound system",
          "HF mics & instruments",
          "Technician & control room",
          "Complete logistics"
        ],
        highlight: "Deposit: on quote",
        ideal: "More than 300 people",
        note: "Perfect for very large events, festivals, concerts, corporate events."
      }
    ]
  };

  const pack = packs[language].find(p => p.id.toString() === packId);

  // Charger les dates bloquées pour le calendrier
  useEffect(() => {
    async function loadDisabledRanges() {
      if (!pack?.id) return;

      try {
        const today = new Date();
        const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        
        const response = await fetch(`/api/availability/calendar?packId=${pack.id}&month=${month}`);
        if (response.ok) {
          const data = await response.json();
          setDisabledRanges(data.disabledRanges || []);
        }
      } catch (err) {
        console.error('Erreur chargement calendrier:', err);
      }
    }

    if (pack) {
      loadDisabledRanges();
    }
  }, [pack]);

  // Vérifier la disponibilité quand les dates changent
  useEffect(() => {
    async function checkAvailability() {
      if (!pack?.id || !startDate || !endDate) {
        setAvailability(null);
        return;
      }

      setCheckingAvailability(true);
      try {
        const response = await fetch('/api/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packId: pack.id.toString(),
            startDate,
            endDate,
          }),
        });

        if (response.ok) {
          const data: AvailabilityResponse = await response.json();
          setAvailability(data);
        }
      } catch (err) {
        console.error('Erreur vérification disponibilité:', err);
      } finally {
        setCheckingAvailability(false);
      }
    }

    checkAvailability();
  }, [pack?.id, startDate, endDate]);

  // Calculer les jours de location
  useEffect(() => {
    if (startDate && endDate) {
      const startParts = startDate.split('-').map(Number);
      const endParts = endDate.split('-').map(Number);
      
      if (startParts.length === 3 && endParts.length === 3) {
        const start = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2]));
        const end = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2]));
        
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        setRentalDays(diffDays);
      } else {
        setRentalDays(1);
      }
    } else {
      setRentalDays(1);
    }
  }, [startDate, endDate]);

  // Sticky bar visibility


  const handleAddToCart = () => {
    if (!pack || !startDate || !endDate) {
      return;
    }

    if (availability !== null && !availability.available) {
      alert(language === 'fr' 
        ? 'Ce pack n\'est pas disponible sur ces dates. Veuillez choisir d\'autres dates.' 
        : 'This pack is not available for these dates. Please choose other dates.');
      return;
    }

    const cartItem: CartItem = {
      productId: `pack-${pack.id}`,
      productName: `Pack ${pack.name}`,
      productSlug: `pack-${pack.id}`,
      quantity,
      rentalDays,
      startDate,
      endDate,
      dailyPrice: basePrice || 0,
      deposit: pack.id === 1 ? 700 : pack.id === 2 ? 1100 : pack.id === 3 ? 1600 : 500,
      addons: selectedAddons,
      images: [pack.image],
    };

    addToCart(cartItem);
  };

  const texts = {
    fr: {
      perDay: '/jour',
      rating: '4.9/5',
      events: 'Événements',
      addToQuote: 'Obtenir un devis pour événement',
      included: 'Inclus dans ce pack',
      capacities: 'Capacités & Utilisation',
      capacity: 'Capacité',
      recommendedScenarios: 'Scénarios recommandés',
      environment: 'Environnement',
      interiorExterior: 'Intérieur & Extérieur',
      photos: 'Photos',
      testimonials: 'Avis clients',
      faq: 'Questions fréquentes',
      call: 'Appeler',
      description: 'Description',
      specs: 'Caractéristiques techniques',
      deposit: 'Dépôt de garantie',
      depositNote: 'non débité',
      youMightNeed: 'Vous pourriez en avoir besoin',
      addToCart: 'Ajouter au panier',
      checking: 'Vérification...',
      available: 'Disponible',
      unavailable: 'Indisponible',
      faqQuestions: [
        {
          question: 'Le pack inclut-il l\'installation ?',
          answer: 'Oui, tous nos packs incluent l\'installation et la reprise du matériel par nos techniciens.'
        },
        {
          question: 'Puis-je modifier ma réservation ?',
          answer: 'Oui, vous pouvez modifier votre réservation jusqu\'à 48h avant le début de la location.'
        },
        {
          question: 'Quel est le délai de livraison ?',
          answer: 'La livraison se fait généralement le jour même de l\'événement, selon vos besoins.'
        }
      ]
    },
    en: {
      perDay: '/day',
      rating: '4.9/5',
      events: 'Events',
      addToQuote: 'Get a quote for event',
      included: 'Included in this pack',
      capacities: 'Capacities & Usage',
      capacity: 'Capacity',
      recommendedScenarios: 'Recommended scenarios',
      environment: 'Environment',
      interiorExterior: 'Indoor & Outdoor',
      photos: 'Photos',
      testimonials: 'Customer reviews',
      faq: 'Frequently asked questions',
      call: 'Call',
      description: 'Description',
      specs: 'Technical specifications',
      deposit: 'Security deposit',
      depositNote: 'not charged',
      youMightNeed: 'You might also need',
      addToCart: 'Add to cart',
      checking: 'Checking...',
      available: 'Available',
      unavailable: 'Unavailable',
      faqQuestions: [
        {
          question: 'Does the pack include installation?',
          answer: 'Yes, all our packs include installation and pickup of equipment by our technicians.'
        },
        {
          question: 'Can I modify my reservation?',
          answer: 'Yes, you can modify your reservation up to 48 hours before the start of the rental.'
        },
        {
          question: 'What is the delivery time?',
          answer: 'Delivery is usually done on the day of the event, according to your needs.'
        }
      ]
    }
  };

  const currentTexts = texts[language];

  if (!pack) {
    return (
      <div className="pt-16 bg-white min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{language === 'fr' ? 'Pack non trouvé' : 'Pack not found'}</p>
      </div>
    );
  }

  // Extraire le prix de base si disponible
  const priceMatch = pack.priceParis.match(/(\d+)/);
  const basePrice = priceMatch ? parseInt(priceMatch[1]) : null;
  const hasPrice = basePrice !== null;

  const calculateTotal = () => {
    if (!hasPrice || !startDate || !endDate) return 0;
    const baseTotal = basePrice * quantity * rentalDays;
    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    return baseTotal + addonsTotal;
  };

  const parseCapacity = (ideal: string) => {
    const match = ideal.match(/(\d+)\s*(?:à|-|to)\s*(\d+)/);
    return match ? `${match[1]} à ${match[2]} personnes` : ideal;
  };

  const capacity = parseCapacity(pack.ideal);

  // Produits recommandés
  const recommendedProducts = [
    { name: 'Console de mixage', price: '45€/jour', image: '/platinedj.jpg' },
    { name: 'Micro sans fil', price: '35€/jour', image: '/microshure.png' },
    { name: 'Pied d\'enceinte', price: '15€/jour', image: '/pro1.png' },
    { name: 'Câbles XLR', price: '12€/jour', image: '/lyreled.png' }
  ];

  return (
    <div className="pt-16 bg-white">
      {/* Hero Section - Image + Infos principales */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Image Gallery */}
            <div>
            {/* Image principale */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100">
              <Image
                src={pack.image}
                alt={pack.name}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div>
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-500 mb-4">
              <Link href="/packs" className="hover:text-[#F2431E] transition-colors">{language === 'fr' ? 'Packs' : 'Packs'}</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">Pack {pack.name}</span>
            </nav>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                {language === 'fr' ? 'Puissant' : 'Powerful'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {language === 'fr' ? 'Indoor/Outdoor' : 'Indoor/Outdoor'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                {language === 'fr' ? 'Pro Quality' : 'Pro Quality'}
              </span>
      </div>

            {/* Titre */}
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4 leading-tight">
              Pack {pack.name}
            </h1>

            {/* Description courte */}
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              {pack.description}
            </p>

            {/* Prix */}
            <div className="mb-6">
              {hasPrice ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-black">{basePrice}€</span>
                  <span className="text-xl text-gray-500">{currentTexts.perDay}</span>
                </div>
              ) : (
                <p className="text-2xl font-semibold text-gray-700">{pack.priceParis}</p>
              )}
            </div>

            {/* Sélecteur de dates */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {language === 'fr' ? 'Période de location' : 'Rental period'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">
                    {language === 'fr' ? 'Début' : 'Start'}
                  </label>
                  <input
                    type="date"
                    value={startDate || ''}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (e.target.value && endDate && e.target.value > endDate) {
                        setEndDate(null);
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">
                    {language === 'fr' ? 'Fin' : 'End'}
                  </label>
                  <input
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Disponibilité */}
            {startDate && endDate && (
              <div className="mb-6">
                {checkingAvailability ? (
                  <div className="text-sm text-gray-600 py-2">{currentTexts.checking}</div>
                ) : availability ? (
                  <div className={`flex items-center gap-2 ${availability.available ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="text-lg">{availability.available ? '●' : '●'}</span>
                    <span className="font-medium text-sm">
                      {availability.available 
                        ? (language === 'fr' ? 'Disponible aux dates sélectionnées' : 'Available on selected dates')
                        : currentTexts.unavailable
                      }
                    </span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Total */}
            {startDate && endDate && hasPrice && (
              <div className="mb-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">
                  {language === 'fr' ? 'Total' : 'Total'} ({rentalDays} {language === 'fr' ? 'jours' : 'days'})
                </span>
                <span className="text-2xl font-bold text-black">{calculateTotal().toFixed(2)}€</span>
          </div>
            )}

            {/* Bouton Ajouter au panier */}
            <button
              onClick={handleAddToCart}
              disabled={checkingAvailability || (availability !== null && !availability.available) || !startDate || !endDate}
              className={`
                w-full py-4 rounded-lg font-bold text-base transition-all shadow-lg mb-3 flex items-center justify-center gap-2
                ${!checkingAvailability && startDate && endDate && (availability === null || availability.available)
                  ? 'bg-[#F2431E] text-white hover:bg-[#E63A1A] hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <span>🛒</span>
              {checkingAvailability 
                ? currentTexts.checking
                : currentTexts.addToCart
              }
            </button>

            {/* Caution */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span>🔒</span>
              <span>
                {language === 'fr' 
                  ? `Caution: ${pack.id === 1 ? '700' : pack.id === 2 ? '1100' : pack.id === 3 ? '1600' : 'selon devis'}€`
                  : `Deposit: ${pack.id === 1 ? '700' : pack.id === 2 ? '1100' : pack.id === 3 ? '1600' : 'on quote'}€`
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-black mb-6">{currentTexts.description}</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            {pack.description}
          </p>
          
          {/* 3 Features avec icônes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⚡</div>
              <div>
                <h3 className="font-bold text-black mb-1">
                  {language === 'fr' ? 'Puissance' : 'Power'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {pack.id === 1 && (language === 'fr' ? 'Enceinte Mac Mah AS 115 : 400 W LF + 100 W HF RMS' : 'Mac Mah AS 115 Speaker: 400 W LF + 100 W HF RMS')}
                  {pack.id === 2 && (language === 'fr' ? '2× Enceintes Mac Mah AS 115 : 2× (400 W LF + 100 W HF RMS)' : '2× Mac Mah AS 115 Speakers: 2× (400 W LF + 100 W HF RMS)')}
                  {pack.id === 3 && (language === 'fr' ? '2× Enceintes FBT X-Lite 115A : 1200 W LF + 300 W HF chacune. 1× Caisson X-Sub 118SA : 1200 W LF' : '2× FBT X-Lite 115A Speakers: 1200 W LF + 300 W HF each. 1× X-Sub 118SA Subwoofer: 1200 W LF')}
                  {pack.id === 4 && (language === 'fr' ? 'Puissance professionnelle adaptée à vos besoins' : 'Professional power adapted to your needs')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-4xl">🔌</div>
              <div>
                <h3 className="font-bold text-black mb-1">
                  {language === 'fr' ? 'Connectiques pro' : 'Pro Connectivity'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {language === 'fr' ? 'XLR, Jack, Bluetooth intégré' : 'XLR, Jack, Integrated Bluetooth'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-4xl">👥</div>
              <div>
                <h3 className="font-bold text-black mb-1">{capacity}</h3>
                <p className="text-gray-600 text-sm">
                  {pack.id === 1 && (language === 'fr' ? 'Idéal pour conférences, mariages, DJ sets' : 'Ideal for conferences, weddings, DJ sets')}
                  {pack.id === 2 && (language === 'fr' ? 'Parfait pour conférences, fêtes, DJ sets' : 'Perfect for conferences, parties, DJ sets')}
                  {pack.id === 3 && (language === 'fr' ? 'Idéal pour concerts, DJ sets, grandes conférences' : 'Ideal for concerts, DJ sets, large conferences')}
                  {pack.id === 4 && (language === 'fr' ? 'Parfait pour très grands événements, festivals, concerts' : 'Perfect for very large events, festivals, concerts')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Caractéristiques techniques */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-black mb-8">{currentTexts.specs}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🔊</div>
              <p className="text-sm font-semibold text-gray-700">{language === 'fr' ? 'Puissance RMS' : 'RMS Power'}</p>
              <p className="text-lg font-bold text-black">
                {pack.id === 1 && '400 W LF + 100 W HF'}
                {pack.id === 2 && '2× (400 W LF + 100 W HF)'}
                {pack.id === 3 && (language === 'fr' ? 'Enceintes: 2× (1200 W LF + 300 W HF). Caisson: 1200 W LF' : 'Speakers: 2× (1200 W LF + 300 W HF). Sub: 1200 W LF')}
                {pack.id === 4 && '—'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">📦</div>
              <p className="text-sm font-semibold text-gray-700">{language === 'fr' ? 'Poids' : 'Weight'}</p>
              <p className="text-lg font-bold text-black">
                {pack.id === 1 && '28 kg'}
                {pack.id === 2 && '2×28 kg'}
                {pack.id === 3 && (language === 'fr' ? 'Enceintes: 2×24 kg, Sub: 38 kg' : 'Speakers: 2×24 kg, Sub: 38 kg')}
                {pack.id === 4 && '—'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">📐</div>
              <p className="text-sm font-semibold text-gray-700">{language === 'fr' ? 'Dimensions' : 'Dimensions'}</p>
              <p className="text-lg font-bold text-black text-xs">
                {pack.id === 1 && '46×36×66 cm'}
                {pack.id === 2 && '2×46×36×66 cm'}
                {pack.id === 3 && (language === 'fr' ? 'Enceintes: 2×46×36×66 cm, Sub: 52×50×120 cm' : 'Speakers: 2×46×36×66 cm, Sub: 52×50×120 cm')}
                {pack.id === 4 && '—'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">📶</div>
              <p className="text-sm font-semibold text-gray-700">{language === 'fr' ? 'Bluetooth' : 'Bluetooth'}</p>
              <p className="text-lg font-bold text-black">{language === 'fr' ? 'Oui' : 'Yes'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vous pourriez en avoir besoin */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-black mb-8">{currentTexts.youMightNeed}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedProducts.map((product) => (
              <div key={product.name} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gray-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
            </div>
                <div className="p-4">
                  <h3 className="font-bold text-black mb-2">{product.name}</h3>
                  <p className="text-lg font-bold text-[#F2431E] mb-4">{product.price}</p>
                  <button className="w-full bg-[#F2431E] text-white py-2 rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors">
                    {language === 'fr' ? 'Ajouter' : 'Add'}
                  </button>
            </div>
            </div>
            ))}
          </div>
        </div>
      </div>

      {/* Avis clients */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-black mb-8">{currentTexts.testimonials}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-full flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div>
                  <p className="font-semibold text-black">Marie L.</p>
                  <div className="flex text-[#F2431E]">★★★★★</div>
                </div>
              </div>
              <p className="text-gray-700">
                "{language === 'fr' 
                  ? 'Parfait pour notre mariage! Son cristallin et puissance au rendez-vous. Livraison et installation impeccables.' 
                  : 'Perfect for our wedding! Crystal-clear sound and power delivered. Impeccable delivery and installation.'}"
              </p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-full flex items-center justify-center text-white font-bold">
                  T
                </div>
                <div>
                  <p className="font-semibold text-black">Thomas R.</p>
                  <div className="flex text-[#F2431E]">★★★★★</div>
                </div>
              </div>
              <p className="text-gray-700">
                "{language === 'fr' 
                  ? 'Matériel professionnel de qualité. Idéal pour nos événements d\'entreprise. Je recommande vivement!' 
                  : 'Professional quality equipment. Ideal for our corporate events. I highly recommend it!'}"
              </p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-full flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div>
                  <p className="font-semibold text-black">Sophie M.</p>
                  <div className="flex text-[#F2431E]">★★★★★</div>
                </div>
              </div>
              <p className="text-gray-700">
                "{language === 'fr' 
                  ? 'Excellent rapport qualité/prix. Service client réactif et matériel en parfait état. Très satisfaite!' 
                  : 'Excellent value for money. Responsive customer service and equipment in perfect condition. Very satisfied!'}"
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
