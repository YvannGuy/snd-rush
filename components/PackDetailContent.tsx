'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { AvailabilityResponse, CalendarDisabledRange, ProductAddon, CartItem, Product } from '@/types/db';
import { supabase } from '@/lib/supabase';

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
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [quantity] = useState(1);
  const [rentalDays, setRentalDays] = useState(1);
  const [selectedAddons] = useState<ProductAddon[]>([]);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_disabledRanges, setDisabledRanges] = useState<CalendarDisabledRange[]>([]); // Préfixé avec _ pour indiquer qu'il n'est pas utilisé pour l'instant
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

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

    if (pack?.id) {
      loadDisabledRanges();
    }
  }, [pack?.id]); // Utiliser pack.id au lieu de pack pour éviter les re-renders infinis

  // Vérifier la disponibilité quand les dates ou heures changent
  useEffect(() => {
    async function checkAvailability() {
      if (!pack?.id || !startDate || !endDate || !startTime || !endTime) {
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
            startTime: startTime || null,
            endTime: endTime || null,
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
  }, [pack?.id, startDate, endDate, startTime, endTime]);

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

  // Charger les produits recommandés depuis Supabase selon le pack
  useEffect(() => {
    async function loadRecommendedProducts() {
      if (!pack || !supabase) return;

      try {
        // Définir les catégories recommandées selon le pack
        let targetCategories: string[] = [];
        
        if (pack.id === 1) {
          // Pack S Petit : micros, câbles, accessoires
          targetCategories = ['micros', 'accessoires'];
        } else if (pack.id === 2) {
          // Pack M Confort : micros, câbles, accessoires, peut-être lumières
          targetCategories = ['micros', 'accessoires', 'lumieres'];
        } else if (pack.id === 3) {
          // Pack L Grand : micros, câbles, accessoires, lumières
          targetCategories = ['micros', 'accessoires', 'lumieres'];
        } else if (pack.id === 4) {
          // Pack XL : tout ce qui est professionnel
          targetCategories = ['micros', 'accessoires', 'lumieres', 'sonorisation'];
        } else {
          // Par défaut
          targetCategories = ['micros', 'accessoires'];
        }

        // Charger les produits depuis Supabase
        const { data: allProducts, error } = await supabase
          .from('products')
          .select('*')
          .in('category', targetCategories)
          .limit(20);

        // Exclure Pioneer XDJ des produits recommandés
        const filteredByPioneer = allProducts?.filter(p => 
          !p.name.toLowerCase().includes('pioneer') && !p.name.toLowerCase().includes('xdj')
        ) || [];

        if (error) {
          console.error('Erreur chargement produits recommandés:', error);
          return;
        }

        if (filteredByPioneer && filteredByPioneer.length > 0) {
          // Trier et sélectionner les produits les plus pertinents selon le pack
          let filtered = filteredByPioneer;

          if (pack.id === 1 || pack.id === 2) {
            // Pour packs S et M : prioriser micros, puis câbles XLR, puis autres accessoires
            filtered = filteredByPioneer.sort((a, b) => {
              const aIsMicro = a.category === 'micros' ? 3 : 0;
              const bIsMicro = b.category === 'micros' ? 3 : 0;
              const aIsCableXlr = a.name.toLowerCase().includes('xlr') && a.category === 'accessoires' ? 2 : 0;
              const bIsCableXlr = b.name.toLowerCase().includes('xlr') && b.category === 'accessoires' ? 2 : 0;
              const aIsAccessoire = a.category === 'accessoires' ? 1 : 0;
              const bIsAccessoire = b.category === 'accessoires' ? 1 : 0;
              
              const aScore = aIsMicro + aIsCableXlr + aIsAccessoire;
              const bScore = bIsMicro + bIsCableXlr + bIsAccessoire;
              return bScore - aScore;
            });
          } else if (pack.id === 3) {
            // Pour pack L : prioriser micros, lumières, puis câbles
            filtered = filteredByPioneer.sort((a, b) => {
              const aIsMicro = a.category === 'micros' ? 3 : 0;
              const bIsMicro = b.category === 'micros' ? 3 : 0;
              const aIsLumiere = a.category === 'lumieres' ? 2 : 0;
              const bIsLumiere = b.category === 'lumieres' ? 2 : 0;
              const aIsCable = a.category === 'accessoires' ? 1 : 0;
              const bIsCable = b.category === 'accessoires' ? 1 : 0;
              
              const aScore = aIsMicro + aIsLumiere + aIsCable;
              const bScore = bIsMicro + bIsLumiere + bIsCable;
              return bScore - aScore;
            });
          } else if (pack.id === 4) {
            // Pour pack XL : prioriser tout ce qui est professionnel
            filtered = filteredByPioneer.sort((a, b) => {
              const aIsMicro = a.category === 'micros' ? 3 : 0;
              const bIsMicro = b.category === 'micros' ? 3 : 0;
              const aIsLumiere = a.category === 'lumieres' ? 2 : 0;
              const bIsLumiere = b.category === 'lumieres' ? 2 : 0;
              const aIsAccessoire = a.category === 'accessoires' ? 1 : 0;
              const bIsAccessoire = b.category === 'accessoires' ? 1 : 0;
              
              const aScore = aIsMicro + aIsLumiere + aIsAccessoire;
              const bScore = bIsMicro + bIsLumiere + bIsAccessoire;
              return bScore - aScore;
            });
          }

          // Prendre les 4 premiers
          setRecommendedProducts(filtered.slice(0, 4));
        }
      } catch (err) {
        console.error('Erreur chargement produits recommandés:', err);
      }
    }

    loadRecommendedProducts();
  }, [pack]);

  // Sticky bar visibility


  const handleAddToCart = () => {
    if (!pack || !startDate || !endDate) {
      return;
    }

    if (!startTime || !endTime) {
      alert(language === 'fr' 
        ? 'Veuillez sélectionner les heures de début et de fin pour éviter les doublons de réservation.' 
        : 'Please select start and end times to prevent duplicate reservations.');
      return;
    }

    if (availability !== null && !availability.available) {
      alert(language === 'fr' 
        ? 'Ce pack n\'est pas disponible sur ces dates et heures. Veuillez choisir d\'autres dates ou heures.' 
        : 'This pack is not available for these dates and times. Please choose other dates or times.');
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
      startTime: startTime || undefined,
      endTime: endTime || undefined,
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
      addToQuote: 'Utiliser l\'assistant SoundRush Paris',
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

  return (
    <div className="pt-[112px] bg-white">
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
            {(() => {
              // Fonction pour générer les tags selon le pack
              const getPackTags = (packId: number): Array<{ text: string; color: string }> => {
                const tags: Array<{ text: string; color: string }> = [];
                
                if (packId === 1) {
                  // Pack S Petit
                  tags.push({ text: language === 'fr' ? 'Compact' : 'Compact', color: 'bg-blue-100 text-blue-800' });
                  tags.push({ text: language === 'fr' ? '30-70 personnes' : '30-70 people', color: 'bg-green-100 text-green-800' });
                  tags.push({ text: language === 'fr' ? 'Clé en main' : 'Turnkey', color: 'bg-purple-100 text-purple-800' });
                } else if (packId === 2) {
                  // Pack M Confort
                  tags.push({ text: language === 'fr' ? 'Confort' : 'Comfort', color: 'bg-blue-100 text-blue-800' });
                  tags.push({ text: language === 'fr' ? '70-150 personnes' : '70-150 people', color: 'bg-green-100 text-green-800' });
                  tags.push({ text: language === 'fr' ? 'Professionnel' : 'Professional', color: 'bg-purple-100 text-purple-800' });
                } else if (packId === 3) {
                  // Pack L Grand
                  tags.push({ text: language === 'fr' ? 'Puissant' : 'Powerful', color: 'bg-green-100 text-green-800' });
                  tags.push({ text: language === 'fr' ? '150-250 personnes' : '150-250 people', color: 'bg-blue-100 text-blue-800' });
                  tags.push({ text: language === 'fr' ? 'Caisson inclus' : 'Subwoofer included', color: 'bg-purple-100 text-purple-800' });
                } else if (packId === 4) {
                  // Pack XL Maxi
                  tags.push({ text: language === 'fr' ? 'Sur mesure' : 'Custom', color: 'bg-purple-100 text-purple-800' });
                  tags.push({ text: language === 'fr' ? '300+ personnes' : '300+ people', color: 'bg-green-100 text-green-800' });
                  tags.push({ text: language === 'fr' ? 'Technicien inclus' : 'Technician included', color: 'bg-blue-100 text-blue-800' });
                }
                
                return tags;
              };
              
              const tags = getPackTags(pack.id);
              
              return tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map((tag, index) => (
                    <span key={index} className={`px-3 py-1 rounded-full text-xs font-semibold ${tag.color}`}>
                      {tag.text}
              </span>
                  ))}
      </div>
              ) : null;
            })()}

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

            {/* Heures - Requises pour éviter les doublons */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {language === 'fr' ? 'Heures de location' : 'Rental times'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">
                    {language === 'fr' ? 'Heure de début *' : 'Start time *'}
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">
                    {language === 'fr' ? 'Heure de fin *' : 'End time *'}
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Disponibilité */}
            {startDate && endDate && startTime && endTime && (
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
              disabled={checkingAvailability || (availability !== null && !availability.available) || !startDate || !endDate || !startTime || !endTime}
              className={`
                w-full py-4 rounded-lg font-bold text-base transition-all shadow-lg mb-3 flex items-center justify-center gap-2
                ${!checkingAvailability && startDate && endDate && startTime && endTime && (availability === null || availability.available)
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

            {/* Carte Installation */}
            {(() => {
              const installationPrice = pack.id === 1 ? 60 : pack.id === 2 ? 80 : pack.id === 3 ? 120 : null;
              return (
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900">{language === 'fr' ? 'Installation' : 'Installation'}</h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    {language === 'fr' 
                      ? 'Installation par technicien professionnel'
                      : 'Installation by professional technician'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      {installationPrice !== null 
                        ? `${installationPrice}€`
                        : (language === 'fr' ? 'Sur devis' : 'On quote')
                      }
                    </span>
                    <span className="text-xs text-gray-500">
                      {language === 'fr' ? 'Optionnel' : 'Optional'}
                    </span>
                  </div>
                </div>
              );
            })()}

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
                  {pack.id === 1 && (language === 'fr' ? 'Enceinte Mac Mah AS 115 : 500W RMS' : 'Mac Mah AS 115 Speaker: 500W RMS')}
                  {pack.id === 2 && (language === 'fr' ? '2× Enceintes Mac Mah AS 115 : 2× 500W RMS (1000W total)' : '2× Mac Mah AS 115 Speakers: 2× 500W RMS (1000W total)')}
                  {pack.id === 3 && (language === 'fr' ? '2× Enceintes FBT X-Lite 115A : 2× (1200W LF + 300W HF). 1× Caisson de basse : 1200W' : '2× FBT X-Lite 115A Speakers: 2× (1200W LF + 300W HF). 1× Subwoofer: 1200W')}
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
                {pack.id === 1 && '500W RMS'}
                {pack.id === 2 && '2× 500W RMS'}
                {pack.id === 3 && (language === 'fr' ? 'Enceintes: 2× (1200W LF + 300W HF). Caisson: 1200W' : 'Speakers: 2× (1200W LF + 300W HF). Sub: 1200W')}
                {pack.id === 4 && '—'}
              </p>
                </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">📦</div>
              <p className="text-sm font-semibold text-gray-700">{language === 'fr' ? 'Poids' : 'Weight'}</p>
              <p className="text-lg font-bold text-black">
                {pack.id === 1 && (language === 'fr' ? 'Enceinte: 15,2 kg + Console' : 'Speaker: 15.2 kg + Console')}
                {pack.id === 2 && (language === 'fr' ? 'Enceintes: 2×15,2 kg + Console' : 'Speakers: 2×15.2 kg + Console')}
                {pack.id === 3 && (language === 'fr' ? 'Enceintes: 2×24 kg, Caisson: ~38 kg' : 'Speakers: 2×24 kg, Sub: ~38 kg')}
                {pack.id === 4 && '—'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">📐</div>
              <p className="text-sm font-semibold text-gray-700">{language === 'fr' ? 'Dimensions' : 'Dimensions'}</p>
              <p className="text-lg font-bold text-black">
                {pack.id === 1 && (language === 'fr' ? 'Enceinte: 15" + Console compacte' : 'Speaker: 15" + Compact console')}
                {pack.id === 2 && (language === 'fr' ? 'Enceintes: 2×15" + Console HPA Promix 8' : 'Speakers: 2×15" + HPA Promix 8 console')}
                {pack.id === 3 && (language === 'fr' ? 'Enceintes: 2×15", Caisson: 18", Console: HPA Promix 16' : 'Speakers: 2×15", Sub: 18", Console: HPA Promix 16')}
                {pack.id === 4 && '—'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">📶</div>
              <p className="text-sm font-semibold text-gray-700">{language === 'fr' ? 'Bluetooth' : 'Bluetooth'}</p>
              <p className="text-lg font-bold text-black">
                {pack.id === 1 && (language === 'fr' ? 'Oui (enceinte)' : 'Yes (speaker)')}
                {pack.id === 2 && (language === 'fr' ? 'Oui (enceintes + console)' : 'Yes (speakers + console)')}
                {pack.id === 3 && (language === 'fr' ? 'Oui (console)' : 'Yes (console)')}
                {pack.id === 4 && (language === 'fr' ? 'Selon configuration' : 'According to config')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vous pourriez en avoir besoin */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-black mb-8">{currentTexts.youMightNeed}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedProducts.length > 0 ? (
              recommendedProducts.map((product) => {
                const productImage = product.images && product.images.length > 0 
                  ? product.images[0] 
                  : '/placeholder-product.png';
                const productPrice = product.daily_price_ttc 
                  ? `${product.daily_price_ttc}€/jour`
                  : language === 'fr' ? 'Sur devis' : 'On quote';

                const handleAddProduct = () => {
                  const cartItem: CartItem = {
                    productId: product.id,
                    productName: product.name,
                    productSlug: product.slug || product.id,
                    quantity: 1,
                    rentalDays: rentalDays || 1,
                    startDate: startDate || new Date().toISOString().split('T')[0],
                    endDate: endDate || new Date().toISOString().split('T')[0],
                    dailyPrice: product.daily_price_ttc || 0,
                    deposit: product.deposit || 0,
                    addons: [],
                    images: product.images || [],
                  };
                  addToCart(cartItem);
                  
                  // Afficher un message de confirmation
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('productAddedToCart'));
                  }
                };

                return (
                  <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
                    <Link href={`/catalogue/${product.slug || product.id}`}>
                      <div className="relative h-48 bg-gray-100 cursor-pointer flex-shrink-0">
                        <Image
                          src={productImage}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Link>
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="h-[3rem] mb-2 flex items-start">
                        <Link href={`/catalogue/${product.slug || product.id}`}>
                          <h3 className="font-bold text-black hover:text-[#F2431E] transition-colors cursor-pointer line-clamp-2">
                            {product.name}
                          </h3>
                        </Link>
                      </div>
                      <div className="h-[2rem] mb-4 flex items-end">
                        <p className="text-lg font-bold text-[#F2431E]">{productPrice}</p>
                      </div>
                      <div className="mt-auto">
                        <button 
                          onClick={handleAddProduct}
                          className="w-full bg-[#F2431E] text-white py-2 rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors"
                        >
                          {language === 'fr' ? 'Ajouter au panier' : 'Add to cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center text-gray-500 py-8">
                {language === 'fr' ? 'Chargement des produits recommandés...' : 'Loading recommended products...'}
              </div>
            )}
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
