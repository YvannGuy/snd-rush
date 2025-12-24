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
      console.log(`[CART] Traitement sélection: ${selection.catalogId}, qty: ${selection.qty}`);
      const catalogItem = await getCatalogItemById(selection.catalogId);

      if (!catalogItem) {
        console.warn(`[CART] Produit non trouvé: ${selection.catalogId}`);
        continue;
      }
      
      console.log(`[CART] Produit trouvé: ${catalogItem.name} (${catalogItem.id})`);

      // Dates par défaut si non fournies
      const startISO = config.event?.startISO || new Date().toISOString();
      const endISO = config.event?.endISO || new Date().toISOString();

      // Calculer rentalDays
      const rentalDays = getRentalDays(startISO, endISO);

      // Pour les packs, les ajouter comme packs (PAS de décomposition)
      if (selection.catalogId.startsWith('pack_')) {
        console.log(`[CART] Ajout du pack: ${selection.catalogId} (sans décomposition)`);
        
        // Le pack_maxi est un pack "sur mesure" qui nécessite un devis
        if (selection.catalogId === 'pack_maxi') {
          console.warn(`[CART] Pack XL (sur mesure) ne peut pas être ajouté automatiquement au panier. Un devis personnalisé est nécessaire.`);
          return {
            ok: false,
            error: 'Le Pack XL est un pack sur mesure qui nécessite un devis personnalisé. Contacte-nous directement pour cette demande.',
          };
        }
        
        // Récupérer les infos du pack pour l'image et la caution
        const { getPacksInfo } = await import('./assistant-products');
        const packs = getPacksInfo();
        
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
        
        const mappedPackId = packIdMapping[selection.catalogId] || selection.catalogId.replace('pack-', 'pack_');
        const packInfo = packs.find(p => p.id === mappedPackId);
        
        // Mapping des images des packs (GARANTI - toujours une image)
        const packImages: Record<string, string> = {
          'pack_petit': '/packs.png',
          'pack_confort': '/packM.png',
          'pack_grand': '/packL.png',
          'pack_dj_essentiel': '/packdjs.png',
          'pack_dj_performance': '/packdjM.png',
          'pack_dj_premium': '/packdjL.png',
        };
        
        const packImage = packImages[mappedPackId] || packImages[selection.catalogId] || '/logo.svg'; // Fallback si pack non mappé
        
        // Récupérer la caution du pack
        const packDeposit = packInfo?.deposit || catalogItem.deposit || 0;
        
        // Ajouter le pack comme un item unique (pas décomposé)
        items.push({
          productId: selection.catalogId,
          productName: catalogItem.name,
          productSlug: selection.catalogId,
          quantity: selection.qty,
          rentalDays,
          startDate: startISO.split('T')[0],
          endDate: endISO.split('T')[0],
          dailyPrice: catalogItem.unitPriceEur,
          deposit: packDeposit, // Caution du pack
          addons: [],
          images: [packImage], // Toujours une image garantie
          startTime: config.event?.startISO ? new Date(config.event.startISO).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
          endTime: config.event?.endISO ? new Date(config.event.endISO).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
          zone: config.event?.department,
          metadata: config.event ? { type: 'event' } : undefined,
        });
      } else {
        // Produit individuel - récupérer l'image depuis Supabase
        let productImage: string[] = [];
        try {
          const { fetchProductById } = await import('./assistant-products');
          const fullProduct = await fetchProductById(catalogItem.id);
          if (fullProduct && fullProduct.images && fullProduct.images.length > 0) {
            productImage = fullProduct.images;
          }
        } catch (e) {
          console.warn('[CART] Erreur récupération image produit:', e);
        }
        
        // GARANTIR qu'il y a toujours une image (fallback par catégorie ou image générique)
        if (productImage.length === 0) {
          const defaultImages: Record<string, string> = {
            'sonorisation': '/enceintebt.jpg',
            'dj': '/platinedj.jpg',
            'micros': '/microshure.png',
            'lumieres': '/lyreled.png',
            'caisson': '/caissonbasse.png',
            'cable': '/xlr6m.png',
            'adaptateur': '/rcaxlr.png',
          };
          const category = catalogItem.category?.toLowerCase() || '';
          const defaultImg = defaultImages[category] || '/logo.svg';
          productImage = [defaultImg];
          console.log(`[CART] Image par défaut utilisée pour ${catalogItem.name} (catégorie: ${category})`);
        }
        
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
          images: productImage, // Toujours au moins une image
          startTime: config.event?.startISO ? new Date(config.event.startISO).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
          endTime: config.event?.endISO ? new Date(config.event.endISO).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
          zone: config.event?.department,
          metadata: config.event ? { type: 'event' } : undefined,
        });
      }
    }

    // Calculer le prix d'installation si nécessaire (après avoir construit tous les items)
    // L'installation est automatiquement ajoutée UNIQUEMENT si :
    // 1. Le client a explicitement demandé l'installation (withInstallation === true)
    // 2. ET il y a une livraison (department présent et différent de "retrait")
    // 3. ET il y a des produits dans le panier
    // IMPORTANT : L'installation est une OPTION SUPPLEMENTAIRE qui nécessite la validation explicite du client
    let installationPrice: number | null = null;
    const needsInstallation = config.withInstallation === true; // UNIQUEMENT si explicitement demandé et validé par le client
    console.log(`[CART] Installation demandée ? ${needsInstallation} (withInstallation: ${config.withInstallation})`);
    if (needsInstallation && config.event?.department && config.event.department !== 'retrait' && items.length > 0) {
      try {
        const { calculateInstallationPrice } = await import('./calculateInstallationPrice');
        // Utiliser les items déjà construits pour calculer l'installation
        // Pour les packs, convertir l'ID pack_* en format pack-* pour la compatibilité avec calculateInstallationPrice
        const itemsForInstallation = items.map(item => {
          // Convertir pack_petit -> pack-1, pack_confort -> pack-2, pack_grand -> pack-3
          let productId = item.productId;
          if (item.productId === 'pack_petit') productId = 'pack-1';
          else if (item.productId === 'pack_confort') productId = 'pack-2';
          else if (item.productId === 'pack_grand') productId = 'pack-3';
          
          return {
            ...item,
            productId,
          } as CartItem;
        });
        
        installationPrice = calculateInstallationPrice(itemsForInstallation);
        console.log(`[CART] Prix installation calculé: ${installationPrice}€`);
      } catch (e) {
        console.warn('[CART] Erreur calcul installation:', e);
      }
    }
    
    // Ajouter l'installation si le prix est > 0
    if (installationPrice && installationPrice > 0) {
      items.push({
        productId: 'installation',
        productName: 'Installation',
        productSlug: 'installation',
        quantity: 1,
        rentalDays: 1,
        startDate: config.event?.startISO ? config.event.startISO.split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: config.event?.endISO ? config.event.endISO.split('T')[0] : new Date().toISOString().split('T')[0],
        dailyPrice: installationPrice,
        deposit: 0,
        addons: [],
        images: ['/installation.jpg'],
        startTime: config.event?.startISO ? new Date(config.event.startISO).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
        endTime: config.event?.endISO ? new Date(config.event.endISO).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
        zone: config.event?.department,
        metadata: { type: 'event' },
      });
      console.log(`[CART] Installation ajoutée: ${installationPrice}€`);
    }

    // Ajouter la livraison si nécessaire (department présent et différent de "retrait")
    if (config.event?.department && config.event.department !== 'retrait') {
      // Convertir le numéro de département en zone si nécessaire
      let deliveryZone = config.event.department;
      const deptNum = parseInt(config.event.department, 10);
      
      if (!isNaN(deptNum)) {
        if (deptNum === 75) {
          deliveryZone = 'paris';
        } else if ([92, 93, 94].includes(deptNum)) {
          deliveryZone = 'petite';
        } else if ([77, 78, 91, 95].includes(deptNum)) {
          deliveryZone = 'grande';
        }
      } else if (config.event.department.startsWith('petite')) {
        deliveryZone = 'petite';
      } else if (config.event.department.startsWith('grande')) {
        deliveryZone = 'grande';
      }
      
      const { getDeliveryPrice } = await import('./zone-detection');
      const deliveryPrice = getDeliveryPrice(deliveryZone);
      
      if (deliveryPrice > 0) {
        // Déterminer le nom de la zone
        const zoneNames: Record<string, string> = {
          'paris': 'Livraison Paris',
          'petite': 'Livraison Petite Couronne',
          'grande': 'Livraison Grande Couronne',
          '75': 'Livraison Paris',
          '92': 'Livraison Petite Couronne',
          '93': 'Livraison Petite Couronne',
          '94': 'Livraison Petite Couronne',
        };
        
        const zoneName = zoneNames[deliveryZone] || zoneNames[config.event.department] || 'Livraison';
        
        items.push({
          productId: `delivery-${deliveryZone}`,
          productName: zoneName,
          productSlug: `delivery-${deliveryZone}`,
          quantity: 1,
          rentalDays: 1,
          startDate: config.event.startISO.split('T')[0],
          endDate: config.event.endISO.split('T')[0],
          dailyPrice: deliveryPrice,
          deposit: 0,
          addons: [],
          images: ['/livraison.jpg'],
          startTime: config.event.startISO ? new Date(config.event.startISO).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
          endTime: config.event.endISO ? new Date(config.event.endISO).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
          zone: deliveryZone,
          metadata: { type: 'event' },
        });
        
        console.log(`[CART] Livraison ajoutée: ${zoneName} (${deliveryPrice}€)`);
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

  // Le pack_maxi est un pack "sur mesure" qui ne peut pas être décomposé en produits individuels
  // Il nécessite un devis personnalisé
  if (packId === 'pack_maxi') {
    console.log('[CART] Pack XL (sur mesure) détecté - ne peut pas être décomposé automatiquement');
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
        console.log(`[CART] Produit trouvé via searchProducts: ${foundCatalogId} pour "${comp}"`);
      }
    } catch (e) {
      console.warn('[CART] Erreur recherche produit:', e);
    }
    
    // Si pas trouvé, essayer de chercher par slug avec des variantes
    if (!foundCatalogId) {
      try {
        const { fetchProductById } = await import('./assistant-products');
        
        // Essayer différentes variantes de slugs
        const slugVariants: string[] = [];
        
        if (compLower.includes('mac mah as 115') || compLower.includes('macmah as115')) {
          slugVariants.push('mac-mah-as-115', 'macmah-as115', 'mac-mah-as115', 'enceinte-mac-mah-as-115');
        } else if (compLower.includes('fbt x-lite 115a') || compLower.includes('fbt xlite')) {
          slugVariants.push('fbt-x-lite-115a', 'fbt-xlite-115a', 'fbt-xlite115a', 'enceinte-fbt-x-lite-115a');
        } else if (compLower.includes('caisson') || compLower.includes('x-sub') || compLower.includes('xsub')) {
          slugVariants.push('fbt-x-sub-118', 'fbt-xsub118', 'caisson-fbt-x-sub-118', 'caisson-de-basse');
        } else if (compLower.includes('promix 8') || (compLower.includes('promix') && compLower.includes('8'))) {
          slugVariants.push('hpa-promix-8', 'promix-8', 'promix8', 'console-hpa-promix-8');
        } else if (compLower.includes('promix 16') || (compLower.includes('promix') && compLower.includes('16'))) {
          slugVariants.push('hpa-promix-16', 'promix-16', 'promix16', 'console-hpa-promix-16');
        } else if (compLower.includes('console') && !foundCatalogId) {
          slugVariants.push('hpa-promix-8', 'promix-8', 'console-de-mixage');
        }
        
        // Essayer chaque variante
        for (const slug of slugVariants) {
          const product = await fetchProductById(slug);
          if (product) {
            foundCatalogId = product.id;
            console.log(`[CART] Produit trouvé via slug: ${foundCatalogId} (slug: ${slug})`);
            break;
          }
        }
      } catch (e) {
        console.warn('[CART] Erreur recherche par slug:', e);
      }
    }
    
    // Si toujours pas trouvé, essayer une recherche plus large dans Supabase
    if (!foundCatalogId) {
      try {
        const { searchProducts } = await import('./assistant-products');
        
        // Construire des termes de recherche plus larges
        const searchTerms: string[] = [];
        
        if (compLower.includes('mac mah as 115') || compLower.includes('macmah as115')) {
          searchTerms.push('mac mah', 'macmah', 'as 115', 'as115', 'enceinte');
        } else if (compLower.includes('fbt x-lite 115a') || compLower.includes('fbt xlite')) {
          searchTerms.push('fbt', 'xlite', 'x-lite', '115a', 'enceinte');
        } else if (compLower.includes('caisson') || compLower.includes('x-sub') || compLower.includes('xsub')) {
          searchTerms.push('caisson', 'sub', 'basse', 'x-sub', 'xsub');
        } else if (compLower.includes('promix 8') || (compLower.includes('promix') && compLower.includes('8'))) {
          searchTerms.push('promix 8', 'promix8', 'hpa promix', 'console');
        } else if (compLower.includes('promix 16') || (compLower.includes('promix') && compLower.includes('16'))) {
          searchTerms.push('promix 16', 'promix16', 'hpa promix', 'console');
        } else if (compLower.includes('console')) {
          searchTerms.push('console', 'promix', 'mixage');
        }
        
        // Essayer chaque terme de recherche
        for (const term of searchTerms) {
          const products = await searchProducts(term);
          if (products.length > 0) {
            // Filtrer pour trouver le meilleur match
            const bestMatch = products.find(p => 
              p.name.toLowerCase().includes(compLower.split(' ')[0]) ||
              compLower.includes(p.name.toLowerCase().split(' ')[0])
            ) || products[0];
            
            foundCatalogId = bestMatch.id;
            console.log(`[CART] Produit trouvé via recherche large: ${foundCatalogId} (terme: ${term}, nom: ${bestMatch.name})`);
            break;
          }
        }
      } catch (e) {
        console.warn('[CART] Erreur recherche large:', e);
      }
    }
    
    // Si toujours pas trouvé, loguer l'erreur mais ne pas utiliser d'IDs hardcodés invalides
    if (!foundCatalogId) {
      console.error(`[CART] PRODUIT NON TROUVÉ dans Supabase pour "${comp}". Le pack ne pourra pas être décomposé correctement.`);
    }
    
    if (foundCatalogId) {
      items.push({ catalogId: foundCatalogId, qty: 1 });
      console.log(`[CART] Item ajouté au pack: ${foundCatalogId} (${comp})`);
    } else {
      console.error(`[CART] PRODUIT NON MAPPÉ dans pack: ${comp}. Le pack sera incomplet.`);
      // Ne pas ajouter l'item si on ne trouve pas le produit
      // Cela permettra de voir dans les logs quels produits manquent
    }
  }

  return items;
}
