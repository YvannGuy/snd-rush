// Service unifié pour récupérer les produits et le stock depuis Supabase pour l'assistant SoundRush Paris

import { supabase } from './supabase';
import { Product } from '@/types/db';

export interface AssistantProduct {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  dailyPrice: number;
  deposit: number;
  quantity: number; // Stock disponible
  description: string | null;
  images: string[] | null;
}

export interface PackInfo {
  id: string;
  name: string;
  basePrice: number | null;
  composition: string[];
  capacity: { min: number; max: number };
}

/**
 * Récupère tous les produits depuis Supabase
 */
export async function fetchProductsFromSupabase(): Promise<AssistantProduct[]> {
  if (!supabase) {
    console.warn('Supabase non configuré, retour de produits vides');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      return [];
    }

    if (!data) return [];

    return data.map((product: Product) => ({
      id: product.id.toString(),
      name: product.name,
      slug: product.slug,
      category: product.category,
      dailyPrice: product.daily_price_ttc,
      deposit: product.deposit,
      quantity: product.quantity || 0,
      description: product.description,
      images: product.images || [],
    }));
  } catch (error) {
    console.error('Erreur lors du fetch des produits:', error);
    return [];
  }
}

/**
 * Récupère un produit spécifique par ID ou slug
 */
export async function fetchProductById(idOrSlug: string): Promise<AssistantProduct | null> {
  if (!supabase) return null;

  try {
    // Essayer d'abord par ID numérique
    const numericId = parseInt(idOrSlug, 10);
    if (!isNaN(numericId)) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', numericId)
        .single();

      if (!error && data) {
        return {
          id: data.id.toString(),
          name: data.name,
          slug: data.slug,
          category: data.category,
          dailyPrice: data.daily_price_ttc,
          deposit: data.deposit,
          quantity: data.quantity || 0,
          description: data.description,
          images: data.images || [],
        };
      }
    }

    // Essayer par ID string (UUID ou autre format)
    // Détecter un UUID : format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 caractères avec tirets)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    
    if (isUUID) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', idOrSlug)
        .single();

      if (!error && data) {
        console.log(`[ASSISTANT-PRODUCTS] Produit trouvé par UUID: ${idOrSlug} -> ${data.name}`);
        return {
          id: data.id.toString(),
          name: data.name,
          slug: data.slug,
          category: data.category,
          dailyPrice: data.daily_price_ttc,
          deposit: data.deposit,
          quantity: data.quantity || 0,
          description: data.description,
          images: data.images || [],
        };
      } else if (error) {
        console.warn(`[ASSISTANT-PRODUCTS] Erreur recherche par UUID ${idOrSlug}:`, error);
      }
    }

    // Sinon, essayer par slug
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', idOrSlug)
      .single();

    if (error || !data) return null;

    return {
      id: data.id.toString(),
      name: data.name,
      slug: data.slug,
      category: data.category,
      dailyPrice: data.daily_price_ttc,
      deposit: data.deposit,
      quantity: data.quantity || 0,
      description: data.description,
      images: data.images || [],
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    return null;
  }
}

/**
 * Récupère les produits par catégorie
 */
export async function fetchProductsByCategory(category: string): Promise<AssistantProduct[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des produits par catégorie:', error);
      return [];
    }

    if (!data) return [];

    return data.map((product: Product) => ({
      id: product.id.toString(),
      name: product.name,
      slug: product.slug,
      category: product.category,
      dailyPrice: product.daily_price_ttc,
      deposit: product.deposit,
      quantity: product.quantity || 0,
      description: product.description,
      images: product.images || [],
    }));
  } catch (error) {
    console.error('Erreur lors du fetch des produits par catégorie:', error);
    return [];
  }
}

/**
 * Vérifie la disponibilité d'un produit pour une période donnée
 */
export async function checkProductAvailability(
  productId: string,
  startDate: string,
  endDate: string
): Promise<{ available: boolean; quantity: number; reason?: string }> {
  if (!supabase) {
    return { available: false, quantity: 0, reason: 'Supabase non configuré' };
  }

  try {
    // Récupérer le produit pour connaître le stock
    const product = await fetchProductById(productId);
    if (!product) {
      return { available: false, quantity: 0, reason: 'Produit introuvable' };
    }

    // Vérifier les réservations existantes pour cette période
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('product_id', productId)
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

    if (error) {
      console.error('Erreur lors de la vérification des réservations:', error);
      return { available: product.quantity > 0, quantity: product.quantity };
    }

    // Calculer la quantité réservée
    const reservedQuantity = reservations?.reduce((sum, res) => {
      // Vérifier si les dates se chevauchent
      const resStart = new Date(res.start_date);
      const resEnd = new Date(res.end_date);
      const checkStart = new Date(startDate);
      const checkEnd = new Date(endDate);

      if (resStart <= checkEnd && resEnd >= checkStart) {
        return sum + (res.quantity || 1);
      }
      return sum;
    }, 0) || 0;

    const availableQuantity = product.quantity - reservedQuantity;

    return {
      available: availableQuantity > 0,
      quantity: availableQuantity,
      reason: availableQuantity <= 0 ? 'Stock insuffisant pour cette période' : undefined,
    };
  } catch (error) {
    console.error('Erreur lors de la vérification de disponibilité:', error);
    return { available: false, quantity: 0, reason: 'Erreur de vérification' };
  }
}

/**
 * Récupère les informations des packs depuis la configuration
 * (Les packs sont gérés dans le code, pas dans Supabase)
 */
export function getPacksInfo(): PackInfo[] {
  return [
    {
      id: 'pack_petit',
      name: 'Pack S Petit',
      basePrice: 109,
      composition: [
        '1 enceinte Mac Mah AS 115',
        '1 console de mixage',
      ],
      capacity: { min: 30, max: 70 },
    },
    {
      id: 'pack_confort',
      name: 'Pack M Confort',
      basePrice: 129,
      composition: [
        '2 enceintes Mac Mah AS 115',
        '1 console HPA Promix 8',
      ],
      capacity: { min: 70, max: 150 },
    },
    {
      id: 'pack_grand',
      name: 'Pack L Grand',
      basePrice: 179,
      composition: [
        '2 enceintes FBT X-Lite 115A',
        '1 caisson X-Sub 118SA',
        '1 console HPA Promix 16',
      ],
      capacity: { min: 150, max: 250 },
    },
    {
      id: 'pack_maxi',
      name: 'Pack XL Maxi / Sur mesure',
      basePrice: null, // Prix sur demande
      composition: [
        'Sonorisation pro',
        'Micros HF & instruments',
        'Technicien & régie',
        'Logistique complète',
      ],
      capacity: { min: 300, max: 999 },
    },
  ];
}

/**
 * Recherche des produits par nom ou description
 */
export async function searchProducts(query: string): Promise<AssistantProduct[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,long_description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Erreur lors de la recherche de produits:', error);
      return [];
    }

    if (!data) return [];

    return data.map((product: Product) => ({
      id: product.id.toString(),
      name: product.name,
      slug: product.slug,
      category: product.category,
      dailyPrice: product.daily_price_ttc,
      deposit: product.deposit,
      quantity: product.quantity || 0,
      description: product.description,
      images: product.images || [],
    }));
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    return [];
  }
}
