// Assistant SoundRush Paris refactorisé avec nouvelle UI et logique complète
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Answers, Step, STEPS, PRICING_CONFIG, ReservationPayload, Recommendation } from '@/types/assistant';
import { recommendPack, computePrice, isUrgent, validateStep } from '@/lib/assistant-logic';
import { recommendPackWithStock } from '@/lib/assistant-recommendation';
import { processReservation } from '@/lib/assistant-api';
import { trackAssistantEvent } from '@/lib/analytics';
import { useCart } from '@/contexts/CartContext';
import { CartItem, ProductAddon } from '@/types/db';
import { fetchProductsByCategory, AssistantProduct } from '@/lib/assistant-products';
import Chip from './assistant/Chip';
import Radio from './assistant/Radio';
import Input from './assistant/Input';
import ErrorText from './assistant/ErrorText';
import ReservationModal from './assistant/ReservationModal';
import QuantitySelector from './assistant/QuantitySelector';

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
  const [accessories, setAccessories] = useState<AssistantProduct[]>([]);
  const [loadingAccessories, setLoadingAccessories] = useState(false);
  const [speakers, setSpeakers] = useState<AssistantProduct[]>([]);
  const [subwoofers, setSubwoofers] = useState<AssistantProduct[]>([]);
  const [loadingSpeakers, setLoadingSpeakers] = useState(false);
  const [speakerQuantities, setSpeakerQuantities] = useState<Record<string, number>>({});
  const [subwooferQuantities, setSubwooferQuantities] = useState<Record<string, number>>({});
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
      setAccessories([]);
      setSpeakers([]);
      setSubwoofers([]);
      setSpeakerQuantities({});
      setSubwooferQuantities({});
      
      // Track assistant start
      trackAssistantEvent.started();
    }
  }, [isOpen]);

  // Charger les accessoires, enceintes et caissons quand on arrive à l'étape extras
  useEffect(() => {
    const step = STEPS[currentStep];
    if (step?.id === 'extras') {
      // Toujours charger les accessoires
      if (accessories.length === 0 && !loadingAccessories) {
        setLoadingAccessories(true);
        fetchProductsByCategory('accessoires')
          .then((products) => {
            const availableAccessories = products.filter(
              (p) => p.quantity > 0 && p.dailyPrice > 0
            );
            setAccessories(availableAccessories);
          })
          .catch((error) => {
            console.error('Erreur lors du chargement des accessoires:', error);
          })
          .finally(() => {
            setLoadingAccessories(false);
          });
      }

      // Charger les enceintes et caissons si guests > 250
      const guestsValue = answers.guests;
      const needsMorePower = guestsValue === '200+' || (typeof guestsValue === 'string' && parseInt(guestsValue) >= 200);
      
      if (needsMorePower && speakers.length === 0 && subwoofers.length === 0 && !loadingSpeakers) {
        setLoadingSpeakers(true);
        Promise.all([
          fetchProductsByCategory('sonorisation')
        ])
          .then(([sonorisationProducts]) => {
            // Filtrer les enceintes (nom contient "enceinte" ou "speaker" mais pas "caisson" ni "sub")
            const availableSpeakers = sonorisationProducts.filter(
              (p) => {
                const nameLower = p.name.toLowerCase();
                return p.quantity > 0 && 
                       p.dailyPrice > 0 &&
                       (nameLower.includes('enceinte') || nameLower.includes('speaker') || nameLower.includes('haut-parleur')) &&
                       !nameLower.includes('caisson') &&
                       !nameLower.includes('sub');
              }
            );
            
            // Filtrer les caissons de basse
            const availableSubwoofers = sonorisationProducts.filter(
              (p) => {
                const nameLower = p.name.toLowerCase();
                return p.quantity > 0 && 
                       p.dailyPrice > 0 &&
                       (nameLower.includes('caisson') || nameLower.includes('sub') || nameLower.includes('basse'));
              }
            );
            
            setSpeakers(availableSpeakers);
            setSubwoofers(availableSubwoofers);
            
            // Suggestion automatique : pré-sélectionner 1 caisson ou 1 enceinte si 200+ personnes
            // Priorité au caisson de basse, sinon une enceinte
            if (availableSubwoofers.length > 0) {
              const suggestedSub = availableSubwoofers[0];
              setSubwooferQuantities({ [suggestedSub.id]: 1 });
            } else if (availableSpeakers.length > 0) {
              const suggestedSpeaker = availableSpeakers[0];
              setSpeakerQuantities({ [suggestedSpeaker.id]: 1 });
            }
          })
          .catch((error) => {
            console.error('Erreur lors du chargement des enceintes/caissons:', error);
          })
          .finally(() => {
            setLoadingSpeakers(false);
          });
      }
    }
  }, [currentStep, accessories.length, loadingAccessories, speakers.length, subwoofers.length, loadingSpeakers, answers.guests]);

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

      // Utiliser la validation personnalisée de l'étape si elle existe (pour endDate qui doit être >= startDate)
      let isValid: boolean;
      if (step.validation) {
        isValid = step.validation(value, answers);
      } else {
        isValid = validateStep(step.id, value);
      }
      
      if (!isValid) {
        setErrors({ ...errors, [step.id]: step.id === 'endDate' ? 'La date de fin doit être supérieure ou égale à la date de début' : 'Valeur invalide' });
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
    
    // Utiliser la validation personnalisée de l'étape si elle existe
    if (step.validation) {
      return step.validation(value, answers);
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
    const startDate = answers.startDate || new Date().toISOString().split('T')[0];
    const endDate = answers.endDate || answers.startDate || new Date().toISOString().split('T')[0];
    
    // Calculer les jours de location (par défaut 1 jour)
    let rentalDays = 1;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      rentalDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1); // +1 car inclusif
    }

    // Mapper le pack ID avec les images correspondantes
    const packIdMapping: Record<string, { id: number; image: string; deposit: number }> = {
      'pack_petit': { id: 1, image: '/pack2c.jpg', deposit: 700 },
      'pack_confort': { id: 2, image: '/pack2cc.jpg', deposit: 1100 },
      'pack_grand': { id: 3, image: '/pack4cc.jpg', deposit: 1600 },
      'pack_maxi': { id: 5, image: '/concert.jpg', deposit: 500 },
    };
    
    const packInfo = packIdMapping[recommendation.pack.id] || { id: 2, image: '/pack2cc.jpg', deposit: 1100 };

    // Convertir les extras en addons pour le panier
    const addons: ProductAddon[] = [];
    const accessoryItems: CartItem[] = [];
    
    if (answers.extras) {
      for (const extra of answers.extras) {
        // Gérer les extras standards (micros, technicien)
        if (extra === 'micros_filaire') {
          addons.push({ id: 'micro-fil', name: 'Micro filaire', price: 10 });
        } else if (extra === 'micros_sans_fil') {
          addons.push({ id: 'micro-sans-fil', name: 'Micro sans fil', price: 20 });
        } else if (extra === 'technicien') {
          addons.push({ id: 'technicien', name: 'Technicien sur place', price: 150 });
        } 
        // Gérer les accessoires du catalogue (format: accessory_123)
        else if (extra.startsWith('accessory_')) {
          const accessoryId = extra.replace('accessory_', '');
          const accessory = accessories.find(a => a.id === accessoryId);
          if (accessory) {
            // Ajouter l'accessoire comme un item séparé dans le panier
            const accessoryCartItem: CartItem = {
              productId: accessory.id,
              productName: accessory.name,
              productSlug: accessory.slug,
              quantity: 1,
              rentalDays: rentalDays,
              startDate: startDate,
              endDate: endDate,
              dailyPrice: accessory.dailyPrice,
              deposit: accessory.deposit || 0,
              addons: [],
              images: accessory.images || [],
            };
            accessoryItems.push(accessoryCartItem);
          }
        }
      }
    }

    // Ajouter les enceintes sélectionnées au panier
    Object.entries(speakerQuantities).forEach(([productId, quantity]) => {
      if (quantity > 0) {
        const speaker = speakers.find(s => s.id === productId);
        if (speaker) {
          const speakerCartItem: CartItem = {
            productId: speaker.id,
            productName: speaker.name,
            productSlug: speaker.slug,
            quantity: quantity,
            rentalDays: rentalDays,
            startDate: startDate,
            endDate: endDate,
            dailyPrice: speaker.dailyPrice,
            deposit: speaker.deposit || 0,
            addons: [],
            images: speaker.images || [],
          };
          accessoryItems.push(speakerCartItem);
        }
      }
    });

    // Ajouter les caissons sélectionnés au panier
    Object.entries(subwooferQuantities).forEach(([productId, quantity]) => {
      if (quantity > 0) {
        const subwoofer = subwoofers.find(s => s.id === productId);
        if (subwoofer) {
          const subwooferCartItem: CartItem = {
            productId: subwoofer.id,
            productName: subwoofer.name,
            productSlug: subwoofer.slug,
            quantity: quantity,
            rentalDays: rentalDays,
            startDate: startDate,
            endDate: endDate,
            dailyPrice: subwoofer.dailyPrice,
            deposit: subwoofer.deposit || 0,
            addons: [],
            images: subwoofer.images || [],
          };
          accessoryItems.push(subwooferCartItem);
        }
      }
    });

    // Créer l'item du panier avec tous les détails
    const cartItem: CartItem = {
      productId: `pack-${packInfo.id}`,
      productName: recommendation.pack.name, // Utiliser le nom exact du pack
      productSlug: `pack-${packInfo.id}`,
      quantity: 1,
      rentalDays: rentalDays,
      startDate: startDate,
      endDate: endDate,
      dailyPrice: recommendation.breakdown.base,
      deposit: packInfo.deposit,
      addons: addons,
      images: [packInfo.image],
      // Détails de l'événement
      eventType: answers.eventType,
      startTime: answers.startTime,
      endTime: answers.endTime,
      zone: answers.zone,
      metadata: {
        guests: answers.guests,
        environment: answers.environment,
        needs: answers.needs,
        urgency: isUrgent(answers.startDate || '', answers.startTime),
        breakdown: recommendation.breakdown,
      },
    };

    addToCart(cartItem);

    // Ajouter les accessoires comme items séparés
    accessoryItems.forEach((item) => {
      addToCart(item);
    });

    // Ajouter la livraison comme item séparé si une zone est sélectionnée
    if (answers.zone && answers.zone !== 'retrait') {
      const deliveryPrices: Record<string, number> = {
        paris: 80,
        petite: 120,
        grande: 160,
      };
      
      const deliveryPrice = deliveryPrices[answers.zone] || 0;
      if (deliveryPrice > 0) {
        const deliveryItem: CartItem = {
          productId: `delivery-${answers.zone}`,
          productName: language === 'fr' 
            ? `Livraison ${answers.zone === 'paris' ? 'Paris' : answers.zone === 'petite' ? 'Petite Couronne' : 'Grande Couronne'}`
            : `Delivery ${answers.zone === 'paris' ? 'Paris' : answers.zone === 'petite' ? 'Inner suburbs' : 'Outer suburbs'}`,
          productSlug: `delivery-${answers.zone}`,
          quantity: 1,
          rentalDays: 1,
          startDate: startDate,
          endDate: endDate,
          dailyPrice: deliveryPrice,
          deposit: 0,
          addons: [],
          images: ['/livraison.jpg'],
        };
        addToCart(deliveryItem);
      }
    }
    
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
      `Bonjour, j'ai utilisé l'assistant SoundRush Paris et j'aimerais parler avec un expert pour finaliser ma réservation.`
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
              {/* Options par défaut (micros, technicien) */}
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
              
              {/* Accessoires du catalogue */}
              {step.id === 'extras' && (
                <>
                  {loadingAccessories && (
                    <div className="text-center py-4 text-gray-500">
                      {language === 'fr' ? 'Chargement des accessoires...' : 'Loading accessories...'}
                    </div>
                  )}
                  {!loadingAccessories && accessories.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {language === 'fr' ? 'Accessoires du catalogue' : 'Catalogue accessories'}
                      </h3>
                      <div className="space-y-3">
                        {accessories.map((accessory) => {
                          const accessoryValue = `accessory_${accessory.id}`;
                          const isSelected = Array.isArray(value) ? value.includes(accessoryValue) : false;
                          return (
                            <Chip
                              key={accessory.id}
                              value={accessoryValue}
                              label={`${accessory.name} (+${accessory.dailyPrice} €)`}
                              icon="📦"
                              price={accessory.dailyPrice}
                              selected={isSelected}
                              onClick={(val) => {
                                const currentValues = Array.isArray(value) ? value : [];
                                const newValues = currentValues.includes(val)
                                  ? currentValues.filter(v => v !== val)
                                  : [...currentValues, val];
                                handleAnswerChange(step.id, newValues);
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Enceintes et caissons pour événements 200+ personnes */}
                  {(answers.guests === '200+' || (typeof answers.guests === 'string' && parseInt(answers.guests) >= 200)) && (
                    <>
                      {loadingSpeakers && (
                        <div className="text-center py-4 text-gray-500">
                          {language === 'fr' ? 'Chargement des enceintes et caissons...' : 'Loading speakers and subwoofers...'}
                        </div>
                      )}
                      
                      {!loadingSpeakers && (speakers.length > 0 || subwoofers.length > 0) && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {language === 'fr' ? 'Enceintes et caissons supplémentaires' : 'Additional speakers and subwoofers'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            {language === 'fr' 
                              ? 'Pour un événement de 200+ personnes, nous recommandons d\'ajouter des enceintes ou un caisson de basse pour une puissance sonore optimale.'
                              : 'For events with 200+ people, we recommend adding speakers or a subwoofer for optimal sound power.'}
                          </p>
                          
                          {/* Caissons de basse */}
                          {subwoofers.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-md font-semibold text-gray-800 mb-3">
                                {language === 'fr' ? 'Caissons de basse' : 'Subwoofers'}
                              </h4>
                              <div className="space-y-3">
                                {subwoofers.map((subwoofer) => {
                                  const currentQuantity = subwooferQuantities[subwoofer.id] || 0;
                                  // Marquer comme suggéré si c'est le premier caisson et qu'il est pré-sélectionné automatiquement
                                  const isSuggested = subwoofers[0]?.id === subwoofer.id && currentQuantity === 1 &&
                                                    Object.keys(subwooferQuantities).length === 1 &&
                                                    Object.keys(speakerQuantities).length === 0;
                                  return (
                                    <QuantitySelector
                                      key={subwoofer.id}
                                      productId={subwoofer.id}
                                      productName={subwoofer.name}
                                      price={subwoofer.dailyPrice}
                                      icon="🔊"
                                      quantity={currentQuantity}
                                      onQuantityChange={(productId, quantity) => {
                                        setSubwooferQuantities(prev => ({
                                          ...prev,
                                          [productId]: quantity
                                        }));
                                      }}
                                      maxQuantity={subwoofer.quantity}
                                      suggested={isSuggested && currentQuantity === 1}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Enceintes */}
                          {speakers.length > 0 && (
                            <div>
                              <h4 className="text-md font-semibold text-gray-800 mb-3">
                                {language === 'fr' ? 'Enceintes' : 'Speakers'}
                              </h4>
                              <div className="space-y-3">
                                {speakers.map((speaker) => {
                                  const currentQuantity = speakerQuantities[speaker.id] || 0;
                                  // Marquer comme suggéré si c'est la première enceinte et qu'elle est pré-sélectionnée automatiquement
                                  const isSuggested = subwoofers.length === 0 && 
                                                    speakers[0]?.id === speaker.id && 
                                                    currentQuantity === 1 &&
                                                    Object.keys(subwooferQuantities).length === 0 &&
                                                    Object.keys(speakerQuantities).length === 1;
                                  return (
                                    <QuantitySelector
                                      key={speaker.id}
                                      productId={speaker.id}
                                      productName={speaker.name}
                                      price={speaker.dailyPrice}
                                      icon="🔊"
                                      quantity={currentQuantity}
                                      onQuantityChange={(productId, quantity) => {
                                        setSpeakerQuantities(prev => ({
                                          ...prev,
                                          [productId]: quantity
                                        }));
                                      }}
                                      maxQuantity={speaker.quantity}
                                      suggested={isSuggested && currentQuantity === 1}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
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

          {(step.id === 'startTime' || step.id === 'endTime') && (
            <Input
              type="text"
              value={value as string || ''}
              onChange={(val) => handleAnswerChange(step.id, val)}
              placeholder={step.id === 'startTime' ? "Ex: 19h00, 20h30..." : "Ex: 23h00, 00h30..."}
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
    // Utiliser recommendPack standard (la vérification de stock se fait côté serveur lors de la réservation)
    const recommendation = recommendPack(answers);
    if (!recommendation) return null;

    const isUrgentEvent = isUrgent(answers.startDate || '', answers.startTime);
    
    // Calculer le prix des accessoires sélectionnés
    const accessoriesPrice = answers.extras?.reduce((total, extra) => {
      if (extra.startsWith('accessory_')) {
        const accessoryId = extra.replace('accessory_', '');
        const accessory = accessories.find(a => a.id === accessoryId);
        if (accessory) {
          return total + accessory.dailyPrice;
        }
      }
      return total;
    }, 0) || 0;
    
    // Calculer le prix des enceintes sélectionnées
    const speakersPrice = Object.entries(speakerQuantities).reduce((total, [productId, quantity]) => {
      if (quantity > 0) {
        const speaker = speakers.find(s => s.id === productId);
        if (speaker) {
          return total + (speaker.dailyPrice * quantity);
        }
      }
      return total;
    }, 0);
    
    // Calculer le prix des caissons sélectionnés
    const subwoofersPrice = Object.entries(subwooferQuantities).reduce((total, [productId, quantity]) => {
      if (quantity > 0) {
        const subwoofer = subwoofers.find(s => s.id === productId);
        if (subwoofer) {
          return total + (subwoofer.dailyPrice * quantity);
        }
      }
      return total;
    }, 0);
    
    // Ajuster le breakdown pour inclure les accessoires, enceintes et caissons
    const adjustedBreakdown = {
      ...recommendation.breakdown,
      extras: recommendation.breakdown.extras + accessoriesPrice + speakersPrice + subwoofersPrice,
    };
    
    const adjustedTotalPrice = recommendation.totalPrice + accessoriesPrice + speakersPrice + subwoofersPrice;
    
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
                <span>{adjustedBreakdown.base} €</span>
              </div>
              <div className="flex justify-between">
                <span>Livraison A/R :</span>
                <span>{adjustedBreakdown.delivery} €</span>
              </div>
              {adjustedBreakdown.extras > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Options :</span>
                    <span>{adjustedBreakdown.extras} €</span>
                  </div>
                  {/* Détail des enceintes et caissons */}
                  {speakersPrice > 0 && (
                    <div className="flex justify-between text-xs text-gray-600 pl-4">
                      <span>Enceintes supplémentaires :</span>
                      <span>{speakersPrice} €</span>
                    </div>
                  )}
                  {subwoofersPrice > 0 && (
                    <div className="flex justify-between text-xs text-gray-600 pl-4">
                      <span>Caissons de basse :</span>
                      <span>{subwoofersPrice} €</span>
                    </div>
                  )}
                </>
              )}
              {adjustedBreakdown.urgency > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Majoration urgence :</span>
                  <span>{adjustedBreakdown.urgency} €</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total TTC :</span>
                <span className="text-[#e27431]">{adjustedTotalPrice} €</span>
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
                  <h1 id="assistant-title" className="text-2xl font-bold mb-1">Assistant SoundRush Paris</h1>
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
