// Assistant SND Rush refactorisé avec nouvelle UI et logique complète
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Answers, Step, STEPS, PRICING_CONFIG, ReservationPayload } from '@/types/assistant';
import { recommendPack, computePrice, isUrgent, validateStep } from '@/lib/assistant-logic';
import { processReservation, showSuccessNotification, showErrorNotification } from '@/lib/assistant-api';
import { trackAssistantEvent } from '@/lib/analytics';
import Chip from './assistant/Chip';
import Radio from './assistant/Radio';
import Input from './assistant/Input';
import ErrorText from './assistant/ErrorText';
import ReservationModal from './assistant/ReservationModal';

interface AssistantRefactoredProps {
  isOpen: boolean;
  onClose: () => void;
  onReservationComplete?: (payload: ReservationPayload) => void;
  onRentalConditionsClick?: () => void;
}

export default function AssistantRefactored({ 
  isOpen, 
  onClose, 
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
  
  const modalRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLButtonElement>(null);

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
    const recommendation = recommendPack(answers, Object.values(PRICING_CONFIG.packs));
    if (!recommendation) {
      showErrorNotification('Impossible de générer une recommandation');
      return;
    }
    
    // Track reservation click
    trackAssistantEvent.reservationClicked(recommendation.pack.name, bookingType);

    setCurrentRecommendation(recommendation);
    setShowReservationModal(true);
  };

  const handleReservationConfirm = async (payload: ReservationPayload) => {
    setIsLoading(true);
    
    try {
      await processReservation(payload);
      
      // Track reservation completed
      trackAssistantEvent.reservationCompleted(payload.packName, payload.totalPrice);
      
      if (payload.bookingType === 'info') {
        showSuccessNotification('Merci ! Nous vous rappelons sous 24h.');
        onClose();
      } else {
        showSuccessNotification('Redirection vers le paiement...');
        // La redirection Stripe se fait dans processReservation
      }
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      showErrorNotification('Erreur lors du traitement. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    const step = STEPS[currentStep];
    const value = answers[step.id as keyof Answers];
    const error = errors[step.id];

    return (
      <div className="space-y-6">
        {/* Titre et sous-titre */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h2>
          {step.subtitle && (
            <p className="text-sm text-gray-600">{step.subtitle}</p>
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
    const recommendation = recommendPack(answers, Object.values(PRICING_CONFIG.packs));
    if (!recommendation) return null;

    const isUrgentEvent = isUrgent(answers.date || '');
    
    // Track pack recommendation
    trackAssistantEvent.packRecommended(recommendation.pack.name, recommendation.confidence);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Notre recommandation</h2>
          <p className="text-sm text-gray-600">Basée sur vos réponses</p>
        </div>

        {/* Pack recommandé */}
        <div className="border-2 border-[#e27431] rounded-xl p-6 bg-[#e27431]/5">
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

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => handleReservation('deposit')}
            disabled={isLoading}
            className="flex-1 bg-[#e27431] text-white py-4 rounded-xl font-semibold hover:bg-[#e27431]/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Traitement...' : 'Réserver maintenant'}
          </button>
          <button
            onClick={() => handleReservation('info')}
            disabled={isLoading}
            className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Être rappelé
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
        className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#e27431] to-[#e27431]/90 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h1 id="assistant-title" className="text-lg font-bold">Assistant SND Rush</h1>
                <p className="text-white/90 text-sm">Trouvez le pack parfait</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
          
          {/* Progress bar */}
          {!showSummary && (
            <div className="mt-4">
              <div className="flex gap-2">
                {STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      index <= currentStep ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
              <p className="text-white/90 text-xs mt-2">
                Étape {currentStep + 1} sur {STEPS.length}
              </p>
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="p-6 max-h-[500px] overflow-y-auto">
          {showSummary ? renderSummary() : renderStep()}
        </div>

        {/* Navigation */}
        {!showSummary && (
          <div className="flex gap-3 p-6 border-t border-gray-200">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Précédent
              </button>
            )}
            <button
              ref={focusRef}
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                canProceed()
                  ? 'bg-[#e27431] text-white hover:bg-[#e27431]/90'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {currentStep === STEPS.length - 1 ? 'Voir la recommandation' : 'Suivant'}
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
