'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getBasePack } from '@/lib/packs/basePacks';
import { calculatePackTier, getPackTierDescription, PackTierAdjustment } from '@/lib/pack-tier-logic';
import { detectZoneFromText, getDeliveryPrice } from '@/lib/zone-detection';
import { getInstallationPrice } from '@/lib/pack-options';
import { calculatePickupJPlus1Price } from '@/lib/time-rules';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import ReservationWizard from '@/components/ReservationWizard';
import Link from 'next/link';

type PackKey = 'conference' | 'soiree' | 'mariage';

export default function BookPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const packKey = params.pack_key as PackKey;
  
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('23:00');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [deliveryInstallation, setDeliveryInstallation] = useState(true);
  const [peopleCount, setPeopleCount] = useState<number | null>(null);
  const [citySuggestions, setCitySuggestions] = useState<Array<{ city: string; postcode: string }>>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [additionalMics, setAdditionalMics] = useState<Array<{ type: 'filaire' | 'sans-fil'; price: number }>>([]);
  
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tierAdjustment, setTierAdjustment] = useState<PackTierAdjustment | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string>('');

  const pack = packKey ? getBasePack(packKey) : null;

  // Récupérer l'email de l'utilisateur connecté (si disponible)
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setCustomerEmail(user.email);
        }
      } catch (error) {
        // L'utilisateur n'est pas connecté, l'email sera récupéré depuis Stripe
        console.log('Utilisateur non connecté, email sera récupéré depuis Stripe');
      }
    };
    getUserEmail();
  }, []);

  // Lire les query params du wizard et de PackSolutionContent
  useEffect(() => {
    const people = searchParams.get('people');
    const ambiance = searchParams.get('ambiance');
    const location = searchParams.get('location');
    const cityParam = searchParams.get('city');
    const postalCodeParam = searchParams.get('postal_code');
    
    if (people) {
      const count = parseInt(people);
      if (!isNaN(count) && count > 0) {
        setPeopleCount(count);
      }
    }
    if (cityParam) setCity(cityParam);
    if (postalCodeParam) setPostalCode(postalCodeParam);
  }, [searchParams]);

  // Auto-complétion ville avec code postal
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
          const suggestions = data.features.map((feature: any) => ({
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

  const handleSelectCity = (suggestion: { city: string; postcode: string }) => {
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

  // Fonction pour vérifier la disponibilité
  const checkAvailability = async (startDate: string, startTime: string, endDate: string, endTime: string) => {
    if (!startDate || !endDate || !startTime || !endTime || !packKey) {
      setAvailabilityStatus('idle');
      return;
    }

    setAvailabilityStatus('checking');
    setAvailabilityError(null);

    try {
      const startISO = `${startDate}T${startTime}:00`;
      const endISO = `${endDate}T${endTime}:00`;

      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: packKey,
          startDate: startISO.split('T')[0],
          endDate: endISO.split('T')[0],
          startTime: startTime,
          endTime: endTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAvailabilityStatus('unavailable');
        setAvailabilityError(data.error || 'Ce créneau n\'est pas disponible');
        return;
      }

      if (data.available && data.remaining > 0) {
        setAvailabilityStatus('available');
      } else {
        setAvailabilityStatus('unavailable');
        setAvailabilityError('Ce créneau n\'est pas disponible');
      }
    } catch (error) {
      console.error('Erreur vérification disponibilité:', error);
      setAvailabilityStatus('unavailable');
      setAvailabilityError('Erreur lors de la vérification');
    }
  };

  // Calculer le tier ajusté quand le pack ou le nombre de personnes change
  useEffect(() => {
    if (pack && peopleCount) {
      const adjustment = calculatePackTier(pack, peopleCount);
      setTierAdjustment(adjustment);
    } else if (pack) {
      // Pas de nombre de personnes : Pack S par défaut pour tous
      setTierAdjustment({
        adjustedItems: pack.defaultItems,
        adjustedPrice: pack.basePrice,
        tier: 'S',
        capacity: 'Jusqu\'à 50 personnes',
      });
    }
  }, [pack, peopleCount, packKey]);

  // Vérifier la disponibilité quand on arrive à l'étape 5 du wizard
  useEffect(() => {
    if (startDate && endDate && startTime && endTime && packKey) {
      checkAvailability(startDate, startTime, endDate, endTime);
    }
  }, [startDate, endDate, startTime, endTime, packKey]);

  const texts = {
    fr: {
      title: 'Réserver votre solution en 2min',
      subtitle: 'Remplissez le formulaire ci-dessous pour vérifier la disponibilité et réserver',
      startDate: 'Date de début',
      startTime: 'Heure de début',
      endDate: 'Date de fin',
      endTime: 'Heure de fin',
      city: 'Ville',
      postalCode: 'Code postal',
      deliveryInstallation: 'Livraison et installation incluses',
      checkAvailability: 'Vérifier la disponibilité',
      checking: 'Vérification en cours...',
      available: 'Disponible !',
      unavailable: 'Indisponible',
      unavailableMessage: 'Ce créneau n\'est pas disponible. Veuillez choisir d\'autres dates.',
      payDeposit: 'Payer l\'acompte (30%)',
      processing: 'Traitement en cours...',
      total: 'Total',
      deposit: 'Acompte 30%',
      balance: 'Solde à régler J-5',
      caution: 'La caution sera demandée J-2',
      depositNote: 'La caution sera demandée J-2',
      specificNeeds: 'Vous avez des besoins spécifiques ?',
      callUs: 'Appelez-nous',
      addMicro: 'Ajouter un micro',
      microFilaire: 'Micro filaire (+10€)',
      microSansFil: 'Micro sans fil (+20€)',
      additionalMics: 'Micros supplémentaires',
      remove: 'Retirer',
      deliverySupplement: 'Supplément livraison',
      petiteCouronne: 'Petite couronne',
      grandeCouronne: 'Grande couronne',
    },
    en: {
      title: 'Book your solution in 2min',
      subtitle: 'Fill out the form below to check availability and book',
      startDate: 'Start date',
      startTime: 'Start time',
      endDate: 'End date',
      endTime: 'End time',
      city: 'City',
      postalCode: 'Postal code',
      deliveryInstallation: 'Delivery and installation included',
      checkAvailability: 'Check availability',
      checking: 'Checking...',
      available: 'Available!',
      unavailable: 'Unavailable',
      unavailableMessage: 'This time slot is not available. Please choose other dates.',
      payDeposit: 'Pay deposit (30%)',
      processing: 'Processing...',
      total: 'Total',
      deposit: '30% deposit',
      balance: 'Balance due 5 days before',
      caution: 'Security deposit will be requested 2 days before',
      depositNote: 'Security deposit will be requested 2 days before',
      specificNeeds: 'Do you have specific needs?',
      callUs: 'Call us',
      addMicro: 'Add a microphone',
      microFilaire: 'Wired microphone (+10€)',
      microSansFil: 'Wireless microphone (+20€)',
      additionalMics: 'Additional microphones',
      remove: 'Remove',
      deliverySupplement: 'Delivery supplement',
      petiteCouronne: 'Small crown',
      grandeCouronne: 'Large crown',
    },
  };

  const currentTexts = texts[language];

  const handleWizardComplete = async (wizardData: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    city: string;
    postalCode: string;
    peopleCount: number | null;
    additionalMics: Array<{ type: 'filaire' | 'sans-fil'; price: number }>;
    customerEmail: string;
  }) => {
    // Mettre à jour les états avec les données du wizard
    setStartDate(wizardData.startDate);
    setStartTime(wizardData.startTime);
    setEndDate(wizardData.endDate);
    setEndTime(wizardData.endTime);
    setCity(wizardData.city);
    setPostalCode(wizardData.postalCode);
    setPeopleCount(wizardData.peopleCount);
    setAdditionalMics(wizardData.additionalMics);
    setCustomerEmail(wizardData.customerEmail);

    // Vérifier la disponibilité avant de procéder au paiement
    await checkAvailability(wizardData.startDate, wizardData.startTime, wizardData.endDate, wizardData.endTime);
    
    // Attendre un peu pour que le statut se mette à jour, puis appeler handlePayDeposit avec toutes les données du wizard
    // IMPORTANT: Passer directement wizardData.customerEmail pour éviter les problèmes de timing avec le state
    setTimeout(async () => {
      const currentStatus = availabilityStatus;
      if (currentStatus === 'available') {
        console.log('[BOOK] Appel handlePayDeposit avec email:', wizardData.customerEmail);
        await handlePayDeposit({
          startDate: wizardData.startDate,
          startTime: wizardData.startTime,
          endDate: wizardData.endDate,
          endTime: wizardData.endTime,
          city: wizardData.city,
          postalCode: wizardData.postalCode,
          peopleCount: wizardData.peopleCount,
          additionalMics: wizardData.additionalMics,
          customerEmail: wizardData.customerEmail, // Utiliser directement depuis wizardData
        });
      }
    }, 500);
  };

  const handlePayDeposit = async (wizardData?: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    city: string;
    postalCode: string;
    peopleCount: number | null;
    additionalMics: Array<{ type: 'filaire' | 'sans-fil'; price: number }>;
    customerEmail?: string;
  }) => {
    if (!pack || availabilityStatus !== 'available') return;

    setIsProcessing(true);

    try {
      const dataToUse = wizardData || {
        startDate,
        startTime,
        endDate,
        endTime,
        city,
        postalCode,
        peopleCount,
        additionalMics,
      };

      // Construire les dates ISO complètes
      const startISO = `${dataToUse.startDate}T${dataToUse.startTime}:00`;
      const endISO = `${dataToUse.endDate}T${dataToUse.endTime}:00`;

      // Validation des dates avant l'envoi
      const startAt = new Date(startISO);
      const endAt = new Date(endISO);

      if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
        throw new Error(language === 'fr' ? 'Dates invalides' : 'Invalid dates');
      }

      if (endAt <= startAt) {
        throw new Error(
          language === 'fr' 
            ? 'La date et heure de fin doivent être après la date et heure de début'
            : 'End date and time must be after start date and time'
        );
      }

      // Prix du pack + micros supplémentaires + livraison + options automatiques
      const basePackPrice = tierAdjustment?.adjustedPrice || pack.basePrice;
      const additionalMicsPrice = dataToUse.additionalMics.reduce((sum, mic) => sum + mic.price, 0);
      const zone = dataToUse.postalCode ? detectZoneFromText(dataToUse.postalCode) : null;
      const deliveryPrice = zone && zone !== 'paris' ? getDeliveryPrice(zone) : 0;
      const tier = tierAdjustment?.tier || 'S';
      // Installation automatique pour M et L
      const installationPrice = tier !== 'S' ? getInstallationPrice(tier) : 0;
      // Récupération J+1 automatique selon l'heure de fin et les dates
      const pickupJPlus1Price = dataToUse.endTime && zone ? calculatePickupJPlus1Price(dataToUse.endTime, zone, dataToUse.startDate, dataToUse.endDate) : 0;
      const finalPrice = basePackPrice + additionalMicsPrice + deliveryPrice + installationPrice + pickupJPlus1Price;

      // Calculer les montants
      const depositAmount = Math.round(finalPrice * 0.3); // 30% d'acompte
      const balanceAmount = finalPrice - depositAmount; // Solde restant

      // Récupérer l'email client (depuis le wizard, l'auth ou valeur temporaire)
      // Note: L'email sera mis à jour depuis Stripe lors du paiement si non fourni
      // Priorité : wizardData.customerEmail > state customerEmail > user email
      let emailToUse = wizardData?.customerEmail || customerEmail;
      
      // Si pas d'email dans wizardData ni dans le state, essayer de récupérer depuis l'auth
      if (!emailToUse || emailToUse.trim() === '' || emailToUse === 'pending@stripe.com') {
        const { data: { user } } = await supabase.auth.getUser();
        emailToUse = user?.email || null;
      }
      
      // Si toujours pas d'email valide, c'est une erreur car le champ est obligatoire dans le wizard
      if (!emailToUse || emailToUse.trim() === '' || emailToUse === 'pending@stripe.com') {
        console.error('[BOOK] Email manquant:', { 
          wizardDataEmail: wizardData?.customerEmail, 
          stateEmail: customerEmail,
          emailToUse 
        });
        throw new Error(language === 'fr' 
          ? 'Email requis pour finaliser la réservation. Veuillez remplir le champ email dans le récapitulatif.'
          : 'Email required to complete reservation. Please fill in the email field in the summary.'
        );
      }
      
      console.log('[BOOK] Email utilisé pour Stripe:', emailToUse);

      // Créer le hold et ouvrir Stripe Checkout (appel atomique côté serveur)
      // Le hold n'est créé QUE maintenant, pas avant le clic sur "Payer l'acompte"
      const response = await fetch('/api/book/direct-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pack_key: packKey,
          start_at: new Date(startISO).toISOString(),
          end_at: new Date(endISO).toISOString(),
          customer_email: emailToUse,
          contact_phone: null, // TODO: Ajouter si disponible dans le wizard
          contact_email: emailToUse,
          price_total: finalPrice,
          deposit_amount: depositAmount,
          balance_amount: balanceAmount,
          city: dataToUse.city || null,
          postal_code: dataToUse.postalCode || null,
          final_items: displayItems as any, // Convertir en format attendu par PostgreSQL
          source: 'direct_solution',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Gérer les erreurs spécifiques
        if (response.status === 409) {
          // Conflit : créneau déjà réservé ou en cours de réservation
          const errorMessage = data.reason === 'SLOT_HELD' 
            ? (language === 'fr' 
                ? 'Ce créneau est temporairement indisponible (en cours de réservation). Veuillez réessayer dans quelques instants.'
                : 'This time slot is temporarily unavailable (being reserved). Please try again in a few moments.')
            : (language === 'fr'
                ? 'Ce créneau est déjà réservé. Veuillez choisir une autre date.'
                : 'This time slot is already booked. Please choose another date.');
          throw new Error(errorMessage);
        }
        
        // Afficher le message d'erreur détaillé si disponible
        const errorMessage = data.error || data.details || (language === 'fr' ? 'Erreur lors de la création de la réservation' : 'Error creating reservation');
        console.error('[BOOK] Erreur API:', {
          status: response.status,
          error: data.error,
          details: data.details,
          fullData: data
        });
        throw new Error(errorMessage);
      }

      // Rediriger vers Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('URL de checkout non reçue');
      }
    } catch (error) {
      console.error('[BOOK] Erreur paiement:', error);
      if (error instanceof Error) {
        console.error('[BOOK] Message:', error.message);
        console.error('[BOOK] Stack:', error.stack);
      }
      setAvailabilityError(error instanceof Error ? error.message : (language === 'fr' ? 'Erreur lors du traitement' : 'Processing error'));
      setIsProcessing(false);
    }
  };

  if (!pack) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header language={language} onLanguageChange={setLanguage} />
        <main className="pt-[112px] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {language === 'fr' ? 'Solution non trouvée' : 'Solution not found'}
            </h1>
            <Button onClick={() => router.push('/')}>
              {language === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
            </Button>
          </div>
        </main>
        <Footer language={language} />
      </div>
    );
  }

  // Prix du pack ajusté selon tier
  const basePackPrice = tierAdjustment?.adjustedPrice || pack.basePrice;
  // Ajouter le prix des micros supplémentaires
  const additionalMicsPrice = additionalMics.reduce((sum, mic) => sum + mic.price, 0);
  // Calculer le prix de livraison selon le code postal
  const zone = postalCode ? detectZoneFromText(postalCode) : null;
  const deliveryPrice = zone && zone !== 'paris' ? getDeliveryPrice(zone) : 0;
  // Calculer les options automatiques
  const tier = tierAdjustment?.tier || 'S';
  // Installation automatique pour M et L
  const installationPrice = tier !== 'S' ? getInstallationPrice(tier) : 0;
  // Récupération J+1 automatique selon l'heure de fin
  const pickupJPlus1Price = endTime && zone ? calculatePickupJPlus1Price(endTime, zone, startDate, endDate) : 0;
  const totalPrice = basePackPrice + additionalMicsPrice + deliveryPrice + installationPrice + pickupJPlus1Price;
  const depositAmount = Math.round(totalPrice * 0.3);
  const balanceAmount = totalPrice - depositAmount;
  const displayItems = tierAdjustment?.adjustedItems || pack.defaultItems;
  
  // Montant de la caution selon le pack et le tier
  const baseCautionAmounts: Record<PackKey, number> = {
    conference: 700,
    soiree: 1100,
    mariage: 1600,
  };
  const tierMultipliers = { S: 1, M: 1.2, L: 1.5 }; // +20% pour M, +50% pour L
  const baseCaution = packKey ? baseCautionAmounts[packKey] || 0 : 0;
  const cautionAmount = Math.round(baseCaution * tierMultipliers[tier]);
  
  const handleAddMicro = (type: 'filaire' | 'sans-fil') => {
    const price = type === 'filaire' ? 10 : 20;
    setAdditionalMics([...additionalMics, { type, price }]);
  };
  
  const handleRemoveMicro = (index: number) => {
    setAdditionalMics(additionalMics.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <main className="pt-[112px] pb-20">
        <div className="max-w-2xl mx-auto px-6 py-12">
          {/* Bouton retour à l'accueil */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-[#F2431E] transition-colors group"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">
                {language === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
              </span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {currentTexts.title}
            </h1>
            <p className="text-lg text-gray-600">
              {pack.title}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {currentTexts.subtitle}
            </p>
          </div>

          {/* Reservation Wizard */}
          <ReservationWizard
            packKey={packKey}
            packTitle={pack.title}
            pack={pack}
            tierAdjustment={tierAdjustment}
            displayItems={displayItems}
            language={language}
            onComplete={handleWizardComplete}
            availabilityStatus={availabilityStatus}
            availabilityError={availabilityError}
            isProcessing={isProcessing}
            onStep5Reached={(data) => {
              setStartDate(data.startDate);
              setStartTime(data.startTime);
              setEndDate(data.endDate);
              setEndTime(data.endTime);
            }}
            onPeopleCountChange={(count) => {
              setPeopleCount(count);
            }}
          />

          {/* Old Form - Hidden, keeping for reference */}
          <Card className="hidden">
            <CardHeader>
              <CardTitle>{language === 'fr' ? 'Informations de réservation' : 'Booking information'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {currentTexts.startDate}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (e.target.value && endDate && e.target.value > endDate) {
                        setEndDate('');
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {currentTexts.startTime}
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {currentTexts.endDate}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {currentTexts.endTime}
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Nombre de personnes (optionnel, pour ajuster le pack) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {language === 'fr' ? 'Nombre de personnes (optionnel)' : 'Number of people (optional)'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={peopleCount || ''}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || null;
                    setPeopleCount(count);
                  }}
                  placeholder={language === 'fr' ? 'Ex: 50' : 'Ex: 50'}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
                />
                {peopleCount && tierAdjustment && (
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'fr' 
                      ? `Pack ajusté automatiquement pour ${peopleCount} personnes (Pack ${tierAdjustment.tier})`
                      : `Pack automatically adjusted for ${peopleCount} people (Pack ${tierAdjustment.tier})`
                    }
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {currentTexts.city}
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={language === 'fr' ? 'Commencez à taper une ville...' : 'Start typing a city...'}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
                  />
                  {showCitySuggestions && citySuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {citySuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectCity(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
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

              {/* Micros supplémentaires (uniquement pour Pack M et L) */}
              {tierAdjustment && (tierAdjustment.tier === 'M' || tierAdjustment.tier === 'L') && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {currentTexts.addMicro}
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleAddMicro('filaire')}
                      className="flex-1 border-gray-300 hover:bg-gray-50"
                    >
                      {currentTexts.microFilaire}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleAddMicro('sans-fil')}
                      className="flex-1 border-gray-300 hover:bg-gray-50"
                    >
                      {currentTexts.microSansFil}
                    </Button>
                  </div>
                  
                  {additionalMics.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        {currentTexts.additionalMics} ({additionalMicsPrice}€)
                      </p>
                      <div className="space-y-2">
                        {additionalMics.map((mic, index) => (
                          <div key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                            <span className="text-gray-700">
                              {mic.type === 'filaire' ? 'Micro filaire' : 'Micro sans fil'} (+{mic.price}€)
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMicro(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {currentTexts.remove}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Availability Status */}
              {startDate && endDate && (
                <div className="mt-4">
                  {availabilityStatus === 'checking' && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                      <AlertDescription className="text-blue-800">
                        {currentTexts.checking}
                      </AlertDescription>
                    </Alert>
                  )}
                  {availabilityStatus === 'available' && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        {currentTexts.available}
                      </AlertDescription>
                    </Alert>
                  )}
                  {availabilityStatus === 'unavailable' && (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {availabilityError || currentTexts.unavailableMessage}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Pricing Summary */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">{currentTexts.total}</span>
                  <span className="text-2xl font-bold text-[#F2431E]">{totalPrice}€</span>
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
                    ✓ {language === 'fr' 
                      ? 'Livraison incluse (Paris)'
                      : 'Delivery included (Paris)'
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

              {/* Section besoins spécifiques */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">{currentTexts.specificNeeds}</p>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = 'tel:+33651084994'}
                  className="border-[#F2431E] text-[#F2431E] hover:bg-[#F2431E] hover:text-white"
                >
                  {currentTexts.callUs}
                </Button>
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => handlePayDeposit()}
                disabled={!startDate || !endDate || availabilityStatus !== 'available' || isProcessing}
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
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer language={language} />
    </div>
  );
}
