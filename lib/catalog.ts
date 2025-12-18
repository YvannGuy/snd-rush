// Utilitaire catalogue unique - source de vérité pour les prix
// Utilisable côté serveur et client

import { fetchProductById, fetchProductsByCategory, AssistantProduct, getPacksInfo } from './assistant-products';

export type BillingUnit = 'event' | 'day';

export interface CatalogItem {
  id: string;
  name: string;
  unitPriceEur: number;
  billingUnit: BillingUnit;
  category: string | null;
  description?: string | null;
  deposit?: number;
  slug?: string;
}

/**
 * Récupère un item du catalogue par ID
 * Utilise Supabase comme source principale, avec fallback vers les packs définis dans le code
 */
export async function getCatalogItemById(id: string): Promise<CatalogItem | null> {
  try {
    // Mapping des IDs de packs du catalogue vers les IDs dans getPacksInfo()
    const packIdMapping: Record<string, string> = {
      'pack-1': 'pack_petit',
      'pack-2': 'pack_confort',
      'pack-3': 'pack_grand',
      'pack-5': 'pack_maxi',
      'pack-6': 'pack_dj_essentiel',
      'pack-7': 'pack_dj_performance',
      'pack-8': 'pack_dj_premium',
    };
    
    // Si c'est un pack (commence par pack- ou pack_), chercher dans getPacksInfo() d'abord
    if (id.startsWith('pack-') || id.startsWith('pack_')) {
      const packs = getPacksInfo();
      // Convertir l'ID du catalogue vers l'ID dans getPacksInfo()
      const mappedId = packIdMapping[id] || id.replace('pack-', 'pack_');
      const pack = packs.find(p => p.id === mappedId);
      
      if (pack) {
        // Tous les packs sont dans la catégorie 'packs' (y compris les packs DJ)
        const category = 'packs';
        
        return {
          id: id, // Utiliser l'ID original du catalogue (pack-6, pack-7, etc.) pour la navigation
          name: pack.name,
          unitPriceEur: pack.basePrice || 0,
          billingUnit: 'event',
          category: category,
          description: `Pack pour ${pack.capacity.min}-${pack.capacity.max} personnes. Composition: ${pack.composition.join(', ')}`,
          deposit: pack.deposit || 0, // Caution du pack
          slug: id, // Utiliser l'ID original pour le slug aussi
        };
      }
    }
    
    // Sinon, chercher dans Supabase
    const product = await fetchProductById(id);
    if (!product) return null;

    // Déterminer billingUnit basé sur la catégorie ou le nom
    // Par défaut, tout est facturé par jour sauf si spécifié autrement
    let billingUnit: BillingUnit = 'day';
    
    // Les packs sont facturés par événement
    if (id.startsWith('pack_')) {
      billingUnit = 'event';
    }
    
    // Certaines catégories peuvent être facturées par événement
    // (à adapter selon les besoins métier)
    const nameLower = product.name.toLowerCase();
    if (nameLower.includes('installation') || nameLower.includes('technicien')) {
      billingUnit = 'event';
    }

    return {
      id: product.id,
      name: product.name,
      unitPriceEur: product.dailyPrice,
      billingUnit,
      category: product.category,
      description: product.description,
      deposit: product.deposit,
      slug: product.slug,
    };
  } catch (error) {
    console.error('Erreur getCatalogItemById:', error);
    return null;
  }
}

/**
 * Récupère les items du catalogue par catégorie
 */
export async function getCatalogItemsByCategory(category: string): Promise<CatalogItem[]> {
  try {
    const products = await fetchProductsByCategory(category);
    
    return products.map((product: AssistantProduct) => {
      let billingUnit: BillingUnit = 'day';
      
      if (product.id.startsWith('pack_')) {
        billingUnit = 'event';
      }
      
      const nameLower = product.name.toLowerCase();
      if (nameLower.includes('installation') || nameLower.includes('technicien')) {
        billingUnit = 'event';
      }

      return {
        id: product.id,
        name: product.name,
        unitPriceEur: product.dailyPrice,
        billingUnit,
        category: product.category,
        description: product.description,
        deposit: product.deposit,
        slug: product.slug,
      };
    });
  } catch (error) {
    console.error('Erreur getCatalogItemsByCategory:', error);
    return [];
  }
}

/**
 * Calcule le nombre de jours de location entre deux dates
 * Gère les traversées de minuit
 */
export function getRentalDays(startISO: string, endISO: string): number {
  const start = new Date(startISO);
  const end = new Date(endISO);
  
  // Si end < start, on ajoute 1 jour à end (traversée minuit)
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(1, diffDays);
}

/**
 * Calcule le multiplicateur de prix selon billingUnit et dates
 */
export function getPriceMultiplier(
  billingUnit: BillingUnit,
  startISO: string,
  endISO: string
): number {
  if (billingUnit === 'event') {
    return 1;
  }
  
  // billingUnit === 'day'
  return getRentalDays(startISO, endISO);
}
