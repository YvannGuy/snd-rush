'use client';

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatMessage, DraftFinalConfig, ChatIntent } from '@/types/chat';
import { useCart } from '@/contexts/CartContext';
import { applyFinalConfigToCart } from '@/lib/cart-utils';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addToCart } = useCart();

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
    
    // Vérifier anti-doublon avant de construire
    const lastUserMessage = [...currentMessages].reverse().find(m => m.role === 'user' && m.kind === 'normal');
    if (lastUserMessage && lastUserMessage.content === trimmedContent && Date.now() - lastUserMessage.createdAt < 1000) {
      console.log('[CHAT] Message déjà présent, ignoré');
      isSendingRef.current = false;
      return;
    }
    
    const userMessage: ChatMessage = {
      id: 'user-' + Date.now() + '-' + Math.random(),
      role: 'user',
      kind: 'normal',
      content: trimmedContent,
      createdAt: Date.now(),
    };
    
    // Construire le tableau nextMessages avec le nouveau message user
    const nextMessages = [...currentMessages, userMessage];
    
    // Filtrer pour l'API (exclure idle et welcome) et inclure 'kind'
    const apiMessages = nextMessages
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
    
    // Mettre à jour le state via addUserMessage (qui gère aussi le timer idle)
    // On utilise addUserMessage pour l'UI, mais on envoie nextMessages à l'API (construit localement)
    const added = addUserMessage(trimmedContent);
    if (!added) {
      // Message dupliqué, ne pas envoyer
      isSendingRef.current = false;
      return;
    }
    
    // Mettre à jour messagesRef pour que les prochains appels utilisent le bon state
    messagesRef.current = nextMessages;
    
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

      addAssistantMessage(cleanContent, data.draftFinalConfig);
      
      // Si on est en mode pack et qu'on a un reservationRequestDraft, le stocker
      if (activePackKey && data.reservationRequestDraft) {
        // Vérifier que activePackKey est bien l'un des types attendus
        if (activePackKey === 'conference' || activePackKey === 'soiree' || activePackKey === 'mariage') {
          setReservationRequestDraft({
            pack_key: activePackKey,
            payload: data.reservationRequestDraft.payload || {}
          });
        }
      }
    } catch (error) {
      console.error('[CHAT] Erreur envoi message:', error);
      // UI fallback : ne pas afficher le welcome, afficher un message d'erreur clair
      addAssistantMessage('Je n\'ai pas pu répondre. Réessaie ou contacte le support.');
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  }, [isLoading, addAssistantMessage, setIsLoading]);

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

  // Ajouter au panier
  const handleAddToCart = async () => {
    if (!draftConfig) return;

    resetIdleTimers(); // Action utilisateur → reset timer

    console.log('[CHAT] Tentative ajout au panier', draftConfig);

    try {
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
        
        // Ajouter tous les items au panier en une seule fois (batch)
        // Cela évite d'ouvrir le mini cart plusieurs fois
        for (const item of itemsWithImages) {
          const result = await addToCart(item);
          if (!result.success) {
            console.warn('Erreur ajout au panier:', result.error);
            // Ne pas bloquer l'utilisateur pour les erreurs de panier dans le widget
          }
        }
        
        console.log(`[CHAT] ${itemsWithImages.length} items ajoutés au panier avec succès`);
        
        // Dispatcher immédiatement l'événement pour mettre à jour le compteur sans délai
        // Le mini cart s'ouvrira automatiquement via l'événement productAddedToCart
        window.dispatchEvent(new CustomEvent('productAddedToCart'));
        
        // Seulement maintenant on confirme
        addAssistantMessage('C\'est dans ton panier. Tu peux passer commande depuis l\'icône panier en haut.');
        setDraftConfig(null);
      } else {
        console.error('[CHAT] Échec ajout panier:', result.error);
        addAssistantMessage('Je n\'ai pas réussi à l\'ajouter. Je réessaie ?');
        // Garder le draftConfig pour permettre le retry
      }
    } catch (error) {
      console.error('[CHAT] Erreur ajout panier:', error);
      addAssistantMessage('Je n\'ai pas réussi à l\'ajouter. Je réessaie ?');
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
      
      if (message && message.trim() && isOpen && !isSendingRef.current) {
        const trimmedMessage = message.trim();
        
        // ONE-SHOT : vérifier que ce message n'a pas déjà été traité
        if (draftProcessedRef.current === trimmedMessage) {
          console.log('[CHAT] Draft message déjà traité (one-shot), ignoré');
          return;
        }
        
        // Marquer comme traité IMMÉDIATEMENT (one-shot)
        draftProcessedRef.current = trimmedMessage;
        
        // Si scenarioId fourni, le stocker dans la ref ET synchroniser avec useChat
        if (scenarioId) {
          scenarioIdRef.current = scenarioId;
          console.log('[CHAT] ScenarioId stocké:', scenarioId);
        }
        
        // Si productContext fourni, le stocker dans la ref
        if (productContext) {
          productContextRef.current = productContext;
          console.log('[CHAT] ProductContext stocké:', productContext);
        }
        
        // Si packKey fourni, il sera géré par useChat via openChatWithDraft
        if (packKey) {
          console.log('[CHAT] PackKey reçu:', packKey);
        }
        
        console.log('[CHAT] Traitement draft message (one-shot):', trimmedMessage);
        
        // Attendre un peu pour s'assurer que le welcome est supprimé et le state est à jour
        await new Promise(resolve => setTimeout(resolve, 50));
        
        await sendMessage(trimmedMessage);
      }
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
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Récap et bouton Ajouter au panier / Envoyer la demande - Style Apple avec glass */}
        {draftConfig && draftConfig.needsConfirmation && !activePackKey && (
          <div className="px-6 py-4 border-t border-gray-100/50 bg-white/80 backdrop-blur-sm">
            <div className="mb-3">
              <p className="text-sm font-semibold text-gray-900 mb-2.5">Récapitulatif</p>
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
              onClick={handleAddToCart}
              className="w-full bg-[#F2431E] text-white hover:bg-[#E63A1A] rounded-[14px] font-semibold shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              Ajouter au panier
            </Button>
          </div>
        )}
        
        {/* Mode pack : Récap et bouton Envoyer la demande */}
        {activePackKey && reservationRequestDraft && (
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
            
            <Button
              onClick={async () => {
                // Récupérer l'email depuis la session si disponible
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
                
                // Utiliser l'email du payload si pas de session
                if (!customerEmail && reservationRequestDraft.payload.customerEmail) {
                  customerEmail = reservationRequestDraft.payload.customerEmail;
                }
                if (!customerName && reservationRequestDraft.payload.customerName) {
                  customerName = reservationRequestDraft.payload.customerName;
                }
                
                // Validation téléphone obligatoire
                if (!customerPhone || customerPhone.trim() === '') {
                  addAssistantMessage('Veuillez renseigner votre numéro de téléphone pour finaliser votre demande. Il est nécessaire pour coordonner la livraison et l\'installation.');
                  return;
                }
                
                // Validation format téléphone basique (au moins 10 caractères)
                const phoneDigits = customerPhone.replace(/\D/g, '');
                if (phoneDigits.length < 10) {
                  addAssistantMessage('Veuillez renseigner un numéro de téléphone valide (au moins 10 chiffres).');
                  return;
                }
                
                if (!customerEmail) {
                  addAssistantMessage('Veuillez fournir votre email pour envoyer la demande. Vous pouvez me le donner maintenant ou vous connecter.');
                  return;
                }
                
                // Envoyer la demande de réservation
                try {
                  // Vérifier que activePackKey est bien l'un des types attendus
                  if (!activePackKey || (activePackKey !== 'conference' && activePackKey !== 'soiree' && activePackKey !== 'mariage')) {
                    addAssistantMessage('Erreur: type de pack invalide. Veuillez réessayer.');
                    return;
                  }
                  
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
                    addAssistantMessage('Votre demande a été envoyée avec succès ! Nous vous recontacterons rapidement par email.');
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
              }}
              disabled={!customerPhoneInput && !reservationRequestDraft.payload.customerPhone}
              className="w-full bg-[#F2431E] text-white hover:bg-[#E63A1A] rounded-[14px] font-semibold shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Envoyer la demande
            </Button>
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
