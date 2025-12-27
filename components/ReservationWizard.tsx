'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, AlertCircle, Loader2, ChevronRight, ChevronLeft, Calendar, MapPin, Users, Package, Info, Sparkles, Mail } from 'lucide-react';
import { PackTierAdjustment } from '@/lib/pack-tier-logic';
import { detectZoneFromText, getDeliveryPrice } from '@/lib/zone-detection';
import { BasePack, PackItem } from '@/lib/packs/basePacks';
import { getPackTierDescription } from '@/lib/pack-tier-logic';
import { getInstallationPrice } from '@/lib/pack-options';
import { calculatePickupJPlus1Price, requiresPickupJPlus1 } from '@/lib/time-rules';
import { supabase } from '@/lib/supabase';

interface ReservationWizardProps {
  packKey: 'conference' | 'soiree' | 'mariage';
  packTitle: string;
  pack: BasePack;
  tierAdjustment: PackTierAdjustment | null;
  displayItems: PackItem[];
  language: 'fr' | 'en';
  onComplete: (data: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    city: string;
    postalCode: string;
    peopleCount: number | null;
    additionalMics: Array<{ type: 'filaire' | 'sans-fil'; price: number }>;
    customerEmail: string;
  }) => Promise<void>;
  availabilityStatus: 'idle' | 'checking' | 'available' | 'unavailable';
  availabilityError: string | null;
  isProcessing: boolean;
  onStep5Reached?: (data: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  }) => void;
  onPeopleCountChange?: (count: number | null) => void;
}

