'use client';

import React, { useState, useEffect } from 'react';
import { usePacks } from '@/hooks/usePacks';
import { useRecommendation } from '@/hooks/useRecommendation';
import { useAssistantPersistence } from '@/hooks/useAssistantPersistence';

// Types
interface Question {
  id: string;
  question: string;
  type: 'single' | 'text';
  options?: Array<{
    value: string;
    label: string;
    icon: string;
  }>;
  placeholder?: string;
}

// Configuration
const CONFIG = {
  accentColor: '#e27431',
  maxQuestions: 6,
};

// Questions de l'assistant
const QUESTIONS: Question[] = [
  {
    id: 'eventType',
    question: 'Quel type d\'événement organisez-vous ?',
    type: 'single',
    options: [
      { value: 'mariage', label: 'Mariage', icon: '💒' },
      { value: 'anniversaire', label: 'Anniversaire', icon: '🎂' },
      { value: 'corporate', label: 'Événement corporate', icon: '🏢' },
      { value: 'eglise', label: 'Église/Cérémonie', icon: '⛪' },
      { value: 'asso', label: 'Association', icon: '👥' },
      { value: 'autre', label: 'Autre', icon: '🎉' }
    ]
  },
  {
    id: 'guests',
    question: 'Combien d\'invités prévoyez-vous ?',
    type: 'single',
    options: [
      { value: '0-50', label: '0-50 personnes', icon: '👥' },
      { value: '50-100', label: '50-100 personnes', icon: '👥👥' },
      { value: '100-200', label: '100-200 personnes', icon: '👥👥👥' },
      { value: '200+', label: '200+ personnes', icon: '👥👥👥👥' }
    ]
  },
  {
    id: 'location',
    question: 'Où se déroule votre événement ?',
    type: 'single',
    options: [
      { value: 'paris', label: 'Paris', icon: '🏙️' },
      { value: 'petite_couronne', label: 'Petite Couronne', icon: '🏘️' },
      { value: 'grande_couronne', label: 'Grande Couronne', icon: '🌆' },
      { value: 'orleans', label: 'Orléans', icon: '🏛️' }
    ]
  },
  {
    id: 'environment',
    question: 'Votre événement se déroule-t-il ?',
    type: 'single',
    options: [
      { value: 'interieur', label: 'En intérieur', icon: '🏠' },
      { value: 'exterieur', label: 'En extérieur', icon: '🌳' }
    ]
  },
  {
    id: 'usage',
    question: 'Quel sera l\'usage principal de la sonorisation ?',
    type: 'single',
    options: [
      { value: 'discours', label: 'Discours/Présentation', icon: '🎤' },
      { value: 'ambiance', label: 'Musique d\'ambiance', icon: '🎵' },
      { value: 'soiree', label: 'Soirée dansante', icon: '💃' },
      { value: 'live', label: 'Concert/Live', icon: '🎸' }
    ]
  },
  {
    id: 'date',
    question: 'Quelle est la date de votre événement ?',
    type: 'text',
    placeholder: 'Ex: 15 juin 2024, Samedi 20 juillet...'
  }
];

interface AssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'fr' | 'en';
  onPackSelected: (packId: number) => void;
}

