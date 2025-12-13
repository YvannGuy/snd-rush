// Utilitaires pour gérer le panier depuis l'assistant

import { DraftFinalConfig } from '@/types/chat';
import { CartItem } from '@/types/db';
import { getCatalogItemById, getRentalDays, getPriceMultiplier } from './catalog';
import { getPacksInfo } from './assistant-products';

/**
 * Applique une configuration finale au panier
 * Retourne { ok: boolean, cart?: Cart, error?: string }
 * 
 * Cette fonction construit les items depuis le catalogue et les retourne
 * pour être ajoutés via le CartContext
 */
export async function applyFinalConfigToCart(
  config: DraftFinalConfig
): Promise<{ ok: boolean; cart?: { items: CartItem[] }; error?: string }> {
  console.log('[CART] APPLY CONFIG', config);
  
  try {
    const items: CartItem[] = [];

    // Traiter chaque sélection
    for (const selection of config.selections) {
      const catalogItem = await getCatalogItemById(selection.catalogId);

      if (!catalogItem) {
        console.warn(`Produit non trouvé: ${selection.catalogId}`);
        continue;
      }

      // Dates par défaut si non fournies
      const startISO = config.event?.startISO || new Date().toISOString();
      const endISO = config.event?.endISO || new Date().toISOString();

      // Calculer rentalDays
      const rentalDays = getRentalDays(startISO, endISO);

      // Pour les packs, on doit décomposer en produits individuels
      if (selection.catalogId.startsWith('pack_')) {
        const packItems = await getPackItems(selection.catalogId);
        
        for (const packItem of packItems) {
          const productItem = await getCatalogItemById(packItem.catalogId);
          if (productItem) {
            items.push({
              productId: productItem.id,
              productName: productItem.name,
              productSlug: productItem.slug || '',
              quantity: packItem.qty * selection.qty,
              rentalDays,
              startDate: startISO.split('T')[0],
              endDate: endISO.split('T')[0],
              dailyPrice: productItem.unitPriceEur,
              deposit: productItem.deposit || 0,
              addons: [],
              eventType: config.event ? 'event' : undefined,
              startTime: config.event?.startISO ? new Date(config.event.startISO).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
              endTime: config.event?.endISO ? new Date(config.event.endISO).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
              zone: config.event?.department,
            });
          }
        }
      } else {
        // Produit individuel
        items.push({
          productId: catalogItem.id,
          productName: catalogItem.name,
          productSlug: catalogItem.slug || '',
          quantity: selection.qty,
          rentalDays,
          startDate: startISO.split('T')[0],
          endDate: endISO.split('T')[0],
          dailyPrice: catalogItem.unitPriceEur,
          deposit: catalogItem.deposit || 0,
          addons: [],
          eventType: config.event ? 'event' : undefined,
          startTime: config.event?.startISO ? new Date(config.event.startISO).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
          endTime: config.event?.endISO ? new Date(config.event.endISO).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
          zone: config.event?.department,
        });
      }
    }

    // Vérifier qu'on a au moins un item
    if (items.length === 0) {
      console.warn('[CART] Aucun item généré, ok=false');
      return {
        ok: false,
        error: 'Aucun produit trouvé pour cette configuration',
      };
    }

    console.log('[CART] CART AFTER', { itemsCount: items.length, items });

    // Retourner les items pour ajout au panier
    return {
      ok: true,
      cart: { items },
    };
  } catch (error: any) {
    console.error('[CART] Erreur applyFinalConfigToCart:', error);
    return {
      ok: false,
      error: error.message || 'Erreur lors de l\'ajout au panier',
    };
  }
}

/**
 * Décompose un pack en produits individuels
 * Cherche d'abord dans Supabase par nom, puis fallback vers catalogId connu
 */
async function getPackItems(packId: string): Promise<Array<{ catalogId: string; qty: number }>> {
  const packs = getPacksInfo();
  const pack = packs.find(p => p.id === packId);

  if (!pack) {
    return [];
  }

  const items: Array<{ catalogId: string; qty: number }> = [];

  for (const comp of pack.composition) {
    const compLower = comp.toLowerCase();
    
    // Essayer de trouver le produit dans Supabase d'abord
    let foundCatalogId: string | null = null;
    
    try {
      const { searchProducts } = await import('./assistant-products');
      const products = await searchProducts(comp);
      
      if (products.length > 0) {
        // Prendre le premier produit trouvé
        foundCatalogId = products[0].id;
      }
    } catch (e) {
      console.warn('[CART] Erreur recherche produit:', e);
    }
    
    // Si pas trouvé, utiliser le mapping par défaut
    if (!foundCatalogId) {
      // Enceintes
      if (compLower.includes('mac mah as 115') || compLower.includes('macmah as115')) {
        foundCatalogId = 'macmah_as115_pair';
      } else if (compLower.includes('fbt x-lite 115a') || compLower.includes('fbt xlite')) {
        foundCatalogId = 'fbt_xlite115_pair';
      }
      // Caissons
      else if (compLower.includes('caisson') || compLower.includes('x-sub') || compLower.includes('xsub')) {
        foundCatalogId = 'fbt_xsub118';
      }
      // Consoles
      else if (compLower.includes('promix 8') || (compLower.includes('promix') && compLower.includes('8'))) {
        foundCatalogId = 'promix8';
      } else if (compLower.includes('promix 16') || (compLower.includes('promix') && compLower.includes('16'))) {
        foundCatalogId = 'promix16';
      } else if (compLower.includes('console') && !foundCatalogId) {
        // Par défaut Promix 8
        foundCatalogId = 'promix8';
      }
    }
    
    if (foundCatalogId) {
      items.push({ catalogId: foundCatalogId, qty: 1 });
    } else {
      console.warn(`[CART] Produit non mappé dans pack: ${comp}`);
    }
  }

  return items;
}
