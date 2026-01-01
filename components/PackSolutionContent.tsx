'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getBasePack } from '@/lib/packs/basePacks';
import { detectZoneFromText, getDeliveryPrice } from '@/lib/zone-detection';

interface PackSolutionContentProps {
  packId: string;
  language: 'fr' | 'en';
}

// Mapping packId → packKey
const PACK_ID_TO_KEY: Record<string, 'conference' | 'soiree' | 'mariage'> = {
  '9': 'conference',
  '10': 'soiree',
  '11': 'mariage',
};

// Images par défaut pour chaque pack
const PACK_IMAGES: Record<string, string> = {
  '9': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
  '10': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
  '11': 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop',
};

// Contenu expert pour chaque pack
const EXPERT_CONTENT = {
  fr: {
    conference: {
      title: 'Pack Conférence',
      expertText: 'Nous vous conseillons ce pack pour les conférences, réunions et prises de parole jusqu\'à 30 personnes. Il garantit une voix claire, intelligible et professionnelle, sans réglages complexes.',
      capacity: 'Jusqu\'à 30 personnes',
      tier: 'S',
    },
    soiree: {
      title: 'Pack Soirée',
      expertText: 'Ce pack est idéal pour les soirées privées et événements festifs jusqu\'à 50 personnes. Il offre un son puissant et équilibré pour danser, sans saturation.',
      capacity: 'Jusqu\'à 50 personnes',
      tier: 'M',
    },
    mariage: {
      title: 'Pack Mariage',
      expertText: 'Ce pack est conçu pour accompagner chaque moment clé de votre mariage : discours clairs, ambiance élégante et son puissant pour la soirée dansante.',
      capacity: 'Jusqu\'à 100 personnes',
      tier: 'L',
    },
  },
  en: {
    conference: {
      title: 'Conference Pack',
      expertText: 'We recommend this pack for conferences, meetings and speeches up to 30 people. It guarantees clear, intelligible and professional voice, without complex settings.',
      capacity: 'Up to 30 people',
      tier: 'S',
    },
    soiree: {
      title: 'Party Pack',
      expertText: 'This pack is ideal for private parties and festive events up to 50 people. It offers powerful and balanced sound for dancing, without saturation.',
      capacity: 'Up to 50 people',
      tier: 'M',
    },
    mariage: {
      title: 'Wedding Pack',
      expertText: 'This pack is designed to accompany every key moment of your wedding: clear speeches, elegant atmosphere and powerful sound for the dance party.',
      capacity: 'Up to 100 people',
      tier: 'L',
    },
  },
};

interface AddressSuggestion {
  label: string;
  city: string;
  postcode: string;
}

