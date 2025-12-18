'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, DraftFinalConfig, ReservationRequestDraft } from '@/types/chat';

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

  // Refs pour éviter les doublons
  const welcomeAddedRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const pendingDraftRef = useRef<string | null>(null); // Flag pour injection one-shot du message pack
  
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

  // Ajouter un message utilisateur avec guard anti-doublon
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
      console.log('[CHAT] Message dupliqué ignoré:', trimmedContent);
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
        now - lastUserMessage.createdAt < 1000
      ) {
        console.log('[CHAT] Message déjà présent, ignoré');
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
   * Ouvrir le chat avec un message draft (depuis Hero ou ScenarioFAQSection)
   * Le Hero ne doit QUE passer le texte, le chat gère l'ajout et l'envoi
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
    
    // Si un message draft arrive, SUPPRIMER le welcome s'il existe
    // Le message user sera ajouté et l'assistant répondra directement
    if (draftText && draftText.trim()) {
      const trimmedDraft = draftText.trim();
      
      // ONE-SHOT : vérifier si ce draft a déjà été traité
      if (pendingDraftRef.current === trimmedDraft) {
        console.log('[CHAT] Draft déjà en attente, ignoré:', trimmedDraft);
        return;
      }
      
      // Marquer ce draft comme en attente (one-shot)
      pendingDraftRef.current = trimmedDraft;
      
      // Supprimer le message d'accueil s'il existe (append-only, ne pas remplacer)
      setMessages(prev => {
        // Si le dernier message est un welcome, le supprimer
        const hasWelcome = prev.some(m => m.kind === 'welcome');
        if (hasWelcome) {
          welcomeAddedRef.current = true; // Empêcher la réinjection
          return prev.filter(m => m.kind !== 'welcome');
        }
        return prev;
      });
      
      // Ne PAS reset le timer idle ici
      // Le timer démarrera APRÈS l'envoi du message (dans sendMessage)
      
      // Dispatcher un événement pour que le chat gère l'ajout + envoi
      // Délai pour s'assurer que le chat est ouvert et que le welcome est supprimé
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('chatDraftMessage', { 
          detail: { 
            message: trimmedDraft,
            scenarioId: scenarioId,
            packKey: packKey
          } 
        }));
      }, 100); // Réduire le délai car on n'a plus besoin d'attendre l'injection du welcome
    } else {
      // Pas de message draft → injecter le welcome normalement
      injectWelcomeMessageIfNeeded(false);
      
      // Reset état idle à l'ouverture (mais ne pas démarrer le timer)
      idleShownRef.current = false;
      lastUserInteractionRef.current = Date.now();
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
    pendingDraftRef.current = null; // Réinitialiser le flag draft
    
    // 3. Vider le state
    setDraftConfig(null);
    setActiveScenarioId(null); // Réinitialiser le scenarioId
    setActivePackKey(null); // Réinitialiser le packKey
    setReservationRequestDraft(null); // Réinitialiser le reservationRequestDraft
    
    // 4. Vider localStorage
    localStorage.removeItem(STORAGE_KEY);
    
    // 5. Créer et injecter immédiatement le message de bienvenue (remplacer complètement)
    const welcome = createWelcomeMessage();
    setMessages([welcome]); // OK ici car c'est un reset complet
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
    injectWelcomeMessageIfNeeded,
    resetIdleTimers,
  };
}
