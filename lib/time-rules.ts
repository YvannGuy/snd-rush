// Règles automatiques pour la récupération J+1 selon l'heure de fin

/**
 * Détermine si la récupération J+1 est nécessaire selon les dates et l'heure de fin
 * Règle : J+1 seulement si l'événement se termine après 02:00 du matin (02h00 AM) et avant 06:00
 * 
 * Explication :
 * - Si même jour (startDate === endDate) :
 *   - Fin entre 00:00 et 01:59 → PAS de J+1 (fin tôt le matin, récupération le même jour)
 *   - Fin entre 02:00 et 05:59 → J+1 automatique (fin très tôt le matin, récupération le lendemain)
 *   - Fin entre 06:00 et 23:59 → PAS de J+1 (fin dans la journée/soirée, récupération le même jour)
 * - Si jour différent (startDate !== endDate) :
 *   - Toujours J+1 (événement sur plusieurs jours)
 * 
 * Exemple :
 * - Même jour, fin à 23:00 → PAS de J+1 (récupération le même jour avant minuit)
 * - Même jour, fin à 01:00 → PAS de J+1 (récupération le même jour tôt le matin)
 * - Même jour, fin à 02:00 → J+1 automatique (fin après 02h du matin, récupération le lendemain)
 * - Même jour, fin à 03:00 → J+1 automatique (fin après 02h du matin, récupération le lendemain)
 * - Même jour, fin à 05:00 → J+1 automatique (fin après 02h du matin, récupération le lendemain)
 * - Même jour, fin à 06:00 → PAS de J+1 (récupération le même jour)
 * - Jour différent → Toujours J+1
 */
export function requiresPickupJPlus1(
  endTime: string,
  startDate?: string,
  endDate?: string
): boolean {
  if (!endTime) return false;
  
  // Si les dates sont différentes, toujours J+1
  if (startDate && endDate && startDate !== endDate) {
    return true;
  }
  
  // Si même jour, vérifier l'heure de fin
  // Parser l'heure (format HH:MM)
  const [hours] = endTime.split(':').map(Number);
  
  // J+1 seulement si fin entre 02:00 et 05:59 (très tôt le matin, récupération le lendemain)
  // Pas de J+1 si fin entre 00:00 et 01:59 (tôt le matin, récupération le même jour)
  // Pas de J+1 si fin entre 06:00 et 23:59 (dans la journée/soirée, récupération le même jour)
  if (hours >= 2 && hours < 6) return true;
  
  return false;
}

/**
 * Calcule le prix de la récupération J+1 selon la zone
 * Retourne 0 si J+1 n'est pas nécessaire, sinon le prix selon la zone
 */
export function calculatePickupJPlus1Price(
  endTime: string,
  zone: 'paris' | 'petite' | 'grande' | null,
  startDate?: string,
  endDate?: string
): number {
  if (!requiresPickupJPlus1(endTime, startDate, endDate) || !zone) return 0;
  
  const prices = {
    paris: 45,
    petite: 70,
    grande: 110,
  };
  
  return prices[zone] || 0;
}
