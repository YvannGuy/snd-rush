export interface Pack {
  id: string;
  name: string;
  basePrice: number | null; // null pour Prestige (prix sur demande)
  composition: string[];
  defaultLight: boolean;
  capacity: {
    min: number;
    max: number;
  };
}

export const PACKS: Record<string, Pack> = {
  petit: {
    id: "pack_petit",
    name: "Pack S Petit",
    basePrice: 109,
    composition: [
      "1 enceinte Mac Mah AS 115",
      "1 console de mixage",
    ],
    defaultLight: false,
    capacity: { min: 30, max: 70 }
  },
  confort: {
    id: "pack_confort",
    name: "Pack M Confort",
    basePrice: 129,
    composition: [
      "2 enceintes Mac Mah AS 115",
      "1 console HPA Promix 8",
    ],
    defaultLight: false,
    capacity: { min: 70, max: 150 }
  },
  grand: {
    id: "pack_grand",
    name: "Pack L Grand",
    basePrice: 179,
    composition: [
      "2 enceintes FBT X-Lite 115A",
      "1 caisson X-Sub 118SA",
      "1 console HPA Promix 16",
    ],
    defaultLight: false,
    capacity: { min: 150, max: 250 }
  },
  maxi: {
    id: "pack_maxi",
    name: "Pack XL Maxi / Sur mesure",
    basePrice: null, // Prix sur demande
    composition: [
      "Sonorisation pro",
      "Micros HF & instruments",
      "Technicien & régie",
      "Logistique complète",
    ],
    defaultLight: false,
    capacity: { min: 300, max: 999 }
  },
};

/**
 * Recommande un pack basé sur le nombre de personnes
 */
export function recommendPackByGuests(guests: string): Pack | null {
  // Utiliser la même logique que getGuestCount
  let guestCount = 0;
  switch (guests) {
    case '0-50': guestCount = 25; break;
    case '50-100': guestCount = 75; break;
    case '100-200': guestCount = 150; break;
    case '200+': guestCount = 300; break;
    default: guestCount = 0;
  }
  
  if (guestCount <= 70) return PACKS.petit;
  if (guestCount <= 150) return PACKS.confort;
  if (guestCount <= 250) return PACKS.grand;
  return PACKS.maxi;
}

/**
 * Vérifie si un pack correspond aux besoins du client
 */
export function packMatchesNeeds(pack: Pack, needs: string[], environment: string): boolean {
  // Vérifier que le pack contient ce qui est demandé
  if (needs.includes('son') && !pack.composition.some(item => item.includes('enceinte'))) {
    return false;
  }
  
  if ((needs.includes('micros_filaire') || needs.includes('micros_sans_fil')) && !pack.composition.some(item => item.includes('micro'))) {
    return false;
  }
  
  if (needs.includes('lumiere') && !pack.defaultLight && !pack.composition.some(item => item.includes('lumiere'))) {
    return false;
  }
  
  if (needs.includes('dj') && !pack.composition.some(item => item.includes('DJ') || item.includes('BoomTone'))) {
    return false;
  }
  
  // Vérifier que le pack ne contient PAS ce qui n'est PAS demandé
  if (!needs.includes('micros_filaire') && !needs.includes('micros_sans_fil') && pack.composition.some(item => item.includes('micro'))) {
    return false; // Pack contient des micros mais pas demandé
  }
  
  if (!needs.includes('lumiere') && (pack.defaultLight || pack.composition.some(item => item.includes('lumiere')))) {
    return false; // Pack contient des lumières mais pas demandé
  }
  
  if (!needs.includes('dj') && pack.composition.some(item => item.includes('DJ') || item.includes('BoomTone'))) {
    return false; // Pack contient du matériel DJ mais pas demandé
  }
  
  return true;
}
