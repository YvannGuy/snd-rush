// Règles automatiques pour la récupération J+1 selon l'heure de fin

/**
 * Détermine si la récupération J+1 est nécessaire selon l'heure de fin
 * Règle : Si l'heure de fin est après 02:00 (02h00 AM) → récupération J+1 automatique
 * 
 * Explication :
 * - Si l'événement se termine avant 02h00 du matin (00:00 à 01:59) → même jour → PAS de J+1
 * - Si l'événement se termine après 02h00 du matin (02:00 à 23:59) → très tard dans la nuit → J+1 automatique
 * 
 * Exemple :
 * - Fin à 23:00 → avant 02h00 du matin du lendemain → PAS de J+1
 * - Fin à 02:00 → après 02h00 du matin → J+1 automatique
 * - Fin à 03:00 → après 02h00 du matin → J+1 automatique
 */
export function requiresPickupJPlus1(endTime: string): boolean {
  if (!endTime) return false;
  
  // Parser l'heure (format HH:MM)
  const [hours, minutes] = endTime.split(':').map(Number);
  
  // J+1 si l'événement se termine après 02h00 du matin (02:00 à 23:59)
  // Pas de J+1 si l'événement se termine avant 02h00 (00:00 à 01:59)
  if (hours >= 2) return true;
  
  return false;
}

/**
 * Calcule le prix de la récupération J+1 selon la zone
 * Retourne 0 si J+1 n'est pas nécessaire, sinon le prix selon la zone
 */
export function calculatePickupJPlus1Price(
  endTime: string,
  zone: 'paris' | 'petite' | 'grande' | null
): number {
  if (!requiresPickupJPlus1(endTime) || !zone) return 0;
  
  const prices = {
    paris: 45,
    petite: 70,
    grande: 110,
  };
  
  return prices[zone] || 0;
}
