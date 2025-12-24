'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, ReservationDraft, ChatStep } from '@/types/chat';

const STORAGE_KEY = 'sndrush_chat_messages_simplified';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-' + Date.now(),
  role: 'assistant',
  kind: 'welcome',
  content: 'Bonjour ! Je suis l\'assistant Soundrush. Je peux t\'aider à réserver un pack pour ton événement. Dis-moi ce que tu organises !',
  createdAt: Date.now(),
};

/**
 * Hook simplifié pour le chat (flow 3 étapes)
 */
export function useChatSimplified() {
  // Alias pour compatibilité avec l'ancien hook
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activePackKey, setActivePackKey] = useState<'conference' | 'soiree' | 'mariage' | null>(null);
  const [reservationDraft, setReservationDraft] = useState<ReservationDraft | null>(null);
  const [currentStep, setCurrentStep] = useState<ChatStep>('dates');

  const hasLoadedRef = useRef(false);
  const welcomeAddedRef = useRef(false);

  /**
   * Vérifie si on peut passer au checkout
   */
  const canCheckout = useCallback((): boolean => {
    if (!reservationDraft || !activePackKey) return false;
    return !!(
      reservationDraft.startAt &&
      reservationDraft.endAt &&
      reservationDraft.address &&
      reservationDraft.phone
    );
  }, [reservationDraft, activePackKey]);

  /**
   * Charger les messages depuis localStorage au mount
   */
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          welcomeAddedRef.current = parsed.some(m => m.kind === 'welcome');
        } else {
          // Chat vide → injecter welcome
          setMessages([WELCOME_MESSAGE]);
          welcomeAddedRef.current = true;
          localStorage.setItem(STORAGE_KEY, JSON.stringify([WELCOME_MESSAGE]));
        }
      } else {
        // Pas de données → injecter welcome
        setMessages([WELCOME_MESSAGE]);
        welcomeAddedRef.current = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify([WELCOME_MESSAGE]));
      }
    } catch (error) {
      console.error('[CHAT] Erreur chargement localStorage:', error);
      setMessages([WELCOME_MESSAGE]);
      welcomeAddedRef.current = true;
    }
  }, []);

  /**
   * Sauvegarder les messages dans localStorage
   */
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  /**
   * Ajouter un message utilisateur
   */
  const addUserMessage = useCallback((content: string) => {
    if (!content.trim()) return null;

    const message: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      kind: 'normal',
      content: content.trim(),
      createdAt: Date.now(),
    };

    setMessages(prev => [...prev, message]);
    return message;
  }, []);

  /**
   * Ajouter un message assistant
   */
  const addAssistantMessage = useCallback((content: string) => {
    const message: ChatMessage = {
      id: 'assistant-' + Date.now(),
      role: 'assistant',
      kind: 'normal',
      content,
      createdAt: Date.now(),
    };

    setMessages(prev => [...prev, message]);
    return message;
  }, []);

  /**
   * Ouvrir le chat avec un pack prérempli
   */
  const openChatWithPack = useCallback((packKey: 'conference' | 'soiree' | 'mariage') => {
    setActivePackKey(packKey);
    setReservationDraft({ packKey });
    setCurrentStep('dates');
    setIsOpen(true);

    // Injecter welcome si nécessaire
    if (!welcomeAddedRef.current) {
      const welcome = {
        ...WELCOME_MESSAGE,
        id: 'welcome-' + Date.now(),
        content: `Bonjour ! Je vais t'aider à réserver le ${packKey === 'conference' ? 'Pack Conférence' : packKey === 'soiree' ? 'Pack Soirée' : 'Pack Mariage'}.\n\nQuelle est la date et l'heure de votre événement ?\n\nExemple: 15 janvier 2025 de 19h à 23h`,
      };
      setMessages([welcome]);
      welcomeAddedRef.current = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify([welcome]));
    }
  }, []);

  /**
   * Ouvrir le chat (sans pack)
   */
  const openChat = useCallback(() => {
    setIsOpen(true);
    if (!welcomeAddedRef.current) {
      setMessages([WELCOME_MESSAGE]);
      welcomeAddedRef.current = true;
    }
  }, []);

  /**
   * Fermer le chat
   */
  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Réinitialiser le chat
   */
  const resetChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setActivePackKey(null);
    setReservationDraft(null);
    setCurrentStep('dates');
    setIsLoading(false);
    welcomeAddedRef.current = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([WELCOME_MESSAGE]));
  }, []);

  /**
   * Mettre à jour le draft de réservation
   */
  const updateReservationDraft = useCallback((updates: Partial<ReservationDraft>) => {
    setReservationDraft(prev => {
      if (!prev) {
        return { packKey: activePackKey || 'conference', ...updates } as ReservationDraft;
      }
      return { ...prev, ...updates };
    });
  }, [activePackKey]);

  /**
   * Mettre à jour l'étape actuelle
   */
  const updateCurrentStep = useCallback((step: ChatStep) => {
    setCurrentStep(step);
  }, []);

  return {
    // État
    messages,
    isOpen,
    isLoading,
    activePackKey,
    reservationDraft,
    currentStep,
    
    // Fonctions
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
  };
}
