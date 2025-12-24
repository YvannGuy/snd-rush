'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useChatSimplified } from '@/hooks/useChat.simplified';
import { ChatMessage, ChatStep } from '@/types/chat';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Phone, CreditCard, Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

interface FloatingChatWidgetSimplifiedProps {
  initialPackKey?: 'conference' | 'soiree' | 'mariage' | null;
  onClose?: () => void;
}

export default function FloatingChatWidgetSimplified({
  initialPackKey = null,
  onClose,
}: FloatingChatWidgetSimplifiedProps) {
  const {
    messages,
    isOpen,
    isLoading,
    activePackKey,
    reservationDraft,
    currentStep,
    setIsLoading,
    setActivePackKey,
    addUserMessage,
    addAssistantMessage,
    openChat,
    openChatWithPack,
    closeChat,
    resetChat,
    updateReservationDraft,
    updateCurrentStep,
    canCheckout,
  } = useChatSimplified();

  const { user } = useUser();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ouvrir le chat avec pack si fourni
  useEffect(() => {
    if (initialPackKey && !isOpen) {
      openChatWithPack(initialPackKey);
    }
  }, [initialPackKey, isOpen, openChatWithPack]);

  // Écouter les événements pour ouvrir le chat avec packKey
  useEffect(() => {
    const handleOpenChatWithPack = (event: CustomEvent) => {
      const packKey = event.detail?.packKey;
      if (packKey && ['conference', 'soiree', 'mariage'].includes(packKey)) {
        openChatWithPack(packKey);
      } else {
        // Si pas de packKey, ouvrir le chat normalement
        openChat();
      }
    };

    // Écouter aussi les anciens événements pour compatibilité
    const handleOpenChatWithDraft = (event: CustomEvent) => {
      const packKey = event.detail?.packKey;
      if (packKey && ['conference', 'soiree', 'mariage'].includes(packKey)) {
        openChatWithPack(packKey);
      } else {
        openChat();
      }
    };

    const handleOpenAssistantModal = () => {
      openChat();
    };

    window.addEventListener('openChatWithPack', handleOpenChatWithPack as EventListener);
    window.addEventListener('openChatWithDraft', handleOpenChatWithDraft as EventListener);
    window.addEventListener('openAssistantModal', handleOpenAssistantModal as EventListener);
    
    return () => {
      window.removeEventListener('openChatWithPack', handleOpenChatWithPack as EventListener);
      window.removeEventListener('openChatWithDraft', handleOpenChatWithDraft as EventListener);
      window.removeEventListener('openAssistantModal', handleOpenAssistantModal as EventListener);
    };
  }, [openChatWithPack, openChat]);

  // Scroll vers le bas quand nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus sur input quand chat ouvert
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  /**
   * Envoyer un message à l'API chat
   */
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    // Ajouter message utilisateur
    addUserMessage(messageText);
    setInputValue('');
    setIsLoading(true);

    try {
      // Appeler l'API chat simplifiée
      const response = await fetch('/api/chat-simplified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          packKey: activePackKey || reservationDraft?.packKey,
          collected: reservationDraft || {},
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur API chat');
      }

      const data = await response.json();

      // Mettre à jour le draft avec les données collectées
      if (data.collected) {
        updateReservationDraft(data.collected);
      }

      // Mettre à jour l'étape actuelle
      if (data.currentStep) {
        updateCurrentStep(data.currentStep);
      }

      // Ajouter message assistant
      addAssistantMessage(data.assistantMessage);

      // Si readyToCheckout, on peut afficher les boutons finaux
    } catch (error) {
      console.error('[CHAT] Erreur:', error);
      addAssistantMessage("Désolé, une erreur s'est produite. Pouvez-vous réessayer ?");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gérer la soumission du formulaire
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue.trim());
    }
  };

  /**
   * Gérer la touche Entrée
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  /**
   * Ouvrir checkout Stripe pour acompte 30%
   */
  const handleCheckout = async () => {
    if (!canCheckout() || !reservationDraft || !activePackKey) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/reservations/create-deposit-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packKey: activePackKey,
          startAt: reservationDraft.startAt,
          endAt: reservationDraft.endAt,
          address: reservationDraft.address,
          phone: reservationDraft.phone,
          customerEmail: user?.email || '',
          customerName: user?.user_metadata?.first_name || user?.email?.split('@')[0] || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du checkout');
      }

      const { checkoutUrl } = await response.json();

      // Rediriger vers Stripe checkout
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error: any) {
      console.error('[CHECKOUT] Erreur:', error);
      addAssistantMessage(`Erreur: ${error.message || 'Impossible de créer le checkout. Veuillez réessayer.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Ouvrir appel téléphonique
   */
  const handleCall = () => {
    window.open('tel:0651084994', '_self');
  };

  /**
   * Fermer le chat
   */
  const handleClose = () => {
    closeChat();
    if (onClose) {
      onClose();
    }
  };

  const packNames: Record<string, string> = {
    conference: 'Pack Conférence',
    soiree: 'Pack Soirée',
    mariage: 'Pack Mariage',
  };

  const currentPackName = activePackKey ? packNames[activePackKey] : 'Pack';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {activePackKey ? currentPackName : 'Chat Soundrush'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4">
            {messages.map((message: ChatMessage) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-[#F2431E] text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Boutons finaux (si readyToCheckout) */}
        {canCheckout() && currentStep === 'recap' && (
          <div className="px-4 py-3 border-t bg-gray-50 space-y-2">
            <Button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full bg-[#F2431E] hover:bg-[#E63A1A] text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Payer l'acompte 30%
            </Button>
            <Button
              onClick={handleCall}
              variant="outline"
              className="w-full"
            >
              <Phone className="h-4 w-4 mr-2" />
              Appeler Soundrush (06 51 08 49 94)
            </Button>
          </div>
        )}

        {/* Input (si pas encore readyToCheckout) */}
        {(!canCheckout() || currentStep !== 'recap') && (
          <form onSubmit={handleSubmit} className="px-4 py-3 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  currentStep === 'dates'
                    ? 'Ex: 15 janvier 2025 de 19h à 23h'
                    : currentStep === 'location'
                    ? 'Ex: Paris 11ème ou 75011'
                    : 'Ex: 06 12 34 56 78'
                }
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
