// Packs de base pour les réservations
// Structure claire avec items et services inclus

export interface PackItem {
  label: string;
  qty: number;
}

export interface PackServices {
  deliveryIncluded: boolean;
  installationIncluded: boolean;
  pickupIncluded: boolean;
}

export interface BasePack {
  key: 'conference' | 'soiree' | 'mariage';
  title: string;
  description: string;
  defaultItems: PackItem[];
  services: PackServices;
  basePrice: number; // Prix de base du pack
}

export const BASE_PACKS: Record<string, BasePack> = {
  conference: {
    key: 'conference',
    title: 'Pack Conférence',
    description: 'Solution complète et professionnelle pour vos conférences, réunions d\'affaires, présentations et événements corporate. Équipement de qualité professionnelle, livraison et installation par nos techniciens expérimentés, garantissant une sonorisation optimale pour tous vos intervenants.',
    defaultItems: [
      { label: 'Enceintes', qty: 1 },
      { label: 'Micros HF', qty: 2 },
      { label: 'Consoles de mixage', qty: 1 },
      { label: 'Micros', qty: 1 },
      { label: 'Caissons de basse', qty: 1 },
      { label: 'Amplis', qty: 1 },
      { label: 'Retours', qty: 1 },
    ],
    services: {
      deliveryIncluded: true,
      installationIncluded: true,
      pickupIncluded: true,
    },
    basePrice: 249,
  },
  soiree: {
    key: 'soiree',
    title: 'Pack Soirée',
    description: 'Sonorisation pour soirées et événements privés',
    defaultItems: [
      { label: 'Enceintes', qty: 1 },
      { label: 'Consoles de mixage', qty: 1 },
      { label: 'Micros', qty: 1 },
      { label: 'Caissons de basse', qty: 1 },
      { label: 'Amplis', qty: 1 },
      { label: 'Retours', qty: 1 },
    ],
    services: {
      deliveryIncluded: true,
      installationIncluded: true,
      pickupIncluded: true,
    },
    basePrice: 299,
  },
  mariage: {
    key: 'mariage',
    title: 'Pack Mariage',
    description: 'Solution complète pour mariages et événements importants',
    defaultItems: [
      { label: 'Enceintes', qty: 1 },
      { label: 'Caissons de basses', qty: 1 },
      { label: 'Micros HF', qty: 2 },
      { label: 'Consoles de mixage', qty: 1 },
      { label: 'Micros', qty: 1 },
      { label: 'Caissons de basse', qty: 1 },
      { label: 'Amplis', qty: 1 },
      { label: 'Retours', qty: 1 },
    ],
    services: {
      deliveryIncluded: true,
      installationIncluded: true,
      pickupIncluded: true,
    },
    basePrice: 349,
  },
};

/**
 * Récupère un pack de base par sa clé
 */
export function getBasePack(key: string): BasePack | null {
  return BASE_PACKS[key] || null;
}

/**
 * Génère un résumé client à partir des items finaux
 */
export function generateCustomerSummary(
  packKey: string,
  finalItems: PackItem[],
  peopleCount?: number
): string {
  const pack = BASE_PACKS[packKey];
  if (!pack) return '';

  const itemsDescription = finalItems
    .map((item) => {
      if (item.qty === 1) {
        return item.label.toLowerCase();
      }
      return `${item.qty} ${item.label.toLowerCase()}s`;
    })
    .join(', ');

  const peopleText = peopleCount ? ` pour ${peopleCount} personnes` : '';

  return `${pack.title} avec ${itemsDescription}${peopleText}.`;
}

/**
 * Compare les items finaux avec les items de base pour détecter les ajustements
 */
export function getAdjustments(
  baseItems: PackItem[],
  finalItems: PackItem[]
): { added: PackItem[]; removed: PackItem[]; modified: Array<{ item: string; from: number; to: number }> } {
  const baseMap = new Map<string, number>();
  const finalMap = new Map<string, number>();

  baseItems.forEach((item) => {
    baseMap.set(item.label, item.qty);
  });

  finalItems.forEach((item) => {
    finalMap.set(item.label, item.qty);
  });

  const added: PackItem[] = [];
  const removed: PackItem[] = [];
  const modified: Array<{ item: string; from: number; to: number }> = [];

  // Items ajoutés
  finalMap.forEach((qty, label) => {
    if (!baseMap.has(label)) {
      added.push({ label, qty });
    } else if (baseMap.get(label) !== qty) {
      modified.push({ item: label, from: baseMap.get(label)!, to: qty });
    }
  });

  // Items supprimés
  baseMap.forEach((qty, label) => {
    if (!finalMap.has(label)) {
      removed.push({ label, qty });
    }
  });

  return { added, removed, modified };
}

/**
 * Calcule le total des extras depuis les finalItems et les produits du catalogue
 */
export async function calculateExtrasTotal(
  finalItems: PackItem[],
  baseItems: PackItem[],
  products: Array<{ name: string; daily_price_ttc: number }>
): Promise<number> {
  // Identifier les items qui sont des extras (pas dans le pack de base)
  const baseItemLabels = new Set(baseItems.map(item => item.label.toLowerCase()));
  
  let extrasTotal = 0;
  
  for (const item of finalItems) {
    const itemLabelLower = item.label.toLowerCase();
    
    // Si l'item n'est pas dans le pack de base, c'est un extra
    if (!baseItemLabels.has(itemLabelLower)) {
      // Chercher le produit correspondant
      const product = products.find(p => 
        p.name.toLowerCase() === itemLabelLower || 
        p.name.toLowerCase().includes(itemLabelLower) ||
        itemLabelLower.includes(p.name.toLowerCase())
      );
      
      if (product) {
        extrasTotal += product.daily_price_ttc * item.qty;
      }
    } else {
      // Vérifier si la quantité dépasse celle du pack de base
      const baseItem = baseItems.find(bi => bi.label.toLowerCase() === itemLabelLower);
      if (baseItem && item.qty > baseItem.qty) {
        const extraQty = item.qty - baseItem.qty;
        const product = products.find(p => 
          p.name.toLowerCase() === itemLabelLower || 
          p.name.toLowerCase().includes(itemLabelLower) ||
          itemLabelLower.includes(p.name.toLowerCase())
        );
        
        if (product) {
          extrasTotal += product.daily_price_ttc * extraQty;
        }
      }
    }
  }
  
  return extrasTotal;
}
