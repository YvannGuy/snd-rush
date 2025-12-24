// Logique de recommandation améliorée pour l'assistant SoundRush Paris
// Utilise les produits réels depuis Supabase avec vérification de stock

import { Answers, Recommendation } from '@/types/assistant';
import { recommendPackByGuests, packMatchesNeeds, Pack } from './packs';
import { computePrice, isUrgent, getDeliveryPrice, getMicrosCount, computeOptionsTotal } from './assistant-logic';
import { PRICING_CONFIG } from '@/types/assistant';
import { 
  fetchProductsFromSupabase, 
  fetchProductsByCategory, 
  checkProductAvailability,
  AssistantProduct 
} from './assistant-products';

/**
 * Recommande un pack amélioré avec vérification de stock depuis Supabase
 */
export async function recommendPackWithStock(
  answers: Answers,
  startDate?: string,
  endDate?: string
): Promise<Recommendation | null> {
  if (!answers.guests || !answers.needs) return null;

  // 1. Essayer d'abord les packs fixes
  const recommendedPack = recommendPackByGuests(answers.guests);
  
  if (recommendedPack && packMatchesNeeds(recommendedPack, answers.needs, answers.environment || 'interieur')) {
    // Pack fixe qui correspond
    const basePrice = recommendedPack.basePrice || 0;
    const totalPrice = computePrice(basePrice, answers, PRICING_CONFIG);
    
    // Ajouter les micros supplémentaires à la composition
    const microsCount = getMicrosCount(answers.extras || []);
    const compositionFinale = [...recommendedPack.composition];
    
    if (microsCount.filaire > 0) {
      compositionFinale.push(`+ ${microsCount.filaire} micro${microsCount.filaire > 1 ? 's' : ''} filaire${microsCount.filaire > 1 ? 's' : ''} (${microsCount.filaire * 10}€)`);
    }
    if (microsCount.sansFil > 0) {
      compositionFinale.push(`+ ${microsCount.sansFil} micro${microsCount.sansFil > 1 ? 's' : ''} sans fil (${microsCount.sansFil * 20}€)`);
    }
    
    // Vérifier la disponibilité si dates fournies
    const warnings: string[] = [];
    if (startDate && endDate) {
      // Vérifier le stock des produits du pack
      const stockWarnings = await checkPackStock(recommendedPack, startDate, endDate);
      warnings.push(...stockWarnings);
    }
    
    return {
      pack: {
        id: recommendedPack.id,
        name: recommendedPack.name,
        priceId: `price_${recommendedPack.id}`,
        basePrice: basePrice,
        capacity: recommendedPack.capacity,
        description: compositionFinale.join(', '),
        features: compositionFinale
      },
      totalPrice,
      confidence: warnings.length > 0 ? 0.7 : 0.9,
      reasons: warnings.length > 0 
        ? ['Pack optimisé pour vos besoins', '⚠️ Vérifiez la disponibilité du matériel']
        : ['Pack optimisé pour vos besoins', 'Solution clé en main', 'Meilleur rapport qualité/prix'],
      breakdown: {
        base: basePrice,
        delivery: getDeliveryPrice(answers.zone || ''),
        extras: computeOptionsTotal(answers, basePrice),
        urgency: isUrgent(answers.startDate || '', answers.startTime) ? Math.round(totalPrice * 0.2) : 0
      },
      compositionFinale,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
  
  // 2. Si aucun pack fixe ne correspond, générer une config à-la-carte avec produits réels
  const customConfig = await generateCustomConfigWithSupabase(
    answers.guests,
    answers.needs,
    answers.environment || 'interieur',
    answers.extras || [],
    startDate,
    endDate
  );
  
  const basePrice = customConfig.total;
  const totalPrice = computePrice(basePrice, answers, PRICING_CONFIG);
  
  // Déterminer le type de config
  const guestCount = getGuestCount(answers.guests);
  let configType = 'Éco';
  if (guestCount > 100) configType = 'Punchy';
  else if (guestCount > 50) configType = 'Standard';
  
  return {
    pack: {
      id: 'custom_config',
      name: `Formule à-la-carte (${configType})`,
      priceId: 'price_custom',
      basePrice: basePrice,
      capacity: { min: guestCount, max: guestCount },
      description: customConfig.items.map(item => item.label).join(', '),
      features: customConfig.items.map(item => item.label)
    },
    totalPrice,
    confidence: customConfig.warnings.length > 0 ? 0.75 : 0.85,
    reasons: customConfig.warnings.length > 0
      ? ['Configuration personnalisée', '⚠️ Certains produits peuvent être en rupture']
      : ['Configuration personnalisée', 'Adaptée à vos besoins spécifiques', 'Prix optimisé'],
    breakdown: {
      base: basePrice,
      delivery: getDeliveryPrice(answers.zone || ''),
      extras: computeOptionsTotal(answers, basePrice),
      urgency: isUrgent(answers.startDate || '', answers.startTime) ? Math.round(totalPrice * 0.2) : 0
    },
    compositionFinale: customConfig.items.map(item => `${item.label} (${item.qty}x)`),
    customConfig: customConfig.items,
    warnings: customConfig.warnings.length > 0 ? customConfig.warnings : undefined
  };
}

/**
 * Vérifie le stock d'un pack
 */
async function checkPackStock(
  pack: Pack,
  startDate: string,
  endDate: string
): Promise<string[]> {
  const warnings: string[] = [];
  
  // Récupérer les produits depuis Supabase
  const allProducts = await fetchProductsFromSupabase();
  
  // Vérifier chaque composant du pack
  for (const component of pack.composition) {
    // Chercher le produit correspondant
    const matchingProduct = findProductByComponent(component, allProducts);
    
    if (matchingProduct) {
      const availability = await checkProductAvailability(
        matchingProduct.id,
        startDate,
        endDate
      );
      
      if (!availability.available || availability.quantity < 1) {
        warnings.push(`⚠️ ${matchingProduct.name} : Stock insuffisant pour cette période`);
      }
    }
  }
  
  return warnings;
}

/**
 * Trouve un produit Supabase correspondant à un composant de pack
 */
function findProductByComponent(component: string, products: AssistantProduct[]): AssistantProduct | null {
  const componentLower = component.toLowerCase();
  
  // Recherche par mots-clés
  for (const product of products) {
    const nameLower = product.name.toLowerCase();
    
    if (componentLower.includes('enceinte') && (nameLower.includes('enceinte') || nameLower.includes('speaker'))) {
      if (componentLower.includes('mac mah') && nameLower.includes('mac mah')) return product;
      if (componentLower.includes('fbt') && nameLower.includes('fbt')) return product;
    }
    
    if (componentLower.includes('caisson') && (nameLower.includes('caisson') || nameLower.includes('sub'))) {
      return product;
    }
    
    if (componentLower.includes('promix 8') && nameLower.includes('promix 8')) return product;
    if (componentLower.includes('promix 16') && nameLower.includes('promix 16')) return product;
    
    if (componentLower.includes('console') && (nameLower.includes('console') || nameLower.includes('mixage'))) {
      return product;
    }
  }
  
  return null;
}

/**
 * Génère une configuration à-la-carte avec produits réels depuis Supabase
 */
async function generateCustomConfigWithSupabase(
  guests: string,
  needs: string[],
  environment: string,
  extras: string[],
  startDate?: string,
  endDate?: string
): Promise<{ 
  items: Array<{ id: string; label: string; price: number; qty: number }>; 
  total: number;
  warnings: string[];
}> {
  const items: Array<{ id: string; label: string; price: number; qty: number }> = [];
  const warnings: string[] = [];
  let total = 0;

  // Récupérer tous les produits depuis Supabase
  const allProducts = await fetchProductsFromSupabase();
  
  // Déterminer le nombre de personnes
  const guestCount = getGuestCount(guests);

  // Enceintes selon le nombre de personnes
  const speakers = await findSpeakersForGuests(guestCount, environment, allProducts, startDate, endDate);
  if (speakers.product) {
    items.push({
      id: speakers.product.id,
      label: speakers.product.name,
      price: speakers.product.dailyPrice,
      qty: speakers.qty
    });
    if (speakers.warning) warnings.push(speakers.warning);
  }

  // Caisson si nécessaire
  if (guestCount > 100 || environment === 'exterieur') {
    const sub = await findSubwoofer(allProducts, startDate, endDate);
    if (sub.product) {
      items.push({
        id: sub.product.id,
        label: sub.product.name,
        price: sub.product.dailyPrice,
        qty: 1
      });
      if (sub.warning) warnings.push(sub.warning);
    }
  }

  // Console de mixage
  const mixer = await findMixer(extras, allProducts, startDate, endDate);
  if (mixer.product) {
    items.push({
      id: mixer.product.id,
      label: mixer.product.name,
      price: mixer.product.dailyPrice,
      qty: 1
    });
    if (mixer.warning) warnings.push(mixer.warning);
  }

  // Micros
  if (needs.includes('micros_filaire') || needs.includes('micros')) {
    const mics = await findWiredMics(guestCount, allProducts, startDate, endDate);
    if (mics.product) {
      items.push({
        id: mics.product.id,
        label: `${mics.product.name} (${mics.qty} unités)`,
        price: mics.product.dailyPrice,
        qty: mics.qty
      });
      if (mics.warning) warnings.push(mics.warning);
    }
  }

  if (needs.includes('micros_sans_fil')) {
    const wirelessMics = await findWirelessMics(guestCount, allProducts, startDate, endDate);
    if (wirelessMics.product) {
      items.push({
        id: wirelessMics.product.id,
        label: `${wirelessMics.product.name} (${wirelessMics.qty} unités)`,
        price: wirelessMics.product.dailyPrice,
        qty: wirelessMics.qty
      });
      if (wirelessMics.warning) warnings.push(wirelessMics.warning);
    }
  }

  // Lumières
  if (needs.includes('lumiere')) {
    const lights = await findLights(extras, allProducts, startDate, endDate);
    if (lights.product) {
      items.push({
        id: lights.product.id,
        label: lights.product.name,
        price: lights.product.dailyPrice,
        qty: 1
      });
      if (lights.warning) warnings.push(lights.warning);
    }
  }

  // Calculer le total
  total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return { items, total, warnings };
}

// Fonctions utilitaires pour trouver les produits
async function findSpeakersForGuests(
  guestCount: number,
  environment: string,
  products: AssistantProduct[],
  startDate?: string,
  endDate?: string
): Promise<{ product: AssistantProduct | null; qty: number; warning?: string }> {
  // Chercher les enceintes par catégorie
  const speakers = products.filter(p => 
    p.category === 'sonorisation' || 
    p.name.toLowerCase().includes('enceinte') ||
    p.name.toLowerCase().includes('speaker')
  );

  let selected: AssistantProduct | null = null;
  let qty = 1;

  if (guestCount <= 50) {
    // Chercher Mac Mah AS108 ou AS115
    selected = speakers.find(p => 
      p.name.toLowerCase().includes('mac mah') && 
      (p.name.toLowerCase().includes('as108') || p.name.toLowerCase().includes('as115'))
    ) || null;
  } else if (guestCount <= 100) {
    // Chercher Mac Mah AS115
    selected = speakers.find(p => 
      p.name.toLowerCase().includes('mac mah') && p.name.toLowerCase().includes('as115')
    ) || null;
  } else {
    // Chercher FBT X-Lite
    selected = speakers.find(p => 
      p.name.toLowerCase().includes('fbt') && p.name.toLowerCase().includes('xlite')
    ) || null;
    if (guestCount > 200) qty = 2;
  }

  if (selected && startDate && endDate) {
    const availability = await checkProductAvailability(selected.id, startDate, endDate);
    if (!availability.available || availability.quantity < qty) {
      return { product: selected, qty, warning: `⚠️ ${selected.name} : Stock limité` };
    }
  }

  return { product: selected, qty };
}

async function findSubwoofer(
  products: AssistantProduct[],
  startDate?: string,
  endDate?: string
): Promise<{ product: AssistantProduct | null; warning?: string }> {
  const subs = products.filter(p => 
    p.category === 'sonorisation' &&
    (p.name.toLowerCase().includes('caisson') || p.name.toLowerCase().includes('sub'))
  );

  const selected = subs.find(p => 
    p.name.toLowerCase().includes('fbt') || p.name.toLowerCase().includes('x-sub')
  ) || subs[0] || null;

  if (selected && startDate && endDate) {
    const availability = await checkProductAvailability(selected.id, startDate, endDate);
    if (!availability.available) {
      return { product: selected, warning: `⚠️ ${selected.name} : Indisponible` };
    }
  }

  return { product: selected };
}

async function findMixer(
  extras: string[],
  products: AssistantProduct[],
  startDate?: string,
  endDate?: string
): Promise<{ product: AssistantProduct | null; warning?: string }> {
  const mixers = products.filter(p => 
    p.category === 'sonorisation' &&
    (p.name.toLowerCase().includes('promix') || p.name.toLowerCase().includes('console') || p.name.toLowerCase().includes('mixage'))
  );

  let selected: AssistantProduct | null = null;
  
  if (extras.includes('promix16')) {
    selected = mixers.find(p => p.name.toLowerCase().includes('promix 16') || p.name.toLowerCase().includes('16')) || null;
  } else {
    selected = mixers.find(p => p.name.toLowerCase().includes('promix 8') || p.name.toLowerCase().includes('8')) || null;
  }

  if (!selected) {
    selected = mixers[0] || null;
  }

  if (selected && startDate && endDate) {
    const availability = await checkProductAvailability(selected.id, startDate, endDate);
    if (!availability.available) {
      return { product: selected, warning: `⚠️ ${selected.name} : Indisponible` };
    }
  }

  return { product: selected };
}

async function findWiredMics(
  guestCount: number,
  products: AssistantProduct[],
  startDate?: string,
  endDate?: string
): Promise<{ product: AssistantProduct | null; qty: number; warning?: string }> {
  const mics = products.filter(p => 
    p.category === 'micros' &&
    (p.name.toLowerCase().includes('filaire') || p.name.toLowerCase().includes('shure') || p.name.toLowerCase().includes('sm58'))
  );

  const selected = mics[0] || null;
  const qty = Math.min(Math.ceil(guestCount / 50), 5);

  if (selected && startDate && endDate) {
    const availability = await checkProductAvailability(selected.id, startDate, endDate);
    if (!availability.available || availability.quantity < qty) {
      return { product: selected, qty, warning: `⚠️ ${selected.name} : Stock limité (${availability.quantity} disponible)` };
    }
  }

  return { product: selected, qty };
}

async function findWirelessMics(
  guestCount: number,
  products: AssistantProduct[],
  startDate?: string,
  endDate?: string
): Promise<{ product: AssistantProduct | null; qty: number; warning?: string }> {
  const mics = products.filter(p => 
    p.category === 'micros' &&
    (p.name.toLowerCase().includes('sans fil') || p.name.toLowerCase().includes('wireless') || p.name.toLowerCase().includes('mipro'))
  );

  const selected = mics[0] || null;
  const qty = Math.min(Math.ceil(guestCount / 50), 3);

  if (selected && startDate && endDate) {
    const availability = await checkProductAvailability(selected.id, startDate, endDate);
    if (!availability.available || availability.quantity < qty) {
      return { product: selected, qty, warning: `⚠️ ${selected.name} : Stock limité (${availability.quantity} disponible)` };
    }
  }

  return { product: selected, qty };
}

async function findLights(
  extras: string[],
  products: AssistantProduct[],
  startDate?: string,
  endDate?: string
): Promise<{ product: AssistantProduct | null; warning?: string }> {
  const lights = products.filter(p => 
    p.category === 'lumieres' || p.category === 'eclairage' ||
    p.name.toLowerCase().includes('lumiere') || p.name.toLowerCase().includes('light') || 
    p.name.toLowerCase().includes('par') || p.name.toLowerCase().includes('boomtone')
  );

  let selected: AssistantProduct | null = null;
  
  if (extras.includes('boomtone')) {
    selected = lights.find(p => p.name.toLowerCase().includes('boomtone')) || null;
  }
  
  if (!selected) {
    selected = lights.find(p => p.name.toLowerCase().includes('par') || p.name.toLowerCase().includes('led')) || null;
  }

  if (!selected) {
    selected = lights[0] || null;
  }

  if (selected && startDate && endDate) {
    const availability = await checkProductAvailability(selected.id, startDate, endDate);
    if (!availability.available) {
      return { product: selected, warning: `⚠️ ${selected.name} : Indisponible` };
    }
  }

  return { product: selected };
}

function getGuestCount(guests: string): number {
  switch (guests) {
    case '0-50': return 25;
    case '50-100': return 75;
    case '100-200': return 150;
    case '200+': return 300;
    default: return 0;
  }
}
