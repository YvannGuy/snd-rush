// Wrapper pour l'assistant refactorisé - remplace AssistantModal.tsx
'use client';

import React from 'react';
import AssistantRefactored from './AssistantRefactored';
import { ReservationPayload } from '@/types/assistant';

interface AssistantModalRefactoredProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'fr' | 'en';
  onPackSelected: (packId: number) => void;
}

export default function AssistantModalRefactored({ 
  isOpen, 
  onClose, 
  language, 
  onPackSelected 
}: AssistantModalRefactoredProps) {
  
  const handleReservationComplete = (payload: ReservationPayload) => {
    // Mapper le packId pour la compatibilité avec l'ancien système
    const packIdMapping: Record<string, number> = {
      'pack_essentiel': 1,
      'pack_standard': 2,
      'pack_premium': 3,
      'pack_prestige': 5,
    };
    
    const packId = packIdMapping[payload.packId] || 2; // Fallback sur Standard
    onPackSelected(packId);
  };

  return (
    <AssistantRefactored
      isOpen={isOpen}
      onClose={onClose}
      onReservationComplete={handleReservationComplete}
    />
  );
}
