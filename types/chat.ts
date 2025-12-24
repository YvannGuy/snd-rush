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

// Type simplifié pour le chat (nouveau flow simplifié)
export interface ChatDraft {
  packKey: 'conference' | 'soiree' | 'mariage' | null;
  startAt?: string; // ISO date string
  endAt?: string; // ISO date string
  location?: string; // Ville ou code postal
  phone?: string; // Téléphone obligatoire
  // Options selon pack
  extras?: {
    // Conférence: nombre de micros (1-4)
    microsCount?: number;
    // Soirée: nombre de personnes (<=50 / 50-100 / 100+)
    peopleCount?: '<=50' | '50-100' | '100+';
    // Mariage: intérieur ou extérieur
    indoorOutdoor?: 'intérieur' | 'extérieur';
  };
}

// Type pour le draft de réservation (simplifié pour le flow 3 étapes)
export interface ReservationDraft {
  packKey: 'conference' | 'soiree' | 'mariage';
  startAt?: string; // ISO date string
  endAt?: string; // ISO date string
  address?: string; // ville/CP/département
  phone?: string; // obligatoire
}

// Étape actuelle du chat (state machine)
export type ChatStep = 'dates' | 'location' | 'recap';

// Réponse simplifiée de l'API chat (rule-based)
export interface ChatResponse {
  assistantMessage: string;
  collected: Partial<ReservationDraft>;
  currentStep: ChatStep;
  readyToCheckout: boolean;
}

// Type pour les demandes de réservation (mode pack) - DEPRECATED, utiliser ChatDraft
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

// Type pour l'état de disponibilité (V1.2 availability check)
export type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

export interface AvailabilityDetails {
  remaining?: number;
  bookedQuantity?: number;
  totalQuantity?: number;
  reason?: string;
  alternatives?: any[];
}
