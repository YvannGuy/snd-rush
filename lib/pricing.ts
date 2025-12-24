// Helpers pour le calcul des prix des réservations

import { getBasePack } from './packs/basePacks';
import { FinalItem } from '@/types/db';

/**
 * Calcule le prix de base du pack selon sa clé
 * Pour l'instant, les packs ont un prix fixe (pas de calcul selon durée)
 * TODO: Si besoin de calcul selon durée, adapter cette fonction
 */
export function computeBasePackPrice(
  packKey: 'conference' | 'soiree' | 'mariage',
  startAt?: string,
  endAt?: string
): number {
  const basePack = getBasePack(packKey);
  if (!basePack) {
    throw new Error(`Pack non trouvé: ${packKey}`);
  }
  
  // Pour l'instant, prix fixe par pack
  // Si besoin de calcul selon durée, ajouter la logique ici
  // Exemple: basePack.basePrice * rentalDays
  return basePack.basePrice;
}

/**
 * Calcule le total des extras depuis les final_items
 * Les extras sont les items avec isExtra = true
 */
export function computeExtrasTotal(finalItems: FinalItem[]): number {
  if (!finalItems || finalItems.length === 0) {
    return 0;
  }
  
  return finalItems
    .filter(item => item.isExtra)
    .reduce((total, item) => {
      const unitPrice = item.unitPrice || 0;
      return total + (unitPrice * item.qty);
    }, 0);
}

/**
 * Calcule le prix total (base pack + extras)
 */
export function computePriceTotal(
  basePackPrice: number,
  extrasTotal: number
): number {
  return basePackPrice + extrasTotal;
}

/**
 * Calcule le montant de l'acompte (30% du total, arrondi en centimes)
 * @param total Prix total en euros
 * @returns Montant acompte en centimes (pour Stripe)
 */
export function computeDepositAmount(total: number): number {
  // 30% du total, arrondi au centime supérieur
  const deposit = total * 0.3;
  return Math.ceil(deposit * 100); // Convertir en centimes et arrondir au supérieur
}

/**
 * Calcule le montant du solde restant
 * @param total Prix total en euros
 * @param depositPaidAmount Montant de l'acompte déjà payé en euros (optionnel)
 * @returns Montant du solde en euros
 */
export function computeBalanceAmount(
  total: number,
  depositPaidAmount?: number | null
): number {
  if (depositPaidAmount && depositPaidAmount > 0) {
    // Si acompte déjà payé, solde = total - acompte payé
    return Math.round((total - depositPaidAmount) * 100) / 100;
  }
  
  // Sinon, solde = 70% du total (standard)
  return Math.round((total * 0.7) * 100) / 100;
}

/**
 * Calcule le montant de l'acompte en euros (pour affichage)
 * @param total Prix total en euros
 * @returns Montant acompte en euros
 */
export function computeDepositAmountEur(total: number): number {
  return Math.round((total * 0.3) * 100) / 100;
}
