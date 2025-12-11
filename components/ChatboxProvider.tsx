'use client';

import { useState, useEffect } from 'react';
import FloatingChatButton from './FloatingChatButton';
import ChatboxAssistant from './ChatboxAssistant';
import { ReservationPayload } from '@/types/assistant';

interface ChatboxProviderProps {
  language?: 'fr' | 'en';
  onPackSelected?: (packId: number) => void;
  onRentalConditionsClick?: () => void;
}

export default function ChatboxProvider({
  language = 'fr',
  onPackSelected,
  onRentalConditionsClick
}: ChatboxProviderProps) {
  const [isChatboxOpen, setIsChatboxOpen] = useState(false);

  // Écouter l'événement pour ouvrir la chatbox
  useEffect(() => {
    const handleOpenAssistant = () => {
      setIsChatboxOpen(true);
    };
    
    window.addEventListener('openAssistantModal', handleOpenAssistant as EventListener);
    
    return () => {
      window.removeEventListener('openAssistantModal', handleOpenAssistant as EventListener);
    };
  }, []);

  const handleReservationComplete = (payload: ReservationPayload) => {
    // Mapper le packId pour la compatibilité avec l'ancien système
    const packIdMapping: Record<string, number> = {
      'pack_essentiel': 1,
      'pack_standard': 2,
      'pack_premium': 3,
      'pack_prestige': 5,
    };
    
    const packId = packIdMapping[payload.packId] || 2; // Fallback sur Standard
    if (onPackSelected) {
      onPackSelected(packId);
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <FloatingChatButton
        onOpen={() => setIsChatboxOpen(true)}
        language={language}
      />

      {/* Chatbox */}
      <ChatboxAssistant
        isOpen={isChatboxOpen}
        onClose={() => setIsChatboxOpen(false)}
        language={language}
        onReservationComplete={handleReservationComplete}
        onRentalConditionsClick={onRentalConditionsClick}
      />
    </>
  );
}
