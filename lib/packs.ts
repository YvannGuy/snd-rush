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
  essentiel: {
    id: "pack_essentiel",
    name: "Pack Essentiel",
    basePrice: 349,
    composition: [
      "2 enceintes Mac Mah AS108 avec pieds et housses",
      "1 console HPA Promix 8",
      "1 micro Shure SM58 (filaire)",
      "Câblage complet fourni",
    ],
    defaultLight: false,
    capacity: { min: 0, max: 50 }
  },
  standard: {
    id: "pack_standard",
    name: "Pack Standard",
    basePrice: 799,
    composition: [
      "2 enceintes FBT X-Lite 115A",
      "1 caisson FBT X-Sub 118SA",
      "1 console HPA Promix 16",
      "2 micros Shure SM58 (filaire) + pieds",
      "Lumières basiques (2 PAR LED)",
      "Câblage complet fourni",
    ],
    defaultLight: true,
    capacity: { min: 50, max: 100 }
  },
  premium: {
    id: "pack_premium",
    name: "Pack Premium",
    basePrice: 1499,
    composition: [
      "2 enceintes FBT X-Lite 115A",
      "2 caissons FBT X-Sub 118SA",
      "1 console HPA Promix 16",
      "3 micros Shure SM58 + 1 Mipro sans fil",
      "Jeu de lumières LED + BoomTone DJ SV200 II",
      "Technicien sur place inclus",
      "Câblage complet fourni",
    ],
    defaultLight: true,
    capacity: { min: 100, max: 200 }
  },
  prestige: {
    id: "pack_prestige",
    name: "Pack Prestige",
    basePrice: null, // Prix sur demande
    composition: [
      "Sono complète (enceintes FBT, caissons, retours)",
      "Console HPA Promix 16",
      "Pack micros (Shure + Mipro sans fil)",
      "Pack lumière complet (uplights, effets, BoomTone)",
      "Technicien dédié",
      "Options DJ / Photo / Vidéo sur demande",
    ],
    defaultLight: true,
    capacity: { min: 200, max: 999 }
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
  
  if (guestCount <= 50) return PACKS.essentiel;
  if (guestCount <= 100) return PACKS.standard;
  if (guestCount <= 200) return PACKS.premium;
  return PACKS.prestige;
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
