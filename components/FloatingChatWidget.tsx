'use client';

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatMessage, DraftFinalConfig, ChatIntent } from '@/types/chat';
import { useCart } from '@/contexts/CartContext';
import { applyFinalConfigToCart } from '@/lib/cart-utils';
import { isPackMode, hasRequiredPackFields } from '@/lib/pack-helpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function FloatingChatWidget() {
  const {
    messages,
    isOpen,
    isLoading,
    draftConfig,
    activeScenarioId,
    activePackKey,
    reservationRequestDraft,
    availabilityStatus, // V1.2 availability check
    availabilityDetails, // V1.2 availability check
    setIsLoading,
    setDraftConfig,
    setReservationRequestDraft,
    addUserMessage,
    addAssistantMessage,
    openChat,
    openChatWithDraft,
    closeChat,
    resetChat,
    resetIdleTimers,
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const [cartItemsNames, setCartItemsNames] = useState<Record<string, string>>({});
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [isCreatingInstantReservation, setIsCreatingInstantReservation] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null); // V1.5 - URL de suivi
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addToCart } = useCart();

  // V1.5 - Écouter l'événement de création de demande pour afficher le bouton de suivi
  useEffect(() => {
    const handleReservationRequestCreated = (event: CustomEvent) => {
      if (event.detail?.trackingUrl) {
        setTrackingUrl(event.detail.trackingUrl);
      }
    };

    window.addEventListener('reservationRequestCreated', handleReservationRequestCreated as EventListener);
    return () => {
      window.removeEventListener('reservationRequestCreated', handleReservationRequestCreated as EventListener);
    };
  }, []);

  /**
   * V1.3 Instant Booking - Vérifie si la réservation est éligible pour l'instant booking
   * Conditions:
   * - availabilityStatus === 'available'
   * - pack_key dans ('conference', 'soiree', 'mariage')
   * - Pas d'urgence (pas de flag "urgent" dans le payload)
   * - Heure de fin ≤ 23:00 (si endTime existe)
   * - Pas de flags complexes (acoustique, accès, besoin spécial)
   */
  const isInstantBookingEligible = (): boolean => {
    if (!activePackKey || !reservationRequestDraft) return false;
    
    // 1. Disponibilité
    if (availabilityStatus !== 'available') return false;
    
    // 2. Pack standard
    if (!['conference', 'soiree', 'mariage'].includes(activePackKey)) return false;
    
    // 3. Pas d'urgence
    const payload = reservationRequestDraft.payload;
    const payloadStr = JSON.stringify(payload).toLowerCase();
    if (payloadStr.includes('urgent') || payloadStr.includes('urgence') || payloadStr.includes('rapide')) {
      return false;
    }
    
    // 4. Heure de fin ≤ 23:00
    if (payload.endTime) {
      const endTimeStr = payload.endTime.toString();
      const timeMatch = endTimeStr.match(/(\d{1,2})[h:](\d{0,2})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        if (hours > 23) return false;
      }
    }
    
    // 5. Pas de flags complexes
    const complexFlags = ['acoustique', 'acoustique complexe', 'accès compliqué', 'accès difficile', 'besoin spécial', 'spécial'];
    for (const flag of complexFlags) {
      if (payloadStr.includes(flag)) return false;
    }
    
    // 6. Dates et heures présentes
    if (!payload.startDate || !payload.endDate) return false;
    
    return true;
  };

  // Charger les noms des produits pour le récap
  useEffect(() => {
    if (draftConfig && draftConfig.needsConfirmation) {
      const loadNames = async () => {
        const names: Record<string, string> = {};
        for (const sel of draftConfig.selections) {
          try {
            const { getCatalogItemById } = await import('@/lib/catalog');
            const item = await getCatalogItemById(sel.catalogId);
            if (item) {
              names[sel.catalogId] = item.name;
            } else {
              // Mapping des packs
              if (sel.catalogId === 'pack_petit') names[sel.catalogId] = 'Pack S Petit';
              else if (sel.catalogId === 'pack_confort') names[sel.catalogId] = 'Pack M Confort';
              else if (sel.catalogId === 'pack_grand') names[sel.catalogId] = 'Pack L Grand';
              else if (sel.catalogId === 'pack_maxi') names[sel.catalogId] = 'Pack XL Sur mesure';
              else names[sel.catalogId] = sel.catalogId;
            }
          } catch (e) {
            names[sel.catalogId] = sel.catalogId;
          }
        }
        setCartItemsNames(names);
      };
      loadNames();
    }
  }, [draftConfig]);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus sur textarea à l'ouverture
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Gérer ESC pour fermer
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeChat();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc as any);
      return () => window.removeEventListener('keydown', handleEsc as any);
    }
  }, [isOpen, closeChat]);

  // Flag pour éviter double envoi
  const isSendingRef = useRef(false);
  // Flag pour éviter double traitement du draft message (one-shot)
  const draftProcessedRef = useRef<string>('');
  // Ref pour stocker le dernier draft traité (pour éviter réinjection)
  const lastDraftRef = useRef<string>('');
  // Ref pour stocker le dernier packKey traité avec timestamp (pour éviter doubles clics rapides)
  const lastPackKeyRef = useRef<{ packKey: string; timestamp: number } | null>(null);
  // Ref pour stocker le scenarioId actif (persiste entre les messages)
  // Synchroniser avec activeScenarioId depuis useChat
  const scenarioIdRef = useRef<string | null>(null);
  // Ref pour stocker le contexte produit actif
  const productContextRef = useRef<{
    productType?: string;
    productId?: string;
    productName?: string;
    productUrl?: string;
  } | null>(null);
  
  // Synchroniser scenarioIdRef avec activeScenarioId
  useEffect(() => {
    scenarioIdRef.current = activeScenarioId;
  }, [activeScenarioId]);

  /**
   * Fonction unique pour envoyer un message
   * Appelée UNE SEULE FOIS depuis handleSend ou depuis le draft Hero
   */
  const sendMessage = useCallback(async (userContent: string) => {
    if (!userContent.trim() || isLoading || isSendingRef.current) {
      return;
    }

    // Guard anti-doublon pour le draft message (one-shot)
    const trimmedContent = userContent.trim();
    if (draftProcessedRef.current === trimmedContent && lastDraftRef.current === trimmedContent) {
      console.log('[CHAT] Draft message déjà traité (one-shot), ignoré:', trimmedContent);
      return;
    }
    
    // Si c'est un nouveau draft, mettre à jour les refs
    if (draftProcessedRef.current === trimmedContent && lastDraftRef.current !== trimmedContent) {
      lastDraftRef.current = trimmedContent;
    }

    isSendingRef.current = true;
    
    // CORRECTION BUG STATE ASYNC : Construire le tableau de messages AVANT de mettre à jour le state
    const currentMessages = messagesRef.current;
    
    // Vérifier si le message user existe déjà (peut être ajouté immédiatement par openChatWithDraft)
    const lastUserMessage = [...currentMessages].reverse().find(m => m.role === 'user' && m.kind === 'normal');
    const messageAlreadyExists = lastUserMessage && lastUserMessage.content === trimmedContent && Date.now() - lastUserMessage.createdAt < 2000;
    
    // Si le message existe déjà, on ne l'ajoute pas à nouveau mais on envoie quand même à l'API
    // (le message a été ajouté immédiatement dans openChatWithDraft pour éviter l'écran blanc)
    if (!messageAlreadyExists) {
      // Le message n'existe pas encore, l'ajouter via addUserMessage
      const added = addUserMessage(trimmedContent);
      if (!added) {
        // Message dupliqué, ne pas envoyer
        isSendingRef.current = false;
        return;
      }
    } else {
      console.log('[CHAT] Message déjà présent dans l\'UI (ajouté par openChatWithDraft), envoi à l\'API uniquement');
      // Reset timer même si le message existe déjà (action utilisateur)
      resetIdleTimers();
    }
    
    // Construire le tableau de messages pour l'API (utiliser les messages actuels)
    // Filtrer pour l'API (exclure idle et welcome) et inclure 'kind'
    const apiMessages = currentMessages
      .filter(m => m.kind !== 'idle' && m.kind !== 'welcome')
      .map(m => ({
        role: m.role,
        kind: m.kind, // IMPORTANT : inclure kind pour que l'API puisse détecter les messages user normaux
        content: m.content,
      }));

    // LOGS DIAGNOSTIQUES
    console.log('[CHAT] ===== DIAGNOSTIC AVANT APPEL API =====');
    console.log('[CHAT] Longueur messages:', apiMessages.length);
    console.log('[CHAT] Dernier message user:', apiMessages.filter(m => m.role === 'user').slice(-1)[0]);
    console.log('[CHAT] Tous les messages:', apiMessages.map(m => `${m.role}: ${m.kind || 'normal'}: ${m.content.substring(0, 50)}...`));
    console.log('[CHAT] ======================================');
    
    // Mettre à jour messagesRef avec les messages actuels
    messagesRef.current = currentMessages;
    
    // Marquer le draft comme traité
    draftProcessedRef.current = trimmedContent;

    setIsLoading(true);

    try {

      // Appel API avec le tableau nextMessages construit AVANT
      // Utiliser scenarioIdRef.current (persiste entre les messages) ou activeScenarioId (depuis useChat)
      const currentScenarioId = scenarioIdRef.current || activeScenarioId;
      const currentProductContext = productContextRef.current;
      const currentPackKey = activePackKey;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages, // Utiliser le tableau construit AVANT setMessages
          scenarioId: currentScenarioId, // Inclure le scenarioId si présent
          productContext: currentProductContext, // Inclure le contexte produit si présent
          packKey: currentPackKey, // Inclure le packKey si présent (mode pack)
        }),
      });

      console.log('[CHAT] Réponse API status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[CHAT] Erreur API:', response.status, errorData);
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      console.log('[CHAT] Réponse reçue:', { 
        hasReply: !!data.reply, 
        replyLength: data.reply?.length || 0,
        hasConfig: !!data.draftFinalConfig,
        hasReservationRequest: !!data.reservationRequestDraft
      });
      
      let cleanContent = data.reply || '';
      
      if (!cleanContent || cleanContent.trim().length === 0) {
        console.warn('[CHAT] Réponse vide, utilisation fallback');
        cleanContent = 'Je rencontre un souci technique. Peux-tu réessayer dans quelques secondes ?';
      } else {
        cleanContent = cleanContent.replace(/###\s*/g, '');
        cleanContent = cleanContent.replace(/\*\*/g, '');
        cleanContent = cleanContent.replace(/\*/g, '');
        cleanContent = cleanContent.trim();
      }

      // En mode pack, ne jamais passer draftFinalConfig à addAssistantMessage
      const configToUse = isPackMode(activePackKey) ? undefined : data.draftFinalConfig;
      addAssistantMessage(cleanContent, configToUse);
      
      // Si on est en mode pack et qu'on a un reservationRequestDraft, le stocker
      if (isPackMode(activePackKey) && data.reservationRequestDraft) {
        setReservationRequestDraft({
          pack_key: activePackKey!,
          payload: data.reservationRequestDraft.payload || {}
        });
        console.log('[CHAT] reservationRequestDraft mis à jour en mode pack:', activePackKey);
      }
      
      // 🛡️ GARDE-FOU : En mode pack, ignorer draftFinalConfig même si retourné
      if (isPackMode(activePackKey) && data.draftFinalConfig) {
        console.warn('[CHAT] 🛡️ draftFinalConfig reçu en mode pack, ignoré. packKey:', activePackKey);
        // Ne pas utiliser draftFinalConfig en mode pack
      }
    } catch (error) {
      console.error('[CHAT] Erreur envoi message:', error);
      // UI fallback : ne pas afficher le welcome, afficher un message d'erreur clair
      addAssistantMessage('Je n\'ai pas pu répondre. Réessaie ou contacte le support.');
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  }, [isLoading, addUserMessage, addAssistantMessage, setIsLoading, activePackKey, resetIdleTimers]);

  /**
   * Envoyer un message depuis l'input
   * Utilise sendMessage qui gère tout (anti-doublon inclus)
   */
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userContent = inputValue.trim();
    setInputValue('');
    
    await sendMessage(userContent);
  };

  // Gérer Enter (envoie) vs Shift+Enter (nouvelle ligne)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    resetIdleTimers();
  };

  // Bloquer la date (créer réservation/hold et rediriger vers checkout)
  const handleBlockDate = async () => {
    if (!draftConfig) return;

    resetIdleTimers(); // Action utilisateur → reset timer

    console.log('[CHAT] Tentative de blocage de date', draftConfig);

    try {
      // Utiliser la logique existante pour créer le panier (compatibilité backend)
      const result = await applyFinalConfigToCart(draftConfig);
      
      if (result.ok && result.cart && result.cart.items && result.cart.items.length > 0) {
        // Vérifier que tous les items ont une image avant d'ajouter
        const itemsWithImages = result.cart.items.map(item => {
          // Garantir qu'il y a toujours au moins une image
          if (!item.images || item.images.length === 0) {
            console.warn(`[CHAT] Item ${item.productName} sans image, ajout image par défaut`);
            return {
              ...item,
              images: ['/logo.svg'], // Image par défaut
            };
          }
          return item;
        });
        
        // Ajouter tous les items au panier (nécessaire pour le backend)
        for (const item of itemsWithImages) {
          const result = await addToCart(item);
          if (!result.success) {
            console.warn('Erreur ajout:', result.error);
          }
        }
        
        console.log(`[CHAT] ${itemsWithImages.length} items préparés avec succès`);
        
        // Dispatcher l'événement pour mettre à jour le compteur
        window.dispatchEvent(new CustomEvent('productAddedToCart'));
        
        // Message de confirmation orienté service
        addAssistantMessage('Parfait ! Je prépare votre solution. Vous allez être redirigé pour bloquer votre date avec un acompte de 30%.');
        setDraftConfig(null);
        
        // Rediriger vers le panier qui mènera au checkout (compatibilité backend)
        // Note: Le panier est utilisé en interne mais l'utilisateur ne le voit pas comme un "panier e-commerce"
        setTimeout(() => {
          window.location.href = '/panier';
        }, 1500);
      } else {
        console.error('[CHAT] Échec préparation:', result.error);
        addAssistantMessage('Je n\'ai pas réussi à préparer votre solution. Je réessaie ?');
        // Garder le draftConfig pour permettre le retry
      }
    } catch (error) {
      console.error('[CHAT] Erreur préparation:', error);
      addAssistantMessage('Je n\'ai pas réussi à préparer votre solution. Je réessaie ?');
    }
  };

  // Rendu d'un message - Style shadcn Card
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const isWelcome = message.kind === 'welcome';
    const isIdle = message.kind === 'idle';

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
        style={{ animation: 'fadeInUp 0.3s ease-out' }}
      >
        <Card
          className={`max-w-[80%] rounded-[18px] px-4 py-2.5 border-0 shadow-sm ${
            isUser
              ? 'bg-[#F2431E] text-white'
              : isWelcome || isIdle
              ? 'bg-[#F2431E]/10 backdrop-blur-sm text-[#F2431E] border border-[#F2431E]/20'
              : 'bg-white/90 backdrop-blur-sm text-gray-900 border border-gray-200/60'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        </Card>
      </div>
    );
  };

  // Ref pour stocker les messages actuels (évite dépendance circulaire)
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

    // Synchroniser productContextRef avec les événements
  useEffect(() => {
    const handleOpenChatWithDraft = (event: CustomEvent) => {
      const message = event.detail?.message;
      const scenarioId = event.detail?.scenarioId;
      const productContext = event.detail?.productContext;
      const packKey = event.detail?.packKey;
      
      // Anti-doublon : ignorer si même packKey dans les 500ms
      if (packKey && lastPackKeyRef.current && lastPackKeyRef.current.packKey === packKey && Date.now() - lastPackKeyRef.current.timestamp < 500) {
        console.log('[CHAT] Événement openChatWithDraft ignoré (doublon packKey):', packKey);
        return;
      }
      
      if (packKey) {
        lastPackKeyRef.current = { packKey, timestamp: Date.now() };
      }
      
      console.log('[CHAT] Événement openChatWithDraft reçu:', { message, scenarioId, productContext, packKey });
      
      // Stocker le contexte produit si fourni
      if (productContext) {
        productContextRef.current = productContext;
      }
      
      openChatWithDraft(message, scenarioId, packKey);
    };

    const handleChatDraftMessage = async (event: CustomEvent) => {
      const message = event.detail?.message;
      const scenarioId = event.detail?.scenarioId;
      const productContext = event.detail?.productContext;
      const packKey = event.detail?.packKey;
      
      if (!message || !message.trim() || !isOpen || isSendingRef.current) {
        return;
      }
      
      const trimmedMessage = message.trim();
      
      // ONE-SHOT : vérifier que ce message n'a pas déjà été traité (anti-doublon renforcé)
      if (draftProcessedRef.current === trimmedMessage && lastDraftRef.current === trimmedMessage) {
        console.log('[CHAT] Draft message déjà traité (one-shot), ignoré:', trimmedMessage.substring(0, 50));
        return;
      }
      
      // Marquer comme traité IMMÉDIATEMENT (one-shot)
      draftProcessedRef.current = trimmedMessage;
      lastDraftRef.current = trimmedMessage;
      
      // Si scenarioId fourni, le stocker dans la ref
      if (scenarioId) {
        scenarioIdRef.current = scenarioId;
        console.log('[CHAT] ScenarioId stocké:', scenarioId);
      }
      
      // Si productContext fourni, le stocker dans la ref
      if (productContext) {
        productContextRef.current = productContext;
        console.log('[CHAT] ProductContext stocké:', productContext);
      }
      
      // Si packKey fourni, log pour debugging
      if (packKey) {
        console.log('[CHAT] PackKey reçu dans draft message:', packKey);
      }
      
      console.log('[CHAT] Traitement draft message (one-shot):', trimmedMessage.substring(0, 50));
      
      // Attendre un peu pour s'assurer que le welcome est supprimé et le state est à jour
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await sendMessage(trimmedMessage);
    };

    // Wrappers pour convertir Event en CustomEvent
    const handleOpenChatWithDraftWrapper = (event: Event) => {
      handleOpenChatWithDraft(event as CustomEvent);
    };

    const handleChatDraftMessageWrapper = (event: Event) => {
      handleChatDraftMessage(event as CustomEvent);
    };

    window.addEventListener('openChatWithDraft', handleOpenChatWithDraftWrapper);
    window.addEventListener('chatDraftMessage', handleChatDraftMessageWrapper);
    
    return () => {
      window.removeEventListener('openChatWithDraft', handleOpenChatWithDraftWrapper);
      window.removeEventListener('chatDraftMessage', handleChatDraftMessageWrapper);
    };
  }, [openChatWithDraft, isOpen, sendMessage, activeScenarioId]);

  // Bouton flottant (fermé) - Style Apple
  if (!isOpen) {
    return (
      <Button
        onClick={() => openChat()}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 p-0 bg-[#F2431E] text-white rounded-full shadow-lg hover:bg-[#E63A1A] transition-all duration-200 hover:scale-105 [&>svg]:w-6 [&>svg]:h-6"
        size="icon"
        aria-label="Ouvrir l'assistant chat"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </Button>
    );
  }

  // Panneau ouvert - Style Apple brandé orange
  return (
    <>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div 
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-24px)] max-w-[calc(100vw-24px)] h-[60vh] bg-white/95 backdrop-blur-2xl rounded-[22px] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col md:left-auto md:translate-x-0 md:right-6 md:w-[380px] md:h-[520px]"
        onClick={resetIdleTimers}
      >
        {/* Header - Bandeau orange avec titre blanc et menu 3 points */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F2431E] rounded-t-[22px]">
          <h3 className="font-semibold text-base text-white tracking-tight">Assistant Soundrush</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
              onClick={() => {
                resetIdleTimers();
                closeChat();
              }}
              aria-label="Masquer la chatbox"
              title="Masquer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                  onClick={resetIdleTimers}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => {
                    resetIdleTimers();
                    resetChat();
                    setTrackingUrl(null); // V1.5 - Réinitialiser l'URL de suivi
                    lastPackKeyRef.current = null; // Réinitialiser le packKey ref
                  }}
                  className="cursor-pointer"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Réinitialiser
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    resetIdleTimers();
                    closeChat();
                  }}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Terminer conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Messages - Style shadcn avec ScrollArea */}
        <div className="flex-1 bg-white/40 backdrop-blur-sm overflow-hidden">
          <ScrollArea className="h-full px-6 py-5">
            <div className="space-y-3">
              {messages.map(renderMessage)}
              
              {isLoading && (
                <div className="flex justify-start">
                  <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-[18px] px-4 py-2.5 shadow-sm">
                    <p className="text-sm text-gray-600">
                      Assistant écrit
                      <span className="inline-block ml-1">
                        <span className="animate-pulse">.</span>
                        <span className="animate-pulse delay-75">.</span>
                        <span className="animate-pulse delay-150">.</span>
                      </span>
                    </p>
                  </Card>
                </div>
              )}

              {/* V1.5 - Bouton "Suivre ma demande" après création */}
              {trackingUrl && (
                <div className="flex justify-start mb-3">
                  <Card className="bg-green-50 border border-green-200 rounded-[18px] px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-900 mb-1">Suivre votre demande</p>
                        <p className="text-xs text-green-700">Consultez l'avancement de votre demande de réservation</p>
                      </div>
                      <Button
                        onClick={() => {
                          window.open(trackingUrl, '_blank');
                          setTrackingUrl(null); // Masquer après ouverture
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 h-auto"
                        size="sm"
                      >
                        Ouvrir
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Récap et bouton Bloquer ma date - UNIQUEMENT en mode normal (pas pack) */}
        {draftConfig && draftConfig.needsConfirmation && !isPackMode(activePackKey) && (
          <div className="px-6 py-4 border-t border-gray-100/50 bg-white/80 backdrop-blur-sm">
            <div className="mb-3">
              <p className="text-sm font-semibold text-gray-900 mb-2.5">Récapitulatif de votre solution</p>
              <ul className="text-xs text-gray-600 space-y-1.5">
                {draftConfig.selections.map((sel, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>• {cartItemsNames[sel.catalogId] || sel.catalogId}</span>
                    <span className="text-gray-500">x{sel.qty}</span>
                  </li>
                ))}
                {draftConfig.event && (
                  <>
                    <li className="pt-1.5 border-t border-gray-100 mt-1.5">
                      Date: {new Date(draftConfig.event.startISO).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </li>
                    {draftConfig.event.startISO && (
                      <li>
                        Heure: {new Date(draftConfig.event.startISO).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {draftConfig.event.endISO ? new Date(draftConfig.event.endISO).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '?'}
                      </li>
                    )}
                    {draftConfig.event.address && (
                      <li className="pt-1.5 border-t border-gray-100 mt-1.5">Lieu: {draftConfig.event.address}</li>
                    )}
                  </>
                )}
              </ul>
            </div>
            <Button
              onClick={handleBlockDate}
              className="w-full bg-[#F2431E] text-white hover:bg-[#E63A1A] rounded-[14px] font-semibold shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              Bloquer ma date (acompte 30%)
            </Button>
          </div>
        )}
        
        {/* Mode pack : Récap et bouton Envoyer la demande / Confirmer & payer */}
        {isPackMode(activePackKey) && reservationRequestDraft && (
          <div className="px-6 py-4 border-t border-gray-100/50 bg-white/80 backdrop-blur-sm">
            <div className="mb-3">
              <p className="text-sm font-semibold text-gray-900 mb-2.5">Récapitulatif de votre demande</p>
              <ul className="text-xs text-gray-600 space-y-1.5">
                <li>
                  <span className="font-semibold">Pack:</span> {
                    activePackKey === 'conference' ? 'Pack Conférence' :
                    activePackKey === 'soiree' ? 'Pack Soirée' :
                    'Pack Mariage'
                  }
                </li>
                {reservationRequestDraft.payload.eventType && (
                  <li><span className="font-semibold">Événement:</span> {reservationRequestDraft.payload.eventType}</li>
                )}
                {reservationRequestDraft.payload.peopleCount && (
                  <li><span className="font-semibold">Personnes:</span> {reservationRequestDraft.payload.peopleCount}</li>
                )}
                {reservationRequestDraft.payload.startDate && (
                  <li><span className="font-semibold">Date:</span> {reservationRequestDraft.payload.startDate}</li>
                )}
                {reservationRequestDraft.payload.address && (
                  <li><span className="font-semibold">Lieu:</span> {reservationRequestDraft.payload.address}</li>
                )}
              </ul>
            </div>
            
            {/* Champ téléphone obligatoire */}
            <div className="mb-3">
              <label htmlFor="customer-phone" className="block text-xs font-semibold text-gray-900 mb-1.5">
                Numéro de téléphone <span className="text-red-500">*</span>
              </label>
              <input
                id="customer-phone"
                type="tel"
                value={customerPhoneInput || reservationRequestDraft.payload.customerPhone || ''}
                onChange={(e) => {
                  const phone = e.target.value;
                  setCustomerPhoneInput(phone);
                  // Mettre à jour aussi dans le payload
                  if (reservationRequestDraft) {
                    setReservationRequestDraft({
                      ...reservationRequestDraft,
                      payload: {
                        ...reservationRequestDraft.payload,
                        customerPhone: phone,
                      },
                    });
                  }
                }}
                placeholder="06 12 34 56 78"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                📞 Utilisé uniquement pour la logistique (coordination livraison/installation). Vos données sont protégées.
              </p>
            </div>
            
            {/* V1.2 availability check - Affichage du statut de disponibilité */}
            {reservationRequestDraft.payload.startDate && reservationRequestDraft.payload.endDate && (
              <div className="mb-3">
                {availabilityStatus === 'checking' && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <p className="text-xs text-blue-700 font-medium">Vérification de la disponibilité…</p>
                  </div>
                )}
                {availabilityStatus === 'available' && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-green-600 text-sm">✅</span>
                    <p className="text-xs text-green-700 font-medium">
                      Disponible à cette date
                      {availabilityDetails?.remaining !== undefined && availabilityDetails.remaining > 0 && (
                        <span className="ml-1 text-green-600">
                          ({availabilityDetails.remaining} disponible{availabilityDetails.remaining > 1 ? 's' : ''})
                        </span>
                      )}
                    </p>
                  </div>
                )}
                {availabilityStatus === 'unavailable' && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-red-600 text-sm mt-0.5">❌</span>
                    <div className="flex-1">
                      <p className="text-xs text-red-700 font-medium">
                        Indisponible à cette date
                      </p>
                      {availabilityDetails?.reason && (
                        <p className="text-xs text-red-600 mt-1">{availabilityDetails.reason}</p>
                      )}
                      <p className="text-xs text-red-600 mt-1">
                        Veuillez choisir une autre date ou contacter le support pour des alternatives.
                      </p>
                    </div>
                  </div>
                )}
                {availabilityStatus === 'error' && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <span className="text-yellow-600 text-sm">⚠️</span>
                    <p className="text-xs text-yellow-700">
                      {availabilityDetails?.reason || 'Impossible de vérifier la disponibilité pour le moment'}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* V1.3 Instant Booking - Bouton conditionnel */}
            {(() => {
              const instantEligible = isInstantBookingEligible();
              
              // Vérifier si tous les champs requis sont présents
              const hasRequiredFields = hasRequiredPackFields(reservationRequestDraft);
              
              const isDisabled = 
                availabilityStatus === 'unavailable' ||
                availabilityStatus === 'checking' ||
                isCreatingInstantReservation ||
                !hasRequiredFields ||
                (!customerPhoneInput && !reservationRequestDraft.payload.customerPhone);
              
              // Debug logs minimaux
              if (instantEligible || !hasRequiredFields) {
                console.log('[INSTANT] État bouton:', {
                  instantEligible,
                  hasRequiredFields,
                  availabilityStatus,
                  isDisabled
                });
              }

              // Fonction partagée pour récupérer les infos client
              const getCustomerInfo = async () => {
                let customerEmail = '';
                let customerName = '';
                let customerPhone = customerPhoneInput || reservationRequestDraft.payload.customerPhone || '';

                try {
                  const { supabase } = await import('@/lib/supabase');
                  if (supabase) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user?.email) {
                      customerEmail = user.email;
                      customerName = user.user_metadata?.full_name || user.user_metadata?.name || '';
                    }
                  }
                } catch (e) {
                  console.error('Erreur récupération user:', e);
                }

                if (!customerEmail && reservationRequestDraft.payload.customerEmail) {
                  customerEmail = reservationRequestDraft.payload.customerEmail;
                }
                if (!customerName && reservationRequestDraft.payload.customerName) {
                  customerName = reservationRequestDraft.payload.customerName;
                }

                return { customerEmail, customerName, customerPhone };
              };

              // Handler pour instant booking
              const handleInstantBooking = async () => {
                console.log('[INSTANT] Début handleInstantBooking');
                console.log('[INSTANT] activePackKey:', activePackKey);
                console.log('[INSTANT] reservationRequestDraft:', reservationRequestDraft);
                console.log('[INSTANT] availabilityStatus:', availabilityStatus);
                
                const { customerEmail, customerName, customerPhone } = await getCustomerInfo();
                console.log('[INSTANT] Infos client:', { customerEmail, customerName, customerPhone });
                console.log('[INSTANT] customerPhone type:', typeof customerPhone, 'value:', customerPhone, 'trimmed:', customerPhone?.trim());

                // Validations
                if (!customerPhone || customerPhone.trim() === '') {
                  console.log('[INSTANT] ❌ ERREUR: téléphone manquant - customerPhone:', customerPhone);
                  setIsCreatingInstantReservation(false);
                  addAssistantMessage('❌ Veuillez renseigner votre numéro de téléphone dans le champ ci-dessus pour finaliser votre réservation.');
                  setTimeout(() => {
                    if (messagesEndRef.current) {
                      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                  return;
                }

                const phoneDigits = customerPhone.replace(/\D/g, '');
                console.log('[INSTANT] phoneDigits:', phoneDigits, 'length:', phoneDigits.length);
                // Accepter les numéros français (9 chiffres minimum, 10 idéalement)
                // Format: 06XXXXXXXX ou 07XXXXXXXX (10 chiffres) ou variantes avec 9 chiffres
                if (phoneDigits.length < 9) {
                  console.log('[INSTANT] ❌ ERREUR: téléphone invalide - moins de 9 chiffres');
                  setIsCreatingInstantReservation(false);
                  addAssistantMessage('❌ Veuillez renseigner un numéro de téléphone valide (au moins 9 chiffres).');
                  setTimeout(() => {
                    if (messagesEndRef.current) {
                      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                  return;
                }
                
                // Avertissement si moins de 10 chiffres mais on accepte quand même
                if (phoneDigits.length < 10) {
                  console.log('[INSTANT] ⚠️ Téléphone avec 9 chiffres seulement - accepté mais idéalement 10 chiffres');
                }
                
                console.log('[INSTANT] ✅ Validation téléphone OK');

                // Note: L'email n'est pas obligatoire pour l'instant booking
                // Stripe demandera l'email dans le checkout si nécessaire
                // On affiche juste un message informatif si l'email manque
                if (!customerEmail || customerEmail.trim() === '') {
                  console.log('[INSTANT] Email non fourni - Stripe demandera dans le checkout');
                  // Message informatif (non bloquant, envoyé en arrière-plan)
                  // On ne bloque pas le flux pour cela
                } else {
                  console.log('[INSTANT] ✅ Email fourni:', customerEmail);
                }

                console.log('[INSTANT] Vérification dates - activePackKey:', activePackKey, 'startDate:', reservationRequestDraft?.payload?.startDate, 'endDate:', reservationRequestDraft?.payload?.endDate);
                if (!activePackKey || !reservationRequestDraft?.payload?.startDate || !reservationRequestDraft?.payload?.endDate) {
                  console.log('[INSTANT] ❌ ERREUR: informations manquantes', { activePackKey, startDate: reservationRequestDraft?.payload?.startDate, endDate: reservationRequestDraft?.payload?.endDate });
                  setIsCreatingInstantReservation(false);
                  addAssistantMessage('❌ Erreur: informations manquantes (dates). Veuillez réessayer ou envoyer une demande de réservation.');
                  setTimeout(() => {
                    if (messagesEndRef.current) {
                      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                  return;
                }

                console.log('[INSTANT] ✅ Toutes les validations passées, création réservation...');
                console.log('[INSTANT] Email client:', customerEmail || '(sera demandé par Stripe)');
                setIsCreatingInstantReservation(true);

                try {
                  // HOLD v1 - Étape 1: Créer un hold avant de créer la réservation
                  const payload = reservationRequestDraft.payload;
                  
                  // Validation des dates avant création Date
                  if (!payload.startDate || !payload.endDate) {
                    throw new Error('Dates de début et de fin requises');
                  }
                  
                  const startAt = new Date(payload.startDate);
                  const endAt = new Date(payload.endDate);
                  
                  // Ajouter les heures si disponibles
                  if (payload.startTime) {
                    const [hours, minutes] = payload.startTime.split(/[h:]/).map(Number);
                    startAt.setHours(hours || 0, minutes || 0, 0, 0);
                  }
                  if (payload.endTime) {
                    const [hours, minutes] = payload.endTime.split(/[h:]/).map(Number);
                    endAt.setHours(hours || 0, minutes || 0, 0, 0);
                  }

                  // Créer le hold (blocage temporaire 10 minutes)
                  let holdId: string | null = null;
                  try {
                    const holdResponse = await fetch('/api/holds', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        pack_key: activePackKey,
                        start_at: startAt.toISOString(),
                        end_at: endAt.toISOString(),
                        contact_phone: customerPhone.trim(),
                        contact_email: customerEmail,
                        source: 'chat',
                      }),
                    });

                    if (!holdResponse.ok) {
                      const holdErrorData = await holdResponse.json();
                      // Si conflit (409), le créneau est déjà bloqué
                      if (holdResponse.status === 409) {
                        throw new Error('Ce créneau est temporairement indisponible. Veuillez choisir une autre date ou envoyer une demande de réservation.');
                      }
                      // Autre erreur : continuer mais logger
                      console.warn('[INSTANT] Erreur création hold (non bloquant):', holdErrorData);
                    } else {
                      const holdData = await holdResponse.json();
                      holdId = holdData.hold_id;
                    }
                  } catch (holdError) {
                    // Si erreur de hold, proposer fallback vers demande
                    if (holdError instanceof Error && holdError.message.includes('indisponible')) {
                      throw holdError; // Relancer l'erreur pour afficher le message
                    }
                    // Autre erreur : continuer mais logger
                    console.warn('[INSTANT] Erreur création hold (non bloquant):', holdError);
                  }

                  // HOLD v1 - Étape 2: Créer la réservation instantanée
                  const instantResponse = await fetch('/api/instant-reservations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      pack_key: activePackKey,
                      start_at: startAt.toISOString(),
                      end_at: endAt.toISOString(),
                      address: payload.address || null,
                      customer_email: customerEmail,
                      customer_phone: customerPhone.trim(),
                      customer_name: customerName || null,
                      payload: payload,
                      hold_id: holdId, // Passer le hold_id pour consommation
                    }),
                  });

                  if (!instantResponse.ok) {
                    const errorData = await instantResponse.json();
                    throw new Error(errorData.error || 'Erreur lors de la création de la réservation');
                  }

                  const { reservation_id } = await instantResponse.json();

                  // HOLD v1 - Étape 3: Créer la session Stripe Checkout avec hold_id
                  console.log('[INSTANT] Création session Stripe pour reservation_id:', reservation_id, 'hold_id:', holdId);
                  const checkoutResponse = await fetch('/api/payments/create-checkout-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      reservation_id,
                      ...(holdId && { hold_id: holdId }), // Passer hold_id si disponible
                    }),
                  });

                  console.log('[INSTANT] Réponse checkout:', checkoutResponse.status, checkoutResponse.ok);

                  if (!checkoutResponse.ok) {
                    const errorData = await checkoutResponse.json().catch(() => ({ error: 'Erreur inconnue' }));
                    console.error('[INSTANT] Erreur checkout:', errorData);
                    throw new Error(errorData.error || 'Erreur lors de la création de la session de paiement');
                  }

                  const checkoutData = await checkoutResponse.json();
                  console.log('[INSTANT] Données checkout:', checkoutData);

                  const url = checkoutData.url || checkoutData.checkoutUrl;
                  console.log('[INSTANT] URL Stripe:', url);

                  // 3. Rediriger vers Stripe Checkout
                  if (url) {
                    console.log('[INSTANT] Redirection vers Stripe...');
                    window.location.href = url;
                  } else {
                    console.error('[INSTANT] Pas d\'URL dans la réponse:', checkoutData);
                    throw new Error('URL de paiement non reçue');
                  }
                } catch (error) {
                  console.error('[INSTANT] Erreur instant booking:', error);
                  setIsCreatingInstantReservation(false);
                  // Message d'erreur visible avec proposition de fallback
                  const errorMessage = error instanceof Error 
                    ? `❌ Erreur: ${error.message}\n\n💡 Vous pouvez envoyer une demande de réservation à la place en cliquant sur "Envoyer la demande".`
                    : '❌ Erreur lors de la confirmation.\n\n💡 Vous pouvez envoyer une demande de réservation à la place en cliquant sur "Envoyer la demande".';
                  setTimeout(() => {
                    addAssistantMessage(errorMessage);
                  }, 100);
                }
              };

              // Handler pour demande normale
              const handleNormalRequest = async () => {
                const { customerEmail, customerName, customerPhone } = await getCustomerInfo();

                // Validations
                if (!customerPhone || customerPhone.trim() === '') {
                  addAssistantMessage('Veuillez renseigner votre numéro de téléphone pour finaliser votre demande.');
                  return;
                }

                const phoneDigits = customerPhone.replace(/\D/g, '');
                if (phoneDigits.length < 10) {
                  addAssistantMessage('Veuillez renseigner un numéro de téléphone valide (au moins 10 chiffres).');
                  return;
                }

                if (!customerEmail) {
                  addAssistantMessage('Veuillez fournir votre email pour envoyer la demande. Vous pouvez me le donner maintenant ou vous connecter.');
                  return;
                }

                if (!isPackMode(activePackKey)) {
                  addAssistantMessage('Erreur: type de pack invalide. Veuillez réessayer.');
                  return;
                }

                try {
                  const response = await fetch('/api/reservation-requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      pack_key: activePackKey,
                      payload: reservationRequestDraft.payload,
                      customer_email: customerEmail,
                      customer_phone: customerPhone.trim(),
                      customer_name: customerName || null,
                    }),
                  });

                  if (response.ok) {
                    const responseData = await response.json();
                    addAssistantMessage('Votre demande a été envoyée avec succès ! Nous vous recontacterons rapidement par email.');
                    
                    // V1.5 - Afficher le bouton "Suivre ma demande" si publicTrackingUrl disponible
                    if (responseData.publicTrackingUrl) {
                      // Ajouter un message avec le bouton de suivi
                      setTimeout(() => {
                        addAssistantMessage('Vous pouvez suivre l\'avancement de votre demande en cliquant sur le bouton ci-dessous.');
                        // Stocker l'URL de suivi pour affichage dans le UI
                        window.dispatchEvent(new CustomEvent('reservationRequestCreated', { 
                          detail: { trackingUrl: responseData.publicTrackingUrl } 
                        }));
                      }, 500);
                    }
                    
                    // Réinitialiser les états après envoi réussi
                    setReservationRequestDraft(null);
                    setDraftConfig(null);
                    setCustomerPhoneInput('');
                  } else {
                    const errorData = await response.json();
                    addAssistantMessage(errorData.error || 'Erreur lors de l\'envoi de la demande. Veuillez réessayer.');
                  }
                } catch (error) {
                  console.error('Erreur envoi demande:', error);
                  addAssistantMessage('Erreur lors de l\'envoi de la demande. Veuillez réessayer.');
                }
              };

              return instantEligible ? (
                <Button
                  onClick={() => {
                    console.log('[INSTANT] Bouton cliqué');
                    console.log('[INSTANT] isDisabled:', isDisabled);
                    console.log('[INSTANT] instantEligible:', instantEligible);
                    handleInstantBooking();
                  }}
                  disabled={isDisabled}
                  className="w-full bg-green-600 text-white hover:bg-green-700 rounded-[14px] font-semibold shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingInstantReservation ? 'Traitement...' : 'Bloquer ma date (acompte 30%)'}
                </Button>
              ) : (
                <Button
                  onClick={handleNormalRequest}
                  disabled={isDisabled}
                  className="w-full bg-[#F2431E] text-white hover:bg-[#E63A1A] rounded-[14px] font-semibold shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {availabilityStatus === 'checking' && 'Vérification...'}
                  {availabilityStatus === 'unavailable' && 'Indisponible à cette date'}
                  {availabilityStatus !== 'checking' && availabilityStatus !== 'unavailable' && 'Bloquer ma date (acompte 30%)'}
                </Button>
              );
            })()}
          </div>
        )}

        {/* Footer - Input - Style Apple iOS-like avec glass */}
        <div className="px-6 py-4 border-t border-gray-100/50 bg-white/80 backdrop-blur-sm rounded-b-[22px]">
          <div className="flex gap-2.5">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                resetIdleTimers();
              }}
              onKeyDown={handleKeyDown}
              onFocus={resetIdleTimers}
              placeholder="Tape ton message..."
              className="flex-1 resize-none border border-gray-200/80 rounded-[14px] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F2431E]/30 focus:border-[#F2431E] bg-white/90 backdrop-blur-sm transition-all placeholder:text-gray-400 shadow-sm"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={() => {
                resetIdleTimers();
                handleSend();
              }}
              disabled={!inputValue.trim() || isLoading}
              className="bg-[#F2431E] text-white hover:bg-[#E63A1A] rounded-[14px] font-semibold shadow-sm hover:shadow-md active:scale-[0.96] disabled:opacity-40"
              size="icon"
              aria-label="Envoyer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
