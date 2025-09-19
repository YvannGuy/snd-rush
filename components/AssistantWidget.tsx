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
  maxQuestions: 7,
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
    id: 'logistics',
    question: 'Comment souhaitez-vous récupérer votre matériel ?',
    type: 'single',
    options: [
      { value: 'retrait', label: 'Retrait sur place', icon: '🚗' },
      { value: 'livraison', label: 'Livraison + Installation', icon: '🚚' },
      { value: 'technicien', label: 'Technicien sur place', icon: '👨‍🔧' }
    ]
  },
  {
    id: 'date',
    question: 'Quelle est la date de votre événement ?',
    type: 'text',
    placeholder: 'Ex: 15 juin 2024, Samedi 20 juillet...'
  }
];


// Composant principal
const AssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Réinitialiser l'état à chaque actualisation de page
  useEffect(() => {
    setIsOpen(false);
    setCurrentStep(0);
    setShowHelpPopup(false);
    setHasInteracted(false);
  }, []);
  
  const packs = usePacks();
  const { answers, setAnswers, recommendation, setRecommendation, saveDraft } = useAssistantPersistence();
  const currentRecommendation = useRecommendation(answers, packs);

  // Popup d'aide automatique après 10 secondes
  useEffect(() => {
    if (!hasInteracted) {
      const timer = setTimeout(() => {
        setShowHelpPopup(true);
      }, 10000); // 10 secondes

      return () => clearTimeout(timer);
    }
  }, [hasInteracted]);

  // Debug: forcer l'affichage du popup pour les tests
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'h' && e.ctrlKey) {
        setShowHelpPopup(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Masquer le popup d'aide après 5 secondes
  useEffect(() => {
    if (showHelpPopup) {
      const timer = setTimeout(() => {
        setShowHelpPopup(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showHelpPopup]);

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
    message += `- Logistique : ${getAnswerLabel('logistics')}\n`;
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
    // Fermer l'assistant
    setIsOpen(false);
    
    // Déclencher l'ouverture du modal de réservation
    // On utilise un événement personnalisé pour communiquer avec le composant parent
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

  const prefillForm = (message: string) => {
    // Chercher les champs du formulaire
    const nameField = document.querySelector('input[name*="name"], input[name*="nom"]') as HTMLInputElement;
    const emailField = document.querySelector('input[name*="email"], input[name*="mail"]') as HTMLInputElement;
    const dateField = document.querySelector('input[name*="date"]') as HTMLInputElement;
    const messageField = document.querySelector('textarea[name*="message"], textarea[name*="comment"]') as HTMLTextAreaElement;

    if (messageField) {
      messageField.value = message;
      messageField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (dateField && answers.date) {
      dateField.value = answers.date;
      dateField.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      // Fallback pour anciens navigateurs
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const showToast = (message: string) => {
    // Créer un toast simple
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${CONFIG.accentColor};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      document.body.removeChild(toast);
    }, 4000);
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
      showToast('Contactez-nous au 01 23 45 67 89 ou par email');
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

  const handleRobotClick = () => {
    setHasInteracted(true);
    setShowHelpPopup(false);
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-20 right-6 z-50 font-sans">
      {/* Popup d'aide automatique */}
      {showHelpPopup && (
        <div className="absolute bottom-16 right-0 bg-white rounded-xl shadow-xl border border-gray-200 p-4 max-w-xs animate-bounce z-60">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🤖</div>
            <div>
              <div className="font-semibold text-gray-900 mb-1">Besoin d'aide ?</div>
              <div className="text-sm text-gray-600 mb-3">
                Notre assistant vous aide à choisir le pack de sonorisation adapté à votre événement.
              </div>
              <button
                className="text-xs bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600 transition-colors"
                onClick={handleRobotClick}
              >
                Commencer
              </button>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600 text-sm"
              onClick={() => setShowHelpPopup(false)}
            >
              ×
            </button>
          </div>
          {/* Flèche pointant vers le robot */}
          <div className="absolute bottom-[-8px] right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
        </div>
      )}

      {/* Icône robot discrète */}
      <button
        className="w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105 focus:outline-2 focus:outline-orange-500 focus:outline-offset-2"
        onClick={handleRobotClick}
        aria-label="Assistant SND Rush"
      >
        <span className="text-xl">🤖</span>
      </button>

      {/* Panneau principal */}
      <div
        className={`absolute bottom-16 right-0 w-96 max-w-[calc(100vw-40px)] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden transition-all duration-300 ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-5 flex justify-between items-center">
          <div className="text-lg font-semibold">Assistant SND Rush</div>
          <button
            className="bg-transparent border-none text-white text-2xl cursor-pointer p-1 rounded hover:bg-white/20 transition-colors"
            onClick={() => setIsOpen(false)}
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
};

export default AssistantWidget;
