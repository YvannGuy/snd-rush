// Assistant SoundRush Paris refactorisé avec nouvelle UI et logique complète
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Answers, Step, STEPS, PRICING_CONFIG, ReservationPayload, Recommendation } from '@/types/assistant';
import { recommendPack, computePrice, isUrgent, validateStep } from '@/lib/assistant-logic';
import { recommendPackWithStock } from '@/lib/assistant-recommendation';
import { processReservation } from '@/lib/assistant-api';
import { trackAssistantEvent } from '@/lib/analytics';
import { useCart } from '@/contexts/CartContext';
import { CartItem, ProductAddon } from '@/types/db';
import { fetchProductsByCategory, AssistantProduct, getPacksInfo } from '@/lib/assistant-products';
import { calculateInstallationPrice } from '@/lib/calculateInstallationPrice';
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
  mode?: 'modal' | 'chatbox'; // Nouveau prop pour le mode
}

export default function AssistantRefactored({ 
  isOpen, 
  onClose, 
  language = 'fr',
  onReservationComplete,
  onRentalConditionsClick,
  mode = 'modal'
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

  // Fonction pour mapper le nom du caisson dans l'assistant
  const getSubwooferDisplayName = (subwoofer: AssistantProduct): string => {
    const nameLower = subwoofer.name.toLowerCase();
    // Si c'est le caisson de basse 18", afficher "FBT X-Lite 115A"
    if (nameLower.includes('caisson de basse') && nameLower.includes('18')) {
      return 'FBT X-Lite 115A';
    }
    // Sinon, retourner le nom original
    return subwoofer.name;
  };
  const [wiredMics, setWiredMics] = useState<AssistantProduct[]>([]);
  const [wirelessMics, setWirelessMics] = useState<AssistantProduct[]>([]);
  const [loadingMics, setLoadingMics] = useState(false);
  const [wiredMicQuantities, setWiredMicQuantities] = useState<Record<string, number>>({});
  const [wirelessMicQuantities, setWirelessMicQuantities] = useState<Record<string, number>>({});
  const [installationPrice, setInstallationPrice] = useState<number>(0);
  const [isUrgentEventCached, setIsUrgentEventCached] = useState<boolean | null>(null);
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
      setWiredMics([]);
      setWirelessMics([]);
      setWiredMicQuantities({});
      setWirelessMicQuantities({});
      
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

      // Charger les enceintes et caissons si guests >= 200 OU si extérieur/musique festive (pour l'étape extras)
      const guestsValue = answers.guests;
      const shouldLoadSpeakers = guestsValue === '200+' || 
                                 (typeof guestsValue === 'string' && parseInt(guestsValue) >= 200) ||
                                 answers.environment === 'exterieur' ||
                                 answers.eventType === 'soiree' ||
                                 answers.eventType === 'anniversaire';
      
      if (shouldLoadSpeakers && speakers.length === 0 && subwoofers.length === 0 && !loadingSpeakers) {
        setLoadingSpeakers(true);
        Promise.all([
          fetchProductsByCategory('sonorisation')
        ])
          .then(([sonorisationProducts]) => {
            console.log('Produits sonorisation chargés (extras):', sonorisationProducts);
            
            // Filtrer les enceintes (nom contient "enceinte", "speaker", "haut-parleur" OU des noms spécifiques comme FBT, Mac Mah)
            const availableSpeakers = sonorisationProducts.filter(
              (p) => {
                const nameLower = p.name.toLowerCase();
                
                // Exclure explicitement "FBT X-Lite 115A" (c'est un caisson, pas une enceinte)
                const isFBTXlite115A = (nameLower.includes('fbt') && nameLower.includes('xlite') && nameLower.includes('115')) ||
                                       (nameLower.includes('fbt') && nameLower.includes('xlite') && nameLower.includes('115a'));
                if (isFBTXlite115A) {
                  return false;
                }
                
                const isSpeaker = 
                  nameLower.includes('enceinte') || 
                  nameLower.includes('speaker') || 
                  nameLower.includes('haut-parleur') ||
                  (nameLower.includes('fbt') && !nameLower.includes('115')) ||
                  (nameLower.includes('xlite') && !nameLower.includes('115')) ||
                  nameLower.includes('mac mah') ||
                  nameLower.includes('as108') ||
                  (nameLower.includes('as115') && !nameLower.includes('xlite'));
                
                const isNotSubwoofer = 
                  !nameLower.includes('caisson') && 
                  !nameLower.includes('sub') && 
                  !nameLower.includes('basse');
                
                return p.quantity > 0 && 
                       p.dailyPrice > 0 &&
                       isSpeaker &&
                       isNotSubwoofer;
              }
            );
            
            // Filtrer les caissons de basse
            const availableSubwoofers = sonorisationProducts.filter(
              (p) => {
                const nameLower = p.name.toLowerCase();
                
                // Inclure explicitement "FBT X-Lite 115A"
                const isFBTXlite115A = (nameLower.includes('fbt') && nameLower.includes('xlite') && nameLower.includes('115')) ||
                                       (nameLower.includes('fbt') && nameLower.includes('xlite') && nameLower.includes('115a'));
                
                return p.quantity > 0 && 
                       p.dailyPrice > 0 &&
                       (isFBTXlite115A ||
                        nameLower.includes('caisson') || 
                        nameLower.includes('sub') || 
                        nameLower.includes('basse'));
              }
            );
            
            console.log('Enceintes filtrées (extras):', availableSpeakers);
            console.log('Caissons filtrés (extras):', availableSubwoofers);
            
            setSpeakers(availableSpeakers);
            setSubwoofers(availableSubwoofers);
            
            // Suggestion automatique selon le contexte et le nombre de personnes
            const shouldSuggest = answers.environment === 'exterieur' ||
                                 answers.eventType === 'soiree' ||
                                 answers.eventType === 'anniversaire' ||
                                 guestsValue === '200+' ||
                                 (typeof guestsValue === 'string' && parseInt(guestsValue) >= 200);
            
            if (shouldSuggest) {
              // Suggestion intelligente selon le nombre de personnes
              let guestCount = 0;
              if (guestsValue === '0-50') guestCount = 50;
              else if (guestsValue === '50-100') guestCount = 100;
              else if (guestsValue === '100-200') guestCount = 200;
              else if (guestsValue === '200+') guestCount = 250;
              else if (typeof guestsValue === 'string') guestCount = parseInt(guestsValue) || 0;
              
              // Pour 200+ personnes ou extérieur : priorité au caisson de basse
              if (guestCount >= 200 || answers.environment === 'exterieur') {
                if (availableSubwoofers.length > 0) {
                  const suggestedSub = availableSubwoofers[0];
                  setSubwooferQuantities({ [suggestedSub.id]: 1 });
                } else if (availableSpeakers.length > 0) {
                  // Chercher une enceinte plus puissante (FBT X-Lite)
                  const powerfulSpeaker = availableSpeakers.find(s => 
                    s.name.toLowerCase().includes('fbt') || s.name.toLowerCase().includes('xlite')
                  ) || availableSpeakers[0];
                  setSpeakerQuantities({ [powerfulSpeaker.id]: 1 });
                }
              } else if (guestCount >= 100) {
                // Pour 100-200 personnes : enceinte supplémentaire (Mac Mah AS115 ou FBT)
                if (availableSpeakers.length > 0) {
                  const suggestedSpeaker = availableSpeakers.find(s => 
                    s.name.toLowerCase().includes('as115') || 
                    s.name.toLowerCase().includes('fbt') ||
                    s.name.toLowerCase().includes('xlite')
                  ) || availableSpeakers[0];
                  setSpeakerQuantities({ [suggestedSpeaker.id]: 1 });
                }
              } else {
                // Pour moins de 100 personnes : caisson de basse si disponible
                if (availableSubwoofers.length > 0) {
                  const suggestedSub = availableSubwoofers[0];
                  setSubwooferQuantities({ [suggestedSub.id]: 1 });
                }
              }
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
  }, [currentStep, accessories.length, loadingAccessories, speakers.length, subwoofers.length, loadingSpeakers, answers.guests, answers.morePower, answers.environment, answers.eventType]);

  // Charger les micros quand on arrive à l'étape micros
  useEffect(() => {
    const step = STEPS[currentStep];
    if (step?.id === 'micros' && wiredMics.length === 0 && wirelessMics.length === 0 && !loadingMics) {
      setLoadingMics(true);
      fetchProductsByCategory('micros')
        .then((products) => {
          // Filtrer les micros filaires
          const availableWiredMics = products.filter(
            (p) => {
              const nameLower = p.name.toLowerCase();
              return p.quantity > 0 && 
                     p.dailyPrice > 0 &&
                     (nameLower.includes('filaire') || nameLower.includes('wired') || nameLower.includes('shure sm58') || 
                      (!nameLower.includes('sans fil') && !nameLower.includes('wireless') && !nameLower.includes('hf')));
            }
          );
          
          // Filtrer les micros sans fil
          const availableWirelessMics = products.filter(
            (p) => {
              const nameLower = p.name.toLowerCase();
              return p.quantity > 0 && 
                     p.dailyPrice > 0 &&
                     (nameLower.includes('sans fil') || nameLower.includes('wireless') || nameLower.includes('hf') || 
                      nameLower.includes('mipro'));
            }
          );
          
          setWiredMics(availableWiredMics);
          setWirelessMics(availableWirelessMics);
          
          // Suggestion automatique selon le type d'événement
          // Mariage/église/corporate → toujours suggérer au moins 1 micro filaire
          if (answers.eventType === 'mariage' || answers.eventType === 'eglise' || answers.eventType === 'corporate') {
            if (availableWiredMics.length > 0) {
              setWiredMicQuantities({ [availableWiredMics[0].id]: 1 });
            }
          }
        })
        .catch((error) => {
          console.error('Erreur lors du chargement des micros:', error);
        })
        .finally(() => {
          setLoadingMics(false);
        });
    }
  }, [currentStep, wiredMics.length, wirelessMics.length, loadingMics, answers.micros, answers.eventType]);

  // Créer des clés stables pour les dépendances des useEffect
  const wiredMicQuantitiesKey = useMemo(() => {
    return Object.entries(wiredMicQuantities)
      .filter(([, qty]) => qty > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, qty]) => `${id}:${qty}`)
      .join(',');
  }, [wiredMicQuantities]);

  const wirelessMicQuantitiesKey = useMemo(() => {
    return Object.entries(wirelessMicQuantities)
      .filter(([, qty]) => qty > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, qty]) => `${id}:${qty}`)
      .join(',');
  }, [wirelessMicQuantities]);

  const speakerQuantitiesKey = useMemo(() => {
    return Object.entries(speakerQuantities)
      .filter(([, qty]) => qty > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, qty]) => `${id}:${qty}`)
      .join(',');
  }, [speakerQuantities]);

  const subwooferQuantitiesKey = useMemo(() => {
    return Object.entries(subwooferQuantities)
      .filter(([, qty]) => qty > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, qty]) => `${id}:${qty}`)
      .join(',');
  }, [subwooferQuantities]);

  // Synchroniser answers.micros avec les quantités de micros sélectionnés
  useEffect(() => {
    const step = STEPS[currentStep];
    if (step?.id === 'micros') {
      const allMicIds = [
        ...Object.keys(wiredMicQuantities).filter(id => wiredMicQuantities[id] > 0),
        ...Object.keys(wirelessMicQuantities).filter(id => wirelessMicQuantities[id] > 0)
      ];
      
      if (allMicIds.length > 0) {
        // Si des micros sont sélectionnés, mettre à jour avec le tableau d'IDs
        setAnswers(prev => {
          const currentMicros = Array.isArray(prev.micros) ? prev.micros : [];
          const currentSorted = [...currentMicros].sort().join(',');
          const newSorted = [...allMicIds].sort().join(',');
          if (currentSorted !== newSorted) {
            return { ...prev, micros: allMicIds };
          }
          return prev;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wiredMicQuantitiesKey, wirelessMicQuantitiesKey, currentStep]);

  // Synchroniser answers.morePower avec les quantités d'enceintes/caissons sélectionnés
  useEffect(() => {
    const step = STEPS[currentStep];
    if (step?.id === 'morePower') {
      const allProductIds = [
        ...Object.keys(speakerQuantities).filter(id => speakerQuantities[id] > 0),
        ...Object.keys(subwooferQuantities).filter(id => subwooferQuantities[id] > 0)
      ];
      
      if (allProductIds.length > 0) {
        // Si des enceintes/caissons sont sélectionnés, mettre à jour avec le tableau d'IDs
        setAnswers(prev => {
          const currentMorePower = Array.isArray(prev.morePower) ? prev.morePower : [];
          const currentSorted = [...currentMorePower].sort().join(',');
          const newSorted = [...allProductIds].sort().join(',');
          if (currentSorted !== newSorted) {
            return { ...prev, morePower: allProductIds };
          }
          return prev;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakerQuantitiesKey, subwooferQuantitiesKey, currentStep]);

  // Charger les enceintes et caissons quand on arrive à l'étape morePower
  useEffect(() => {
    const step = STEPS[currentStep];
    if (step?.id === 'morePower' && speakers.length === 0 && subwoofers.length === 0 && !loadingSpeakers) {
      setLoadingSpeakers(true);
      fetchProductsByCategory('sonorisation')
        .then((sonorisationProducts) => {
          console.log('Produits sonorisation chargés:', sonorisationProducts);
          
          // Filtrer les enceintes (nom contient "enceinte", "speaker", "haut-parleur" OU des noms spécifiques comme FBT, Mac Mah)
          const availableSpeakers = sonorisationProducts.filter(
            (p) => {
              const nameLower = p.name.toLowerCase();
              
              // Exclure explicitement "FBT X-Lite 115A" (c'est un caisson, pas une enceinte)
              const isFBTXlite115A = (nameLower.includes('fbt') && nameLower.includes('xlite') && nameLower.includes('115')) ||
                                     (nameLower.includes('fbt') && nameLower.includes('xlite') && nameLower.includes('115a'));
              if (isFBTXlite115A) {
                return false;
              }
              
              const isSpeaker = 
                nameLower.includes('enceinte') || 
                nameLower.includes('speaker') || 
                nameLower.includes('haut-parleur') ||
                (nameLower.includes('fbt') && !nameLower.includes('115')) ||
                (nameLower.includes('xlite') && !nameLower.includes('115')) ||
                nameLower.includes('mac mah') ||
                nameLower.includes('as108') ||
                (nameLower.includes('as115') && !nameLower.includes('xlite'));
              
              const isNotSubwoofer = 
                !nameLower.includes('caisson') && 
                !nameLower.includes('sub') && 
                !nameLower.includes('basse');
              
              return p.quantity > 0 && 
                     p.dailyPrice > 0 &&
                     isSpeaker &&
                     isNotSubwoofer;
            }
          );
          
          // Filtrer les caissons de basse
          const availableSubwoofers = sonorisationProducts.filter(
            (p) => {
              const nameLower = p.name.toLowerCase();
              
              // Inclure explicitement "FBT X-Lite 115A"
              const isFBTXlite115A = (nameLower.includes('fbt') && nameLower.includes('xlite') && nameLower.includes('115')) ||
                                     (nameLower.includes('fbt') && nameLower.includes('xlite') && nameLower.includes('115a'));
              
              return p.quantity > 0 && 
                     p.dailyPrice > 0 &&
                     (isFBTXlite115A ||
                      nameLower.includes('caisson') || 
                      nameLower.includes('sub') || 
                      nameLower.includes('basse'));
            }
          );
          
          console.log('Enceintes filtrées:', availableSpeakers);
          console.log('Caissons filtrés:', availableSubwoofers);
          
          setSpeakers(availableSpeakers);
          setSubwoofers(availableSubwoofers);
          
          // Suggestion automatique selon le contexte et le nombre de personnes
          // Toujours suggérer quelque chose si on arrive à cette étape
          const guestsValue = answers.guests;
          
          // Suggestion intelligente selon le nombre de personnes
          let guestCount = 0;
          if (guestsValue === '0-50') guestCount = 50;
          else if (guestsValue === '50-100') guestCount = 100;
          else if (guestsValue === '100-200') guestCount = 200;
          else if (guestsValue === '200+') guestCount = 250;
          else if (typeof guestsValue === 'string') guestCount = parseInt(guestsValue) || 0;
          
          // Toujours suggérer quelque chose selon le contexte
          // Pour 200+ personnes ou extérieur : priorité au caisson de basse
          if (guestCount >= 200 || answers.environment === 'exterieur') {
            if (availableSubwoofers.length > 0) {
              const suggestedSub = availableSubwoofers[0];
              setSubwooferQuantities({ [suggestedSub.id]: 1 });
            } else if (availableSpeakers.length > 0) {
              // Chercher une enceinte plus puissante (FBT X-Lite)
              const powerfulSpeaker = availableSpeakers.find(s => 
                s.name.toLowerCase().includes('fbt') || s.name.toLowerCase().includes('xlite')
              ) || availableSpeakers[0];
              setSpeakerQuantities({ [powerfulSpeaker.id]: 1 });
            }
          } else if (guestCount >= 100) {
            // Pour 100-200 personnes : enceinte supplémentaire (Mac Mah AS115 ou FBT)
            if (availableSpeakers.length > 0) {
              const suggestedSpeaker = availableSpeakers.find(s => 
                s.name.toLowerCase().includes('as115') || 
                s.name.toLowerCase().includes('fbt') ||
                s.name.toLowerCase().includes('xlite')
              ) || availableSpeakers[0];
              setSpeakerQuantities({ [suggestedSpeaker.id]: 1 });
            }
          } else if (guestCount > 0) {
            // Pour moins de 100 personnes : caisson de basse si disponible
            if (availableSubwoofers.length > 0) {
              const suggestedSub = availableSubwoofers[0];
              setSubwooferQuantities({ [suggestedSub.id]: 1 });
            } else if (availableSpeakers.length > 0) {
              // Sinon, suggérer une enceinte
              const suggestedSpeaker = availableSpeakers[0];
              setSpeakerQuantities({ [suggestedSpeaker.id]: 1 });
            }
          } else {
            // Par défaut, suggérer un caisson ou une enceinte
            if (availableSubwoofers.length > 0) {
              const suggestedSub = availableSubwoofers[0];
              setSubwooferQuantities({ [suggestedSub.id]: 1 });
            } else if (availableSpeakers.length > 0) {
              const suggestedSpeaker = availableSpeakers[0];
              setSpeakerQuantities({ [suggestedSpeaker.id]: 1 });
            }
          }
        })
        .catch((error) => {
          console.error('Erreur lors du chargement des enceintes/caissons:', error);
        })
        .finally(() => {
          setLoadingSpeakers(false);
        });
    }
  }, [currentStep, speakers.length, subwoofers.length, loadingSpeakers, answers.guests, answers.environment, answers.eventType]);

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
    // Vérifier d'abord si on peut procéder
    if (!canProceed) {
      return;
    }
    
    const step = STEPS[currentStep];
    const value = answers[step.id as keyof Answers];
    
    // Pour les étapes optionnelles (extras, zone), on peut passer même si vide
    if (step.id === 'extras' || step.id === 'zone') {
      // Toujours valide, même si vide
      setErrors({ ...errors, [step.id]: '' });
    } else if (step.id === 'micros') {
      // Étape obligatoire : doit avoir soit 'none', soit des micros sélectionnés
      // Vérifier d'abord les quantités directement (au cas où answers.micros n'est pas encore synchronisé)
      const hasWiredMics = Object.values(wiredMicQuantities).some(qty => qty > 0);
      const hasWirelessMics = Object.values(wirelessMicQuantities).some(qty => qty > 0);
      const hasSelectedMics = hasWiredMics || hasWirelessMics;
      
      // Si des micros sont sélectionnés via les quantités, c'est valide
      if (hasSelectedMics) {
        setErrors({ ...errors, [step.id]: '' });
      } else if (Array.isArray(value)) {
        // Si c'est un tableau mais vide, erreur
        if (value.length === 0) {
          setErrors({ ...errors, [step.id]: language === 'fr' ? 'Veuillez sélectionner au moins une option ou choisir "Non"' : 'Please select at least one option or choose "No"' });
          return;
        }
        setErrors({ ...errors, [step.id]: '' });
      } else if (value === 'none') {
        // Si 'none' est sélectionné, c'est valide
        setErrors({ ...errors, [step.id]: '' });
      } else {
        // Sinon, aucun choix n'a été fait
        setErrors({ ...errors, [step.id]: language === 'fr' ? 'Veuillez sélectionner au moins une option ou choisir "Non"' : 'Please select at least one option or choose "No"' });
        return;
      }
    } else if (step.id === 'morePower') {
      // Étape obligatoire : doit avoir soit 'no', soit des enceintes/caissons sélectionnés
      // Vérifier d'abord les quantités directement (au cas où answers.morePower n'est pas encore synchronisé)
      const hasSpeakers = Object.values(speakerQuantities).some(qty => qty > 0);
      const hasSubwoofers = Object.values(subwooferQuantities).some(qty => qty > 0);
      const hasSelectedProducts = hasSpeakers || hasSubwoofers;
      
      // Si des enceintes/caissons sont sélectionnés via les quantités, c'est valide
      if (hasSelectedProducts) {
        setErrors({ ...errors, [step.id]: '' });
      } else if (Array.isArray(value)) {
        // Si c'est un tableau mais vide, erreur
        if (value.length === 0) {
          setErrors({ ...errors, [step.id]: language === 'fr' ? 'Veuillez sélectionner au moins une option ou choisir "Non"' : 'Please select at least one option or choose "No"' });
          return;
        }
        setErrors({ ...errors, [step.id]: '' });
      } else if (value === 'no') {
        // Si 'no' est sélectionné, c'est valide
        setErrors({ ...errors, [step.id]: '' });
      } else {
        // Sinon, aucun choix n'a été fait
        setErrors({ ...errors, [step.id]: language === 'fr' ? 'Veuillez sélectionner au moins une option ou choisir "Non"' : 'Please select at least one option or choose "No"' });
        return;
      }
    } else if (step.id === 'deliveryOptions') {
      // Étape obligatoire : au moins un choix requis (livraison, installation, ou retrait)
      if (Array.isArray(value)) {
        if (value.length === 0) {
          setErrors({ ...errors, [step.id]: language === 'fr' ? 'Veuillez sélectionner au moins une option (livraison, installation ou retrait)' : 'Please select at least one option (delivery, installation or pickup)' });
          return;
        }
      } else {
        setErrors({ ...errors, [step.id]: language === 'fr' ? 'Veuillez sélectionner au moins une option' : 'Please select at least one option' });
        return;
      }
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

    // Gérer les étapes conditionnelles
    let nextStep = currentStep + 1;
    
    // Si retrait est sélectionné et que ni livraison ni installation ne sont sélectionnées, sauter l'étape zone
    // Si retrait est sélectionné et que ni livraison ni installation ne sont sélectionnées, sauter la zone
    if (step.id === 'deliveryOptions') {
      const deliveryOptions = Array.isArray(value) ? value : [];
      if (deliveryOptions.includes('retrait') && !deliveryOptions.includes('livraison') && !deliveryOptions.includes('installation')) {
        // Chercher l'index de l'étape zone et la sauter
        const zoneStepIndex = STEPS.findIndex(s => s.id === 'zone');
        if (zoneStepIndex > currentStep) {
          nextStep = zoneStepIndex + 1;
        }
      }
    }
    
    // Si on vient de répondre à morePower = 'yes', s'assurer que les enceintes/caissons sont chargés
    if (step.id === 'morePower' && (value === 'yes' || value === true)) {
      // Les enceintes/caissons seront chargés automatiquement dans le useEffect si guests >= 200
    }

    // Passer à l'étape suivante ou au résumé
    if (nextStep < STEPS.length) {
      setCurrentStep(nextStep);
    } else {
      setShowSummary(true);
    }
  };

  // Calculer canProceed directement (pas de useMemo pour éviter les problèmes de cache)
  const canProceed = (() => {
    const step = STEPS[currentStep];
    const value = answers[step.id as keyof Answers];
    
    // Étapes obligatoires : micros, morePower, deliveryOptions
    if (step.id === 'micros') {
      // Vérifier d'abord si 'none' est explicitement sélectionné (chaîne exacte)
      if (value === 'none') {
        return true;
      }
      
      // Vérifier les quantités directement (au cas où answers.micros n'est pas encore synchronisé)
      // Calculer le total de toutes les quantités
      let totalWired = 0;
      let totalWireless = 0;
      for (const key in wiredMicQuantities) {
        const qty = wiredMicQuantities[key];
        if (qty && qty > 0) {
          totalWired += qty;
        }
      }
      for (const key in wirelessMicQuantities) {
        const qty = wirelessMicQuantities[key];
        if (qty && qty > 0) {
          totalWireless += qty;
        }
      }
      const hasSelectedMics = totalWired > 0 || totalWireless > 0;
      
      // Si des micros sont sélectionnés via les quantités, c'est valide
      if (hasSelectedMics) {
        return true;
      }
      
      // Vérifier si answers.micros contient un tableau non vide
      if (Array.isArray(value) && value.length > 0) {
        return true;
      }
      
      // BLOQUER : aucune des conditions ci-dessus n'est vraie
      // value est undefined, null, '', ou un tableau vide
      return false;
    }
    
    if (step.id === 'morePower') {
      // Vérifier d'abord si 'no' est explicitement sélectionné (chaîne exacte)
      if (value === 'no') {
        return true;
      }
      
      // Vérifier les quantités directement (au cas où answers.morePower n'est pas encore synchronisé)
      // Calculer le total de toutes les quantités
      let totalSpeakers = 0;
      let totalSubwoofers = 0;
      for (const key in speakerQuantities) {
        const qty = speakerQuantities[key];
        if (qty && qty > 0) {
          totalSpeakers += qty;
        }
      }
      for (const key in subwooferQuantities) {
        const qty = subwooferQuantities[key];
        if (qty && qty > 0) {
          totalSubwoofers += qty;
        }
      }
      const hasSelectedProducts = totalSpeakers > 0 || totalSubwoofers > 0;
      
      // Si des enceintes/caissons sont sélectionnés via les quantités, c'est valide
      if (hasSelectedProducts) {
        return true;
      }
      
      // Vérifier si answers.morePower contient un tableau non vide
      if (Array.isArray(value) && value.length > 0) {
        return true;
      }
      
      // BLOQUER : aucune des conditions ci-dessus n'est vraie
      // value est undefined, null, '', ou un tableau vide
      return false;
    }
    
    // deliveryOptions : au moins un choix requis (livraison, installation, ou retrait)
    if (step.id === 'deliveryOptions') {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return false;
    }
    
    // Pour les étapes optionnelles (extras, startTime, endTime)
    if (step.id === 'extras' || step.id === 'startTime' || step.id === 'endTime') {
      return true; // Toujours valide, même si vide
    }
    
    // Zone est obligatoire si livraison ou installation est sélectionné
    if (step.id === 'zone') {
      const deliveryOptions = answers.deliveryOptions || [];
      if (Array.isArray(deliveryOptions) && (deliveryOptions.includes('livraison') || deliveryOptions.includes('installation'))) {
        return !!value; // Obligatoire si livraison ou installation
      }
      return true; // Optionnel sinon
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
  })();

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
      'pack_petit': { id: 1, image: '/packs.png', deposit: 700 },
      'pack_confort': { id: 2, image: '/packM.png', deposit: 1100 },
      'pack_grand': { id: 3, image: '/packL.png', deposit: 1600 },
      'pack_maxi': { id: 5, image: '/concert.jpg', deposit: 500 },
    };
    
    const packInfo = packIdMapping[recommendation.pack.id] || { id: 2, image: '/packM.png', deposit: 1100 };

    // Convertir les extras en addons pour le panier
    const addons: ProductAddon[] = [];
    const accessoryItems: CartItem[] = [];
    
    // Ajouter les micros filaires sélectionnés au panier
    Object.entries(wiredMicQuantities).forEach(([productId, quantity]) => {
      if (quantity > 0) {
        const mic = wiredMics.find(m => m.id === productId);
        if (mic) {
          const micCartItem: CartItem = {
            productId: mic.id,
            productName: mic.name,
            productSlug: mic.slug,
            quantity: quantity,
            rentalDays: rentalDays,
            startDate: startDate,
            endDate: endDate,
            dailyPrice: mic.dailyPrice,
            deposit: mic.deposit || 0,
            addons: [],
            images: mic.images || [],
          };
          accessoryItems.push(micCartItem);
        }
      }
    });

    // Ajouter les micros sans fil sélectionnés au panier
    Object.entries(wirelessMicQuantities).forEach(([productId, quantity]) => {
      if (quantity > 0) {
        const mic = wirelessMics.find(m => m.id === productId);
        if (mic) {
          const micCartItem: CartItem = {
            productId: mic.id,
            productName: mic.name,
            productSlug: mic.slug,
            quantity: quantity,
            rentalDays: rentalDays,
            startDate: startDate,
            endDate: endDate,
            dailyPrice: mic.dailyPrice,
            deposit: mic.deposit || 0,
            addons: [],
            images: mic.images || [],
          };
          accessoryItems.push(micCartItem);
        }
      }
    });
    
    // Gérer les extras standards (technicien et accessoires du catalogue)
    // NOTE: Les micros sont maintenant gérés via wiredMicQuantities/wirelessMicQuantities
    // et sont ajoutés comme items séparés, donc on ne les ajoute plus via answers.extras
    if (answers.extras) {
      for (const extra of answers.extras) {
        // Gérer le technicien
        if (extra === 'technicien') {
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
        // Ignorer les anciens extras micros_filaire et micros_sans_fil car ils sont maintenant gérés
        // via wiredMicQuantities et wirelessMicQuantities qui sont ajoutés comme items séparés
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

    // Utiliser le résultat en cache de isUrgentEvent pour garantir la cohérence avec renderSummary
    // IMPORTANT: La majoration urgence ne s'applique QUE pour des événements le jour même (1 jour)
    // Si plusieurs jours sont sélectionnés, la majoration ne s'applique JAMAIS
    let isUrgentEvent = false;
    if (isUrgentEventCached !== null) {
      isUrgentEvent = isUrgentEventCached;
    } else if (rentalDays === 1) {
      // Ne calculer que si c'est 1 jour
      isUrgentEvent = isUrgent(answers.startDate || '', answers.startTime);
    }
    const baseDailyPrice = recommendation.breakdown.base;
    
    // Calculer le total de TOUS les items pour la période (pack + micros + enceintes + caissons + accessoires)
    // pour pouvoir calculer la majoration urgence sur le total complet
    const totalBase = baseDailyPrice * rentalDays;
    const totalDelivery = recommendation.breakdown.delivery || 0;
    
    // Calculer le total des accessoires pour la période
    const accessoriesDailyTotal = answers.extras?.reduce((total, extra) => {
      if (extra.startsWith('accessory_')) {
        const accessoryId = extra.replace('accessory_', '');
        const accessory = accessories.find(a => a.id === accessoryId);
        if (accessory) {
          return total + accessory.dailyPrice;
        }
      }
      return total;
    }, 0) || 0;
    const accessoriesTotal = accessoriesDailyTotal * rentalDays;
    
    // Calculer le total des micros pour la période
    const wiredMicsDailyTotal = Object.entries(wiredMicQuantities).reduce((total, [productId, quantity]) => {
      if (quantity > 0) {
        const mic = wiredMics.find(m => m.id === productId);
        if (mic) {
          return total + (mic.dailyPrice * quantity);
        }
      }
      return total;
    }, 0);
    const wiredMicsTotal = wiredMicsDailyTotal * rentalDays;
    
    const wirelessMicsDailyTotal = Object.entries(wirelessMicQuantities).reduce((total, [productId, quantity]) => {
      if (quantity > 0) {
        const mic = wirelessMics.find(m => m.id === productId);
        if (mic) {
          return total + (mic.dailyPrice * quantity);
        }
      }
      return total;
    }, 0);
    const wirelessMicsTotal = wirelessMicsDailyTotal * rentalDays;
    
    // Calculer le total des enceintes pour la période
    const speakersDailyTotal = Object.entries(speakerQuantities).reduce((total, [productId, quantity]) => {
      if (quantity > 0) {
        const speaker = speakers.find(s => s.id === productId);
        if (speaker) {
          return total + (speaker.dailyPrice * quantity);
        }
      }
      return total;
    }, 0);
    const speakersTotal = speakersDailyTotal * rentalDays;
    
    // Calculer le total des caissons pour la période
    const subwoofersDailyTotal = Object.entries(subwooferQuantities).reduce((total, [productId, quantity]) => {
      if (quantity > 0) {
        const subwoofer = subwoofers.find(s => s.id === productId);
        if (subwoofer) {
          return total + (subwoofer.dailyPrice * quantity);
        }
      }
      return total;
    }, 0);
    const subwoofersTotal = subwoofersDailyTotal * rentalDays;
    
    // Calculer le prix d'installation (prix fixe, pas par jour)
    const packId = packIdMapping[recommendation.pack.id]?.id || 1;
    let installationPrice = 0;
    switch (packId) {
      case 1: installationPrice = 60; break;
      case 2: installationPrice = 80; break;
      case 3: installationPrice = 120; break;
      default: installationPrice = 0;
    }
    const totalWiredMics = Object.values(wiredMicQuantities).reduce((sum, qty) => sum + (qty || 0), 0);
    const totalWirelessMics = Object.values(wirelessMicQuantities).reduce((sum, qty) => sum + (qty || 0), 0);
    const totalMics = totalWiredMics + totalWirelessMics;
    const totalSpeakers = Object.values(speakerQuantities).reduce((sum, qty) => sum + (qty || 0), 0);
    const totalSubwoofers = Object.values(subwooferQuantities).reduce((sum, qty) => sum + (qty || 0), 0);
    let additionalComplexity = 0;
    if (totalMics > 0) additionalComplexity += totalMics * 5;
    if (totalSpeakers > 0) additionalComplexity += totalSpeakers * 10;
    if (totalSubwoofers > 0) additionalComplexity += totalSubwoofers * 15;
    installationPrice += additionalComplexity;
    
    // Calculer le total AVANT majoration urgence (incluant tous les items)
    // Livraison et installation sont des prix fixes (pas par jour)
    const totalBeforeUrgency = totalBase + totalDelivery + accessoriesTotal + wiredMicsTotal + wirelessMicsTotal + speakersTotal + subwoofersTotal + installationPrice;
    
    // Calculer la majoration d'urgence (20% du total)
    // IMPORTANT: La majoration ne s'applique QUE si l'événement commence dans moins de 2h, est un dimanche, ou un samedi après 15h
    // Pour une location de plusieurs jours, on vérifie uniquement la date/heure de début
    // La majoration s'applique UNE SEULE FOIS, pas par jour
    const urgencySurcharge = isUrgentEvent ? Math.round(totalBeforeUrgency * 0.2) : 0;
    
    // Ajouter la majoration comme addon pour qu'elle soit visible et comptabilisée dans le panier
    // La majoration s'applique au total de TOUS les items, donc on l'ajoute comme addon au pack
    if (isUrgentEvent && urgencySurcharge > 0) {
      addons.push({
        id: 'urgence-majoration',
        name: language === 'fr' ? 'Majoration urgence (+20%)' : 'Urgency surcharge (+20%)',
        price: urgencySurcharge
      });
    }

    // Créer l'item du panier avec tous les détails
    const cartItem: CartItem = {
      productId: `pack-${packInfo.id}`,
      productName: recommendation.pack.name, // Utiliser le nom exact du pack
      productSlug: `pack-${packInfo.id}`,
      quantity: 1,
      rentalDays: rentalDays,
      startDate: startDate,
      endDate: endDate,
      dailyPrice: baseDailyPrice, // Prix de base journalier (la majoration est dans les addons)
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
        urgency: isUrgentEvent,
        urgencySurcharge: urgencySurcharge, // Montant de la majoration pour affichage
        breakdown: recommendation.breakdown,
      },
    };

    const packResult = await addToCart(cartItem);
    if (!packResult.success) {
      alert(packResult.error || (language === 'fr' 
        ? 'Impossible d\'ajouter ce pack au panier.' 
        : 'Unable to add this pack to cart.'));
      return;
    }

    // Ajouter les accessoires comme items séparés
    for (const item of accessoryItems) {
      const result = await addToCart(item);
      if (!result.success) {
        console.warn('Erreur ajout accessoire:', result.error);
        // Continuer même en cas d'erreur pour les accessoires
      }
    }

    // Ajouter la livraison et/ou l'installation selon les choix
    const deliveryOptions = Array.isArray(answers.deliveryOptions) ? answers.deliveryOptions : [];
    const deliveryZone = answers.zone || 'paris';
    
    // Prix de livraison selon la zone
    const deliveryPrices: Record<string, number> = {
      paris: 80,
      petite: 120,
      grande: 160,
    };
    
    // installationPrice est déjà calculé plus haut pour le calcul de la majoration urgence
    
    // Ajouter la livraison si sélectionnée
    if (deliveryOptions.includes('livraison') && deliveryZone !== 'retrait') {
      const deliveryPrice = deliveryPrices[deliveryZone] || 0;
      if (deliveryPrice > 0) {
        const deliveryItem: CartItem = {
          productId: `delivery-${deliveryZone}`,
          productName: language === 'fr' 
            ? `Livraison ${deliveryZone === 'paris' ? 'Paris' : deliveryZone === 'petite' ? 'Petite Couronne' : 'Grande Couronne'}`
            : `Delivery ${deliveryZone === 'paris' ? 'Paris' : deliveryZone === 'petite' ? 'Inner suburbs' : 'Outer suburbs'}`,
          productSlug: `delivery-${deliveryZone}`,
          quantity: 1,
          rentalDays: 1,
          startDate: startDate,
          endDate: endDate,
          dailyPrice: deliveryPrice,
          deposit: 0,
          addons: [],
          images: ['/livraison.jpg'],
        };
        // La livraison n'a pas de stock, on peut l'ajouter sans vérification
        await addToCart(deliveryItem);
      }
    }
    
    // Ajouter l'installation si sélectionnée
    if (deliveryOptions.includes('installation') && installationPrice > 0) {
      const installationItem: CartItem = {
        productId: `installation-${packIdMapping[recommendation.pack.id]?.id || 1}`,
        productName: language === 'fr' ? 'Installation' : 'Installation',
        productSlug: `installation-${packIdMapping[recommendation.pack.id]?.id || 1}`,
        quantity: 1,
        rentalDays: 1,
        startDate: startDate,
        endDate: endDate,
        dailyPrice: installationPrice,
        deposit: 0,
        addons: [],
        images: ['/installation.jpg'],
      };
      // L'installation n'a pas de stock, on peut l'ajouter sans vérification
      await addToCart(installationItem);
    }
    
    // Ancien système de livraison (pour compatibilité)
    if (!deliveryOptions.includes('livraison') && !deliveryOptions.includes('installation') && answers.zone && answers.zone !== 'retrait') {
      // Ancien système de livraison (pour compatibilité)
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
        // La livraison n'a pas de stock, on peut l'ajouter sans vérification
        await addToCart(deliveryItem);
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
      <div className={`space-y-8 ${mode === 'chatbox' ? 'space-y-4' : 'animate-fadeIn'}`}>
        {/* Titre et sous-titre - adapté selon le mode */}
        <div className={mode === 'chatbox' ? 'mb-3' : 'text-center'}>
          {mode !== 'chatbox' && (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#F2431E]/10 to-[#e27431]/10 rounded-2xl mb-4">
              <span className="text-2xl">✨</span>
            </div>
          )}
          <h2 className={`font-bold text-gray-900 mb-3 ${mode === 'chatbox' ? 'text-base' : 'text-3xl'}`}>
            {step.title}
          </h2>
          {step.subtitle && (
            <p className={`text-gray-600 ${mode === 'chatbox' ? 'text-xs mb-3' : 'text-lg max-w-md mx-auto leading-relaxed'}`}>
              {step.subtitle}
            </p>
          )}
        </div>

        {/* Contenu de l'étape */}
        <div className="space-y-3">
          {/* Étape micros : afficher les cartes de micros avec incrémentation */}
          {step.id === 'micros' && (
            <>
              {loadingMics && (
                <div className="text-center py-4 text-gray-500">
                  {language === 'fr' ? 'Chargement des micros...' : 'Loading microphones...'}
                </div>
              )}
              
              {!loadingMics && (
                <div className="space-y-6">
                  {/* Option "Non" pour passer sans micros */}
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setWiredMicQuantities({});
                        setWirelessMicQuantities({});
                        handleAnswerChange(step.id, 'none');
                      }}
                      className={`w-full px-6 py-4 rounded-xl border-2 transition-all ${
                        answers.micros === 'none'
                          ? 'border-[#F2431E] bg-[#F2431E]/10 text-[#F2431E]'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl">🚫</span>
                        <span className="font-semibold">
                          {language === 'fr' ? 'Non, pas besoin de micros' : 'No, no microphones needed'}
                        </span>
                      </div>
                    </button>
                  </div>
                  
                  {/* Micros filaires */}
                  {wiredMics.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {language === 'fr' ? 'Micros filaires' : 'Wired microphones'}
                      </h3>
                      <div className="space-y-3">
                        {wiredMics.map((mic) => {
                          const currentQuantity = wiredMicQuantities[mic.id] || 0;
                          const totalWired = Object.values(wiredMicQuantities).reduce((sum, qty) => sum + qty, 0);
                          // Suggestion automatique selon le type d'événement
                          const isSuggested = (answers.eventType === 'mariage' || answers.eventType === 'eglise' || answers.eventType === 'corporate') && 
                                            currentQuantity === 1 && totalWired === 1 && Object.keys(wiredMicQuantities).length === 1;
                          // Calculer le maxQuantity : limite globale de 5, moins ce qui est déjà sélectionné ailleurs, plus ce qui est déjà sélectionné pour ce micro
                          const otherQuantities = totalWired - currentQuantity;
                          const remainingGlobal = 5 - otherQuantities;
                          const maxForThisMic = Math.min(mic.quantity || 5, remainingGlobal);
                          return (
                            <QuantitySelector
                              key={mic.id}
                              productId={mic.id}
                              productName={mic.name}
                              price={mic.dailyPrice}
                              icon="🎤"
                              quantity={currentQuantity}
                              onQuantityChange={(productId, quantity) => {
                                // Vérifier que la quantité totale ne dépasse pas 5
                                const otherQuantities = Object.entries(wiredMicQuantities)
                                  .filter(([id]) => id !== productId)
                                  .reduce((sum, [, qty]) => sum + qty, 0);
                                const newTotal = otherQuantities + quantity;
                                if (newTotal <= 5) {
                                  setWiredMicQuantities(prev => ({
                                    ...prev,
                                    [productId]: quantity
                                  }));
                                  // La synchronisation se fera automatiquement via le useEffect
                                }
                              }}
                              maxQuantity={maxForThisMic}
                              suggested={isSuggested}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Micros sans fil */}
                  {wirelessMics.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {language === 'fr' ? 'Micros sans fil' : 'Wireless microphones'}
                      </h3>
                      <div className="space-y-3">
                        {wirelessMics.map((mic) => {
                          const currentQuantity = wirelessMicQuantities[mic.id] || 0;
                          const totalWireless = Object.values(wirelessMicQuantities).reduce((sum, qty) => sum + qty, 0);
                          const isSuggested = false; // Les micros sans fil ne sont pas suggérés automatiquement
                          // Calculer le maxQuantity : limite globale de 3, moins ce qui est déjà sélectionné ailleurs, plus ce qui est déjà sélectionné pour ce micro
                          const otherQuantities = totalWireless - currentQuantity;
                          const remainingGlobal = 3 - otherQuantities;
                          const maxForThisMic = Math.min(mic.quantity || 3, remainingGlobal);
                          return (
                            <QuantitySelector
                              key={mic.id}
                              productId={mic.id}
                              productName={mic.name}
                              price={mic.dailyPrice}
                              icon="🎤"
                              quantity={currentQuantity}
                              onQuantityChange={(productId, quantity) => {
                                // Vérifier que la quantité totale ne dépasse pas 3
                                const otherQuantities = Object.entries(wirelessMicQuantities)
                                  .filter(([id]) => id !== productId)
                                  .reduce((sum, [, qty]) => sum + qty, 0);
                                const newTotal = otherQuantities + quantity;
                                if (newTotal <= 3) {
                                  setWirelessMicQuantities(prev => ({
                                    ...prev,
                                    [productId]: quantity
                                  }));
                                  // La synchronisation se fera automatiquement via le useEffect
                                }
                              }}
                              maxQuantity={maxForThisMic}
                              suggested={isSuggested}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {wiredMics.length === 0 && wirelessMics.length === 0 && !loadingMics && (
                    <div className="text-center py-4 text-gray-500">
                      {language === 'fr' 
                        ? 'Aucun micro disponible pour le moment.'
                        : 'No microphones available at the moment.'}
                    </div>
                  )}
                </div>
              )}
              {error && <ErrorText message={error} />}
            </>
          )}

          {/* Étape morePower : afficher les cartes d'enceintes/caissons avec incrémentation */}
          {step.id === 'morePower' && (
            <>
              {loadingSpeakers && (
                <div className="text-center py-4 text-gray-500">
                  {language === 'fr' ? 'Chargement des enceintes et caissons...' : 'Loading speakers and subwoofers...'}
                </div>
              )}
              
              {!loadingSpeakers && (
                <div className="space-y-6">
                  {/* Option "Non" pour passer sans puissance supplémentaire */}
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSpeakerQuantities({});
                        setSubwooferQuantities({});
                        handleAnswerChange(step.id, 'no');
                      }}
                      className={`w-full px-6 py-4 rounded-xl border-2 transition-all ${
                        answers.morePower === 'no'
                          ? 'border-[#F2431E] bg-[#F2431E]/10 text-[#F2431E]'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl">✅</span>
                        <span className="font-semibold">
                          {language === 'fr' ? 'Non, le pack suffit' : 'No, the pack is enough'}
                        </span>
                      </div>
                    </button>
                  </div>
                  
                  {(speakers.length > 0 || subwoofers.length > 0) && (
                    <>
                      <p className="text-sm text-gray-600 mb-4">
                        {language === 'fr' 
                          ? 'Pour éviter toute frustration sur le volume ou les basses, voici ce que nous recommandons :'
                          : 'To avoid any frustration with volume or bass, here\'s what we recommend:'}
                      </p>
                      
                      {/* Caissons de basse */}
                  {subwoofers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {language === 'fr' ? 'Caissons de basse' : 'Subwoofers'}
                      </h3>
                      <div className="space-y-3">
                        {subwoofers.map((subwoofer) => {
                          const currentQuantity = subwooferQuantities[subwoofer.id] || 0;
                          const totalSubs = Object.values(subwooferQuantities).reduce((sum, qty) => sum + qty, 0);
                          // Suggestion si c'est le premier caisson et qu'il a été pré-sélectionné automatiquement
                          const isSuggested = currentQuantity === 1 && totalSubs === 1 && 
                                            Object.keys(subwooferQuantities).length === 1 &&
                                            Object.keys(speakerQuantities).length === 0;
                          return (
                            <QuantitySelector
                              key={subwoofer.id}
                              productId={subwoofer.id}
                              productName={getSubwooferDisplayName(subwoofer)}
                              price={subwoofer.dailyPrice}
                              icon="🔊"
                              quantity={currentQuantity}
                              onQuantityChange={(productId, quantity) => {
                                setSubwooferQuantities(prev => ({
                                  ...prev,
                                  [productId]: quantity
                                }));
                                  // La synchronisation se fera automatiquement via le useEffect
                              }}
                              maxQuantity={Math.min(subwoofer.quantity, 2)}
                              suggested={isSuggested}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Enceintes */}
                  {speakers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {language === 'fr' ? 'Enceintes supplémentaires' : 'Additional speakers'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {language === 'fr' 
                          ? 'Maximum 2 de chaque type d\'enceinte.'
                          : 'Maximum 2 of each speaker type.'}
                      </p>
                      <div className="space-y-3">
                        {speakers.map((speaker) => {
                          const currentQuantity = speakerQuantities[speaker.id] || 0;
                          const totalSpeakers = Object.values(speakerQuantities).reduce((sum, qty) => sum + qty, 0);
                          // Suggestion si c'est la première enceinte et qu'elle a été pré-sélectionnée automatiquement
                          const isSuggested = subwoofers.length === 0 && 
                                            currentQuantity === 1 && totalSpeakers === 1 && 
                                            Object.keys(speakerQuantities).length === 1 &&
                                            Object.keys(subwooferQuantities).length === 0;
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
                                  // La synchronisation se fera automatiquement via le useEffect
                              }}
                              maxQuantity={Math.min(speaker.quantity, 2)}
                              suggested={isSuggested}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                    </>
                  )}
                  
                  {speakers.length === 0 && subwoofers.length === 0 && !loadingSpeakers && (
                    <div className="text-center py-4 text-gray-500">
                      {language === 'fr' 
                        ? 'Aucune enceinte ou caisson disponible pour le moment.'
                        : 'No speakers or subwoofers available at the moment.'}
                    </div>
                  )}
                </div>
              )}
              {error && <ErrorText message={error} />}
            </>
          )}

          {step.type === 'single' && step.options && step.id !== 'micros' && step.id !== 'morePower' && step.id !== 'deliveryOptions' && (
            <div className="space-y-3">
              {step.options
                .filter((option) => {
                  // Si on est à l'étape zone et que livraison ou installation est sélectionné, cacher "retrait sur place"
                  if (step.id === 'zone') {
                    const deliveryOptions = answers.deliveryOptions || [];
                    if (Array.isArray(deliveryOptions) && (deliveryOptions.includes('livraison') || deliveryOptions.includes('installation'))) {
                      return option.value !== 'retrait';
                    }
                  }
                  return true;
                })
                .map((option) => (
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

          {/* Étape deliveryOptions avec choix multiples */}
          {step.id === 'deliveryOptions' && step.type === 'multiple' && step.options && (
            <div className="space-y-3">
              {step.options.map((option) => {
                const deliveryOptions = Array.isArray(value) ? value : [];
                const isSelected = deliveryOptions.includes(option.value);
                return (
                  <Chip
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    icon={option.icon}
                    selected={isSelected}
                    onClick={(val) => {
                      const currentOptions = Array.isArray(value) ? [...value] : [];
                      if (currentOptions.includes(val)) {
                        // Désélectionner
                        const newOptions = currentOptions.filter(v => v !== val);
                        handleAnswerChange(step.id, newOptions.length > 0 ? newOptions : undefined);
                      } else {
                        // Sélectionner
                        handleAnswerChange(step.id, [...currentOptions, val]);
                      }
                    }}
                  />
                );
              })}
              {error && <ErrorText message={error} />}
            </div>
          )}

          {step.type === 'multiple' && step.options && step.id !== 'deliveryOptions' && (
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

          {step.type === 'time' && (
            <div className="space-y-2">
              <select
                value={value as string || ''}
                onChange={(e) => handleAnswerChange(step.id, e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#F2431E] focus:outline-none transition-colors text-gray-900 bg-white"
                required={step.required}
              >
                <option value="">{language === 'fr' ? 'Sélectionnez une heure' : 'Select a time'}</option>
                {Array.from({ length: 48 }, (_, i) => {
                  const hour = Math.floor(i / 2);
                  const minute = (i % 2) * 30;
                  const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                  const displayTime = `${hour.toString().padStart(2, '0')}h${minute.toString().padStart(2, '0')}`;
                  return (
                    <option key={timeString} value={timeString}>
                      {displayTime}
                    </option>
                  );
                })}
              </select>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}

        </div>

        {/* Message d'erreur */}
        {error && <ErrorText message={error} />}
      </div>
    );
  };

  // Calculer le prix d'installation quand les données changent
  useEffect(() => {
    const calculateInstallation = async () => {
      const deliveryOptions = Array.isArray(answers.deliveryOptions) ? answers.deliveryOptions : [];
      if (!deliveryOptions.includes('installation')) {
        setInstallationPrice(0);
        return;
      }

      const recommendation = recommendPack(answers);
      if (!recommendation) {
        setInstallationPrice(0);
        return;
      }

      // Construire un panier temporaire pour calculer le prix d'installation
      const tempCartItems: CartItem[] = [];
      
      // Ajouter le pack
      const packInfo = getPacksInfo();
      const selectedPack = packInfo.find(p => p.id === recommendation.pack.id);
      if (selectedPack && selectedPack.basePrice !== null) {
        tempCartItems.push({
          productId: `pack-${selectedPack.id}`,
          productName: selectedPack.name,
          productSlug: `pack-${selectedPack.id}`,
          quantity: 1,
          rentalDays: 1,
          startDate: answers.startDate || '',
          endDate: answers.endDate || answers.startDate || '',
          dailyPrice: recommendation.pack.basePrice,
          deposit: selectedPack.deposit || 0,
          addons: [],
          images: [],
        });
      }
      
      // Ajouter les micros
      Object.entries(wiredMicQuantities).forEach(([productId, quantity]) => {
        if (quantity > 0) {
          const mic = wiredMics.find(m => m.id === productId);
          if (mic) {
            tempCartItems.push({
              productId: mic.id,
              productName: mic.name,
              productSlug: mic.slug || mic.id,
              quantity: quantity,
              rentalDays: 1,
              startDate: answers.startDate || '',
              endDate: answers.endDate || answers.startDate || '',
              dailyPrice: mic.dailyPrice,
              deposit: mic.deposit || 0,
              addons: [],
              images: mic.images || [],
            });
          }
        }
      });
      
      Object.entries(wirelessMicQuantities).forEach(([productId, quantity]) => {
        if (quantity > 0) {
          const mic = wirelessMics.find(m => m.id === productId);
          if (mic) {
            tempCartItems.push({
              productId: mic.id,
              productName: mic.name,
              productSlug: mic.slug || mic.id,
              quantity: quantity,
              rentalDays: 1,
              startDate: answers.startDate || '',
              endDate: answers.endDate || answers.startDate || '',
              dailyPrice: mic.dailyPrice,
              deposit: mic.deposit || 0,
              addons: [],
              images: mic.images || [],
            });
          }
        }
      });
      
      // Ajouter les enceintes
      Object.entries(speakerQuantities).forEach(([productId, quantity]) => {
        if (quantity > 0) {
          const speaker = speakers.find(s => s.id === productId);
          if (speaker) {
            tempCartItems.push({
              productId: speaker.id,
              productName: speaker.name,
              productSlug: speaker.slug || speaker.id,
              quantity: quantity,
              rentalDays: 1,
              startDate: answers.startDate || '',
              endDate: answers.endDate || answers.startDate || '',
              dailyPrice: speaker.dailyPrice,
              deposit: speaker.deposit || 0,
              addons: [],
              images: speaker.images || [],
            });
          }
        }
      });
      
      // Ajouter les caissons
      Object.entries(subwooferQuantities).forEach(([productId, quantity]) => {
        if (quantity > 0) {
          const subwoofer = subwoofers.find(s => s.id === productId);
          if (subwoofer) {
            tempCartItems.push({
              productId: subwoofer.id,
              productName: subwoofer.name,
              productSlug: subwoofer.slug || subwoofer.id,
              quantity: quantity,
              rentalDays: 1,
              startDate: answers.startDate || '',
              endDate: answers.endDate || answers.startDate || '',
              dailyPrice: subwoofer.dailyPrice,
              deposit: subwoofer.deposit || 0,
              addons: [],
              images: subwoofer.images || [],
            });
          }
        }
      });
      
      // Ajouter les accessoires
      answers.extras?.forEach((extra) => {
        if (extra.startsWith('accessory_')) {
          const accessoryId = extra.replace('accessory_', '');
          const accessory = accessories.find(a => a.id === accessoryId);
          if (accessory) {
            tempCartItems.push({
              productId: accessory.id,
              productName: accessory.name,
              productSlug: accessory.slug || accessory.id,
              quantity: 1,
              rentalDays: 1,
              startDate: answers.startDate || '',
              endDate: answers.endDate || answers.startDate || '',
              dailyPrice: accessory.dailyPrice,
              deposit: accessory.deposit || 0,
              addons: [],
              images: accessory.images || [],
            });
          }
        }
      });
      
      const calculatedInstallationPrice = calculateInstallationPrice(tempCartItems);
      setInstallationPrice(calculatedInstallationPrice || 0);
    };

    if (showSummary) {
      calculateInstallation();
    }
  }, [showSummary, answers.deliveryOptions, answers.startDate, answers.endDate, answers.extras, wiredMicQuantities, wirelessMicQuantities, speakerQuantities, subwooferQuantities, wiredMics, wirelessMics, speakers, subwoofers, accessories]);

  // Calculer et mettre en cache isUrgentEvent quand les dates/heures changent
  // IMPORTANT: La majoration urgence ne s'applique QUE pour des événements le jour même (1 jour)
  // Si plusieurs jours sont sélectionnés, la majoration ne s'applique JAMAIS
  useEffect(() => {
    if (answers.startDate) {
      // Vérifier si c'est une réservation de plusieurs jours
      const startDate = answers.startDate;
      const endDate = answers.endDate || answers.startDate;
      let rentalDays = 1;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end.getTime() - start.getTime();
        rentalDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
      }
      
      // La majoration urgence ne s'applique QUE si c'est 1 jour ET que l'événement est urgent
      const isUrgentEvent = rentalDays === 1 ? isUrgent(answers.startDate, answers.startTime) : false;
      setIsUrgentEventCached(isUrgentEvent);
    } else {
      setIsUrgentEventCached(null);
    }
  }, [answers.startDate, answers.startTime, answers.endDate]);

  const renderSummary = () => {
    // Utiliser recommendPack standard (la vérification de stock se fait côté serveur lors de la réservation)
    const recommendation = recommendPack(answers);
    if (!recommendation) return null;

    // Calculer les jours de location (comme dans handleAddToCart)
    const startDate = answers.startDate || new Date().toISOString().split('T')[0];
    const endDate = answers.endDate || answers.startDate || new Date().toISOString().split('T')[0];
    let rentalDays = 1;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      rentalDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1); // +1 car inclusif
    }

    // Utiliser le résultat en cache de isUrgentEvent (calculé dans useEffect)
    // IMPORTANT: La majoration urgence ne s'applique QUE pour des événements le jour même (1 jour)
    // Si plusieurs jours sont sélectionnés, la majoration ne s'applique JAMAIS
    let isUrgentEvent = false;
    if (isUrgentEventCached !== null) {
      isUrgentEvent = isUrgentEventCached;
    } else if (rentalDays === 1) {
      // Ne calculer que si c'est 1 jour
      isUrgentEvent = isUrgent(answers.startDate || '', answers.startTime);
    }
    
    // Calculer le prix des accessoires sélectionnés (PRIX JOURNALIER, à multiplier par rentalDays)
    const accessoriesDailyPrice = answers.extras?.reduce((total, extra) => {
      if (extra.startsWith('accessory_')) {
        const accessoryId = extra.replace('accessory_', '');
        const accessory = accessories.find(a => a.id === accessoryId);
        if (accessory) {
          return total + accessory.dailyPrice;
        }
      }
      return total;
    }, 0) || 0;
    const accessoriesPrice = accessoriesDailyPrice * rentalDays;
    
    // Calculer le prix des micros filaires sélectionnés (PRIX JOURNALIER, à multiplier par rentalDays)
    const wiredMicsDailyPrice = Object.entries(wiredMicQuantities).reduce((total, [productId, quantity]) => {
      if (quantity > 0) {
        const mic = wiredMics.find(m => m.id === productId);
        if (mic) {
          return total + (mic.dailyPrice * quantity);
        }
      }
      return total;
    }, 0);
    const wiredMicsPrice = wiredMicsDailyPrice * rentalDays;
    
    // Calculer le prix des micros sans fil sélectionnés (PRIX JOURNALIER, à multiplier par rentalDays)
    const wirelessMicsDailyPrice = Object.entries(wirelessMicQuantities).reduce((total, [productId, quantity]) => {
      if (quantity > 0) {
        const mic = wirelessMics.find(m => m.id === productId);
        if (mic) {
          return total + (mic.dailyPrice * quantity);
        }
      }
      return total;
    }, 0);
    const wirelessMicsPrice = wirelessMicsDailyPrice * rentalDays;
    
    // Calculer le prix des enceintes sélectionnées (PRIX JOURNALIER, à multiplier par rentalDays)
    const speakersDailyPrice = Object.entries(speakerQuantities).reduce((total, [productId, quantity]) => {
      if (quantity > 0) {
        const speaker = speakers.find(s => s.id === productId);
        if (speaker) {
          return total + (speaker.dailyPrice * quantity);
        }
      }
      return total;
    }, 0);
    const speakersPrice = speakersDailyPrice * rentalDays;
    
    // Calculer le prix des caissons sélectionnés (PRIX JOURNALIER, à multiplier par rentalDays)
    const subwoofersDailyPrice = Object.entries(subwooferQuantities).reduce((total, [productId, quantity]) => {
      if (quantity > 0) {
        const subwoofer = subwoofers.find(s => s.id === productId);
        if (subwoofer) {
          return total + (subwoofer.dailyPrice * quantity);
        }
      }
      return total;
    }, 0);
    const subwoofersPrice = subwoofersDailyPrice * rentalDays;
    
    // Calculer le prix d'installation correctement (comme dans handleAddToCart)
    // Base selon le pack
    const packIdMapping: Record<string, { id: number }> = {
      'pack_petit': { id: 1 },
      'pack_confort': { id: 2 },
      'pack_grand': { id: 3 },
      'pack_maxi': { id: 5 },
    };
    const packInfo = packIdMapping[recommendation.pack.id] || { id: 2 };
    let calculatedInstallationPrice = 0;
    
    // Prix de base selon le pack
    switch (packInfo.id) {
      case 1: // Pack S
        calculatedInstallationPrice = 60;
        break;
      case 2: // Pack M
        calculatedInstallationPrice = 80;
        break;
      case 3: // Pack L
        calculatedInstallationPrice = 120;
        break;
      case 5: // Pack XL
        calculatedInstallationPrice = 0; // Sur devis
        break;
      default:
        calculatedInstallationPrice = 80;
    }
    
    // Ajouter les suppléments pour équipements supplémentaires
    const totalWiredMics = Object.values(wiredMicQuantities).reduce((sum, qty) => sum + (qty || 0), 0);
    const totalWirelessMics = Object.values(wirelessMicQuantities).reduce((sum, qty) => sum + (qty || 0), 0);
    const totalMics = totalWiredMics + totalWirelessMics;
    const totalSpeakers = Object.values(speakerQuantities).reduce((sum, qty) => sum + (qty || 0), 0);
    const totalSubwoofers = Object.values(subwooferQuantities).reduce((sum, qty) => sum + (qty || 0), 0);
    
    let additionalComplexity = 0;
    if (totalMics > 0) {
      additionalComplexity += totalMics * 5;
    }
    if (totalSpeakers > 0) {
      additionalComplexity += totalSpeakers * 10;
    }
    if (totalSubwoofers > 0) {
      additionalComplexity += totalSubwoofers * 15;
    }
    calculatedInstallationPrice += additionalComplexity;
    
    // Utiliser le prix d'installation calculé au lieu de celui du state
    const finalInstallationPrice = calculatedInstallationPrice;
    
    // Calculer le prix de base du pack pour toute la période (PRIX JOURNALIER × rentalDays)
    const basePriceForPeriod = recommendation.breakdown.base * rentalDays;
    
    // La livraison est un prix FIXE (pas par jour), donc on ne multiplie PAS par rentalDays
    const deliveryPrice = recommendation.breakdown.delivery || 0;
    
    // L'installation est un prix FIXE (pas par jour), donc on ne multiplie PAS par rentalDays
    // finalInstallationPrice est déjà calculé plus haut
    
    // Calculer le total AVANT majoration urgence
    // Inclure : pack (× rentalDays), livraison (fixe), accessoires (× rentalDays), micros (× rentalDays), 
    // enceintes (× rentalDays), caissons (× rentalDays), installation (fixe)
    const totalBeforeUrgency = basePriceForPeriod + deliveryPrice + accessoriesPrice + wiredMicsPrice + wirelessMicsPrice + speakersPrice + subwoofersPrice + finalInstallationPrice;
    
    // Recalculer la majoration urgence sur le nouveau total (incluant tous les extras)
    // IMPORTANT: La majoration urgence s'applique UNIQUEMENT si l'événement commence le jour même
    // (dans moins de 2h, dimanche, ou samedi après 15h). Elle s'applique UNE SEULE FOIS, pas par jour.
    // isUrgentEvent est déjà calculé plus haut dans la fonction
    const urgencySurcharge = isUrgentEvent ? Math.round(totalBeforeUrgency * 0.2) : 0;
    
    // Calculer uniquement les extras qui sont des accessoires du catalogue
    // Exclure les micros, technicien, etc. qui sont gérés séparément
    // accessoriesPrice est déjà calculé plus haut (prix total pour toute la période)
    const adjustedBreakdown = {
      ...recommendation.breakdown,
      base: basePriceForPeriod, // Pack pour toute la période
      delivery: deliveryPrice, // Livraison (prix fixe)
      extras: accessoriesPrice, // Accessoires pour toute la période
      urgency: urgencySurcharge, // Majoration urgence (une seule fois)
    };
    
    // Le total doit inclure la majoration urgence si applicable
    // Tous les prix journaliers sont déjà multipliés par rentalDays
    const adjustedTotalPrice = basePriceForPeriod + deliveryPrice + accessoriesPrice + wiredMicsPrice + wirelessMicsPrice + speakersPrice + subwoofersPrice + finalInstallationPrice + urgencySurcharge;
    
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
                <span>Pack de base {rentalDays > 1 ? `(${rentalDays} jours)` : ''} :</span>
                <span>{adjustedBreakdown.base} €</span>
              </div>
              <div className="flex justify-between">
                <span>Livraison A/R :</span>
                <span>{adjustedBreakdown.delivery} €</span>
              </div>
              {/* Afficher les options (accessoires uniquement) */}
              {adjustedBreakdown.extras > 0 && (
                <div className="flex justify-between">
                  <span>Options {rentalDays > 1 ? `(${rentalDays} jours)` : ''} :</span>
                  <span>{adjustedBreakdown.extras} €</span>
                </div>
              )}
              {/* Détail des micros, enceintes et caissons - affichés séparément */}
              {(wiredMicsPrice > 0 || wirelessMicsPrice > 0 || speakersPrice > 0 || subwoofersPrice > 0 || finalInstallationPrice > 0) && (
                <>
                  {wiredMicsPrice > 0 && (
                    <div className="flex justify-between text-xs text-gray-600 pl-4">
                      <span>Micros filaires {rentalDays > 1 ? `(${rentalDays} jours)` : ''} :</span>
                      <span>{wiredMicsPrice} €</span>
                    </div>
                  )}
                  {wirelessMicsPrice > 0 && (
                    <div className="flex justify-between text-xs text-gray-600 pl-4">
                      <span>Micros sans fil {rentalDays > 1 ? `(${rentalDays} jours)` : ''} :</span>
                      <span>{wirelessMicsPrice} €</span>
                    </div>
                  )}
                  {speakersPrice > 0 && (
                    <div className="flex justify-between text-xs text-gray-600 pl-4">
                      <span>Enceintes supplémentaires {rentalDays > 1 ? `(${rentalDays} jours)` : ''} :</span>
                      <span>{speakersPrice} €</span>
                    </div>
                  )}
                  {subwoofersPrice > 0 && (
                    <div className="flex justify-between text-xs text-gray-600 pl-4">
                      <span>Caissons de basse {rentalDays > 1 ? `(${rentalDays} jours)` : ''} :</span>
                      <span>{subwoofersPrice} €</span>
                    </div>
                  )}
                  {finalInstallationPrice > 0 && (
                    <div className="flex justify-between text-xs text-gray-600 pl-4">
                      <span>Installation :</span>
                      <span>{finalInstallationPrice} €</span>
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
                <span className="text-[#e27431]">{Math.round(adjustedTotalPrice)} €</span>
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
            
            {/* Afficher les micros sélectionnés */}
            {Object.entries(wiredMicQuantities).map(([productId, quantity]) => {
              if (quantity > 0) {
                const mic = wiredMics.find(m => m.id === productId);
                if (mic) {
                  return (
                    <li key={`wired-${productId}`} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#e27431] rounded-full" />
                      <span>
                        {language === 'fr' 
                          ? `🎤 ${mic.name} (${quantity}x)`
                          : `🎤 ${mic.name} (${quantity}x)`}
                      </span>
                    </li>
                  );
                }
              }
              return null;
            })}
            
            {Object.entries(wirelessMicQuantities).map(([productId, quantity]) => {
              if (quantity > 0) {
                const mic = wirelessMics.find(m => m.id === productId);
                if (mic) {
                  return (
                    <li key={`wireless-${productId}`} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#e27431] rounded-full" />
                      <span>
                        {language === 'fr' 
                          ? `🎤 ${mic.name} (${quantity}x)`
                          : `🎤 ${mic.name} (${quantity}x)`}
                      </span>
                    </li>
                  );
                }
              }
              return null;
            })}
            
            {/* Afficher les enceintes sélectionnées */}
            {Object.entries(speakerQuantities).map(([productId, quantity]) => {
              if (quantity > 0) {
                const speaker = speakers.find(s => s.id === productId);
                if (speaker) {
                  return (
                    <li key={`speaker-${productId}`} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#e27431] rounded-full" />
                      <span>
                        {language === 'fr' 
                          ? `🔊 ${speaker.name} (${quantity}x)`
                          : `🔊 ${speaker.name} (${quantity}x)`}
                      </span>
                    </li>
                  );
                }
              }
              return null;
            })}
            
            {/* Afficher les caissons sélectionnés */}
            {Object.entries(subwooferQuantities).map(([productId, quantity]) => {
              if (quantity > 0) {
                const subwoofer = subwoofers.find(s => s.id === productId);
                if (subwoofer) {
                  return (
                    <li key={`subwoofer-${productId}`} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#e27431] rounded-full" />
                      <span>
                        {language === 'fr' 
                          ? `🔊 ${getSubwooferDisplayName(subwoofer)} (${quantity}x)`
                          : `🔊 ${getSubwooferDisplayName(subwoofer)} (${quantity}x)`}
                      </span>
                    </li>
                  );
                }
              }
              return null;
            })}
          </ul>
        </div>

        {/* Message de conclusion (Message 10) */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {language === 'fr' ? 'Parfait ✅' : 'Perfect ✅'}
          </h3>
          <p className="text-gray-700 mb-4">
            {language === 'fr' 
              ? 'Votre configuration est adaptée à votre événement et prête à être réservée.'
              : 'Your configuration is adapted to your event and ready to be reserved.'}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            {language === 'fr' 
              ? '👉 Actions possibles :'
              : '👉 Possible actions :'}
          </p>
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

  // Mode chatbox : rendu simplifié sans overlay ni modal
  if (mode === 'chatbox') {
    return (
      <div className="w-full">
        {/* Contenu de l'assistant adapté pour chatbox */}
        <div className="space-y-3 sm:space-y-4">
          {showSummary ? (
            <div className="flex justify-start">
              <div className="max-w-[90%] sm:max-w-[85%] bg-white rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm">
                {renderSummary()}
              </div>
            </div>
          ) : (
            <>
              {/* Question de l'assistant */}
              <div className="flex justify-start">
                <div className="max-w-[90%] sm:max-w-[85%] bg-white rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm">
                  {renderStep()}
                </div>
              </div>
              
              {/* Navigation */}
              <div className="flex gap-2 pt-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors text-xs sm:text-sm touch-manipulation"
                  >
                    ← Précédent
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className={`flex-1 px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all touch-manipulation ${
                    canProceed
                      ? 'bg-[#F2431E] text-white hover:bg-[#E63A1A] active:bg-[#D32F0F]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  {currentStep === STEPS.length - 1 ? '✨ Voir la recommandation' : 'Suivant →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Mode modal : rendu complet avec overlay
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
              disabled={!canProceed}
              style={{ pointerEvents: canProceed ? 'auto' : 'none' }}
              className={`flex-1 py-3 sm:py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm sm:text-base ${
                canProceed
                  ? 'bg-gradient-to-r from-[#F2431E] to-[#e27431] text-white hover:from-[#E63A1A] hover:to-[#F2431E]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
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
