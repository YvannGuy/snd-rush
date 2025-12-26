import { ReservationRequestDraft } from '@/types/chat';

/**
 * Vérifie si on est en mode pack
 */
export function isPackMode(packKey: string | null | undefined): boolean {
  return packKey !== null && packKey !== undefined && ['conference', 'soiree', 'mariage'].includes(packKey);
}

/**
 * Vérifie si toutes les informations requises pour une demande de réservation pack sont présentes
 */
export function hasRequiredPackFields(draft: ReservationRequestDraft | null): boolean {
  if (!draft || !draft.payload) return false;
  
  const payload = draft.payload;
  
  // Champs obligatoires
  const requiredFields = [
    'eventType',
    'peopleCount',
    'indoorOutdoor',
    'startDate',
    'endDate',
    'department',
    'address',
    'customerPhone',
  ];
  
  // Vérifier que tous les champs requis sont présents et non vides
  for (const field of requiredFields) {
    const value = payload[field];
    if (value === undefined || value === null || value === '') {
      return false;
    }
  }
  
  // Vérifier que peopleCount est un nombre valide
  if (typeof payload.peopleCount !== 'number' || payload.peopleCount <= 0) {
    return false;
  }
  
  // Vérifier que customerPhone a au moins 9 chiffres
  const phoneDigits = String(payload.customerPhone).replace(/\D/g, '');
  if (phoneDigits.length < 9) {
    return false;
  }
  
  return true;
}


