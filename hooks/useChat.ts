'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, DraftFinalConfig } from '@/types/chat';

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

  // Refs pour éviter les doublons
  const welcomeAddedRef = useRef(false);
  const hasLoadedRef = useRef(false);
  
  // Refs pour la gestion de l'inactivité (logique stricte)
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleShownRef = useRef(false);
  const lastUserInteractionRef = useRef<number>(Date.now());

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

  /**
   * Réinitialiser le timer d'inactivité
   * Règles strictes :
   * - Ne démarre que si chat ouvert ET pas de loading
   * - Reset sur chaque interaction utilisateur
   * - Timer de 45 secondes minimum
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
    
    // Reset timer après action utilisateur
    lastUserInteractionRef.current = Date.now();
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
   * Ouvrir le chat avec un message draft (depuis Hero)
   * Le Hero ne doit QUE passer le texte, le chat gère l'ajout et l'envoi
   */
  const openChatWithDraft = useCallback((draftText?: string) => {
    setIsOpen(true);
    injectWelcomeMessageIfNeeded();
    
    // Reset état idle à l'ouverture
    idleShownRef.current = false;
    lastUserInteractionRef.current = Date.now();
    
    // Ne PAS démarrer le timer immédiatement
    // Il démarrera seulement après une interaction utilisateur

    // Si un message draft est fourni, le stocker pour envoi automatique
    // Mais NE PAS l'ajouter ici - le chat le fera UNE SEULE FOIS
    if (draftText && draftText.trim()) {
      // Dispatcher un événement pour que le chat gère l'ajout + envoi
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('chatDraftMessage', { detail: { message: draftText.trim() } }));
      }, 300);
    }
  }, [injectWelcomeMessageIfNeeded]);

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
