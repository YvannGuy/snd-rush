# ARCHIVE COMPLÈTE DU SYSTÈME SOUNDRUSH

Ce fichier contient tous les contenus des fichiers principaux du système :
- Chatbox (FloatingChatWidget, useChat, API chat)
- Homepage
- Dashboards Admin (Catalogue, Réservations, Panier)
- Migrations Supabase et RLS

---

## 📦 COMPOSANTS CHATBOX

### FloatingChatWidget.tsx

```tsx
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

        {/* Récap et bouton Ajouter au panier - UNIQUEMENT en mode normal (pas pack) */}
        {draftConfig && draftConfig.needsConfirmation && !isPackMode(activePackKey) && (
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
                  {isCreatingInstantReservation ? 'Traitement...' : '✅ Confirmer & payer'}
                </Button>
              ) : (
                <Button
                  onClick={handleNormalRequest}
                  disabled={isDisabled}
                  className="w-full bg-[#F2431E] text-white hover:bg-[#E63A1A] rounded-[14px] font-semibold shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {availabilityStatus === 'checking' && 'Vérification...'}
                  {availabilityStatus === 'unavailable' && 'Indisponible à cette date'}
                  {availabilityStatus !== 'checking' && availabilityStatus !== 'unavailable' && 'Envoyer la demande'}
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
```

---

### useChat.ts

