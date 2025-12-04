'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import QuantityStepper from '@/components/products/QuantityStepper';
import ProductAddons from '@/components/products/ProductAddons';
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
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const { addToCart } = useCart();
  
  // État pour le calendrier et la réservation
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [rentalDays, setRentalDays] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [disabledRanges, setDisabledRanges] = useState<CalendarDisabledRange[]>([]);
  const [showToast, setShowToast] = useState(false);

  const packs: { fr: Pack[], en: Pack[] } = {
    fr: [
      {
        id: 1,
        name: "Essentiel",
        tagline: "Solution basique pour petits événements",
        description: "Pack essentiel parfait pour les petits événements intérieurs jusqu'à 70 personnes.",
        priceParis: "300 € TTC",
        priceHorsParis: "300 € TTC",
        featured: false,
        image: "/pack2c.jpg",
        features: [
          "2 enceintes pro",
          "1 micro",
          "Câblage complet",
          "Installation & reprise"
        ],
        highlight: "Clé en main",
        ideal: "30 à 70 personnes",
        note: "Idéal pour petits événements intérieurs, réunions, anniversaires intimes."
      },
      {
        id: 2,
        name: "Standard",
        tagline: "Solution complète pour événements moyens",
        description: "Pack standard avec sonorisation complète pour événements jusqu'à 150 personnes.",
        priceParis: "450 € TTC",
        priceHorsParis: "450 € TTC",
        featured: true,
        image: "/pack2cc.jpg",
        features: [
          "2 enceintes + 1 caisson de basse",
          "2 micros",
          "Console de mixage",
          "Installation & reprise"
        ],
        highlight: "Clé en main",
        ideal: "70 à 150 personnes",
        note: "Parfait pour événements moyens, mariages, conférences, soirées privées."
      },
      {
        id: 3,
        name: "Premium",
        tagline: "Solution professionnelle pour grands événements",
        description: "Pack premium avec équipement professionnel et technicien sur place pour événements jusqu'à 300 personnes.",
        priceParis: "650 € TTC",
        priceHorsParis: "650 € TTC",
        featured: false,
        image: "/pack4cc.jpg",
        features: [
          "2 enceintes + 2 caissons",
          "Console pro",
          "4 micros",
          "Technicien sur place",
          "Installation & reprise"
        ],
        highlight: "Clé en main",
        ideal: "150 à 300 personnes",
        note: "Idéal pour grands événements, concerts, live, DJ sets professionnels."
      },
      {
        id: 4,
        name: "Événement",
        tagline: "Solution sur mesure pour très grands événements",
        description: "Pack événement avec sonorisation professionnelle complète pour événements jusqu'à 600 personnes.",
        priceParis: "Sur devis",
        priceHorsParis: "Sur devis",
        featured: false,
        image: "/pack4cc.jpg",
        features: [
          "Sonorisation pro complète",
          "Micros HF & instruments",
          "Technicien & régie",
          "Logistique complète",
          "Installation & reprise"
        ],
        highlight: "Clé en main",
        ideal: "300 à 600 personnes",
        note: "Parfait pour très grands événements, festivals, concerts, événements corporate."
      }
    ],
    en: [
      {
        id: 1,
        name: "Essential",
        tagline: "Basic solution for small events",
        description: "Essential pack perfect for small indoor events up to 70 people.",
        priceParis: "300 € TTC",
        priceHorsParis: "300 € TTC",
        featured: false,
        image: "/pack2c.jpg",
        features: [
          "2 pro speakers",
          "1 microphone",
          "Complete wiring",
          "Installation & pickup"
        ],
        highlight: "Turnkey",
        ideal: "30 to 70 people",
        note: "Ideal for small indoor events, meetings, intimate birthdays."
      },
      {
        id: 2,
        name: "Standard",
        tagline: "Complete solution for medium events",
        description: "Standard pack with complete sound system for events up to 150 people.",
        priceParis: "450 € TTC",
        priceHorsParis: "450 € TTC",
        featured: true,
        image: "/pack2cc.jpg",
        features: [
          "2 speakers + 1 subwoofer",
          "2 microphones",
          "Mixing console",
          "Installation & pickup"
        ],
        highlight: "Turnkey",
        ideal: "70 to 150 people",
        note: "Perfect for medium events, weddings, conferences, private parties."
      },
      {
        id: 3,
        name: "Premium",
        tagline: "Professional solution for large events",
        description: "Premium pack with professional equipment and on-site technician for events up to 300 people.",
        priceParis: "650 € TTC",
        priceHorsParis: "650 € TTC",
        featured: false,
        image: "/pack4cc.jpg",
        features: [
          "2 speakers + 2 subwoofers",
          "Pro console",
          "4 microphones",
          "On-site technician",
          "Installation & pickup"
        ],
        highlight: "Turnkey",
        ideal: "150 to 300 people",
        note: "Ideal for large events, concerts, live, professional DJ sets."
      },
      {
        id: 4,
        name: "Event",
        tagline: "Custom solution for very large events",
        description: "Event pack with complete professional sound system for events up to 600 people.",
        priceParis: "On quote",
        priceHorsParis: "On quote",
        featured: false,
        image: "/pack4cc.jpg",
        features: [
          "Complete pro sound system",
          "HF mics & instruments",
          "Technician & control room",
          "Complete logistics",
          "Installation & pickup"
        ],
        highlight: "Turnkey",
        ideal: "300 to 600 people",
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
  useEffect(() => {
    const handleScroll = () => {
      const faqSection = document.getElementById('faq-section');
      if (faqSection) {
        const faqTop = faqSection.getBoundingClientRect().top;
        setIsStickyVisible(faqTop > window.innerHeight);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Add-ons par défaut pour les packs
  const defaultAddons: ProductAddon[] = [
    { id: 'technician', name: 'Technicien installation', price: 80, description: 'Installation et reprise incluses' },
    { id: 'delivery', name: 'Livraison express', price: 80 },
    { id: 'emergency', name: 'Urgence 24/7', price: 0, description: 'Majoration +20%' },
  ];

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
      deposit: 500,
      addons: selectedAddons,
      images: [pack.image],
    };

    addToCart(cartItem);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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
              <img
                src={pack.image}
                alt={pack.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div>
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-500 mb-4">
              <a href="/packs" className="hover:text-[#F2431E] transition-colors">{language === 'fr' ? 'Packs' : 'Packs'}</a>
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
              <span>{language === 'fr' ? 'Caution: 500€' : 'Deposit: 500€'}</span>
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
                  {language === 'fr' ? 'Puissance' : 'Power'} {hasPrice ? `${basePrice}W RMS` : ''}
                </h3>
                <p className="text-gray-600 text-sm">
                  {language === 'fr' ? 'Son puissant et cristallin pour tous vos événements' : 'Powerful and crystal-clear sound for all your events'}
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
                  {language === 'fr' ? 'Idéale pour mariages, conférences, DJ sets' : 'Ideal for weddings, conferences, DJ sets'}
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
              <p className="text-lg font-bold text-black">{hasPrice ? `${basePrice}W` : '—'}</p>
                </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">📦</div>
              <p className="text-sm font-semibold text-gray-700">{language === 'fr' ? 'Poids' : 'Weight'}</p>
              <p className="text-lg font-bold text-black">28 kg</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">📐</div>
              <p className="text-sm font-semibold text-gray-700">{language === 'fr' ? 'Dimensions' : 'Dimensions'}</p>
              <p className="text-lg font-bold text-black">46x36x66cm</p>
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
            {recommendedProducts.map((product, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
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

      {/* Toast pour ajout au panier */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-fadeIn">
          <div className="flex items-center gap-4">
            <span>✅</span>
            <span className="font-semibold">{language === 'fr' ? 'Pack ajouté au panier' : 'Pack added to cart'}</span>
            <a
              href="/panier"
              className="ml-4 px-4 py-2 bg-[#F2431E] rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors"
            >
              {language === 'fr' ? 'Voir le panier' : 'View cart'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
