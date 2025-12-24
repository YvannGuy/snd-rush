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
  // Si pas de nombre de personnes, retourner le pack de base
  // Pack Mariage commence en M, Conférence et Soirée en S
  if (!peopleCount || peopleCount <= 0) {
    if (basePack.key === 'mariage') {
      // Pack Mariage commence directement en M
      return {
        adjustedItems: basePack.defaultItems, // Déjà configuré pour M
        adjustedPrice: Math.round(basePack.basePrice * 1.1), // +10% pour pack M
        tier: 'M',
        capacity: '30-70 personnes',
      };
    } else {
      // Pack Conférence et Soirée commencent en S
      return {
        adjustedItems: basePack.defaultItems,
        adjustedPrice: basePack.basePrice,
        tier: 'S',
        capacity: 'Jusqu\'à 30 personnes',
      };
    }
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
    } else {
      // Pack S Mariage (ne devrait pas arriver car mariage commence en M)
      adjustedItems = basePack.defaultItems;
    }
    priceMultiplier = 0.85; // -15% pour pack S
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
    } else if (basePack.key === 'soiree') {
      // Pack M Soirée : 2 enceintes + console
      adjustedItems = [
        { label: 'Enceinte', qty: 2 },
        { label: 'Console de mixage', qty: 1 },
      ];
    } else if (basePack.key === 'mariage') {
      // Pack M Mariage : 2 enceintes + caisson + console + 2 micros
      adjustedItems = [
        { label: 'Enceinte', qty: 2 },
        { label: 'Caisson de basses', qty: 1 },
        { label: 'Console de mixage', qty: 1 },
        { label: 'Micro', qty: 2 },
      ];
    }
    priceMultiplier = 1.1; // +10% pour pack M
  } else if (peopleCount <= 150) {
    tier = 'L';
    capacity = '70-150 personnes';
    
    // Configuration Pack L standardisée : 2 enceintes + 2 caissons + 4 micros + console
    adjustedItems = [
      { label: 'Enceinte', qty: 2 },
      { label: 'Caisson de basses', qty: 2 },
      { label: 'Micro HF', qty: 4 },
      { label: 'Console de mixage', qty: 1 },
    ];
    priceMultiplier = 1.25; // +25% pour pack L
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

  // Ajustements selon l'ambiance (uniquement pour conférence et soirée, pas mariage qui a déjà un caisson)
  if ((ambiance === 'fort' || ambiance === 'mixte') && basePack.key !== 'mariage') {
    // Ajouter un caisson de basses si pas déjà présent
    const hasSubwoofer = adjustedItems.some(item => 
      item.label.toLowerCase().includes('caisson') || 
      item.label.toLowerCase().includes('basse')
    );
    if (!hasSubwoofer && (tier === 'M' || tier === 'L')) {
      adjustedItems.push({ label: 'Caisson de basses', qty: 1 });
      priceMultiplier += 0.15; // +15% pour caisson
    }
  }

  // Ajustements selon intérieur/extérieur
  if (indoorOutdoor === 'exterieur') {
    // Pour extérieur, augmenter légèrement les quantités
    adjustedItems = adjustedItems.map(item => {
      if (item.label === 'Enceinte') {
        return { ...item, qty: item.qty + 1 };
      }
      return item;
    });
    priceMultiplier += 0.1; // +10% pour extérieur
  }

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
