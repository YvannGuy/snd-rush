// Système d'inventaire unifié pour SoundRush Paris
// Utilise Supabase comme source principale, avec fallback vers données statiques

import { fetchProductsFromSupabase, AssistantProduct } from './assistant-products';

export interface InventoryItem {
  id: string;
  label: string;
  qty: number;
  unitPrice: number;
  capacity?: number; // Capacité en personnes
  category: string;
}

export interface UnifiedInventory {
  speakers: Record<string, InventoryItem>;
  mixers: Record<string, InventoryItem>;
  mics: Record<string, InventoryItem>;
  lights: Record<string, InventoryItem>;
  subs: Record<string, InventoryItem>;
}

/**
 * Inventaire par défaut (fallback si Supabase n'est pas disponible)
 */
const DEFAULT_INVENTORY: UnifiedInventory = {
  speakers: {
    macmah_as108_pair: { 
      id: 'macmah_as108_pair',
      label: "Mac Mah AS108 (paire) + pieds + housses", 
      qty: 2, 
      unitPrice: 70, 
      capacity: 80,
      category: 'sonorisation'
    },
    macmah_as115_pair: { 
      id: 'macmah_as115_pair',
      label: "Mac Mah AS115 (paire) + pieds + housses", 
      qty: 2, 
      unitPrice: 75, 
      capacity: 120,
      category: 'sonorisation'
    },
    fbt_xlite115_pair: { 
      id: 'fbt_xlite115_pair',
      label: "FBT X-Lite 115A (paire)", 
      qty: 2, 
      unitPrice: 100, 
      capacity: 150,
      category: 'sonorisation'
    },
  },
  subs: {
    fbt_xsub118: { 
      id: 'fbt_xsub118',
      label: "FBT X-Sub 118SA (caisson)", 
      qty: 1, 
      unitPrice: 90, 
      capacity: 70,
      category: 'sonorisation'
    },
  },
  mixers: {
    promix8: { 
      id: 'promix8',
      label: "HPA Promix 8", 
      qty: 1, 
      unitPrice: 30,
      category: 'sonorisation'
    },
    promix16: { 
      id: 'promix16',
      label: "HPA Promix 16", 
      qty: 1, 
      unitPrice: 70,
      category: 'sonorisation'
    },
  },
  mics: {
    shure_sm58: { 
      id: 'shure_sm58',
      label: "Shure SM58 (filaire)", 
      qty: 5, 
      unitPrice: 10,
      category: 'micros'
    },
    mipro_wireless: { 
      id: 'mipro_wireless',
      label: "Mipro ACT311II sans fil", 
      qty: 3, 
      unitPrice: 20,
      category: 'micros'
    },
  },
  lights: {
    basic_par: { 
      id: 'basic_par',
      label: "Lumières basiques (2 PAR LED)", 
      qty: 1, 
      unitPrice: 80,
      category: 'lumieres'
    },
    boomtone: { 
      id: 'boomtone',
      label: "BoomTone DJ SV200 II", 
      qty: 1, 
      unitPrice: 80,
      category: 'lumieres'
    },
  },
};

/**
 * Convertit un produit Supabase en InventoryItem
 */
function productToInventoryItem(product: AssistantProduct): InventoryItem | null {
  const nameLower = product.name.toLowerCase();
  
  // Déterminer la catégorie et le type
  let category = product.category || 'sonorisation';
  let label = product.name;
  let capacity: number | undefined = undefined;
  
  // Enceintes
  if (nameLower.includes('enceinte') || nameLower.includes('speaker')) {
    category = 'sonorisation';
    if (nameLower.includes('mac mah')) {
      if (nameLower.includes('as108')) {
        capacity = 80;
      } else if (nameLower.includes('as115')) {
        capacity = 120;
      }
    } else if (nameLower.includes('fbt') && nameLower.includes('xlite')) {
      capacity = 150;
    }
  }
  
  // Caissons
  if (nameLower.includes('caisson') || nameLower.includes('sub')) {
    category = 'sonorisation';
    capacity = 70;
  }
  
  // Mixers
  if (nameLower.includes('promix') || nameLower.includes('console') || nameLower.includes('mixage')) {
    category = 'sonorisation';
  }
  
  // Micros
  if (nameLower.includes('micro') || nameLower.includes('mic')) {
    category = 'micros';
  }
  
  // Lumières
  if (nameLower.includes('lumiere') || nameLower.includes('light') || nameLower.includes('par') || nameLower.includes('boomtone')) {
    category = 'lumieres';
  }
  
  return {
    id: product.id,
    label: label,
    qty: product.quantity,
    unitPrice: product.dailyPrice,
    capacity,
    category
  };
}

/**
 * Récupère l'inventaire unifié depuis Supabase avec fallback
 */
export async function getUnifiedInventory(): Promise<UnifiedInventory> {
  try {
    const products = await fetchProductsFromSupabase();
    
    if (products.length === 0) {
      console.warn('Aucun produit trouvé dans Supabase, utilisation de l\'inventaire par défaut');
      return DEFAULT_INVENTORY;
    }
  
    // Construire l'inventaire depuis les produits Supabase
    const inventory: UnifiedInventory = {
      speakers: {},
      mixers: {},
      mics: {},
      lights: {},
      subs: {}
    };
  
    for (const product of products) {
      const item = productToInventoryItem(product);
      if (!item) continue;
  
      const nameLower = product.name.toLowerCase();
      
      // Classer dans la bonne catégorie
      if (nameLower.includes('enceinte') || nameLower.includes('speaker')) {
        // Créer une clé unique basée sur le nom
        const key = product.slug || product.id;
        inventory.speakers[key] = item;
      } else if (nameLower.includes('caisson') || nameLower.includes('sub')) {
        const key = product.slug || product.id;
        inventory.subs[key] = item;
      } else if (nameLower.includes('promix') || nameLower.includes('console') || nameLower.includes('mixage')) {
        const key = product.slug || product.id;
        inventory.mixers[key] = item;
      } else if (nameLower.includes('micro') || nameLower.includes('mic')) {
        const key = product.slug || product.id;
        inventory.mics[key] = item;
      } else if (nameLower.includes('lumiere') || nameLower.includes('light') || nameLower.includes('par') || nameLower.includes('boomtone')) {
        const key = product.slug || product.id;
        inventory.lights[key] = item;
      }
    }
  
    // Fusionner avec l'inventaire par défaut pour les produits manquants
    return mergeInventories(inventory, DEFAULT_INVENTORY);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'inventaire:', error);
    return DEFAULT_INVENTORY;
  }
}

/**
 * Fusionne deux inventaires (Supabase + défaut)
 */
function mergeInventories(supabase: UnifiedInventory, fallback: UnifiedInventory): UnifiedInventory {
  return {
    speakers: { ...fallback.speakers, ...supabase.speakers },
    mixers: { ...fallback.mixers, ...supabase.mixers },
    mics: { ...fallback.mics, ...supabase.mics },
    lights: { ...fallback.lights, ...supabase.lights },
    subs: { ...fallback.subs, ...supabase.subs },
  };
}

/**
 * Récupère un item d'inventaire par ID
 */
export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  const inventory = await getUnifiedInventory();
  
  // Chercher dans toutes les catégories
  for (const category of Object.values(inventory)) {
    if (category[id]) {
      return category[id];
    }
  }
  
  return null;
}

/**
 * Récupère les items d'une catégorie spécifique
 */
export async function getInventoryByCategory(category: 'speakers' | 'mixers' | 'mics' | 'lights' | 'subs'): Promise<Record<string, InventoryItem>> {
  const inventory = await getUnifiedInventory();
  return inventory[category];
}
