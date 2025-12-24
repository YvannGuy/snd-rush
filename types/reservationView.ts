/**
 * Modèle unifié pour représenter les réservations (anciennes et nouvelles)
 * Évite le "mess" entre client_reservations et reservations legacy
 */
export interface ReservationView {
  id: string;
  source: 'client_reservation' | 'reservation';
  
  // Informations de base
  packLabel: string;
  summary?: string | null; // customer_summary
  startAt: string; // ISO date
  endAt?: string | null; // ISO date
  address?: string | null;
  status: string;
  
  // Prix et paiements
  priceTotal?: number | null;
  depositAmount?: number | null; // 30% si client_reservation
  balanceAmount?: number | null;
  depositPaid: boolean;
  balancePaid: boolean;
  
  // Documents
  contractSigned: boolean;
  hasInvoices: boolean;
  hasEtatLieux: boolean;
  
  // CTA principal
  cta: {
    label: string;
    action: 'PAY_DEPOSIT' | 'PAY_BALANCE' | 'SIGN_CONTRACT' | 'CALL_SUPPORT' | 'NONE';
    href?: string;
  };
  
  // Données brutes pour compatibilité (optionnel)
  raw?: any;
}