export default function AssistantModal({ isOpen, onClose, language, onPackSelected }: AssistantModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const packs = usePacks();
  const { answers, setAnswers, recommendation, setRecommendation, saveDraft } = useAssistantPersistence();
  const currentRecommendation = useRecommendation(answers, packs);

  // Réinitialiser l'état à chaque ouverture
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleAnswerChange = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    saveDraft(newAnswers);
  };

  const canProceed = () => {
    const question = QUESTIONS[currentStep];
    if (question.type === 'single') {
      return answers[question.id];
    } else {
      return answers[question.id] && answers[question.id].trim().length > 0;
    }
  };

  const nextStep = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Générer la recommandation
      if (currentRecommendation) {
        setRecommendation(currentRecommendation);
        saveDraft(answers, currentRecommendation);
      }
      setCurrentStep(QUESTIONS.length);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateReservationMessage = () => {
    if (!recommendation) return '';
    
    const { pack } = recommendation;
    
    let message = `Bonjour,\n\n`;
    message += `Je souhaite réserver le ${pack.name} (${pack.priceText}) pour mon événement.\n\n`;
    message += `Détails de l'événement :\n`;
    message += `- Type : ${getAnswerLabel('eventType')}\n`;
    message += `- Invités : ${getAnswerLabel('guests')}\n`;
    message += `- Lieu : ${getAnswerLabel('location')}\n`;
    message += `- Environnement : ${getAnswerLabel('environment')}\n`;
    message += `- Usage : ${getAnswerLabel('usage')}\n`;
    if (answers.date) {
      message += `- Date : ${answers.date}\n`;
    }
    message += `\nMerci de me recontacter pour finaliser la réservation.`;

    return message;
  };

  const getAnswerLabel = (questionId: string) => {
    const question = QUESTIONS.find(q => q.id === questionId);
    if (!question) return answers[questionId] || '';
    
    const option = question.options?.find(opt => opt.value === answers[questionId]);
    return option ? option.label : answers[questionId] || '';
  };

  const handleReservation = () => {
    // Fermer le modal
    onClose();
    
    // Déclencher l'ouverture du modal de réservation
    const event = new CustomEvent('openReservationModal', {
      detail: {
        packId: getPackIdFromRecommendation(),
        message: generateReservationMessage()
      }
    });
    window.dispatchEvent(event);
  };

  const getPackIdFromRecommendation = () => {
    if (!recommendation) return undefined;
    
    // Mapper le nom du pack vers l'ID utilisé dans le système
    const packNameToId: Record<string, number> = {
      'Pack STANDARD': 2,
      'Pack PREMIUM': 3,
      'Pack PRESTIGE': 5
    };
    
    return packNameToId[recommendation.pack.name];
  };

  const handleCallback = () => {
    // Chercher un lien de rappel ou numéro de téléphone
    const callbackSelectors = [
      'a[href^="tel:"]',
      'a[href^="mailto:"]',
      '[data-callback]',
      '.callback-btn'
    ];

    let callbackElement = null;
    for (const selector of callbackSelectors) {
      callbackElement = document.querySelector(selector);
      if (callbackElement) break;
    }

    if (callbackElement) {
      (callbackElement as HTMLElement).click();
    } else {
      // Fallback: afficher les coordonnées de contact
      alert('Contactez-nous au 01 23 45 67 89 ou par email');
    }
  };

  const renderContent = () => {
    if (currentStep >= QUESTIONS.length) {
      return renderRecommendation();
    }

    const question = QUESTIONS[currentStep];

    return (
      <>
        <div className="flex gap-2 mb-6">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i <= currentStep ? 'bg-orange-500' : 'bg-gray-300'
              } ${i < currentStep ? 'bg-green-500' : ''}`}
            />
          ))}
        </div>

        <div className="text-xl font-semibold text-gray-900 mb-5 leading-relaxed">
          {question.question}
        </div>

        {question.type === 'single' ? (
          <div className="space-y-3">
            {question.options?.map(option => (
              <button
                key={option.value}
                className={`w-full flex items-center gap-3 p-4 border-2 rounded-xl transition-all text-left ${
                  answers[question.id] === option.value
                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                    : 'border-gray-200 hover:border-orange-500 hover:bg-orange-50'
                }`}
                onClick={() => handleAnswerChange(question.id, option.value)}
              >
                <span className="text-2xl">{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <input
            type="text"
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
            placeholder={question.placeholder}
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          />
        )}

        <div className="flex gap-3 mt-6">
          {currentStep > 0 && (
            <button
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              onClick={prevStep}
            >
              Précédent
            </button>
          )}
          <button
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              canProceed()
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={nextStep}
            disabled={!canProceed()}
          >
            {currentStep === QUESTIONS.length - 1 ? 'Voir la recommandation' : 'Suivant'}
          </button>
        </div>
      </>
    );
  };

  const renderRecommendation = () => {
    if (!recommendation) return null;

    const { pack, confidence, reasons } = recommendation;
    const confidencePercent = Math.round(confidence * 100);

    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">Notre recommandation</h2>
        
        <div className="border-2 border-orange-500 rounded-xl p-5 mb-5 bg-orange-50">
          <div className="text-2xl font-bold text-orange-600 mb-2">{pack.name}</div>
          <div className="text-3xl font-bold text-gray-900 mb-3">{pack.priceText}</div>
          <div className="text-gray-600 mb-4 leading-relaxed">{pack.description}</div>
          
          <ul className="text-left mb-5">
            {pack.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="py-1 text-gray-700">
                ✓ {feature}
              </li>
            ))}
          </ul>

          <div className="bg-gray-200 h-2 rounded-full mb-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-orange-500 to-green-500 h-full transition-all duration-500"
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
          <div className="text-sm text-gray-600">Confiance: {confidencePercent}%</div>
        </div>

        <div className="mb-5 p-4 bg-gray-50 rounded-lg">
          <strong>Pourquoi ce pack ?</strong>
          <ul className="mt-2 pl-5 text-left">
            {reasons.map((reason, index) => (
              <li key={index} className="py-1">{reason}</li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3 mb-4">
          <button
            className="flex-1 py-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            onClick={handleReservation}
          >
            Réserver maintenant
          </button>
          <button
            className="flex-1 py-4 bg-gray-100 text-gray-700 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            onClick={handleCallback}
          >
            Être rappelé
          </button>
        </div>

        <div className="text-sm text-gray-600">
          Recommandation basée sur vos réponses. Ajustable après échange avec un conseiller.
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
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <div className="text-xl font-bold">Assistant SND Rush</div>
              <div className="text-orange-100 text-sm">Trouvez le pack parfait pour votre événement</div>
            </div>
          </div>
          <button
            className="bg-transparent border-none text-white text-2xl cursor-pointer p-1 rounded hover:bg-white/20 transition-colors"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 max-h-[500px] overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
