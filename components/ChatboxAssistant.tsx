'use client';

import { useState, useEffect, useRef } from 'react';
import AssistantRefactored from './AssistantRefactored';
import { ReservationPayload } from '@/types/assistant';

interface ChatboxAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'fr' | 'en';
  onReservationComplete?: (payload: ReservationPayload) => void;
  onRentalConditionsClick?: () => void;
}

interface Message {
  id: string;
  type: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  stepId?: string;
}

export default function ChatboxAssistant({
  isOpen,
  onClose,
  language = 'fr',
  onReservationComplete,
  onRentalConditionsClick
}: ChatboxAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatboxRef = useRef<HTMLDivElement>(null);

  // Message de bienvenue
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'assistant',
        content: language === 'fr' 
          ? '👋 Bonjour ! Je suis l\'assistant SoundRush Paris. Je vais vous aider à trouver le pack parfait pour votre événement en quelques questions simples. Prêt à commencer ?'
          : '👋 Hello! I\'m the SoundRush Paris assistant. I\'ll help you find the perfect pack for your event with a few simple questions. Ready to start?',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, language, messages.length]);

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fermer au clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatboxRef.current && !chatboxRef.current.contains(event.target as Node)) {
        // Ne pas fermer si on clique sur le bouton flottant
        const target = event.target as HTMLElement;
        if (!target.closest('[data-floating-button]')) {
          // Optionnel : on peut laisser la chatbox ouverte même en cliquant dehors
          // onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Chatbox Container */}
      <div
        ref={chatboxRef}
        className={`fixed z-50 flex flex-col bg-white shadow-2xl transition-all duration-300 ${
          isMinimized 
            ? 'w-80 h-16 bottom-24 right-6 rounded-2xl' 
            : 'w-full sm:w-96 h-[calc(100vh-120px)] sm:h-[600px] sm:max-h-[80vh] bottom-0 sm:bottom-24 right-0 sm:right-6 rounded-t-2xl sm:rounded-2xl'
        }`}
        style={{
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#F2431E] to-[#e27431] text-white p-3 sm:p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg sm:text-xl">🤖</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-xs sm:text-sm truncate">
                {language === 'fr' ? 'Assistant SoundRush Paris' : 'SoundRush Paris Assistant'}
              </h3>
              <p className="text-xs text-white/80 flex items-center gap-1">
                {language === 'fr' ? 'En ligne' : 'Online'}
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full inline-block flex-shrink-0"></span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors touch-manipulation"
              aria-label={isMinimized ? (language === 'fr' ? 'Agrandir' : 'Expand') : (language === 'fr' ? 'Réduire' : 'Minimize')}
            >
              {isMinimized ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors touch-manipulation"
              aria-label={language === 'fr' ? 'Fermer' : 'Close'}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area - seulement si non minimisé */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
              {/* Messages de bienvenue */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2 ${
                      message.type === 'assistant'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'bg-[#F2431E] text-white'
                    }`}
                  >
                    <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Zone pour l'assistant intégré - rendu en mode chatbox */}
              <div className="mt-3 sm:mt-4">
                <AssistantRefactored
                  isOpen={true}
                  onClose={() => {}}
                  language={language}
                  onReservationComplete={onReservationComplete}
                  onRentalConditionsClick={onRentalConditionsClick}
                  mode="chatbox"
                />
              </div>

              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