```typescript
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, DraftFinalConfig, ReservationRequestDraft, AvailabilityStatus, AvailabilityDetails } from '@/types/chat';

const STORAGE_KEY = 'sndrush_chat_messages';
const IDLE_TIMEOUT_MS = 45000; // 45 secondes d'inactivité réelle

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-' + Date.now(),
  role: 'assistant',
  kind: 'welcome',
  content: 'Bonjour ! Je suis l\'assistant Soundrush. Je peux t\'aider à trouver le matériel de sonorisation adapté à ton événement. Dis-moi ce que tu organises !',
  createdAt: Date.now(),
};

/**
 * Fonction unique pour injecter le message de bienvenue
 * Règles strictes : uniquement si messages.length === 0 et welcomeAddedRef === false
 */
function createWelcomeMessage(): ChatMessage {
  return {
    id: 'welcome-' + Date.now(),
    role: 'assistant',
    kind: 'welcome',
    content: 'Bonjour ! Je suis l\'assistant Soundrush. Je peux t\'aider à trouver le matériel de sonorisation adapté à ton événement. Dis-moi ce que tu organises !',
    createdAt: Date.now(),
  };
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [draftConfig, setDraftConfig] = useState<DraftFinalConfig | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [activePackKey, setActivePackKey] = useState<'conference' | 'soiree' | 'mariage' | null>(null);
  const [reservationRequestDraft, setReservationRequestDraft] = useState<ReservationRequestDraft | null>(null);
  
  // V1.2 availability check - État de disponibilité
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('idle');
  const [availabilityDetails, setAvailabilityDetails] = useState<AvailabilityDetails | null>(null);

  // Refs pour éviter les doublons
  const welcomeAddedRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const pendingDraftRef = useRef<string | null>(null); // Flag pour injection one-shot du message pack
  const lastDraftRef = useRef<string>(''); // Ref pour stocker le dernier draft traité (anti-doublon)
  
  // Refs pour la gestion de l'inactivité (logique stricte)
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleShownRef = useRef(false);
  const lastUserInteractionRef = useRef<number>(Date.now());
  
  // Ref pour stocker les messages actuels (évite dépendance circulaire)
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /**
   * Fonction unique pour injecter le message de bienvenue si nécessaire
   * Règles strictes :
   * - Uniquement si messages.length === 0
   * - Uniquement si welcomeAddedRef.current === false
   * - Ne jamais injecter si un message user existe déjà
   * - Ne jamais injecter si un message draft arrive (le Hero envoie déjà un message user)
   */
  const injectWelcomeMessageIfNeeded = useCallback((skipIfDraft = false) => {
    // Si skipIfDraft est true, ne pas injecter (un message draft arrive)
    if (skipIfDraft) {
      return;
    }
    
    // Vérifier que le chat est vraiment vide ET qu'il n'y a pas de message user
    setMessages(prev => {
      // Ne jamais injecter si un message user existe déjà
      const hasUserMessage = prev.some(m => m.role === 'user');
      if (hasUserMessage) {
        return prev;
      }
      
      // Injecter uniquement si le chat est vide et que le welcome n'a pas déjà été ajouté
      if (prev.length === 0 && !welcomeAddedRef.current) {
        const welcome = createWelcomeMessage();
        welcomeAddedRef.current = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify([welcome]));
        return [welcome];
      }
      return prev;
    });
  }, []);

  // Charger les messages depuis localStorage au mount (une seule fois)
  useEffect(() => {
    // Ne charger qu'une seule fois
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[];
        if (parsed.length > 0) {
          // Utiliser la forme fonctionnelle pour éviter d'écraser les messages
          setMessages(prev => {
            // Ne remplacer que si vraiment vide (première fois)
            if (prev.length === 0) {
              return parsed;
            }
            return prev; // Garder les messages existants
          });
          // Vérifier si welcome existe déjà
          welcomeAddedRef.current = parsed.some(m => m.kind === 'welcome');
          
          // Si un message user existe, ne pas réinjecter le welcome
          const hasUserMessage = parsed.some(m => m.role === 'user');
          if (hasUserMessage) {
            // Supprimer le welcome s'il existe car un message user existe
            const withoutWelcome = parsed.filter(m => m.kind !== 'welcome');
            if (withoutWelcome.length !== parsed.length) {
              setMessages(prev => {
                // Ne mettre à jour que si nécessaire
                const currentHasWelcome = prev.some(m => m.kind === 'welcome');
                if (currentHasWelcome) {
                  return prev.filter(m => m.kind !== 'welcome');
                }
                return prev;
              });
              welcomeAddedRef.current = false;
              localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutWelcome));
            }
          }
        } else {
          // Si le tableau est vide, injecter le welcome (append-only)
          const welcome = createWelcomeMessage();
          setMessages(prev => {
            if (prev.length === 0) {
              welcomeAddedRef.current = true;
              localStorage.setItem(STORAGE_KEY, JSON.stringify([welcome]));
              return [welcome];
            }
            return prev;
          });
        }
      } else {
        // Pas de localStorage, injecter le welcome (append-only)
        const welcome = createWelcomeMessage();
        setMessages(prev => {
          if (prev.length === 0) {
            welcomeAddedRef.current = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify([welcome]));
            return [welcome];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      // En cas d'erreur, injecter le welcome (append-only)
      const welcome = createWelcomeMessage();
      setMessages(prev => {
        if (prev.length === 0) {
          welcomeAddedRef.current = true;
          localStorage.setItem(STORAGE_KEY, JSON.stringify([welcome]));
          return [welcome];
        }
        return prev;
      });
    }
  }, []); // Pas de dépendances - s'exécute une seule fois au mount

  // Sauvegarder dans localStorage à chaque changement
  // IMPORTANT : Ne sauvegarder que si hasLoadedRef est true (après le premier chargement)
  // Cela évite d'écraser le localStorage pendant le chargement initial
  useEffect(() => {
    if (hasLoadedRef.current && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  /**
   * Réinitialiser le timer d'inactivité
   * Règles strictes :
   * - Ne démarre que si chat ouvert ET pas de loading
   * - Ne démarre QUE après une vraie interaction utilisateur (message envoyé)
   * - Reset sur chaque interaction utilisateur
   * - Timer de 45 secondes minimum
   * - Un seul idle maximum par session
   */
  const resetIdleTimer = useCallback(() => {
    // Nettoyer le timer existant
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }

    // Interdictions absolues
    if (!isOpen) {
      return; // Chat fermé → pas de timer
    }
    
    if (isLoading) {
      return; // Assistant en train d'écrire → pas de timer
    }

    // Vérifier qu'il y a eu au moins un message utilisateur réel
    // (pas juste le welcome)
    const hasUserMessage = messagesRef.current.some(m => m.role === 'user' && m.kind === 'normal');
    if (!hasUserMessage) {
      // Pas encore de message utilisateur → ne pas démarrer le timer
      return;
    }

    // Si idle déjà affiché, ne pas redémarrer le timer
    if (idleShownRef.current) {
      return;
    }

    // Mettre à jour la dernière interaction
    lastUserInteractionRef.current = Date.now();

    // Lancer un nouveau timer de 45 secondes
    idleTimeoutRef.current = setTimeout(() => {
      const now = Date.now();
      const timeSinceLastInteraction = now - lastUserInteractionRef.current;

      // Vérifications strictes avant d'afficher le message idle
      if (
        timeSinceLastInteraction >= IDLE_TIMEOUT_MS && // Au moins 45s d'inactivité
        !idleShownRef.current && // Pas déjà affiché
        !isLoading && // Assistant pas en train d'écrire
        isOpen // Chat ouvert
      ) {
        // Afficher UNE SEULE FOIS le message idle
        const idleMessage: ChatMessage = {
          id: 'idle-' + now,
          role: 'assistant',
          kind: 'idle',
          content: 'Je suis toujours là si tu as besoin d\'aide 🙂',
          createdAt: now,
        };
        
        setMessages(prev => [...prev, idleMessage]);
        idleShownRef.current = true;
      }
    }, IDLE_TIMEOUT_MS);
  }, [isOpen, isLoading]);

  // Alias pour compatibilité (utilisé dans d'autres composants)
  const resetIdleTimers = resetIdleTimer;

  // Guard anti-doublon
  const lastSubmittedTextRef = useRef<string>('');
  const lastSubmittedTimeRef = useRef<number>(0);

  // Ajouter un message utilisateur avec guard anti-doublon renforcé
  const addUserMessage = useCallback((content: string) => {
    if (!content.trim()) return null;

    const trimmedContent = content.trim();
    const now = Date.now();
    
    // Guard anti-doublon : ignorer si même texte dans les 800ms
    // MAIS : permettre si c'est le draft en attente (one-shot)
    const isPendingDraft = pendingDraftRef.current === trimmedContent;
    
    if (
      !isPendingDraft &&
      lastSubmittedTextRef.current === trimmedContent &&
      now - lastSubmittedTimeRef.current < 800
    ) {
      console.log('[CHAT] Message dupliqué ignoré (guard temporel):', trimmedContent);
      return null;
    }

    // Vérifier aussi dans les messages existants (dernier message user)
    // MAIS : permettre si c'est le draft en attente (one-shot)
    let shouldAdd = true;
    setMessages(prev => {
      const lastUserMessage = [...prev].reverse().find(m => m.role === 'user' && m.kind === 'normal');
      if (
        !isPendingDraft &&
        lastUserMessage &&
        lastUserMessage.content === trimmedContent &&
        now - lastUserMessage.createdAt < 2000 // Augmenter la fenêtre pour éviter doublons
      ) {
        console.log('[CHAT] Message déjà présent dans les messages, ignoré');
        shouldAdd = false;
        return prev;
      }
      return prev;
    });

    if (!shouldAdd) {
      return null;
    }

    lastSubmittedTextRef.current = trimmedContent;
    lastSubmittedTimeRef.current = now;
    
    // Si c'est le draft en attente, le clear après ajout (one-shot)
    if (isPendingDraft) {
      pendingDraftRef.current = null;
      console.log('[CHAT] Draft traité et marqué comme consommé:', trimmedContent);
    }

    const userMessage: ChatMessage = {
      id: 'user-' + now + '-' + Math.random(),
      role: 'user',
      kind: 'normal',
      content: trimmedContent,
      createdAt: now,
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Reset timer APRÈS action utilisateur réelle
    // C'est ici que le timer démarre vraiment (première interaction)
    lastUserInteractionRef.current = Date.now();
    idleShownRef.current = false; // Reset le flag idle quand l'utilisateur envoie un message
    resetIdleTimer();
    
    return userMessage;
  }, [resetIdleTimer]);

  // Ajouter un message assistant
  const addAssistantMessage = useCallback((content: string, config?: DraftFinalConfig) => {
    const assistantMessage: ChatMessage = {
      id: 'assistant-' + Date.now() + '-' + Math.random(),
      role: 'assistant',
      kind: 'normal',
      content: content.trim(),
      createdAt: Date.now(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    
    if (config) {
      setDraftConfig(config);
    }
    
    // Ne pas reset le timer après un message assistant
    // Le timer continue à partir de la dernière interaction utilisateur
    
    return assistantMessage;
  }, []);

  /**
   * Ouvrir le chat avec un message draft (depuis Hero ou SolutionsSection)
   * ONE-SHOT : le message draft ne sera injecté qu'une seule fois
   */
  const openChatWithDraft = useCallback((draftText?: string, scenarioId?: string, packKey?: 'conference' | 'soiree' | 'mariage') => {
    setIsOpen(true);
    
    // Stocker le scenarioId si fourni (persiste pour toute la conversation)
    if (scenarioId) {
      setActiveScenarioId(scenarioId);
      console.log('[CHAT] ScenarioId défini:', scenarioId);
    }
    
    // Stocker le packKey si fourni (persiste pour toute la conversation)
    if (packKey && (packKey === 'conference' || packKey === 'soiree' || packKey === 'mariage')) {
      setActivePackKey(packKey);
      console.log('[CHAT] PackKey défini:', packKey);
    }
    
    // Si un message draft arrive, SUPPRIMER le welcome s'il existe et AJOUTER le message user immédiatement
    // Le message user sera visible immédiatement pour éviter l'écran blanc
    if (draftText && draftText.trim()) {
      const trimmedDraft = draftText.trim();
      
      // ONE-SHOT : vérifier si ce draft a déjà été traité (anti-doublon)
      // Note: lastDraftRef est dans FloatingChatWidget, pas ici
      // On utilise seulement pendingDraftRef pour éviter les doublons dans useChat
      if (pendingDraftRef.current === trimmedDraft) {
        console.log('[CHAT] Draft déjà traité (one-shot), ignoré:', trimmedDraft);
        return;
      }
      
      // Marquer ce draft comme en attente (one-shot)
      pendingDraftRef.current = trimmedDraft;
      
      // Supprimer le welcome s'il existe
      setMessages(prev => {
        const hasWelcome = prev.some(m => m.kind === 'welcome');
        if (hasWelcome) {
          welcomeAddedRef.current = true; // Empêcher la réinjection
          return prev.filter(m => m.kind !== 'welcome');
        }
        return prev;
      });
      
      // Ajouter le message user immédiatement via addUserMessage pour éviter l'écran blanc
      // Cela garantit la cohérence avec le système anti-doublon
      const userMessageAdded = addUserMessage(trimmedDraft);
      if (!userMessageAdded) {
        // Le message n'a pas pu être ajouté (doublon), mais on continue quand même pour l'API
        console.log('[CHAT] Message user déjà présent, envoi à l\'API uniquement');
      }
      
      // Dispatcher un événement pour que FloatingChatWidget gère l'envoi à l'API
      // Délai réduit car le message user est déjà visible
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('chatDraftMessage', { 
          detail: { 
            message: trimmedDraft,
            scenarioId: scenarioId,
            packKey: packKey
          } 
        }));
      }, 50);
    } else {
      // Pas de message draft → injecter le welcome normalement
      injectWelcomeMessageIfNeeded(false);
      
      // Reset état idle à l'ouverture (mais ne pas démarrer le timer)
      idleShownRef.current = false;
      lastUserInteractionRef.current = Date.now();
    }
  }, [injectWelcomeMessageIfNeeded, addUserMessage]);

  // Ouvrir le chat (sans message)
  const openChat = useCallback(() => {
    setIsOpen(true);
    injectWelcomeMessageIfNeeded();
    
    // Reset état idle à l'ouverture
    idleShownRef.current = false;
    lastUserInteractionRef.current = Date.now();
    
    // Ne PAS démarrer le timer immédiatement
    // Il démarrera seulement après une interaction utilisateur
  }, [injectWelcomeMessageIfNeeded]);

  // Fermer le chat
  const closeChat = useCallback(() => {
    setIsOpen(false);
    
    // Nettoyer le timer
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    
    // Reset état idle
    idleShownRef.current = false;
    lastUserInteractionRef.current = Date.now();
  }, []);

  /**
   * Réinitialiser la conversation
   * DOIT : vider messages, nettoyer localStorage, réinitialiser TOUS les flags, réinjecter immédiatement le welcome
   * RÉSULTAT : toujours 1 message visible après reset (jamais de chatbox blanche)
   */
  const resetChat = useCallback(() => {
    // 1. Nettoyer le timer
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    
    // 2. Réinitialiser TOUS les flags
    welcomeAddedRef.current = false;
    idleShownRef.current = false;
    lastUserInteractionRef.current = Date.now();
    pendingDraftRef.current = null; // Réinitialiser le flag draft
    lastSubmittedTextRef.current = ''; // Réinitialiser le guard anti-doublon
    lastSubmittedTimeRef.current = 0;
    
    // 3. Vider le state
    setDraftConfig(null);
    setActiveScenarioId(null); // Réinitialiser le scenarioId
    setActivePackKey(null); // Réinitialiser le packKey
    setReservationRequestDraft(null); // Réinitialiser le reservationRequestDraft
    
    // V1.2 availability check - Réinitialiser l'état de disponibilité
    setAvailabilityStatus('idle');
    setAvailabilityDetails(null);
    
    // 4. Vider localStorage
    localStorage.removeItem(STORAGE_KEY);
    
    // 5. Créer et injecter immédiatement le message de bienvenue (remplacer complètement)
    const welcome = createWelcomeMessage();
    setMessages([welcome]); // OK ici car c'est un reset complet
    welcomeAddedRef.current = true;
    
    // 6. Sauvegarder immédiatement
    localStorage.setItem(STORAGE_KEY, JSON.stringify([welcome]));
    
    console.log('[CHAT] Reset complet effectué');
  }, []);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, []);

  // Nettoyer le timer si chat fermé ou loading
  useEffect(() => {
    if (!isOpen || isLoading) {
      // Chat fermé ou loading → nettoyer le timer
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
    }
    // Ne PAS démarrer le timer automatiquement ici
    // Le timer démarrera seulement après une interaction utilisateur (via resetIdleTimer)
  }, [isOpen, isLoading]);

  /**
   * V1.2 availability check - Vérifier la disponibilité d'un pack pour une période donnée
   * Réutilise EXACTEMENT la même signature que PackDetailContent.tsx
   */
  const checkAvailability = useCallback(async (
    packKey: 'conference' | 'soiree' | 'mariage',
    startDate: string,
    endDate: string,
    startTime?: string | null,
    endTime?: string | null
  ) => {
    // Réinitialiser l'état précédent
    setAvailabilityStatus('checking');
    setAvailabilityDetails(null);

    try {
      // Appeler l'API /api/availability avec packId = packKey (l'API accepte des strings)
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: packKey, // Utiliser packKey comme packId (l'API gérera le mapping)
          startDate,
          endDate,
          startTime: startTime || null,
          endTime: endTime || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      
      if (data.available) {
        setAvailabilityStatus('available');
        setAvailabilityDetails({
          remaining: data.remaining,
          bookedQuantity: data.bookedQuantity,
          totalQuantity: data.totalQuantity,
        });
      } else {
        setAvailabilityStatus('unavailable');
        setAvailabilityDetails({
          remaining: data.remaining,
          bookedQuantity: data.bookedQuantity,
          totalQuantity: data.totalQuantity,
          reason: `Indisponible (${data.bookedQuantity}/${data.totalQuantity} réservé${data.totalQuantity > 1 ? 's' : ''})`,
        });
      }
    } catch (error) {
      console.error('[CHAT] Erreur vérification disponibilité:', error);
      // En cas d'erreur, ne pas bloquer complètement le flux
      setAvailabilityStatus('error');
      setAvailabilityDetails({
        reason: 'Impossible de vérifier la disponibilité pour le moment',
      });
    }
  }, []);

  /**
   * V1.2 availability check - Déclencher la vérification automatique
   * Quand les dates/heures sont disponibles ET qu'un pack est sélectionné
   */
  useEffect(() => {
    // Conditions pour déclencher la vérification :
    // 1. Un pack est sélectionné (activePackKey)
    // 2. Un reservationRequestDraft existe
    // 3. Les dates de début et fin sont présentes
    if (
      activePackKey &&
      reservationRequestDraft?.payload?.startDate &&
      reservationRequestDraft?.payload?.endDate
    ) {
      const { startDate, endDate, startTime, endTime } = reservationRequestDraft.payload;
      
      // Vérifier la disponibilité
      checkAvailability(
        activePackKey,
        startDate,
        endDate,
        startTime || null,
        endTime || null
      );
    } else {
      // Si les conditions ne sont plus remplies, réinitialiser l'état
      if (availabilityStatus !== 'idle') {
        setAvailabilityStatus('idle');
        setAvailabilityDetails(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activePackKey,
    reservationRequestDraft?.payload?.startDate,
    reservationRequestDraft?.payload?.endDate,
    reservationRequestDraft?.payload?.startTime,
    reservationRequestDraft?.payload?.endTime,
    checkAvailability,
  ]);

  return {
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
    injectWelcomeMessageIfNeeded,
    resetIdleTimers,
  };
}
```

