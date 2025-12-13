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
    setIsLoading,
    setDraftConfig,
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
  // Flag pour éviter double traitement du draft message
  const draftProcessedRef = useRef<string>('');

  /**
   * Fonction unique pour envoyer un message
   * Appelée UNE SEULE FOIS depuis handleSend ou depuis le draft Hero
   */
  const sendMessage = useCallback(async (userContent: string) => {
    if (!userContent.trim() || isLoading || isSendingRef.current) {
      return;
    }

    // Guard anti-doublon pour le draft message
    const trimmedContent = userContent.trim();
    if (draftProcessedRef.current === trimmedContent) {
      console.log('[CHAT] Draft message déjà traité, ignoré:', trimmedContent);
      return;
    }

    isSendingRef.current = true;
    
    // Ajouter le message user (avec guard anti-doublon dans addUserMessage)
    const added = addUserMessage(trimmedContent);
    if (!added) {
      // Message dupliqué, ne pas envoyer
      isSendingRef.current = false;
      return;
    }

    // Marquer le draft comme traité
    draftProcessedRef.current = trimmedContent;

    setIsLoading(true);

    try {
      // Attendre un peu pour que le state soit mis à jour
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const currentMessages = messagesRef.current;
      // Envoyer tous les messages SAUF les idle (pour le contexte)
      // Les messages welcome sont inclus pour donner le contexte à l'assistant
      const apiMessages = currentMessages
        .filter(m => m.kind !== 'idle') // Exclure uniquement les idle
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      console.log('[CHAT] Appel /api/chat avec', apiMessages.length, 'messages');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
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
        hasConfig: !!data.draftFinalConfig 
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
    } catch (error) {
      console.error('[CHAT] Erreur envoi message:', error);
      addAssistantMessage('Je rencontre un souci technique. Peux-tu réessayer dans quelques secondes ?');
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  }, [isLoading, addUserMessage, addAssistantMessage, setIsLoading]);

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
        // Ajouter chaque item au panier via le contexte
        for (const item of result.cart.items) {
          addToCart(item);
        }
        
        console.log('[CHAT] Items ajoutés au panier avec succès');
        
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

  // Écouter l'ouverture du chat avec draft depuis HeroInput
  useEffect(() => {
    const handleOpenChatWithDraft = (event: CustomEvent) => {
      const message = event.detail?.message;
      console.log('[CHAT] Événement openChatWithDraft reçu:', message);
      openChatWithDraft(message);
    };

    const handleChatDraftMessage = async (event: CustomEvent) => {
      const message = event.detail?.message;
      if (message && message.trim() && isOpen && !isSendingRef.current) {
        const trimmedMessage = message.trim();
        
        // Vérifier que ce message n'a pas déjà été traité
        if (draftProcessedRef.current === trimmedMessage) {
          console.log('[CHAT] Draft message déjà traité, ignoré');
          return;
        }
        
        console.log('[CHAT] Traitement draft message:', trimmedMessage);
        await sendMessage(trimmedMessage);
      }
    };

    window.addEventListener('openChatWithDraft', handleOpenChatWithDraft as EventListener);
    window.addEventListener('chatDraftMessage', handleChatDraftMessage as EventListener);
    
    return () => {
      window.removeEventListener('openChatWithDraft', handleOpenChatWithDraft as EventListener);
      window.removeEventListener('chatDraftMessage', handleChatDraftMessage as EventListener);
    };
  }, [openChatWithDraft, isOpen, sendMessage]);

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

        {/* Récap et bouton Ajouter au panier - Style Apple avec glass */}
        {draftConfig && draftConfig.needsConfirmation && (
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
