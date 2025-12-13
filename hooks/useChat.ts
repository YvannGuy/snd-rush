'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, DraftFinalConfig } from '@/types/chat';

const STORAGE_KEY = 'sndrush_chat_messages';
const IDLE_TIMEOUT_MS = 30000; // 30 secondes
const IDLE_CLOSE_TIMEOUT_MS = 30000; // 30 secondes après le message idle

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-' + Date.now(),
  role: 'assistant',
  kind: 'welcome',
  content: 'Bonjour ! Je suis l\'assistant Sndrush. Je peux t\'aider à trouver le matériel de sonorisation adapté à ton événement. Dis-moi ce que tu organises !',
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
    content: 'Bonjour ! Je suis l\'assistant Sndrush. Je peux t\'aider à trouver le matériel de sonorisation adapté à ton événement. Dis-moi ce que tu organises !',
    createdAt: Date.now(),
  };
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [draftConfig, setDraftConfig] = useState<DraftFinalConfig | null>(null);

  // Refs pour éviter les doublons
  const welcomeAddedRef = useRef(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idlePromptShownRef = useRef(false);
  const hasLoadedRef = useRef(false);

  /**
   * Fonction unique pour injecter le message de bienvenue si nécessaire
   * Interdiction : aucun autre endroit du code ne doit injecter le welcome
   */
  const injectWelcomeMessageIfNeeded = useCallback(() => {
    if (!welcomeAddedRef.current) {
      const welcome = createWelcomeMessage();
      setMessages([welcome]);
      welcomeAddedRef.current = true;
      // Sauvegarder immédiatement
      localStorage.setItem(STORAGE_KEY, JSON.stringify([welcome]));
    }
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
          setMessages(parsed);
          // Vérifier si welcome existe déjà
          welcomeAddedRef.current = parsed.some(m => m.kind === 'welcome');
        } else {
          // Si le tableau est vide, injecter le welcome
          const welcome = createWelcomeMessage();
          setMessages([welcome]);
          welcomeAddedRef.current = true;
          localStorage.setItem(STORAGE_KEY, JSON.stringify([welcome]));
        }
      } else {
        // Pas de localStorage, injecter le welcome
        const welcome = createWelcomeMessage();
        setMessages([welcome]);
        welcomeAddedRef.current = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify([welcome]));
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      // En cas d'erreur, injecter le welcome
      const welcome = createWelcomeMessage();
      setMessages([welcome]);
      welcomeAddedRef.current = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify([welcome]));
    }
  }, []); // Pas de dépendances - s'exécute une seule fois au mount

  // Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Réinitialiser les timers d'inactivité
  const resetIdleTimers = useCallback(() => {
    // Nettoyer les timers existants
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    if (idleCloseTimeoutRef.current) {
      clearTimeout(idleCloseTimeoutRef.current);
      idleCloseTimeoutRef.current = null;
    }

    // Réinitialiser le flag idle
    idlePromptShownRef.current = false;

    // Si le chat est ouvert, lancer un nouveau timer
    if (isOpen) {
      idleTimeoutRef.current = setTimeout(() => {
        // Si le prompt idle n'a pas encore été montré
        if (!idlePromptShownRef.current) {
          const idleMessage: ChatMessage = {
            id: 'idle-' + Date.now(),
            role: 'assistant',
            kind: 'idle',
            content: 'Je suis toujours là si tu as besoin d\'aide 🙂',
            createdAt: Date.now(),
          };
          
          setMessages(prev => [...prev, idleMessage]);
          idlePromptShownRef.current = true;

          // Lancer le timer de fermeture
          idleCloseTimeoutRef.current = setTimeout(() => {
            closeChat();
            resetChat();
          }, IDLE_CLOSE_TIMEOUT_MS);
        }
      }, IDLE_TIMEOUT_MS);
    }
  }, [isOpen]);

  // Réinitialiser les timers sur activité utilisateur
  useEffect(() => {
    if (isOpen) {
      resetIdleTimers();
    }
  }, [isOpen, resetIdleTimers]);

  // Guard anti-doublon
  const lastSubmittedTextRef = useRef<string>('');
  const lastSubmittedTimeRef = useRef<number>(0);

  // Ajouter un message utilisateur avec guard anti-doublon
  const addUserMessage = useCallback((content: string) => {
    if (!content.trim()) return null;

    const trimmedContent = content.trim();
    const now = Date.now();
    
    // Guard anti-doublon : ignorer si même texte dans les 800ms
    if (
      lastSubmittedTextRef.current === trimmedContent &&
      now - lastSubmittedTimeRef.current < 800
    ) {
      console.log('[CHAT] Message dupliqué ignoré:', trimmedContent);
      return null;
    }

    // Vérifier aussi dans les messages existants (dernier message user)
    setMessages(prev => {
      const lastUserMessage = [...prev].reverse().find(m => m.role === 'user' && m.kind === 'normal');
      if (
        lastUserMessage &&
        lastUserMessage.content === trimmedContent &&
        now - lastUserMessage.createdAt < 1000
      ) {
        console.log('[CHAT] Message déjà présent, ignoré');
        return prev;
      }
      return prev;
    });

    lastSubmittedTextRef.current = trimmedContent;
    lastSubmittedTimeRef.current = now;

    const userMessage: ChatMessage = {
      id: 'user-' + now + '-' + Math.random(),
      role: 'user',
      kind: 'normal',
      content: trimmedContent,
      createdAt: now,
    };

    setMessages(prev => [...prev, userMessage]);
    resetIdleTimers();
    return userMessage;
  }, [resetIdleTimers]);

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
    
    resetIdleTimers();
    return assistantMessage;
  }, [resetIdleTimers]);

  /**
   * Ouvrir le chat avec un message draft (depuis Hero)
   * Le Hero ne doit QUE passer le texte, le chat gère l'ajout et l'envoi
   */
  const openChatWithDraft = useCallback((draftText?: string) => {
    setIsOpen(true);
    injectWelcomeMessageIfNeeded();
    resetIdleTimers();

    // Si un message draft est fourni, le stocker pour envoi automatique
    // Mais NE PAS l'ajouter ici - le chat le fera UNE SEULE FOIS
    if (draftText && draftText.trim()) {
      // Dispatcher un événement pour que le chat gère l'ajout + envoi
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('chatDraftMessage', { detail: { message: draftText.trim() } }));
      }, 300);
    }
  }, [injectWelcomeMessageIfNeeded, resetIdleTimers]);

  // Ouvrir le chat (sans message)
  const openChat = useCallback(() => {
    setIsOpen(true);
    injectWelcomeMessageIfNeeded();
    resetIdleTimers();
  }, [injectWelcomeMessageIfNeeded, resetIdleTimers]);

  // Fermer le chat
  const closeChat = useCallback(() => {
    setIsOpen(false);
    
    // Nettoyer les timers
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    if (idleCloseTimeoutRef.current) {
      clearTimeout(idleCloseTimeoutRef.current);
      idleCloseTimeoutRef.current = null;
    }
  }, []);

  /**
   * Réinitialiser la conversation
   * DOIT : vider messages, nettoyer localStorage, réinitialiser TOUS les flags, réinjecter immédiatement le welcome
   * RÉSULTAT : toujours 1 message visible après reset (jamais de chatbox blanche)
   */
  const resetChat = useCallback(() => {
    // 1. Nettoyer les timers
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    if (idleCloseTimeoutRef.current) {
      clearTimeout(idleCloseTimeoutRef.current);
      idleCloseTimeoutRef.current = null;
    }
    
    // 2. Réinitialiser TOUS les flags
    welcomeAddedRef.current = false;
    idlePromptShownRef.current = false;
    
    // 3. Vider le state
    setDraftConfig(null);
    
    // 4. Vider localStorage
    localStorage.removeItem(STORAGE_KEY);
    
    // 5. Créer et injecter immédiatement le message de bienvenue
    const welcome = createWelcomeMessage();
    setMessages([welcome]);
    welcomeAddedRef.current = true;
    
    // 6. Sauvegarder immédiatement
    localStorage.setItem(STORAGE_KEY, JSON.stringify([welcome]));
  }, []);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      if (idleCloseTimeoutRef.current) {
        clearTimeout(idleCloseTimeoutRef.current);
      }
    };
  }, []);

  return {
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
    injectWelcomeMessageIfNeeded,
    resetIdleTimers,
  };
}
