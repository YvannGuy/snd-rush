// Assistant SND Rush refactorisé avec nouvelle UI et logique complète
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Answers, Step, STEPS, PRICING_CONFIG, ReservationPayload } from '@/types/assistant';
import { recommendPack, computePrice, isUrgent, validateStep } from '@/lib/assistant-logic';
import { processReservation } from '@/lib/assistant-api';
import { trackAssistantEvent } from '@/lib/analytics';
import { useCart } from '@/contexts/CartContext';
import { CartItem } from '@/types/db';
import Chip from './assistant/Chip';
import Radio from './assistant/Radio';
import Input from './assistant/Input';
import ErrorText from './assistant/ErrorText';
import ReservationModal from './assistant/ReservationModal';

interface AssistantRefactoredProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'fr' | 'en';
  onReservationComplete?: (payload: ReservationPayload) => void;
  onRentalConditionsClick?: () => void;
}

export default function AssistantRefactored({ 
  isOpen, 
  onClose, 
  language = 'fr',
  onReservationComplete,
  onRentalConditionsClick
}: AssistantRefactoredProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState<any>(null);
  const { addToCart } = useCart();
  
  const modalRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLButtonElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus trap et gestion des événements clavier
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus initial
  useEffect(() => {
    if (isOpen && focusRef.current) {
      focusRef.current.focus();
    }
  }, [isOpen, currentStep]);

  // Scroller vers le bouton quand il devient actif (sur mobile)
  useEffect(() => {
    // Vérifier si on peut procéder avec les réponses actuelles
    const step = STEPS[currentStep];
    const value = answers[step?.id as keyof Answers];
    const canProceedNow = step && (
      step.id === 'extras' || 
      (value && (!Array.isArray(value) || value.length > 0))
    );

    if (canProceedNow && buttonRef.current) {
      // Petit délai pour laisser le DOM se mettre à jour
      setTimeout(() => {
        buttonRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        });
      }, 300);
    }
  }, [answers, currentStep]);

  // Réinitialiser l'état à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setAnswers({});
      setErrors({});
      setShowSummary(false);
      
      // Track assistant start
      trackAssistantEvent.started();
    }
  }, [isOpen]);

  const handleAnswerChange = (stepId: string, value: any) => {
    const newAnswers = { ...answers, [stepId]: value };
    
    // Si c'est la sélection de zone, mettre automatiquement le prix de livraison
    if (stepId === 'zone') {
      const deliveryPrices = {
        paris: 80,
        petite: 120,
        grande: 156,
        retrait: 0
      };
      newAnswers.deliveryAR = deliveryPrices[value as keyof typeof deliveryPrices] || 0;
    }
    
    setAnswers(newAnswers);
    
    // Effacer l'erreur pour cette étape
    if (errors[stepId]) {
      setErrors({ ...errors, [stepId]: '' });
    }

    // Sur mobile, scroller vers le bouton après une sélection
    setTimeout(() => {
      if (buttonRef.current) {
        buttonRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  const handleNext = () => {
    const step = STEPS[currentStep];
    const value = answers[step.id as keyof Answers];
    
    // Pour les options supplémentaires, on peut passer même si vide
    if (step.id === 'extras') {
      // Toujours valide, même si vide
      setErrors({ ...errors, [step.id]: '' });
    } else {
      // Validation stricte pour les autres étapes
      if (!value || (Array.isArray(value) && value.length === 0)) {
        setErrors({ ...errors, [step.id]: 'Ce champ est obligatoire' });
        return;
      }

      if (!validateStep(step.id, value)) {
        setErrors({ ...errors, [step.id]: 'Valeur invalide' });
        return;
      }
    }

    // Effacer les erreurs si validation OK
    setErrors({ ...errors, [step.id]: '' });

    // Passer à l'étape suivante ou au résumé
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowSummary(true);
    }
  };

  const canProceed = () => {
    const step = STEPS[currentStep];
    const value = answers[step.id as keyof Answers];
    
    // Pour les étapes optionnelles (comme extras), on peut avoir un tableau vide
    if (step.id === 'extras') {
      return true; // Toujours valide, même si vide
    }
    
    // Pour les autres étapes, validation stricte
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return false;
    }
    
    return validateStep(step.id, value);
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReservation = async (bookingType: 'info' | 'deposit') => {
    const recommendation = recommendPack(answers);
    if (!recommendation) {
      return;
    }
    
    // Track reservation click
    trackAssistantEvent.reservationClicked(recommendation.pack.name, bookingType);

    setCurrentRecommendation(recommendation);
    setShowReservationModal(true);
  };

  const handleAddToCart = () => {
    const recommendation = recommendPack(answers);
    if (!recommendation) {
      return;
    }

    // Calculer les dates de location
    const startDate = answers.date || new Date().toISOString().split('T')[0];
    const endDate = answers.date || new Date().toISOString().split('T')[0];
    
    // Calculer les jours de location (par défaut 1 jour)
    let rentalDays = 1;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      rentalDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    }

    // Mapper le pack ID
    const packIdMapping: Record<string, number> = {
      'pack_petit': 1,
      'pack_confort': 2,
      'pack_grand': 3,
      'pack_maxi': 5,
    };
    
    const packId = packIdMapping[recommendation.pack.id] || 2; // Fallback sur Pack M Confort

    // Créer l'item du panier
    const cartItem: CartItem = {
      productId: `pack-${packId}`,
      productName: `Pack ${recommendation.pack.name}`,
      productSlug: `pack-${packId}`,
      quantity: 1,
      rentalDays: rentalDays,
      startDate: startDate,
      endDate: endDate,
      dailyPrice: recommendation.breakdown.base,
      deposit: 500, // Dépôt par défaut
      addons: [], // Les extras seront gérés séparément si nécessaire
      images: [], // Pas d'image pour les packs de l'assistant
    };

    addToCart(cartItem);
    
    // Track add to cart
    trackAssistantEvent.addToCart(recommendation.pack.name);
    
    // Fermer l'assistant et rediriger vers le panier
    onClose();
    
    // Optionnel : rediriger vers le panier
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/panier';
      }, 500);
    }
  };

  const handleCallExpert = () => {
    // Ouvrir WhatsApp avec un message pré-rempli
    const message = encodeURIComponent(
      `Bonjour, j'ai utilisé l'assistant SND Rush et j'aimerais parler avec un expert pour finaliser ma réservation.`
    );
    window.open(`https://wa.me/33651084994?text=${message}`, '_blank');
    
    // Track expert call
    const recommendation = recommendPack(answers);
    if (recommendation) {
      trackAssistantEvent.expertCalled(recommendation.pack.name);
    }
    
    // Fermer l'assistant
    onClose();
  };

  const handleReservationConfirm = async (payload: ReservationPayload) => {
    setIsLoading(true);
    
    try {
      await processReservation(payload);
      
      // Track reservation completed
      trackAssistantEvent.reservationCompleted(payload.packName, payload.totalPrice);
      
      if (payload.bookingType === 'info') {
        onClose();
      } else {
        // La redirection Stripe se fait dans processReservation
      }
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    const step = STEPS[currentStep];
    const value = answers[step.id as keyof Answers];
    const error = errors[step.id];

    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Titre et sous-titre améliorés */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#F2431E]/10 to-[#e27431]/10 rounded-2xl mb-4">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{step.title}</h2>
          {step.subtitle && (
            <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">{step.subtitle}</p>
          )}
        </div>

        {/* Contenu de l'étape */}
        <div className="space-y-3">
          {step.type === 'single' && step.options && (
            <div className="space-y-3">
              {step.options.map((option) => (
                <Radio
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  icon={option.icon}
                  price={option.price}
                  selected={value === option.value}
                  onClick={(val) => handleAnswerChange(step.id, val)}
                />
              ))}
            </div>
          )}

          {step.type === 'multiple' && step.options && (
            <div className="space-y-3">
              {step.options.map((option) => (
                <Chip
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  icon={option.icon}
                  price={option.price}
                  selected={Array.isArray(value) && value.includes(option.value)}
                  onClick={(val) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = currentValues.includes(val)
                      ? currentValues.filter(v => v !== val)
                      : [...currentValues, val];
                    handleAnswerChange(step.id, newValues);
                  }}
                />
              ))}
              
            </div>
          )}

          {step.type === 'date' && (
            <Input
              type="date"
              value={value as string || ''}
              onChange={(val) => handleAnswerChange(step.id, val)}
              required={step.required}
              error={error}
            />
          )}

          {step.id === 'time' && (
            <Input
              type="text"
              value={value as string || ''}
              onChange={(val) => handleAnswerChange(step.id, val)}
              placeholder="Ex: 19h00, 20h30..."
              required={step.required}
              error={error}
            />
          )}

        </div>

        {/* Message d'erreur */}
        {error && <ErrorText message={error} />}
      </div>
    );
  };

  const renderSummary = () => {
    const recommendation = recommendPack(answers);
    if (!recommendation) return null;

    const isUrgentEvent = isUrgent(answers.date || '');
    
    // Track pack recommendation
    trackAssistantEvent.packRecommended(recommendation.pack.name, recommendation.confidence);

    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#F2431E]/20 to-[#e27431]/20 rounded-3xl mb-4">
            <span className="text-4xl">🎯</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Notre recommandation</h2>
          <p className="text-lg text-gray-600">Basée sur vos réponses</p>
        </div>

        {/* Pack recommandé avec design amélioré */}
        <div className="relative border-2 border-[#F2431E] rounded-2xl p-8 bg-gradient-to-br from-[#F2431E]/5 to-[#e27431]/5 shadow-lg">
          {/* Badge de confiance */}
          <div className="absolute -top-4 right-6 bg-gradient-to-r from-[#F2431E] to-[#e27431] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            {Math.round(recommendation.confidence * 100)}% de confiance
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-[#e27431] mb-2">{recommendation.pack.name}</h3>
            
            {/* Composition exacte */}
            {recommendation.compositionFinale && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Composition :</h4>
                <ul className="text-sm text-gray-700 space-y-1 text-left">
                  {recommendation.compositionFinale.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-[#e27431] mr-2">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Détail des coûts */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Pack de base :</span>
                <span>{recommendation.breakdown.base} €</span>
              </div>
              <div className="flex justify-between">
                <span>Livraison A/R :</span>
                <span>{recommendation.breakdown.delivery} €</span>
              </div>
              {recommendation.breakdown.extras > 0 && (
                <div className="flex justify-between">
                  <span>Options :</span>
                  <span>{recommendation.breakdown.extras} €</span>
                </div>
              )}
              {recommendation.breakdown.urgency > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Majoration urgence :</span>
                  <span>{recommendation.breakdown.urgency} €</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total TTC :</span>
                <span className="text-[#e27431]">{recommendation.totalPrice} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Raisons de la recommandation */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Pourquoi ce pack ?</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            {recommendation.reasons.map((reason, index) => (
              <li key={index} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#e27431] rounded-full" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions améliorées */}
        <div className="flex gap-4">
          <button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-[#F2431E] to-[#e27431] text-white py-5 rounded-xl font-bold text-lg hover:from-[#E63A1A] hover:to-[#F2431E] transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳ Traitement...' : 'Ajouter au panier'}
          </button>
          <button
            onClick={handleCallExpert}
            disabled={isLoading}
            className="flex-1 bg-white text-gray-700 py-5 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-md hover:shadow-lg border-2 border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Appeler un expert
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col transform transition-all duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
      >
        {/* Header avec design moderne */}
        <div className="relative bg-gradient-to-br from-[#F2431E] via-[#e27431] to-[#E63A1A] text-white p-8 overflow-hidden">
          {/* Éléments décoratifs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-3xl">🤖</span>
                </div>
                <div>
                  <h1 id="assistant-title" className="text-2xl font-bold mb-1">Assistant SND Rush</h1>
                  <p className="text-white/90 text-sm">Trouvez le pack parfait en 2 minutes</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all hover:scale-110"
                aria-label="Fermer"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
            
            {/* Progress bar améliorée */}
            {!showSummary && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white/90">
                    Étape {currentStep + 1} sur {STEPS.length}
                  </span>
                  <span className="text-sm font-medium text-white/90">
                    {Math.round(((currentStep + 1) / STEPS.length) * 100)}%
                  </span>
                </div>
                <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                  />
                  <div className="flex gap-1 absolute inset-0 p-1">
                    {STEPS.map((_, index) => (
                      <div
                        key={index}
                        className={`flex-1 h-full rounded-full transition-all duration-300 ${
                          index <= currentStep 
                            ? 'bg-white/40' 
                            : index === currentStep + 1
                            ? 'bg-white/20'
                            : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenu scrollable */}
        <div 
          ref={contentRef}
          className="flex-1 p-8 overflow-y-auto custom-scrollbar min-h-0"
        >
          {showSummary ? renderSummary() : renderStep()}
        </div>

        {/* Navigation améliorée - Sticky en bas sur mobile */}
        {!showSummary && (
          <div className="sticky bottom-0 flex gap-4 p-4 sm:p-8 border-t border-gray-100 bg-white z-10">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-4 sm:px-8 py-3 sm:py-4 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-sm hover:shadow-md border border-gray-200 text-sm sm:text-base"
              >
                ← Précédent
              </button>
            )}
            <button
              ref={(node) => {
                focusRef.current = node;
                buttonRef.current = node;
              }}
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex-1 py-3 sm:py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm sm:text-base ${
                canProceed()
                  ? 'bg-gradient-to-r from-[#F2431E] to-[#e27431] text-white hover:from-[#E63A1A] hover:to-[#F2431E]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {currentStep === STEPS.length - 1 ? '✨ Voir la recommandation' : 'Suivant →'}
            </button>
          </div>
        )}

      </div>

      {/* Modal de réservation */}
      {showReservationModal && currentRecommendation && (
        <ReservationModal
          isOpen={showReservationModal}
          onClose={() => setShowReservationModal(false)}
          recommendation={currentRecommendation}
          answers={answers}
          onConfirm={handleReservationConfirm}
          isLoading={isLoading}
          onRentalConditionsClick={onRentalConditionsClick}
        />
      )}
    </div>
  );
}
