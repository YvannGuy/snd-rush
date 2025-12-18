// Types pour le système de chat assistant

export type ChatMessageRole = 'user' | 'assistant';
export type ChatMessageKind = 'welcome' | 'idle' | 'normal';

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  kind: ChatMessageKind;
  content: string;
  createdAt: number;
}

export type ChatIntent = 'RECOMMENDATION' | 'NEEDS_INFO' | 'READY_TO_ADD';

export interface DraftFinalConfig {
  selections: Array<{
    catalogId: string;
    qty: number;
  }>;
  event?: {
    startISO: string;
    endISO: string;
    address?: string;
    department?: string;
  };
  needsConfirmation: boolean;
  withInstallation?: boolean; // true si le client demande explicitement l'installation
}

// Type pour les demandes de réservation (mode pack)
export interface ReservationRequestDraft {
  pack_key: 'conference' | 'soiree' | 'mariage';
  payload: {
    eventType?: string;
    peopleCount?: number;
    location?: string;
    indoorOutdoor?: string;
    ambiance?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    address?: string;
    department?: string;
    [key: string]: any; // Pour permettre d'autres champs dynamiques
  };
}