---

### app/api/chat/route.ts

**FICHIER COMPLET - 1988 LIGNES**

**Note importante:** Ce fichier est très volumineux (1988 lignes). Le contenu complet est disponible dans le fichier original `/app/api/chat/route.ts`.

**Fonctionnalités principales:**
- Détection d'intent utilisateur (urgences, événements, besoins techniques, comportements)
- Intégration OpenAI GPT-4o-mini avec prompt système détaillé
- Génération de `draftFinalConfig` pour ajout au panier (mode normal)
- Génération de `reservationRequestDraft` pour demandes de réservation (mode pack)
- Gestion des scénarios (dj-lâché, événement-2h, matériel-choisir, etc.)
- Gestion du mode pack vs mode normal avec règles strictes
- Prompt système complet avec catalogue produits intégré
- Gestion des dates/heures avec conversion relative → absolue
- Anti-répétition et continuité de conversation
- Détection de salutations, nombres, acquittements
- Logique de recommandation de packs selon nombre de personnes et contexte

**Structure du fichier:**
1. Imports et configuration OpenAI
2. Réponses spécifiques par scénario (SCENARIO_RESPONSES)
3. Fonctions utilitaires (normalizeText, hasWholeWord, detectIntent)
4. Réponses par intent (INTENT_RESPONSES)
5. Fonction buildAssistantReply
6. SYSTEM_PROMPT complet (très détaillé, ~1000 lignes)
7. Fonction POST principale avec toute la logique de traitement

