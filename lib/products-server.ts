// Fonctions serveur pour récupérer les produits (utilisées dans Server Components)
import { createClient } from '@supabase/supabase-js';
import { getCatalogItemById } from './catalog';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export interface ProductForMetadata {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  long_description: string | null;
  category: string | null;
  images: string[] | null;
}

/**
 * Récupère un produit pour générer la metadata (Server Component)
 */
export async function getProductForMetadata(idOrSlug: string): Promise<ProductForMetadata | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Fallback : essayer getCatalogItemById
    const catalogItem = await getCatalogItemById(idOrSlug);
    if (catalogItem) {
      return {
        id: catalogItem.id,
        name: catalogItem.name,
        slug: catalogItem.slug || catalogItem.id,
        description: catalogItem.description || null,
        long_description: null,
        category: catalogItem.category || null,
        images: null,
      };
    }
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Si c'est un pack (commence par pack-), utiliser getCatalogItemById
    if (idOrSlug.startsWith('pack-')) {
      const catalogItem = await getCatalogItemById(idOrSlug);
      if (catalogItem) {
        return {
          id: catalogItem.id,
          name: catalogItem.name,
          slug: catalogItem.slug || catalogItem.id,
          description: catalogItem.description || null,
          long_description: null,
          category: catalogItem.category || null,
          images: null,
        };
      }
    }

    // Essayer par ID numérique
    const numericId = parseInt(idOrSlug, 10);
    if (!isNaN(numericId)) {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, description, long_description, category, images')
        .eq('id', numericId)
        .single();

      if (!error && data) {
        return {
          id: data.id.toString(),
          name: data.name,
          slug: data.slug,
          description: data.description,
          long_description: data.long_description,
          category: data.category,
          images: data.images,
        };
      }
    }

    // Essayer par slug
    const { data, error } = await supabase
      .from('products')
      .select('id, name, slug, description, long_description, category, images')
      .eq('slug', idOrSlug)
      .single();

    if (!error && data) {
      return {
        id: data.id.toString(),
        name: data.name,
        slug: data.slug,
        description: data.description,
        long_description: data.long_description,
        category: data.category,
        images: data.images,
      };
    }

    return null;
  } catch (error) {
    console.error('Erreur récupération produit pour metadata:', error);
    return null;
  }
}

