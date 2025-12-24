'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { PackTierAdjustment } from '@/lib/pack-tier-logic';

interface ReservationWizardProps {
  packKey: 'conference' | 'soiree' | 'mariage';
  packTitle: string;
  tierAdjustment: PackTierAdjustment | null;
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
  tierAdjustment,
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

  const texts = {
    fr: {
      title: 'Réservation en 2 minutes',
      step1: 'Dates et horaires',
      step2: 'Localisation',
      step3: 'Personnes',
      step4: 'Options',
      step5: 'Récapitulatif',
      startDate: 'Date de début',
      startTime: 'Heure de début',
      endDate: 'Date de fin',
      endTime: 'Heure de fin',
      city: 'Ville',
      postalCode: 'Code postal',
      cityPlaceholder: 'Commencez à taper une ville...',
      peopleCount: 'Nombre de personnes (optionnel)',
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
    },
    en: {
      title: 'Book in 2 minutes',
      step1: 'Dates and times',
      step2: 'Location',
      step3: 'People',
      step4: 'Options',
      step5: 'Summary',
      startDate: 'Start date',
      startTime: 'Start time',
      endDate: 'End date',
      endTime: 'End time',
      city: 'City',
      postalCode: 'Postal code',
      cityPlaceholder: 'Start typing a city...',
      peopleCount: 'Number of people (optional)',
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
    },
  };

  const currentTexts = texts[language];
  const totalSteps = 5;

  // Auto-complétion ville
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
        return startDate && endDate && startTime && endTime;
      case 2:
        return city && postalCode;
      case 3:
        return true; // Optionnel
      case 4:
        return true; // Optionnel
      case 5:
        return availabilityStatus === 'available';
      default:
        return false;
    }
  };

  useEffect(() => {
    // Quand on arrive à l'étape 5, déclencher la vérification de disponibilité
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
    } else if (step === totalSteps && canProceed()) {
      await onComplete({
        startDate,
        startTime,
        endDate,
        endTime,
        city,
        postalCode,
        peopleCount,
        additionalMics,
      });
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Calculer les prix
  const basePackPrice = tierAdjustment?.adjustedPrice || 279;
  const additionalMicsPrice = additionalMics.reduce((sum, mic) => sum + mic.price, 0);
  const totalPrice = basePackPrice + additionalMicsPrice;
  const depositAmount = Math.round(totalPrice * 0.3);
  const balanceAmount = totalPrice - depositAmount;
  const cautionAmounts: Record<typeof packKey, number> = {
    conference: 700,
    soiree: 1100,
    mariage: 1600,
  };
  const tierMultipliers = { S: 1, M: 1.2, L: 1.5 };
  const tier = tierAdjustment?.tier || 'S';
  const baseCaution = cautionAmounts[packKey] || 0;
  const cautionAmount = Math.round(baseCaution * tierMultipliers[tier]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header avec progression */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          {currentTexts.title}
        </h2>
        <div className="flex items-center justify-between mb-4">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    step > index + 1
                      ? 'bg-green-500 text-white'
                      : step === index + 1
                      ? 'bg-[#F2431E] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > index + 1 ? <CheckCircle2 className="h-6 w-6" /> : index + 1}
                </div>
                <span className="text-xs mt-2 text-gray-600 hidden sm:block">
                  {index === 0 && currentTexts.step1}
                  {index === 1 && currentTexts.step2}
                  {index === 2 && currentTexts.step3}
                  {index === 3 && currentTexts.step4}
                  {index === 4 && currentTexts.step5}
                </span>
              </div>
              {index < totalSteps - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-colors ${
                    step > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contenu de l'étape */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {/* Étape 1: Dates et horaires */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{currentTexts.step1}</h3>
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
            </div>
          )}

          {/* Étape 2: Localisation */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{currentTexts.step2}</h3>
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
            </div>
          )}

          {/* Étape 3: Nombre de personnes */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{currentTexts.step3}</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {currentTexts.peopleCount}
                </label>
                <input
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
                />
                {peopleCount && tierAdjustment && (
                  <p className="text-xs text-gray-500 mt-2">
                    {language === 'fr'
                      ? `Pack ajusté automatiquement pour ${peopleCount} personnes (Pack ${tierAdjustment.tier})`
                      : `Pack automatically adjusted for ${peopleCount} people (Pack ${tierAdjustment.tier})`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Étape 4: Micros supplémentaires (si pack M ou L) */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{currentTexts.step4}</h3>
              {tierAdjustment && (tierAdjustment.tier === 'M' || tierAdjustment.tier === 'L') ? (
                <>
                  <div className="flex gap-2 mb-4">
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
                    <div className="p-3 bg-gray-50 rounded-lg">
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
                </>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  {language === 'fr'
                    ? 'Aucune option supplémentaire disponible pour ce pack.'
                    : 'No additional options available for this pack.'}
                </p>
              )}
            </div>
          )}

          {/* Étape 5: Récapitulatif */}
          {step === 5 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{currentTexts.summary}</h3>

              {/* Statut disponibilité */}
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

              {/* Détails réservation */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">{currentTexts.startDate}:</span>
                  <span className="font-semibold">{startDate} {startTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{currentTexts.endDate}:</span>
                  <span className="font-semibold">{endDate} {endTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{currentTexts.city}:</span>
                  <span className="font-semibold">{city} {postalCode}</span>
                </div>
                {peopleCount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{currentTexts.peopleCount}:</span>
                    <span className="font-semibold">{peopleCount}</span>
                  </div>
                )}
              </div>

              {/* Prix */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">{currentTexts.total}</span>
                  <span className="text-2xl font-bold text-[#F2431E]">{totalPrice}€</span>
                </div>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={step === 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {currentTexts.previous}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed() || isProcessing || (step === 5 && availabilityStatus !== 'available')}
          className="flex items-center gap-2 bg-[#F2431E] text-white hover:bg-[#E63A1A]"
        >
          {step === totalSteps ? (
            <>
              {isProcessing ? currentTexts.processing : currentTexts.complete}
            </>
          ) : (
            <>
              {currentTexts.next}
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