export default function PackSolutionContent({ packId, language }: PackSolutionContentProps) {
  const router = useRouter();
  const packKey = PACK_ID_TO_KEY[packId];
  const pack = packKey ? getBasePack(packKey) : null;
  const expertContent = packKey ? EXPERT_CONTENT[language][packKey] : null;

  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<AddressSuggestion[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculer le prix selon la zone (mise à jour automatique)
  const basePrice = pack?.basePrice || 0;
  // Calculer le prix de livraison selon le code postal
  const zone = postalCode ? detectZoneFromText(postalCode) : null;
  const deliveryPrice = zone && zone !== 'paris' ? getDeliveryPrice(zone) : 0;
  const totalPrice = basePrice + deliveryPrice;
  const depositAmount = Math.round(totalPrice * 0.3);
  const balanceAmount = totalPrice - depositAmount;

  // Caution selon le pack
  const depositAmounts: Record<string, number> = {
    '9': 700, // Conference
    '10': 1100, // Soirée
    '11': 1600, // Mariage
  };
  const cautionAmount = depositAmounts[packId] || 0;

  // Recherche de ville avec auto-complétion code postal
  useEffect(() => {
    if (city.length < 2) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }

    const searchCities = async () => {
      try {
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(city)}&limit=5&type=municipality`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const suggestions: AddressSuggestion[] = data.features.map((feature: any) => ({
            label: feature.properties.label,
            city: feature.properties.city,
            postcode: feature.properties.postcode,
          }));
          setCitySuggestions(suggestions);
          setShowCitySuggestions(true);
        } else {
          setCitySuggestions([]);
          setShowCitySuggestions(false);
        }
      } catch (error) {
        console.error('Erreur recherche ville:', error);
      }
    };

    const timeoutId = setTimeout(searchCities, 300);
    return () => clearTimeout(timeoutId);
  }, [city]);

  const handleSelectCity = (suggestion: AddressSuggestion) => {
    setCity(suggestion.city);
    setPostalCode(suggestion.postcode);
    setShowCitySuggestions(false);
    setCitySuggestions([]);
  };

  // Fermer les suggestions quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowCitySuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePayDeposit = async () => {
    if (!pack || !city || !postalCode) return;

    setIsProcessing(true);

    try {
      // Rediriger vers la page de réservation avec les données pré-remplies
      const params = new URLSearchParams();
      params.set('city', city);
      params.set('postal_code', postalCode);
      
      // Rediriger vers /book/[pack_key] qui gère déjà le checkout direct
      router.push(`/book/${packKey}?${params.toString()}`);
    } catch (error) {
      console.error('Erreur:', error);
      setIsProcessing(false);
    }
  };

  const texts = {
    fr: {
      back: 'Retour à l\'accueil',
      deliveryIncluded: 'Livraison et installation incluses',
      total: 'Prix total',
      deposit: 'Acompte 30% à payer maintenant',
      balance: 'Solde à régler J-5',
      caution: 'La caution sera demandée à J-2',
      payDeposit: 'Payer l\'acompte (30%)',
      notSure: 'Vous n\'êtes pas sûr ? Parlez à un expert SoundRush',
      contactExpert: 'Contacter notre expert',
      city: 'Ville',
      postalCode: 'Code postal',
      cityPlaceholder: 'Commencez à taper une ville...',
      processing: 'Traitement en cours...',
      paris: 'Paris',
      petiteCouronne: 'Petite couronne',
      grandeCouronne: 'Grande couronne',
      deliverySupplement: 'Supplément livraison',
      specificNeeds: 'Vous avez des besoins spécifiques ?',
      callUs: 'Appelez-nous',
    },
    en: {
      back: 'Back to home',
      deliveryIncluded: 'Delivery and installation included',
      total: 'Total price',
      deposit: '30% deposit to pay now',
      balance: 'Balance due 1 day before',
      caution: 'Security deposit will be requested 2 days before',
      payDeposit: 'Pay deposit (30%)',
      notSure: 'Not sure? Talk to a SoundRush expert',
      contactExpert: 'Contact our expert',
      specificNeeds: 'Do you have specific needs?',
      callUs: 'Call us',
      city: 'City',
      postalCode: 'Postal code',
      cityPlaceholder: 'Start typing a city...',
      processing: 'Processing...',
      paris: 'Paris',
      petiteCouronne: 'Small crown',
      grandeCouronne: 'Large crown',
      deliverySupplement: 'Delivery supplement',
    },
  };

  const currentTexts = texts[language];

  if (!pack || !expertContent) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation retour */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#F2431E] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{currentTexts.back}</span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header avec palier */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {expertContent.title}
          </h1>
          <div className="inline-flex items-center gap-2 bg-[#F2431E]/10 text-[#F2431E] px-4 py-2 rounded-full font-semibold mb-4">
            <span>Pack {expertContent.tier}</span>
            <span>•</span>
            <span>{expertContent.capacity}</span>
          </div>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed mb-6">
            {expertContent.expertText}
          </p>
          
          {/* Matériel disponible */}
          <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="font-semibold text-gray-900 mb-3">
              {language === 'fr' ? 'Matériel disponible :' : 'Available equipment:'}
            </p>
            <ul className="text-left space-y-2 text-gray-700">
              {pack.defaultItems.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#F2431E] flex-shrink-0" />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Image pack */}
        <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8 bg-gray-100">
          <Image
            src={PACK_IMAGES[packId] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop'}
            alt={expertContent.title}
            fill
            className="object-cover"
          />
        </div>

        {/* Formulaire réservation */}
        <Card className="mb-6">
          <CardContent className="p-6 space-y-6">
            {/* Champs ville et code postal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {currentTexts.city}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setShowCitySuggestions(true);
                  }}
                  onFocus={() => {
                    if (city.length >= 2 && citySuggestions.length > 0) {
                      setShowCitySuggestions(true);
                    }
                  }}
                  placeholder={currentTexts.cityPlaceholder}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
                />
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {citySuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectCity(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{suggestion.city}</div>
                        <div className="text-sm text-gray-500">{suggestion.postcode}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {currentTexts.postalCode}
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="75011"
                  maxLength={5}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
                />
              </div>
            </div>

            {/* Bloc prix */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">{currentTexts.total}</span>
                <span className="text-3xl font-bold text-[#F2431E]">{totalPrice}€</span>
              </div>
              
              {/* Supplément livraison si applicable */}
              {postalCode && zone && zone !== 'paris' && deliveryPrice > 0 && (
                <div className="flex justify-between items-center text-sm text-gray-600 pt-2 border-t border-gray-200">
                  <span>
                    {currentTexts.deliverySupplement} – {
                      zone === 'petite' ? currentTexts.petiteCouronne : currentTexts.grandeCouronne
                    }
                  </span>
                  <span className="font-semibold">+{deliveryPrice}€</span>
                </div>
              )}
              
              {/* Message si Paris (livraison incluse) */}
              {postalCode && zone === 'paris' && (
                <div className="text-xs text-green-600 pt-2 border-t border-gray-200">
                  {language === 'fr' 
                    ? '✓ Livraison incluse (Paris)'
                    : '✓ Delivery included (Paris)'
                  }
                </div>
              )}

              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-600">{currentTexts.deposit}</span>
                <span className="font-semibold text-gray-900">{depositAmount}€</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{currentTexts.balance}</span>
                <span className="font-semibold text-gray-900">{balanceAmount}€</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-900">{cautionAmount}€</span> – {currentTexts.caution}
                </p>
              </div>
            </div>

            {/* CTA Principal */}
            <Button
              onClick={handlePayDeposit}
              disabled={!city || !postalCode || isProcessing}
              className="w-full bg-[#F2431E] text-white hover:bg-[#E63A1A] py-6 text-lg font-bold"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {currentTexts.processing}
                </>
              ) : (
                currentTexts.payDeposit
              )}
            </Button>

            {/* CTA Secondaire */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">{currentTexts.notSure}</p>
              <Button
                variant="outline"
                onClick={() => {
                  // Ouvrir le chat ou rediriger vers contact
                  window.dispatchEvent(new CustomEvent('openChatWithPack', { 
                    detail: { packKey } 
                  }));
                }}
                className="border-[#F2431E] text-[#F2431E] hover:bg-[#F2431E] hover:text-white"
              >
                {currentTexts.contactExpert}
              </Button>
            </div>

            {/* Section besoins spécifiques */}
            <div className="text-center pt-4 border-t border-gray-200 mt-4">
              <p className="text-sm text-gray-600 mb-3">{currentTexts.specificNeeds}</p>
              <Button
                variant="outline"
                onClick={() => window.location.href = 'tel:+33744782754'}
                className="border-[#F2431E] text-[#F2431E] hover:bg-[#F2431E] hover:text-white"
              >
                {currentTexts.callUs}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