Pour voir le code complet, référez-vous au fichier original.

---

## 🏠 HOMEPAGE

### app/page.tsx

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import IASection from '@/components/IASection';
import SolutionsSection from '@/components/SolutionsSection';
import UrgencySection from '@/components/UrgencySection';
import CommentCaMarcheSection from '@/components/CommentCaMarcheSection';
import PourQuiSection from '@/components/PourQuiSection';
import AboutSection from '@/components/AboutSection';
import GallerySection from '@/components/GallerySection';
import TrustedBySection from '@/components/TrustedBySection';
import TrustindexReviews from '@/components/TrustindexReviews';
import Footer from '@/components/Footer';
import SectionAnimation from '@/components/SectionAnimation';
import ReservationModal from '@/components/ReservationModal';
import LegalNoticeModal from '@/components/LegalNoticeModal';
import RentalConditionsModal from '@/components/RentalConditionsModal';
import CookieBanner from '@/components/CookieBanner';
import SplashScreen from '@/components/SplashScreen';
import ScenarioFAQSection from '@/components/ScenarioFAQSection';

export default function Home() {
  const router = useRouter();
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [reservationModal, setReservationModal] = useState(false);
  const [legalNoticeModal, setLegalNoticeModal] = useState(false);
  const [rentalConditionsModal, setRentalConditionsModal] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<number | undefined>(undefined);
  const [showContent, setShowContent] = useState(false);

  const handleReservePack = (packId: number) => {
    setSelectedPackId(packId);
    setReservationModal(true);
  };

  const handleCloseReservationModal = () => {
    setReservationModal(false);
    setSelectedPackId(undefined);
  };

  // Gérer les tokens d'authentification dans le hash (#access_token=...)
  useEffect(() => {
    const handleAuthTokens = async () => {
      if (!supabase || typeof window === 'undefined') return;

      // Vérifier s'il y a des tokens dans le hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      // Si c'est une confirmation d'inscription ou connexion avec tokens
      if (accessToken && refreshToken && (type === 'signup' || type === 'recovery')) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Erreur lors de la création de la session:', error);
            
            // Si l'erreur concerne oauth_client_id, essayer de rediriger quand même
            if (error.message?.includes('oauth_client_id')) {
              console.warn('⚠️ Erreur oauth_client_id détectée, redirection vers le dashboard...');
              // Nettoyer le hash de l'URL
              window.history.replaceState(null, '', window.location.pathname);
              // Rediriger vers le dashboard - la session peut quand même fonctionner
              router.push('/dashboard');
              return;
            }
            return;
          }

          if (data.session) {
            console.log('✅ Session créée avec succès');
            // Nettoyer le hash de l'URL
            window.history.replaceState(null, '', window.location.pathname);
            // Si c'est une réinitialisation de mot de passe, rediriger vers la page de réinitialisation
            if (type === 'recovery') {
              router.push('/reinitialiser-mot-de-passe');
            } else {
              // Sinon, rediriger vers le dashboard
              router.push('/dashboard');
            }
          }
        } catch (err: any) {
          console.error('Erreur lors du traitement des tokens:', err);
          
          // Si l'erreur concerne oauth_client_id, essayer de rediriger quand même
          if (err?.message?.includes('oauth_client_id')) {
            console.warn('⚠️ Erreur oauth_client_id détectée dans catch, redirection vers le dashboard...');
            // Nettoyer le hash de l'URL
            window.history.replaceState(null, '', window.location.pathname);
            // Rediriger vers le dashboard
            router.push('/dashboard');
          }
        }
      }
    };

    handleAuthTokens();
  }, [router]);

  // Écouter l'événement de réservation depuis l'assistant
  useEffect(() => {
    const handleOpenReservationModal = (event: CustomEvent) => {
      const { packId, message } = event.detail;
      setSelectedPackId(packId);
      setReservationModal(true);
      
      // Préremplir le message après ouverture du modal
      setTimeout(() => {
        const messageField = document.querySelector('textarea[name*="message"], textarea[name*="comment"]') as HTMLTextAreaElement;
        if (messageField) {
          messageField.value = message;
          messageField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 100);
    };

    window.addEventListener('openReservationModal', handleOpenReservationModal as EventListener);
    
    // Rediriger openAssistantModal vers la chatbox flottante
    const handleOpenAssistantToChat = () => {
      window.dispatchEvent(new CustomEvent('openChatWithDraft', { detail: { message: undefined } }));
    };
    window.addEventListener('openAssistantModal', handleOpenAssistantToChat as EventListener);
    
    return () => {
      window.removeEventListener('openReservationModal', handleOpenReservationModal as EventListener);
      window.removeEventListener('openAssistantModal', handleOpenAssistantToChat as EventListener);
    };
  }, []);

  return (
    <>
      {/* Splash Screen - affiché en premier, bloque le rendu */}
      <SplashScreen onComplete={() => setShowContent(true)} />
      
      {/* Contenu principal - affiché seulement après le splash */}
      {showContent && (
        <div className="min-h-screen bg-white">
          <Header 
            language={language} 
            onLanguageChange={setLanguage}
          />
      
      <main>
        <HeroSection 
          language={language}
        />

        {/* Section IA */}
        <SectionAnimation delay={0.05}>
          <IASection language={language} />
        </SectionAnimation>

        {/* Section Nos Solutions */}
        <SectionAnimation delay={0.1}>
          <SolutionsSection 
            language={language}
          />
        </SectionAnimation>

        {/* Section Besoin d'une sono maintenant ? */}
        <SectionAnimation delay={0.2}>
          <UrgencySection language={language} />
        </SectionAnimation>

        {/* Section Comment ça marche */}
        <SectionAnimation delay={0.25}>
          <CommentCaMarcheSection language={language} />
        </SectionAnimation>

        {/* Section Pour Qui ? */}
        <SectionAnimation delay={0.3}>
          <PourQuiSection language={language} />
        </SectionAnimation>

        {/* Section Pourquoi SoundRush */}
        <SectionAnimation delay={0.4}>
          <AboutSection language={language} />
        </SectionAnimation>

        {/* Section Galerie Vidéos */}
        <SectionAnimation delay={0.45}>
          <GallerySection language={language} />
        </SectionAnimation>

        {/* Section Ils nous ont fait confiance */}
        <SectionAnimation delay={0.48}>
          <TrustedBySection language={language} />
        </SectionAnimation>

        {/* Section Témoignages Clients */}
        <SectionAnimation delay={0.5}>
          <TrustindexReviews language={language} />
        </SectionAnimation>

        {/* Section FAQ Scénarios */}
        <SectionAnimation delay={0.58}>
          <ScenarioFAQSection 
            language={language}
            onScenarioClick={(scenarioId) => {
              // Ouvrir l'assistant avec le scénario sélectionné
              window.dispatchEvent(new CustomEvent('openChatWithDraft', { 
                detail: { message: scenarioId } 
              }));
            }}
          />
        </SectionAnimation>

      </main>

          <Footer 
            language={language} 
            onLegalNoticeClick={() => setLegalNoticeModal(true)}
            onRentalConditionsClick={() => setRentalConditionsModal(true)}
          />

          {/* Modals */}
          <ReservationModal 
            isOpen={reservationModal} 
            onClose={handleCloseReservationModal}
            language={language}
            preselectedPackId={selectedPackId}
          />
          
          <LegalNoticeModal 
            isOpen={legalNoticeModal} 
            onClose={() => setLegalNoticeModal(false)}
            language={language}
          />
          
          <RentalConditionsModal 
            isOpen={rentalConditionsModal} 
            onClose={() => setRentalConditionsModal(false)}
            language={language}
          />
        </div>
      )}
    </>
  );
}
```

---

## 🔧 DASHBOARDS ADMIN

### app/admin/catalogue/page.tsx

**Note:** Contenu complet disponible dans le fichier original (310 lignes). Ce fichier gère l'interface admin pour visualiser et gérer le catalogue de produits.

### app/admin/page.tsx

**Note:** Contenu complet disponible dans le fichier original (1052 lignes). Ce fichier est le dashboard principal admin avec statistiques, réservations à venir, matériel sorti, clients récents, et planning.

### app/admin/reservation-requests/page.tsx

**Note:** Contenu complet disponible dans le fichier original (1406 lignes). Ce fichier gère l'interface admin pour examiner, approuver, ajuster ou rejeter les demandes de réservation des clients.

### app/panier/page.tsx

**Note:** Contenu complet disponible dans le fichier original (1256 lignes). Ce fichier gère la page panier utilisateur avec gestion des items, options de livraison, installation, produits recommandés, et intégration Stripe checkout.

---

## 🗄️ MIGRATIONS SUPABASE ET RLS

### Migration 1: Création des tables reservation_requests et client_reservations

```sql
-- Migration: Création des tables pour le système de demandes de réservation
-- Date: 2025-01-01

-- Table: reservation_requests
-- Stocke les demandes de réservation initiales depuis les packs publics
CREATE TABLE IF NOT EXISTS reservation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_key text NOT NULL CHECK (pack_key IN ('conference', 'soiree', 'mariage')),
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'PENDING_REVIEW', 'APPROVED', 'ADJUSTED', 'REJECTED')),
  customer_email text NOT NULL,
  customer_phone text,
  customer_name text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: client_reservations
