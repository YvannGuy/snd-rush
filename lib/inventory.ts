export interface InventoryItem {
  label: string;
  qty: number;
  unitPrice: number;
  capacity?: number; // Capacité en personnes
}

export interface Inventory {
  speakers: Record<string, InventoryItem>;
  mixers: Record<string, InventoryItem>;
  mics: Record<string, InventoryItem>;
  lights: Record<string, InventoryItem>;
}

export const INVENTORY: Inventory = {
  speakers: {
    macmah_as108_pair: { 
      label: "Mac Mah AS108 (paire) + pieds + housses", 
      qty: 1, 
      unitPrice: 120, 
      capacity: 80 
    },
    macmah_as115_pair: { 
      label: "Mac Mah AS115 (paire) + pieds + housses", 
      qty: 1, 
      unitPrice: 150, 
      capacity: 120 
    },
    fbt_xlite115_pair: { 
      label: "FBT X-Lite 115A (paire)", 
      qty: 1, 
      unitPrice: 200, 
      capacity: 150 
    },
    fbt_xsub118: { 
      label: "FBT X-Sub 118SA (caisson)", 
      qty: 1, 
      unitPrice: 100, 
      capacity: 70 
    },
    // Optionnel : unités simples si autorisées
    macmah_as108_single: { 
      label: "Mac Mah AS108 (unité)", 
      qty: 2, 
      unitPrice: 70, 
      capacity: 40 
    },
  },
  mixers: {
    promix8: { 
      label: "HPA Promix 8", 
      qty: 1, 
      unitPrice: 40 
    },
    promix16: { 
      label: "HPA Promix 16", 
      qty: 1, 
      unitPrice: 50 
    },
  },
  mics: {
    shure_sm58: { 
      label: "Shure SM58 (filaire)", 
      qty: 5, 
      unitPrice: 15 
    },
    mipro_wireless: { 
      label: "Mipro ACT311II sans fil", 
      qty: 3, 
      unitPrice: 20 
    },
  },
  lights: {
    basic_par: { 
      label: "Lumières basiques (2 PAR LED)", 
      qty: 1, 
      unitPrice: 80 
    },
    boomtone: { 
      label: "BoomTone DJ SV200 II", 
      qty: 1, 
      unitPrice: 80 
    },
  },
};

/**
 * Génère une configuration à-la-carte basée sur les besoins
 */
export function generateCustomConfig(
  guests: string,
  needs: string[],
  environment: string,
  extras: string[]
): { items: Array<{ id: string; label: string; price: number; qty: number }>; total: number } {
  const items: Array<{ id: string; label: string; price: number; qty: number }> = [];
  let total = 0;

  // Déterminer le nombre de personnes
  const guestCount = parseInt(guests.replace(/\D/g, '')) || 0;

  // Enceintes selon le nombre de personnes
  if (guestCount <= 50) {
    if (environment === 'exterieur') {
      items.push({
        id: 'macmah_as115_pair',
        label: INVENTORY.speakers.macmah_as115_pair.label,
        price: INVENTORY.speakers.macmah_as115_pair.unitPrice,
        qty: 1
      });
    } else {
      items.push({
        id: 'macmah_as108_pair',
        label: INVENTORY.speakers.macmah_as108_pair.label,
        price: INVENTORY.speakers.macmah_as108_pair.unitPrice,
        qty: 1
      });
    }
  } else if (guestCount <= 100) {
    items.push({
      id: 'macmah_as115_pair',
      label: INVENTORY.speakers.macmah_as115_pair.label,
      price: INVENTORY.speakers.macmah_as115_pair.unitPrice,
      qty: 1
    });
    
    if (environment === 'exterieur') {
      items.push({
        id: 'fbt_xsub118',
        label: INVENTORY.speakers.fbt_xsub118.label,
        price: INVENTORY.speakers.fbt_xsub118.unitPrice,
        qty: 1
      });
    }
  } else if (guestCount <= 200) {
    items.push({
      id: 'fbt_xlite115_pair',
      label: INVENTORY.speakers.fbt_xlite115_pair.label,
      price: INVENTORY.speakers.fbt_xlite115_pair.unitPrice,
      qty: 1
    });
    
    items.push({
      id: 'fbt_xsub118',
      label: INVENTORY.speakers.fbt_xsub118.label,
      price: INVENTORY.speakers.fbt_xsub118.unitPrice,
      qty: 1
    });
  } else {
    // Plus de 200 personnes - configuration prestige
    items.push({
      id: 'fbt_xlite115_pair',
      label: INVENTORY.speakers.fbt_xlite115_pair.label,
      price: INVENTORY.speakers.fbt_xlite115_pair.unitPrice,
      qty: 2
    });
    
    items.push({
      id: 'fbt_xsub118',
      label: INVENTORY.speakers.fbt_xsub118.label,
      price: INVENTORY.speakers.fbt_xsub118.unitPrice,
      qty: 2
    });
  }

  // Console de mixage
  if (extras.includes('promix16')) {
    items.push({
      id: 'promix16',
      label: INVENTORY.mixers.promix16.label,
      price: INVENTORY.mixers.promix16.unitPrice,
      qty: 1
    });
  } else {
    items.push({
      id: 'promix8',
      label: INVENTORY.mixers.promix8.label,
      price: INVENTORY.mixers.promix8.unitPrice,
      qty: 1
    });
  }

  // Micros
  if (needs.includes('micros')) {
    const micCount = Math.min(Math.ceil(guestCount / 50), 5);
    items.push({
      id: 'shure_sm58',
      label: `${INVENTORY.mics.shure_sm58.label} (${micCount} unités)`,
      price: INVENTORY.mics.shure_sm58.unitPrice,
      qty: micCount
    });
  }

  // Micros sans fil si demandé
  if (extras.includes('mipro_wireless')) {
    items.push({
      id: 'mipro_wireless',
      label: INVENTORY.mics.mipro_wireless.label,
      price: INVENTORY.mics.mipro_wireless.unitPrice,
      qty: 1
    });
  }

  // Lumières
  if (needs.includes('lumiere')) {
    if (extras.includes('boomtone')) {
      items.push({
        id: 'boomtone',
        label: INVENTORY.lights.boomtone.label,
        price: INVENTORY.lights.boomtone.unitPrice,
        qty: 1
      });
    } else {
      items.push({
        id: 'basic_par',
        label: INVENTORY.lights.basic_par.label,
        price: INVENTORY.lights.basic_par.unitPrice,
        qty: 1
      });
    }
  }

  // Calculer le total
  total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return { items, total };
}