export default function ReservationWizard({
  packKey,
  packTitle,
  pack,
  tierAdjustment,
  displayItems,
  language,
  onComplete,
  availabilityStatus,
  availabilityError,
  isProcessing,
  onStep5Reached,
  onPeopleCountChange,
}: ReservationWizardProps) {
  const [step, setStep] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('23:00');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [peopleCount, setPeopleCount] = useState<number | null>(null);
  const [additionalMics, setAdditionalMics] = useState<Array<{ type: 'filaire' | 'sans-fil'; price: number }>>([]);
  const [citySuggestions, setCitySuggestions] = useState<Array<{ city: string; postcode: string }>>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string>('');

  // Récupérer l'email de l'utilisateur connecté (si disponible)
  useEffect(() => {
    const getUserEmail = async () => {
      if (!supabase) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setCustomerEmail(user.email);
        }
      } catch (error) {
        // L'utilisateur n'est pas connecté, l'email sera saisi manuellement
        console.log('Utilisateur non connecté, email à saisir manuellement');
      }
    };
    getUserEmail();
  }, []);

  const texts = {
    fr: {
      title: '',
      step0: 'Votre solution',
      step1: 'Dates et horaires',
      step2: 'Localisation',
      step3: 'Personnes',
      step4: 'Récapitulatif',
      startDate: 'Date de début',
      startTime: 'Heure de début',
      endDate: 'Date de fin',
      endTime: 'Heure de fin',
      city: 'Ville',
      postalCode: 'Code postal',
      cityPlaceholder: 'Commencez à taper une ville...',
      peopleCount: 'Nombre de personnes',
      peoplePlaceholder: 'Ex: 50',
      addMicro: 'Ajouter un micro',
      microFilaire: 'Micro filaire (+10€)',
      microSansFil: 'Micro sans fil (+20€)',
      additionalMics: 'Micros supplémentaires',
      remove: 'Retirer',
      next: 'Suivant',
      previous: 'Précédent',
      complete: 'Payer l\'acompte (30%)',
      checking: 'Vérification en cours...',
      available: 'Disponible !',
      unavailable: 'Indisponible',
      unavailableMessage: 'Ce créneau n\'est pas disponible. Veuillez choisir d\'autres dates.',
      processing: 'Traitement en cours...',
      summary: 'Récapitulatif',
      total: 'Total',
      deposit: 'Acompte 30%',
      balance: 'Solde à régler J-5',
      caution: 'La caution sera demandée J-2',
      deliverySupplement: 'Supplément livraison',
      petiteCouronne: 'Petite couronne',
      grandeCouronne: 'Grande couronne',
      email: 'Email',
      emailPlaceholder: 'votre.email@exemple.com',
      emailRequired: 'Email requis pour la confirmation',
      zoneCoverage: 'Zone couverte : Île-de-France uniquement. Pour d\'autres zones, veuillez nous contacter.',
    },
    en: {
      title: '',
      step0: 'Your solution',
      step1: 'Dates and times',
      step2: 'Location',
      step3: 'People',
      step4: 'Summary',
      startDate: 'Start date',
      startTime: 'Start time',
      endDate: 'End date',
      endTime: 'End time',
      city: 'City',
      postalCode: 'Postal code',
      cityPlaceholder: 'Start typing a city...',
      peopleCount: 'Number of people',
      peoplePlaceholder: 'Ex: 50',
      addMicro: 'Add a microphone',
      microFilaire: 'Wired microphone (+10€)',
      microSansFil: 'Wireless microphone (+20€)',
      additionalMics: 'Additional microphones',
      remove: 'Remove',
      next: 'Next',
      previous: 'Previous',
      complete: 'Pay deposit (30%)',
      checking: 'Checking...',
      available: 'Available!',
      unavailable: 'Unavailable',
      unavailableMessage: 'This time slot is not available. Please choose other dates.',
      processing: 'Processing...',
      summary: 'Summary',
      total: 'Total',
      deposit: '30% deposit',
      balance: 'Balance due 5 days before',
      caution: 'Security deposit will be requested 2 days before',
      deliverySupplement: 'Delivery supplement',
      petiteCouronne: 'Small crown',
      grandeCouronne: 'Large crown',
      email: 'Email',
      emailPlaceholder: 'your.email@example.com',
      emailRequired: 'Email required for confirmation',
      zoneCoverage: 'Coverage area: Île-de-France only. For other areas, please contact us.',
    },
  };

  const currentTexts = texts[language];
  const totalSteps = 5;

  // Auto-complétion ville - UNIQUEMENT Île-de-France
  useEffect(() => {
    if (city.length < 2) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }

    const searchCities = async () => {
      try {
        // Recherche avec filtre géographique pour Île-de-France
        // Île-de-France = départements 75, 77, 78, 91, 92, 93, 94, 95
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(city)}&limit=20&type=municipality&lat=48.8566&lon=2.3522&radius=50000`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          // Filtrer pour ne garder que les villes d'Île-de-France (codes postaux 75xxx, 77xxx, 78xxx, 91xxx, 92xxx, 93xxx, 94xxx, 95xxx)
          const idfPostcodes = ['75', '77', '78', '91', '92', '93', '94', '95'];
          const idfSuggestions = data.features
            .filter((feature: any) => {
              const postcode = feature.properties.postcode;
              if (!postcode) return false;
              // Vérifier si le code postal commence par un département d'Île-de-France
              return idfPostcodes.some(dept => postcode.startsWith(dept));
            })
            .map((feature: any) => ({
              city: feature.properties.city,
              postcode: feature.properties.postcode,
            }))
            .slice(0, 5); // Limiter à 5 résultats
            
          setCitySuggestions(idfSuggestions);
          setShowCitySuggestions(idfSuggestions.length > 0);
        } else {
          setCitySuggestions([]);
          setShowCitySuggestions(false);
        }
      } catch (error) {
        console.error('Erreur recherche ville:', error);
        setCitySuggestions([]);
        setShowCitySuggestions(false);
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

  const handleAddMicro = (type: 'filaire' | 'sans-fil') => {
    const price = type === 'filaire' ? 10 : 20;
    setAdditionalMics([...additionalMics, { type, price }]);
  };

  const handleRemoveMicro = (index: number) => {
    setAdditionalMics(additionalMics.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return true; // Étape 0 : présentation du pack, toujours disponible
      case 2:
        // Vérifier que toutes les dates/heures sont remplies ET que la fin est après le début
        if (!startDate || !endDate || !startTime || !endTime) {
          return false;
        }
        // Validation : la date/heure de fin doit être après la date/heure de début
        const startISO = `${startDate}T${startTime}:00`;
        const endISO = `${endDate}T${endTime}:00`;
        const startAt = new Date(startISO);
        const endAt = new Date(endISO);
        if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
          return false;
        }
        return endAt > startAt;
      case 3:
        return city && postalCode;
      case 4:
        return peopleCount !== null && peopleCount > 0; // Obligatoire
      case 5:
        // Vérifier que la disponibilité est OK et que l'email est valide
        if (availabilityStatus !== 'available') return false;
        if (!customerEmail) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(customerEmail);
      default:
        return false;
    }
  };

  useEffect(() => {
    // Quand on arrive à l'étape 5 (récapitulatif), déclencher la vérification de disponibilité
    if (step === 5 && onStep5Reached) {
      onStep5Reached({
        startDate,
        startTime,
        endDate,
        endTime,
      });
    }
  }, [step, startDate, startTime, endDate, endTime, onStep5Reached]);

  const handleNext = async () => {
    if (canProceed() && step < totalSteps) {
      setStep(step + 1);
    } else if (step === 5 && canProceed()) {
      // Vérifier que l'email est bien présent avant de compléter
      if (!customerEmail || customerEmail.trim() === '') {
        console.error('[WIZARD] Email manquant avant completion:', customerEmail);
        return;
      }
      console.log('[WIZARD] Completion avec email:', customerEmail);
      await onComplete({
        startDate,
        startTime,
        endDate,
        endTime,
        city,
        postalCode,
        peopleCount,
        additionalMics,
        customerEmail,
      });
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Calculer les prix
  const basePackPrice = tierAdjustment?.adjustedPrice || 299;
  const additionalMicsPrice = additionalMics.reduce((sum, mic) => sum + mic.price, 0);
  // Calculer le prix de livraison selon le code postal
  const zone = postalCode ? detectZoneFromText(postalCode) : null;
  const deliveryPrice = zone && zone !== 'paris' ? getDeliveryPrice(zone) : 0;
  // Calculer les options automatiques
  const tier = tierAdjustment?.tier || 'S';
  // Installation automatique pour M et L
  const installationPrice = tier !== 'S' ? getInstallationPrice(tier) : 0;
  // Récupération J+1 automatique selon l'heure de fin et les dates
  const pickupJPlus1Price = endTime && zone ? calculatePickupJPlus1Price(endTime, zone, startDate, endDate) : 0;
  const totalPrice = basePackPrice + additionalMicsPrice + deliveryPrice + installationPrice + pickupJPlus1Price;
  const depositAmount = Math.round(totalPrice * 0.3);
  const balanceAmount = totalPrice - depositAmount;
  const cautionAmounts: Record<typeof packKey, number> = {
    conference: 700,
    soiree: 1100,
    mariage: 1600,
  };
  const tierMultipliers = { S: 1, M: 1.2, L: 1.5 };
  const baseCaution = cautionAmounts[packKey] || 0;
  const cautionAmount = Math.round(baseCaution * tierMultipliers[tier]);

  const progressPercentage = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
      {/* Header avec progression améliorée */}
      <div className="mb-8 space-y-4">
        {/* Barre de progression moderne */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-medium">
              {language === 'fr' ? 'Étape' : 'Step'} {step} {language === 'fr' ? 'sur' : 'of'} {totalSteps}
            </span>
            <span className="font-semibold text-[#F2431E]">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Étapes visuelles améliorées */}
        <div className="flex items-center justify-between gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNumber = index + 1;
            const isCompleted = step > stepNumber;
            const isCurrent = step === stepNumber;
            const stepLabels = [
              currentTexts.step0,
              currentTexts.step1,
              currentTexts.step2,
              currentTexts.step3,
              currentTexts.step4,
            ];

            return (
              <div key={index} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1 relative w-full">
                  <div
                    className={`
                      relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all duration-300
                      ${isCompleted 
                        ? 'bg-green-500 text-white shadow-lg scale-110' 
                        : isCurrent 
                        ? 'bg-[#F2431E] text-white shadow-lg scale-110 ring-4 ring-[#F2431E]/20' 
                        : 'bg-gray-200 text-gray-500'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : (
                      <span>{stepNumber}</span>
                    )}
                  </div>
                  <span className={`text-xs mt-2 text-center hidden sm:block font-medium transition-colors leading-tight px-1 ${
                    isCurrent ? 'text-[#F2431E] font-semibold' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {stepLabels[index]}
                  </span>
                </div>
                {index < totalSteps - 1 && (
                  <div className={`h-1 flex-1 mx-2 transition-all duration-500 ${
                    step > stepNumber ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contenu de l'étape */}
      <Card className="mb-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
        <CardContent className="p-6 sm:p-8">
          {/* Étape 0: Présentation du pack */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in-50 duration-500">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 mb-4">
                  <Sparkles className="h-6 w-6 text-[#F2431E]" />
                  <h3 className="text-3xl font-bold text-gray-900">{pack.title}</h3>
                </div>
                {/* Ne pas afficher le tier sur la première page car on ne connaît pas encore le nombre de personnes */}
                {tierAdjustment && peopleCount && (
                  <Badge variant="default" className="bg-[#F2431E] text-white text-base px-4 py-1.5">
                    Pack {tierAdjustment.tier} - {tierAdjustment.capacity}
                  </Badge>
                )}
              </div>

              {/* Description complète du pack */}
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed text-base">
                  {pack.description}
                </p>
                {/* Ne pas afficher la description du tier sur la première page car on ne connaît pas encore le nombre de personnes */}
                {tierAdjustment && peopleCount && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                    <p className="text-sm text-blue-900 italic">
                      {getPackTierDescription(packKey, tierAdjustment.tier, tierAdjustment.capacity)}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Matériel inclus */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#F2431E]" />
                  <h4 className="font-semibold text-gray-900 text-lg">
                    {language === 'fr' ? 'Matériel inclus' : 'Included equipment'}
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {displayItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-[#F2431E]/30 transition-colors">
                      <span className="text-gray-700 font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Services inclus */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 mb-1">
                      {language === 'fr' ? 'Services inclus' : 'Included services'}
                    </p>
                    <p className="text-sm text-green-800 mb-2">
                      {language === 'fr' 
                        ? 'Livraison, installation et récupération par nos techniciens'
                        : 'Delivery, installation and pickup by our technicians'
                      }
                    </p>
                    <p className="text-xs text-green-700/80 pt-2 border-t border-green-200/50">
                      {language === 'fr' 
                        ? 'Des suppléments peuvent s\'appliquer selon votre zone de livraison, le nombre de personnes et l\'heure de fin de votre événement.'
                        : 'Supplements may apply depending on your delivery zone, number of people and event end time.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 1: Dates et horaires */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in-50 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#F2431E]/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-[#F2431E]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{currentTexts.step1}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {currentTexts.startDate}
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (e.target.value && endDate && e.target.value > endDate) {
                        setEndDate('');
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-[#F2431E]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {currentTexts.startTime}
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-[#F2431E]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {currentTexts.endDate}
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-[#F2431E]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {currentTexts.endTime}
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-[#F2431E]"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Localisation */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in-50 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#F2431E]/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-[#F2431E]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{currentTexts.step2}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative space-y-2">
                  <Label htmlFor="city" className="text-base font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {currentTexts.city}
                  </Label>
                  <Input
                    id="city"
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
                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-[#F2431E]"
                    required
                  />
                  {showCitySuggestions && citySuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {citySuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectCity(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-[#F2431E]/5 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{suggestion.city}</div>
                          <div className="text-sm text-gray-500">{suggestion.postcode}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-base font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {currentTexts.postalCode}
                  </Label>
                  <Input
                    id="postalCode"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="75011"
                    maxLength={5}
                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-[#F2431E]"
                    required
                  />
                </div>
              </div>
              
              {/* Message zone couverte */}
              <div className="text-xs text-gray-500 text-center pt-2">
                <p>{currentTexts.zoneCoverage}</p>
              </div>
              
              {/* Message J+1 si zone détectée et heure de fin après 02h00 (même jour) ou jour différent */}
              {postalCode && zone && endTime && startDate && endDate && requiresPickupJPlus1(endTime, startDate, endDate) && (
                <Alert className="bg-amber-50 border-amber-200">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    {language === 'fr'
                      ? `Récupération le lendemain (J+1) automatique (+${calculatePickupJPlus1Price(endTime, zone, startDate, endDate)}€)`
                      : `Next day pickup (J+1) automatically applied (+${calculatePickupJPlus1Price(endTime, zone, startDate, endDate)}€)`
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Étape 3: Nombre de personnes */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in-50 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#F2431E]/10 rounded-lg">
                  <Users className="h-5 w-5 text-[#F2431E]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{currentTexts.step3}</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="peopleCount" className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {currentTexts.peopleCount}
                  </Label>
                  <Input
                    id="peopleCount"
                    type="number"
                    min="1"
                    value={peopleCount || ''}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || null;
                      setPeopleCount(count);
                      if (onPeopleCountChange) {
                        onPeopleCountChange(count);
                      }
                    }}
                    placeholder={currentTexts.peoplePlaceholder}
                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-[#F2431E]"
                    required
                  />
                </div>
                
                {peopleCount && tierAdjustment && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      {language === 'fr'
                        ? `Pack ajusté automatiquement pour ${peopleCount} personnes (Pack ${tierAdjustment.tier})`
                        : `Pack automatically adjusted for ${peopleCount} people (Pack ${tierAdjustment.tier})`}
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Information installation automatique */}
                {tierAdjustment && tierAdjustment.tier !== 'S' && (
                  <Alert className="bg-indigo-50 border-indigo-200">
                    <Info className="h-4 w-4 text-indigo-600" />
                    <AlertDescription className="text-indigo-800">
                      {language === 'fr'
                        ? `Installation & réglages inclus automatiquement (+${getInstallationPrice(tierAdjustment.tier)}€)`
                        : `Installation & setup automatically included (+${getInstallationPrice(tierAdjustment.tier)}€)`
                      }
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* Étape 4: Récapitulatif */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in-50 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#F2431E]/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-[#F2431E]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{currentTexts.summary}</h3>
              </div>

              {/* Statut disponibilité */}
              {availabilityStatus === 'checking' && (
                <Alert className="bg-blue-50 border-blue-200 shadow-sm">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  <AlertDescription className="text-blue-800 font-medium">
                    {currentTexts.checking}
                  </AlertDescription>
                </Alert>
              )}
              {availabilityStatus === 'available' && (
                <Alert className="bg-green-50 border-green-200 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 font-medium">
                    {currentTexts.available}
                  </AlertDescription>
                </Alert>
              )}
              {availabilityStatus === 'unavailable' && (
                <Alert className="bg-red-50 border-red-200 shadow-sm">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 font-medium">
                    {availabilityError || currentTexts.unavailableMessage}
                  </AlertDescription>
                </Alert>
              )}

              {/* Détails réservation */}
              <Card className="bg-gradient-to-br from-gray-50 to-white border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#F2431E]" />
                    {language === 'fr' ? 'Détails de la réservation' : 'Reservation details'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{currentTexts.startDate}</p>
                      <p className="font-semibold text-gray-900">{startDate} {startTime}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{currentTexts.endDate}</p>
                      <p className="font-semibold text-gray-900">{endDate} {endTime}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{currentTexts.city}</p>
                      <p className="font-semibold text-gray-900">{city} {postalCode}</p>
                    </div>
                    {peopleCount && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{currentTexts.peopleCount}</p>
                        <p className="font-semibold text-gray-900">{peopleCount}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pack détaillé */}
              <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#F2431E]" />
                    {language === 'fr' ? 'Pack sélectionné' : 'Selected pack'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 mb-1">{pack.title}</h4>
                      {tierAdjustment && (
                        <Badge variant="default" className="bg-[#F2431E] text-white">
                          Pack {tierAdjustment.tier} - {tierAdjustment.capacity}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Matériel inclus */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        {language === 'fr' ? 'Matériel inclus :' : 'Included equipment :'}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {displayItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Prix de base du pack */}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {language === 'fr' ? 'Prix de base du pack' : 'Base pack price'}
                        </span>
                        <span className="font-semibold text-gray-900">{basePackPrice}€</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Champ email */}
              <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-[#F2431E]" />
                    {currentTexts.email}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail" className="text-base font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {currentTexts.email} <span className="text-[#F2431E]">*</span>
                    </Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder={currentTexts.emailPlaceholder}
                      value={customerEmail || ''}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-[#F2431E]"
                      required
                    />
                    <p className="text-xs text-gray-600">
                      {language === 'fr' 
                        ? 'Cet email sera utilisé pour recevoir la confirmation de paiement et les détails de votre réservation.'
                        : 'This email will be used to receive payment confirmation and your reservation details.'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Prix */}
              <Card className="bg-gradient-to-br from-[#F2431E]/5 to-white border-2 border-[#F2431E]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#F2431E]" />
                    {language === 'fr' ? 'Récapitulatif des prix' : 'Price summary'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Prix de base */}
                  <div className="flex justify-between items-center pb-3 border-b-2">
                    <span className="text-lg font-semibold text-gray-900">{currentTexts.total}</span>
                    <span className="text-3xl font-bold text-[#F2431E]">{totalPrice}€</span>
                  </div>
                  
                  {/* Détails des suppléments */}
                  <div className="space-y-2">
                    {/* Supplément livraison si applicable */}
                    {postalCode && zone && zone !== 'paris' && deliveryPrice > 0 && (
                      <div className="flex justify-between items-center text-sm text-gray-600 bg-white/50 p-2 rounded">
                        <span>
                          {currentTexts.deliverySupplement} – {
                            zone === 'petite' ? currentTexts.petiteCouronne : currentTexts.grandeCouronne
                          }
                        </span>
                        <Badge variant="outline" className="font-semibold">+{deliveryPrice}€</Badge>
                      </div>
                    )}
                    
                    {/* Message si Paris (livraison incluse) */}
                    {postalCode && zone === 'paris' && (
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                        <CheckCircle2 className="h-4 w-4" />
                        {language === 'fr' 
                          ? 'Livraison incluse (Paris)'
                          : 'Delivery included (Paris)'
                        }
                      </div>
                    )}

                    {/* Installation automatique */}
                    {tier !== 'S' && installationPrice > 0 && (
                      <div className="flex justify-between items-center text-sm text-gray-600 bg-white/50 p-2 rounded">
                        <span>
                          {language === 'fr' 
                            ? 'Installation & réglages (automatique)'
                            : 'Installation & setup (automatic)'
                          }
                        </span>
                        <Badge variant="outline" className="font-semibold">+{installationPrice}€</Badge>
                      </div>
                    )}

                    {/* Récupération J+1 automatique */}
                    {endTime && pickupJPlus1Price > 0 && (
                      <div className="flex justify-between items-center text-sm text-gray-600 bg-white/50 p-2 rounded">
                        <span>
                          {language === 'fr' 
                            ? 'Récupération le lendemain (J+1) (automatique)'
                            : 'Next day pickup (J+1) (automatic)'
                          }
                        </span>
                        <Badge variant="outline" className="font-semibold">+{pickupJPlus1Price}€</Badge>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Paiement */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">{currentTexts.deposit}</span>
                      <span className="text-lg font-bold text-gray-900">{depositAmount}€</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">{currentTexts.balance}</span>
                      <span className="text-lg font-bold text-gray-900">{balanceAmount}€</span>
                    </div>
                    <div className="pt-3 border-t-2 border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{currentTexts.caution}</span>
                        <Badge variant="secondary" className="text-base font-bold px-3 py-1">
                          {cautionAmount}€
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation améliorée */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={step === 1}
          size="lg"
          className="flex items-center justify-center gap-2 w-full sm:w-auto order-2 sm:order-1 border-2 hover:bg-gray-50 transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
          {currentTexts.previous}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed() || isProcessing || (step === 5 && availabilityStatus !== 'available')}
          size="lg"
          className="flex items-center justify-center gap-2 bg-[#F2431E] text-white hover:bg-[#E63A1A] w-full sm:w-auto order-1 sm:order-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === 5 ? (
            <>
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {currentTexts.processing}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  {currentTexts.complete}
                </>
              )}
            </>
          ) : (
            <>
              {currentTexts.next}
              <ChevronRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
