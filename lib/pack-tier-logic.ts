/**
 * Logique de paliers frontend-only pour ajuster automatiquement le pack selon le nombre de personnes
 * Cette logique est purement frontend et ne modifie pas le backend
 */

import { BasePack, PackItem } from './packs/basePacks';

export interface PackTierAdjustment {
  adjustedItems: PackItem[];
  adjustedPrice: number;
  tier: 'S' | 'M' | 'L';
  capacity: string;
}

/**
 * Calcule le pack optimal selon le nombre de personnes et le type d'événement
 * Retourne les ajustements à appliquer au pack de base
 */
export function calculatePackTier(
  basePack: BasePack,
  peopleCount: number | null,
  ambiance: string = '',
  indoorOutdoor: string = ''
): PackTierAdjustment {
  // Si pas de nombre de personnes, retourner le pack de base (Pack S pour tous)
  if (!peopleCount || peopleCount <= 0) {
    // Tous les packs commencent en S par défaut
    return {
      adjustedItems: basePack.defaultItems,
      adjustedPrice: basePack.basePrice,
      tier: 'S',
      capacity: 'Jusqu\'à 30 personnes',
    };
  }

  // Logique de paliers selon le nombre de personnes (Pack S par défaut)
  let tier: 'S' | 'M' | 'L' = 'S';
  let adjustedItems: PackItem[] = [...basePack.defaultItems];
  let priceMultiplier = 1;
  let capacity = '';

  // Paliers selon le pack et le nombre de personnes
  if (peopleCount <= 30) {
    tier = 'S';
    capacity = 'Jusqu\'à 30 personnes';
    
    // Configuration Pack S selon le type de pack
    if (basePack.key === 'conference') {
      // Pack S Conférence : 1 enceinte + 2 micros + console
      adjustedItems = [
        { label: 'Enceinte', qty: 1 },
        { label: 'Micro HF', qty: 2 },
        { label: 'Console de mixage', qty: 1 },
      ];
    } else if (basePack.key === 'soiree') {
      // Pack S Soirée : 1 enceinte + console
      adjustedItems = [
        { label: 'Enceinte', qty: 1 },
        { label: 'Console de mixage', qty: 1 },
      ];
    } else if (basePack.key === 'mariage') {
      // Pack S Mariage : 1 enceinte + 1 caisson + 2 micros HF + console
      adjustedItems = [
        { label: 'Enceinte', qty: 1 },
        { label: 'Caisson de basses', qty: 1 },
        { label: 'Micro HF', qty: 2 },
        { label: 'Console de mixage', qty: 1 },
      ];
      // Pack Mariage S : prix fixe 349€
      return {
        adjustedItems,
        adjustedPrice: 349,
        tier: 'S',
        capacity: 'Jusqu\'à 30 personnes',
      };
    }
    priceMultiplier = 1; // Pas de multiplicateur pour pack S (prix fixe)
  } else if (peopleCount <= 70) {
    tier = 'M';
    capacity = '30-70 personnes';
    
    // Configuration Pack M selon le type de pack
    if (basePack.key === 'conference') {
      // Pack M Conférence : 2 enceintes + 3 micros + console
      adjustedItems = [
        { label: 'Enceinte', qty: 2 },
        { label: 'Micro HF', qty: 3 },
        { label: 'Console de mixage', qty: 1 },
      ];
      // Pack Conférence M : prix fixe 389€
      return {
        adjustedItems,
        adjustedPrice: 389,
        tier,
        capacity,
      };
    } else if (basePack.key === 'soiree') {
      // Pack M Soirée : 2 enceintes + 1 caisson + console
      adjustedItems = [
        { label: 'Enceinte', qty: 2 },
        { label: 'Caisson de basses', qty: 1 },
        { label: 'Console de mixage', qty: 1 },
      ];
      // Pack Soirée M : prix fixe 399€
      return {
        adjustedItems,
        adjustedPrice: 399,
        tier,
        capacity,
      };
    } else if (basePack.key === 'mariage') {
      // Pack M Mariage : 2 enceintes + caisson + console + 2 micros HF
      adjustedItems = [
        { label: 'Enceinte', qty: 2 },
        { label: 'Caisson de basses', qty: 1 },
        { label: 'Micro HF', qty: 2 },
        { label: 'Console de mixage', qty: 1 },
      ];
      // Pack Mariage M : prix fixe 499€
      return {
        adjustedItems,
        adjustedPrice: 499,
        tier,
        capacity,
      };
    }
  } else if (peopleCount <= 150) {
    tier = 'L';
    capacity = '70-150 personnes';
    
    // Configuration Pack L selon le type de pack
    if (basePack.key === 'conference') {
      // Pack L Conférence : 2 enceintes (façade) + 4 micros + console + 2 enceintes "Delay"
      adjustedItems = [
        { label: 'Enceinte', qty: 2 },
        { label: 'Micro HF', qty: 4 },
        { label: 'Console de mixage', qty: 1 },
        { label: 'Enceinte "Delay"', qty: 2 },
      ];
      // Pack Conférence L : prix fixe 569€
      return {
        adjustedItems,
        adjustedPrice: 569,
        tier,
        capacity,
      };
    } else if (basePack.key === 'soiree') {
      // Pack L Soirée : 2 enceintes + 2 caissons + console
      adjustedItems = [
        { label: 'Enceinte', qty: 2 },
        { label: 'Caisson de basses', qty: 2 },
        { label: 'Console de mixage', qty: 1 },
      ];
      // Pack Soirée L : prix fixe 499€
      return {
        adjustedItems,
        adjustedPrice: 499,
        tier,
        capacity,
      };
    } else if (basePack.key === 'mariage') {
      // Pack L Mariage : 2 enceintes + 2 caissons + 4 micros HF + console
      adjustedItems = [
        { label: 'Enceinte', qty: 2 },
        { label: 'Caisson de basses', qty: 2 },
        { label: 'Micro HF', qty: 4 },
        { label: 'Console de mixage', qty: 1 },
      ];
      // Pack Mariage L : prix fixe 649€
      return {
        adjustedItems,
        adjustedPrice: 649,
        tier,
        capacity,
      };
    }
  } else {
    // Plus de 150 personnes : pack XL (sur devis)
    tier = 'L';
    capacity = '150+ personnes (sur devis)';
    // Configuration Pack L standardisée avec prix majoré
    adjustedItems = [
      { label: 'Enceinte', qty: 2 },
      { label: 'Caisson de basses', qty: 2 },
      { label: 'Micro HF', qty: 4 },
      { label: 'Console de mixage', qty: 1 },
    ];
    priceMultiplier = 1.5; // +50% pour pack XL
  }

  // Ajustements selon l'ambiance et extérieur supprimés selon nouvelle documentation

  // Calculer le prix ajusté
  const adjustedPrice = Math.round(basePack.basePrice * priceMultiplier);

  return {
    adjustedItems,
    adjustedPrice,
    tier,
    capacity,
  };
}

/**
 * Génère une description pédagogique du pack selon le tier
 */
export function getPackTierDescription(
  packKey: string,
  tier: 'S' | 'M' | 'L',
  capacity: string
): string {
  const packNames: Record<string, string> = {
    conference: 'Conférence',
    soiree: 'Soirée',
    mariage: 'Mariage',
  };
  const packName = packNames[packKey] || packKey;

  const tierDescriptions = {
    S: `Pack ${packName} S - Idéal pour ${capacity}. Configuration compacte et efficace.`,
    M: `Pack ${packName} M - Parfait pour ${capacity}. Équilibre parfait entre puissance et simplicité.`,
    L: `Pack ${packName} L - Optimisé pour ${capacity}. Sonorisation professionnelle avec impact maximal.`,
  };
  
  // Description améliorée pour Pack Conférence S
  if (packKey === 'conference' && tier === 'S') {
    return `Pack Conférence S - Idéal pour Jusqu'à 30 personnes. Configuration compacte et efficace.`;
  }

  return tierDescriptions[tier] || tierDescriptions.M;
}