-- Stocke les réservations créées après validation/adjustement admin
CREATE TABLE IF NOT EXISTS client_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES reservation_requests(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  pack_key text NOT NULL CHECK (pack_key IN ('conference', 'soiree', 'mariage')),
  status text NOT NULL DEFAULT 'AWAITING_PAYMENT' CHECK (status IN ('AWAITING_PAYMENT', 'PAID', 'CONFIRMED', 'CANCELLED')),
  price_total numeric NOT NULL CHECK (price_total >= 0),
  deposit_amount numeric NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  start_at timestamptz,
  end_at timestamptz,
  address text,
  notes text,
  stripe_session_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_reservation_requests_status ON reservation_requests(status);
CREATE INDEX IF NOT EXISTS idx_reservation_requests_customer_email ON reservation_requests(customer_email);
CREATE INDEX IF NOT EXISTS idx_reservation_requests_created_at ON reservation_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_reservations_user_id ON client_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_client_reservations_customer_email ON client_reservations(customer_email);
CREATE INDEX IF NOT EXISTS idx_client_reservations_status ON client_reservations(status);
CREATE INDEX IF NOT EXISTS idx_client_reservations_request_id ON client_reservations(request_id);
CREATE INDEX IF NOT EXISTS idx_client_reservations_stripe_session_id ON client_reservations(stripe_session_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reservation_requests_updated_at
  BEFORE UPDATE ON reservation_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_reservations_updated_at
  BEFORE UPDATE ON client_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies pour reservation_requests
-- Les inserts sont gérés uniquement via API routes (service role)
-- Les utilisateurs ne peuvent pas voir les demandes des autres
ALTER TABLE reservation_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres demandes (via email)
CREATE POLICY "Users can view their own reservation requests"
  ON reservation_requests
  FOR SELECT
  USING (auth.email() = customer_email);

-- RLS Policies pour client_reservations
ALTER TABLE client_reservations ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres réservations (via user_id ou email)
CREATE POLICY "Users can view their own client reservations"
  ON client_reservations
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.email() = customer_email
  );

-- Policy: Les utilisateurs ne peuvent pas modifier leurs réservations (seul le serveur peut)
-- Les modifications sont gérées uniquement via API routes avec service role

-- Note: Les admins peuvent voir toutes les données via les API routes qui utilisent supabaseAdmin (service role)
```

### Migration 2: Ajout des colonnes final_items et customer_summary

```sql
-- Migration: Ajout des colonnes final_items et customer_summary à client_reservations
-- Date: 2025-01-02

-- Ajouter la colonne final_items (jsonb) pour stocker les items finaux du pack avec ajustements
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS final_items jsonb DEFAULT '[]'::jsonb;

-- Ajouter la colonne customer_summary (text) pour stocker le résumé client généré automatiquement
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS customer_summary text;

-- Commentaires pour documentation
COMMENT ON COLUMN client_reservations.final_items IS 'Items finaux du pack avec ajustements admin (format: [{"label": "Enceinte", "qty": 2}])';
COMMENT ON COLUMN client_reservations.customer_summary IS 'Résumé client généré automatiquement à partir des items finaux';
```

### Migration 3: Ajout des champs de pricing

```sql
-- Migration: Ajout des champs de pricing base_pack_price et extras_total
-- Date: 2025-01-02

-- Ajouter base_pack_price pour stocker le prix de base du pack
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS base_pack_price numeric DEFAULT 0 CHECK (base_pack_price >= 0);

-- Ajouter extras_total pour stocker le total des extras ajoutés
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS extras_total numeric DEFAULT 0 CHECK (extras_total >= 0);

-- Commentaires pour documentation
COMMENT ON COLUMN client_reservations.base_pack_price IS 'Prix de base du pack (sans extras)';
COMMENT ON COLUMN client_reservations.extras_total IS 'Total des extras ajoutés depuis le catalogue';
```

### Migration 4: Création de la table reservation_holds

```sql
-- Migration: Création de la table reservation_holds pour le système de blocage temporaire (HOLD v1)
-- Date: 2025-01-03
-- Objectif: Éviter le double-booking lors de l'instant booking avec un blocage temporaire de 10 minutes

-- Table: reservation_holds
-- Stocke les blocages temporaires de créneaux lors de l'instant booking
CREATE TABLE IF NOT EXISTS reservation_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL, -- Date d'expiration (now() + 10 minutes)
  start_at timestamptz NOT NULL, -- Date/heure de début du créneau bloqué
  end_at timestamptz NOT NULL, -- Date/heure de fin du créneau bloqué
  pack_key text NOT NULL CHECK (pack_key IN ('conference', 'soiree', 'mariage')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CONSUMED', 'CANCELLED', 'EXPIRED')),
  reservation_id uuid REFERENCES client_reservations(id) ON DELETE SET NULL, -- Lien vers la réservation si consommé
  contact_phone text,
  contact_email text,
  source text NOT NULL DEFAULT 'chat' CHECK (source IN ('chat', 'pack_page', 'admin')),
  updated_at timestamptz DEFAULT now()
);

-- Index pour améliorer les performances des requêtes de disponibilité
-- Index sur status et expires_at pour filtrer rapidement les holds actifs et non expirés
CREATE INDEX IF NOT EXISTS idx_reservation_holds_status_expires 
  ON reservation_holds(status, expires_at) 
  WHERE status = 'ACTIVE';

-- Index sur start_at et end_at pour les vérifications de chevauchement
CREATE INDEX IF NOT EXISTS idx_reservation_holds_dates 
  ON reservation_holds(start_at, end_at);

-- Index sur pack_key pour filtrer par pack
CREATE INDEX IF NOT EXISTS idx_reservation_holds_pack_key 
  ON reservation_holds(pack_key);

-- Index sur reservation_id pour les requêtes de liaison
CREATE INDEX IF NOT EXISTS idx_reservation_holds_reservation_id 
  ON reservation_holds(reservation_id) 
  WHERE reservation_id IS NOT NULL;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_reservation_holds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER trigger_reservation_holds_updated_at
  BEFORE UPDATE ON reservation_holds
  FOR EACH ROW
  EXECUTE FUNCTION update_reservation_holds_updated_at();

-- Commentaires pour documentation
COMMENT ON TABLE reservation_holds IS 'Blocages temporaires de créneaux pour éviter le double-booking lors de l''instant booking';
COMMENT ON COLUMN reservation_holds.expires_at IS 'Date d''expiration du hold (généralement 10 minutes après création)';
COMMENT ON COLUMN reservation_holds.status IS 'ACTIVE: hold actif, CONSUMED: lié à une réservation, CANCELLED: annulé, EXPIRED: expiré';
COMMENT ON COLUMN reservation_holds.reservation_id IS 'ID de la réservation si le hold a été consommé';
```

### Migration 5: Ajout du token public pour client_reservations

```sql
-- Migration: Ajout des colonnes pour le token public de checkout (V1.4)
-- Date: 2025-01-03
-- Objectif: Permettre un checkout public sécurisé sans compte via lien email

-- Ajouter les colonnes pour le token public
ALTER TABLE client_reservations
  ADD COLUMN IF NOT EXISTS public_token_hash text,
  ADD COLUMN IF NOT EXISTS public_token_expires_at timestamptz;

-- Index pour améliorer les performances des requêtes de validation
CREATE INDEX IF NOT EXISTS idx_client_reservations_token_hash 
  ON client_reservations(public_token_hash) 
  WHERE public_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_reservations_token_expires 
  ON client_reservations(public_token_expires_at) 
  WHERE public_token_expires_at IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN client_reservations.public_token_hash IS 'Hash SHA256 du token public pour accès sécurisé au checkout sans compte';
COMMENT ON COLUMN client_reservations.public_token_expires_at IS 'Date d''expiration du token public (généralement 7 jours après création)';
```

### Migration 6: Ajout du token public pour reservation_requests

```sql
-- Migration: Ajout des colonnes pour le token public de suivi (V1.5)
-- Date: 2025-01-03
-- Objectif: Permettre un suivi public sécurisé des demandes de réservation sans compte

-- Ajouter les colonnes pour le token public
ALTER TABLE reservation_requests
  ADD COLUMN IF NOT EXISTS public_token_hash text,
  ADD COLUMN IF NOT EXISTS public_token_expires_at timestamptz;

-- Index pour améliorer les performances des requêtes de validation
CREATE INDEX IF NOT EXISTS idx_reservation_requests_token_hash 
  ON reservation_requests(public_token_hash) 
  WHERE public_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservation_requests_token_expires 
  ON reservation_requests(public_token_expires_at) 
  WHERE public_token_expires_at IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN reservation_requests.public_token_hash IS 'Hash SHA256 du token public pour accès sécurisé au suivi sans compte';
COMMENT ON COLUMN reservation_requests.public_token_expires_at IS 'Date d''expiration du token public (généralement 7 jours après création)';
```

### Migration 7: Ajout des colonnes pour relances et rappels

```sql
-- Migration: Ajout des colonnes pour les relances paiement et rappels événement (Phase C)
-- Date: 2025-01-03
-- Objectif: Automatiser les relances paiement et rappels événement

-- Colonnes pour relances paiement (C1)
ALTER TABLE client_reservations
  ADD COLUMN IF NOT EXISTS reminder_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reminder_at timestamptz;

-- Colonnes pour rappels événement (C2)
ALTER TABLE client_reservations
  ADD COLUMN IF NOT EXISTS reminder_j1_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_h3_sent_at timestamptz;

-- Index pour améliorer les performances des requêtes de relance
CREATE INDEX IF NOT EXISTS idx_client_reservations_reminder_payment 
  ON client_reservations(status, reminder_count, created_at, last_reminder_at) 
  WHERE status = 'AWAITING_PAYMENT' AND reminder_count < 2;

CREATE INDEX IF NOT EXISTS idx_client_reservations_reminder_event 
  ON client_reservations(status, start_at, reminder_j1_sent_at, reminder_h3_sent_at) 
  WHERE status IN ('PAID', 'CONFIRMED') AND start_at IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN client_reservations.reminder_count IS 'Nombre de relances paiement envoyées (max 2)';
COMMENT ON COLUMN client_reservations.last_reminder_at IS 'Date de la dernière relance paiement envoyée';
COMMENT ON COLUMN client_reservations.reminder_j1_sent_at IS 'Date d''envoi du rappel J-1 (24h avant événement)';
COMMENT ON COLUMN client_reservations.reminder_h3_sent_at IS 'Date d''envoi du rappel H-3 (3h avant événement)';
```

### Migration 8: Rendre customer_email nullable

```sql
-- Migration: Rendre customer_email nullable dans client_reservations (V1.3 - Instant Booking)
-- Date: 2025-01-03
-- Objectif: Permettre la création de réservations instantanées sans email (Stripe demandera l'email dans le checkout)

-- Rendre customer_email nullable
ALTER TABLE client_reservations
  ALTER COLUMN customer_email DROP NOT NULL;

-- Commentaire pour documentation
COMMENT ON COLUMN client_reservations.customer_email IS 'Email du client (peut être NULL pour instant booking, sera rempli après paiement Stripe)';
```

### RLS Fix pour orders

```sql
-- Correction de la policy RLS pour la table orders
-- Remplacer auth.uid()::text = customer_email par auth.email() = customer_email
-- Note: user_profiles n'a pas de colonne email, donc on utilise directement auth.email()

-- Supprimer l'ancienne policy si elle existe
DROP POLICY IF EXISTS "Users can view own orders" ON orders;

-- Créer la nouvelle policy corrigée
-- Les utilisateurs peuvent voir leurs propres commandes via leur email
CREATE POLICY "Users can view own orders"
ON orders
FOR SELECT
USING (auth.email() = customer_email);
```

---

## 🏠 HOMEPAGE

### app/page.tsx

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import IASection from '@/components/IASection';
import SolutionsSection from '@/components/SolutionsSection';
import UrgencySection from '@/components/UrgencySection';
import CommentCaMarcheSection from '@/components/CommentCaMarcheSection';
import PourQuiSection from '@/components/PourQuiSection';
import AboutSection from '@/components/AboutSection';
import GallerySection from '@/components/GallerySection';
import TrustedBySection from '@/components/TrustedBySection';
import TrustindexReviews from '@/components/TrustindexReviews';
import Footer from '@/components/Footer';
import SectionAnimation from '@/components/SectionAnimation';
import ReservationModal from '@/components/ReservationModal';
import LegalNoticeModal from '@/components/LegalNoticeModal';
import RentalConditionsModal from '@/components/RentalConditionsModal';
import CookieBanner from '@/components/CookieBanner';
import SplashScreen from '@/components/SplashScreen';
import ScenarioFAQSection from '@/components/ScenarioFAQSection';

export default function Home() {
  const router = useRouter();
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [reservationModal, setReservationModal] = useState(false);
  const [legalNoticeModal, setLegalNoticeModal] = useState(false);
  const [rentalConditionsModal, setRentalConditionsModal] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<number | undefined>(undefined);
  const [showContent, setShowContent] = useState(false);

  const handleReservePack = (packId: number) => {
    setSelectedPackId(packId);
    setReservationModal(true);
  };

  const handleCloseReservationModal = () => {
    setReservationModal(false);
    setSelectedPackId(undefined);
  };

  // Gérer les tokens d'authentification dans le hash (#access_token=...)
  useEffect(() => {
    const handleAuthTokens = async () => {
      if (!supabase || typeof window === 'undefined') return;

      // Vérifier s'il y a des tokens dans le hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      // Si c'est une confirmation d'inscription ou connexion avec tokens
      if (accessToken && refreshToken && (type === 'signup' || type === 'recovery')) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Erreur lors de la création de la session:', error);
            
            // Si l'erreur concerne oauth_client_id, essayer de rediriger quand même
            if (error.message?.includes('oauth_client_id')) {
              console.warn('⚠️ Erreur oauth_client_id détectée, redirection vers le dashboard...');
              // Nettoyer le hash de l'URL
              window.history.replaceState(null, '', window.location.pathname);
              // Rediriger vers le dashboard - la session peut quand même fonctionner
              router.push('/dashboard');
              return;
            }
            return;
          }

          if (data.session) {
            console.log('✅ Session créée avec succès');
            // Nettoyer le hash de l'URL
            window.history.replaceState(null, '', window.location.pathname);
            // Si c'est une réinitialisation de mot de passe, rediriger vers la page de réinitialisation
            if (type === 'recovery') {
              router.push('/reinitialiser-mot-de-passe');
            } else {
              // Sinon, rediriger vers le dashboard
              router.push('/dashboard');
            }
          }
        } catch (err: any) {
          console.error('Erreur lors du traitement des tokens:', err);
          
          // Si l'erreur concerne oauth_client_id, essayer de rediriger quand même
          if (err?.message?.includes('oauth_client_id')) {
            console.warn('⚠️ Erreur oauth_client_id détectée dans catch, redirection vers le dashboard...');
            // Nettoyer le hash de l'URL
            window.history.replaceState(null, '', window.location.pathname);
            // Rediriger vers le dashboard
            router.push('/dashboard');
          }
        }
      }
    };

    handleAuthTokens();
  }, [router]);

  // Écouter l'événement de réservation depuis l'assistant
  useEffect(() => {
    const handleOpenReservationModal = (event: CustomEvent) => {
      const { packId, message } = event.detail;
      setSelectedPackId(packId);
      setReservationModal(true);
      
      // Préremplir le message après ouverture du modal
      setTimeout(() => {
        const messageField = document.querySelector('textarea[name*="message"], textarea[name*="comment"]') as HTMLTextAreaElement;
        if (messageField) {
          messageField.value = message;
          messageField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 100);
    };

    window.addEventListener('openReservationModal', handleOpenReservationModal as EventListener);
    
    // Rediriger openAssistantModal vers la chatbox flottante
    const handleOpenAssistantToChat = () => {
      window.dispatchEvent(new CustomEvent('openChatWithDraft', { detail: { message: undefined } }));
    };
    window.addEventListener('openAssistantModal', handleOpenAssistantToChat as EventListener);
    
    return () => {
      window.removeEventListener('openReservationModal', handleOpenReservationModal as EventListener);
      window.removeEventListener('openAssistantModal', handleOpenAssistantToChat as EventListener);
    };
  }, []);

  return (
    <>
      {/* Splash Screen - affiché en premier, bloque le rendu */}
      <SplashScreen onComplete={() => setShowContent(true)} />
      
      {/* Contenu principal - affiché seulement après le splash */}
      {showContent && (
        <div className="min-h-screen bg-white">
          <Header 
            language={language} 
            onLanguageChange={setLanguage}
          />
      
      <main>
        <HeroSection 
          language={language}
        />

        {/* Section IA */}
        <SectionAnimation delay={0.05}>
          <IASection language={language} />
        </SectionAnimation>

        {/* Section Nos Solutions */}
        <SectionAnimation delay={0.1}>
          <SolutionsSection 
            language={language}
          />
        </SectionAnimation>

        {/* Section Besoin d'une sono maintenant ? */}
        <SectionAnimation delay={0.2}>
          <UrgencySection language={language} />
        </SectionAnimation>

        {/* Section Comment ça marche */}
        <SectionAnimation delay={0.25}>
          <CommentCaMarcheSection language={language} />
        </SectionAnimation>

        {/* Section Pour Qui ? */}
        <SectionAnimation delay={0.3}>
          <PourQuiSection language={language} />
        </SectionAnimation>

        {/* Section Pourquoi SoundRush */}
        <SectionAnimation delay={0.4}>
          <AboutSection language={language} />
        </SectionAnimation>

        {/* Section Galerie Vidéos */}
        <SectionAnimation delay={0.45}>
          <GallerySection language={language} />
        </SectionAnimation>

        {/* Section Ils nous ont fait confiance */}
        <SectionAnimation delay={0.48}>
          <TrustedBySection language={language} />
        </SectionAnimation>

        {/* Section Témoignages Clients */}
        <SectionAnimation delay={0.5}>
          <TrustindexReviews language={language} />
        </SectionAnimation>

        {/* Section FAQ Scénarios */}
        <SectionAnimation delay={0.58}>
          <ScenarioFAQSection 
            language={language}
            onScenarioClick={(scenarioId) => {
              // Ouvrir l'assistant avec le scénario sélectionné
              window.dispatchEvent(new CustomEvent('openChatWithDraft', { 
                detail: { message: scenarioId } 
              }));
            }}
          />
        </SectionAnimation>

      </main>

          <Footer 
            language={language} 
            onLegalNoticeClick={() => setLegalNoticeModal(true)}
            onRentalConditionsClick={() => setRentalConditionsModal(true)}
          />

          {/* Modals */}
          <ReservationModal 
            isOpen={reservationModal} 
            onClose={handleCloseReservationModal}
            language={language}
            preselectedPackId={selectedPackId}
          />
          
          <LegalNoticeModal 
            isOpen={legalNoticeModal} 
            onClose={() => setLegalNoticeModal(false)}
            language={language}
          />
          
          <RentalConditionsModal 
            isOpen={rentalConditionsModal} 
            onClose={() => setRentalConditionsModal(false)}
            language={language}
          />
        </div>
      )}
    </>
  );
}
```

---

## 🤖 API CHAT

### app/api/chat/route.ts

Le fichier complet fait 1988 lignes. Voici les sections principales :

- **Imports et configuration OpenAI** : Configuration du client OpenAI avec la clé API
- **Détection d'intent** : Fonction `detectIntent()` pour identifier les intentions utilisateur (urgences, types d'événements, besoins techniques, comportements commerciaux)
- **Réponses par scénario** : Réponses spécifiques pour chaque scénario (dj-lache, evenement-2h, materiel-choisir, etc.)
- **Réponses par intent** : Réponses prédéfinies pour chaque intent détecté
- **SYSTEM_PROMPT** : Prompt système complet pour OpenAI (1369 lignes) avec :
  - Rôle principal et comportement général
  - Gestion du contexte et anti-répétition
  - Gestion des salutations
  - Logique de décision et de vente
  - Règles techniques pour les packs (S, M, L, XL)
  - Catalogue produits et règles d'utilisation
  - Format JSON pour draftFinalConfig et reservationRequestDraft
- **Fonction POST** : Handler principal qui :
  - Vérifie la présence de la clé OpenAI
  - Filtre les messages (exclut idle et welcome)
  - Charge le catalogue produits depuis Supabase
  - Construit le prompt système avec contexte
  - Gère le mode pack (conference, soiree, mariage)
  - Appelle OpenAI GPT-4o-mini
  - Extrait draftFinalConfig ou reservationRequestDraft de la réponse
  - Retourne la réponse formatée

**Note** : Le fichier complet est trop volumineux pour être inclus ici (1988 lignes). Il est disponible dans le projet à `app/api/chat/route.ts`.

---

## 👨‍💼 DASHBOARDS ADMIN

### app/admin/page.tsx

Le fichier complet fait 1052 lignes. Il contient :

- **Dashboard principal admin** avec statistiques :
  - Réservations à venir
  - CA du mois
  - Matériel sorti
  - Retours en retard
- **Liste des réservations à venir** (prochaines 30 jours)
- **Actions rapides** : Ajouter produit, Créer pack
- **État du matériel** : Réservations actives avec dates de retour
- **Clients récents** : Liste des clients avec nombre de réservations et total dépensé
- **Planning des réservations** : Calendrier mensuel avec jours marqués
- **Notification pour nouvelles demandes de réservation**
- **Authentification admin** : Vérification des permissions avant affichage

**Note** : Le fichier complet est disponible dans le projet à `app/admin/page.tsx`.

### app/admin/catalogue/page.tsx

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignModal from '@/components/auth/SignModal';
import Link from 'next/link';

export default function AdminCataloguePage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { isAdmin, checkingAdmin } = useAdmin();
  const router = useRouter();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

    // Rediriger si l'utilisateur n'est pas admin
  useEffect(() => {
    if (!checkingAdmin && !isAdmin && user) {
      console.warn('⚠️ Accès admin refusé pour:', user.email);
      router.push('/dashboard');
    }
  }, [isAdmin, checkingAdmin, user, router]);

useEffect(() => {
    if (!user || !supabase) return;

    const loadProducts = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
        setFilteredProducts(data || []);
      } catch (error) {
        console.error('Erreur chargement produits:', error);
      }
    };

    loadProducts();
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter((product) => {
    
  // Double vérification de sécurité
  if (!isAdmin) {
    return null;
  }

  return (
        product.name?.toLowerCase().includes(query) ||
        product.slug?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
    });
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchQuery, products]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const texts = {
    fr: {
      title: 'Catalogue produits',
      addProduct: '+ Ajouter un produit',
      searchPlaceholder: 'Rechercher un produit...',
      noProducts: 'Aucun produit',
      name: 'Nom',
      price: 'Prix/jour',
      deposit: 'Caution',
      category: 'Catégorie',
      actions: 'Actions',
      edit: 'Modifier',
      signInRequired: 'Connexion requise',
      signInDescription: 'Connectez-vous pour accéder au catalogue.',
      signIn: 'Se connecter',
    },
    en: {
      title: 'Product Catalog',
      addProduct: '+ Add a product',
      searchPlaceholder: 'Search a product...',
      noProducts: 'No products',
      name: 'Name',
      price: 'Price/day',
      deposit: 'Deposit',
      category: 'Category',
      actions: 'Actions',
      edit: 'Edit',
      signInRequired: 'Sign in required',
      signInDescription: 'Sign in to access the catalog.',
      signIn: 'Sign in',
    },
  };

  const currentTexts = texts[language];

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar language={language} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="text-6xl mb-6">🔒</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{currentTexts.signInRequired}</h1>
            <p className="text-xl text-gray-600 mb-8">{currentTexts.signInDescription}</p>
            <button
              onClick={() => setIsSignModalOpen(true)}
              className="inline-block bg-[#F2431E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors"
            >
              {currentTexts.signIn}
            </button>
          </div>
        </main>
        <SignModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          language={language}
          isAdmin={true}
          onSuccess={() => window.location.reload()}
          onOpenUserModal={() => router.push('/dashboard')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="flex flex-1 pt-[112px] lg:flex-row">
        {/* Sidebar - Fixed, ne prend pas d'espace dans le flux */}
        <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}></div>
        <AdminSidebar 
          language={language} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-30">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F2431E] rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">♪</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SoundRush</span>
            </Link>
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Header Desktop */}
          <div className="hidden lg:block">
            <AdminHeader language={language} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{currentTexts.title}</h1>
                <Link
                  href="/admin/catalogue/nouveau"
                  className="bg-[#F2431E] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors text-sm sm:text-base whitespace-nowrap"
                >
                  {currentTexts.addProduct}
                </Link>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder={currentTexts.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F2431E] focus:border-transparent"
                />
              </div>

              {paginatedProducts.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <p className="text-gray-500 text-lg">{currentTexts.noProducts}</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'produit' : 'produits'}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {paginatedProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                      <div className="mb-4 flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-grow">
                        <div className="h-[3rem] mb-2 flex items-start">
                          <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{product.name}</h3>
                        </div>
                        <div className="h-[3rem] mb-4">
                          <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-sm text-gray-500">{currentTexts.price}</div>
                            <div className="text-lg font-bold text-gray-900">{product.daily_price_ttc}€</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">{currentTexts.deposit}</div>
                            <div className="text-lg font-bold text-gray-900">{product.deposit}€</div>
                          </div>
                        </div>
                        <div className="mt-auto pt-2">
                          <Link
                            href={`/admin/catalogue/${product.id}`}
                            className="w-full text-center bg-[#F2431E] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors min-h-[44px] flex items-center justify-center"
                          >
                            {currentTexts.edit}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Précédent
                      </button>
                      <span className="px-4 py-2 text-gray-700">
                        Page {currentPage} sur {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Suivant
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <AdminFooter language={language} />
        </main>
      </div>
      <Footer language={language} />
    </div>
  );
}
```

### app/admin/reservation-requests/page.tsx

Le fichier complet fait 1406 lignes. Il contient :

- **Liste des demandes de réservation** avec filtres (Toutes, Nouvelles, En attente)
- **Modal détaillé** pour chaque demande avec :
  - Informations client (nom, email, téléphone)
  - Résumé de l'événement (type, lieu, nombre de personnes, ambiance, dates)
  - Contenu du pack de base
  - Configuration finale modifiable (ajout/suppression d'items)
  - Analyse admin avec flags (micro supplémentaire, acoustique complexe, horaire tardif, accès compliqué)
  - Prix et décision (valider, ajuster, refuser)
  - Historique des actions
- **Intégration avec le catalogue** pour ajouter des produits supplémentaires
- **Calcul automatique des prix** (pack de base + extras)
- **Génération automatique du résumé client**

**Note** : Le fichier complet est disponible dans le projet à `app/admin/reservation-requests/page.tsx`.

---

## 🛒 PAGE PANIER

### app/panier/page.tsx

Le fichier complet fait 1256 lignes. Il contient :

- **Affichage des items du panier** avec :
  - Images produits
  - Dates et heures de location
  - Quantités modifiables
  - Options et addons
  - Prix détaillés
- **Section achats additionnels** (masquée par défaut) :
  - Options de livraison (Paris, Petite Couronne, Grande Couronne, Retrait)
  - Option d'installation par technicien
- **Produits recommandés** depuis Supabase selon le contenu du panier
- **Résumé de commande** avec :
  - Sous-total matériel
  - Livraison
  - Installation
  - Caution (avec tooltip explicatif)
  - Total
- **Formulaire client** (email, nom, téléphone, adresse)
- **Intégration Stripe** pour le paiement
- **Gestion de l'authentification** avec modal de connexion si nécessaire

**Note** : Le fichier complet est disponible dans le projet à `app/panier/page.tsx`.

---

## 📝 NOTES IMPORTANTES

- Tous les fichiers sont en TypeScript/TSX
- Le système utilise Supabase pour la base de données
- Les RLS (Row Level Security) sont activés sur toutes les tables sensibles
- Le système de chat utilise OpenAI GPT-4o-mini
- Les dashboards admin nécessitent une authentification admin
- Le système de panier utilise Stripe pour les paiements
- Les migrations sont appliquées dans l'ordre chronologique

---

**Date de création de cette archive :** 2025-01-03
**Version du système :** V1.5 (avec instant booking, holds, tokens publics, relances automatiques)
