// Fonctions pures pour l'assistant SND Rush

import { Answers, Recommendation, PRICING_CONFIG } from '@/types/assistant';
import { recommendPackByGuests, packMatchesNeeds } from './packs';
import { generateCustomConfig } from './inventory';

/**
 * Détecte la zone à partir d'un texte (adresse ou code postal)
 */
export function detectZoneFromText(input: string): "paris" | "petite" | "grande" | null {
  const m = input.match(/\b(\d{5})\b/);
  if (!m) return null;
  const zip = m[1];
  const dep = parseInt(zip.slice(0, 2), 10);
  if (dep === 75) return "paris";
  if ([92, 93, 94].includes(dep)) return "petite";
  if ([77, 78, 91, 95].includes(dep)) return "grande";
  return null;
}

/**
 * Obtient le prix de livraison A/R selon la zone
 */
export function getDeliveryPrice(zone: string): number {
  const DELIVERY_AR = { 
    paris: 80, 
    petite: 120, 
    grande: 160, 
    retrait: 0 
  };
  return DELIVERY_AR[zone as keyof typeof DELIVERY_AR] || 0;
}

/**
 * Vérifie si un événement est urgent (même jour)
 */
export function isUrgent(dateStr: string): boolean {
  if (!dateStr) return false;
  
  const [y, m, d] = dateStr.split('-').map(Number);
  const eventDate = new Date(y, (m-1), d);
  const today = new Date();
  
  // Comparer seulement les dates (sans l'heure)
  return eventDate.toDateString() === today.toDateString();
}

/**
 * Recommande un pack basé sur les réponses (nouvelle logique avec packs fixes + à-la-carte)
 */
export function recommendPack(answers: Answers): Recommendation | null {
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
      confidence: 0.9,
      reasons: [
        'Pack optimisé pour vos besoins',
        'Solution clé en main',
        'Meilleur rapport qualité/prix'
      ],
      breakdown: {
        base: basePrice,
        delivery: getDeliveryPrice(answers.zone || ''),
        extras: computeOptionsTotal(answers, basePrice),
        urgency: isUrgent(answers.date || '') ? Math.round(totalPrice * 0.2) : 0
      },
      compositionFinale
    };
  }
  
  // 2. Si aucun pack fixe ne correspond, générer une config à-la-carte
  const customConfig = generateCustomConfig(
    answers.guests,
    answers.needs,
    answers.environment || 'interieur',
    answers.extras || []
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
    confidence: 0.85,
    reasons: [
      'Configuration personnalisée',
      'Adaptée à vos besoins spécifiques',
      'Prix optimisé'
    ],
    breakdown: {
      base: basePrice,
      delivery: getDeliveryPrice(answers.zone || ''),
      extras: computeOptionsTotal(answers, basePrice),
      urgency: isUrgent(answers.date || '') ? Math.round(totalPrice * 0.2) : 0
    },
    compositionFinale: customConfig.items.map(item => `${item.label} (${item.qty}x)`),
    customConfig: customConfig.items
  };
}

/**
 * Calcule le prix total avec concordance besoins
 */
export function computePrice(
  basePrice: number,
  answers: Answers,
  pricing: typeof PRICING_CONFIG
): number {
  let total = basePrice;
  
  // Livraison A/R
  total += getDeliveryPrice(answers.zone || '');
  
  // Options supplémentaires avec concordance besoins
  total += computeOptionsTotal(answers, basePrice);
  
  // Majoration d'urgence
  if (isUrgent(answers.date || '')) {
    total = Math.round(total * pricing.urgencyMultiplier);
  }
  
  return total;
}

/**
 * Calcule le total des options avec concordance besoins
 */
export function computeOptionsTotal(answers: Answers, basePrice: number): number {
  let total = 0;
  
  // Options supplémentaires
  if (answers.extras) {
    total += getExtrasPrice(answers.extras);
  }
  
  // Concordance besoins - retirer lumière si pas demandée
  if (!answers.needs?.includes('lumiere') && hasDefaultLight(basePrice)) {
    total -= 80; // Retirer lumière par défaut
  }
  
  return total;
}

/**
 * Vérifie si le pack a de la lumière par défaut
 */
function hasDefaultLight(basePrice: number): boolean {
  // Les packs Standard, Premium et Prestige incluent la lumière par défaut
  return basePrice >= 179;
}

/**
 * Obtient le nombre d'invités à partir de la réponse
 */
function getGuestCount(guests: string): number {
  switch (guests) {
    case '0-50': return 25;
    case '50-100': return 75;
    case '100-200': return 150;
    case '200+': return 300;
    default: return 0;
  }
}


/**
 * Obtient le prix des options supplémentaires
 */
function getExtrasPrice(extras: string[]): number {
  return extras.reduce((total, extra) => {
    switch (extra) {
      case 'micros_filaire': return total + PRICING_CONFIG.extras.micros_filaire;
      case 'micros_sans_fil': return total + PRICING_CONFIG.extras.micros_sans_fil;
      case 'technicien': return total + PRICING_CONFIG.extras.technicien;
      default: return total;
    }
  }, 0);
}

/**
 * Compte les micros supplémentaires sélectionnés
 */
export function getMicrosCount(extras: string[]): { filaire: number; sansFil: number } {
  const filaire = extras.filter(extra => extra === 'micros_filaire').length;
  const sansFil = extras.filter(extra => extra === 'micros_sans_fil').length;
  return { filaire, sansFil };
}

/**
 * Valide les réponses d'une étape
 */
export function validateStep(stepId: string, value: any): boolean {
  switch (stepId) {
    case 'eventType':
      return ['mariage', 'anniversaire', 'association', 'corporate', 'eglise', 'soiree', 'autre'].includes(value);
    case 'guests':
      return ['0-50', '50-100', '100-200', '200+'].includes(value);
    case 'zone':
      return ['paris', 'petite', 'grande', 'retrait'].includes(value);
    case 'environment':
      return ['interieur', 'exterieur'].includes(value);
    case 'needs':
      return Array.isArray(value) && value.length > 0;
    case 'extras':
      return true; // Optionnel - peut être un tableau vide
    case 'date':
      if (!value) return false;
      const date = new Date(value);
      const today = new Date();
      // Comparer seulement les dates (sans l'heure) pour permettre la sélection d'aujourd'hui
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return dateOnly >= todayOnly;
    case 'time':
      return true; // Optionnel
    default:
      return false;
  }
}

/**
 * Génère un message de réservation
 */
export function generateReservationMessage(
  recommendation: Recommendation,
  answers: Answers
): string {
  const { pack, totalPrice, breakdown } = recommendation;
  
  let message = `Bonjour,\n\n`;
  message += `Je souhaite réserver le ${pack.name} (${totalPrice} € TTC) pour mon événement.\n\n`;
  message += `Détails de l'événement :\n`;
  message += `- Type : ${getEventTypeLabel(answers.eventType)}\n`;
  message += `- Invités : ${getGuestsLabel(answers.guests)}\n`;
  message += `- Zone : ${getZoneLabel(answers.zone)}\n`;
  message += `- Environnement : ${getEnvironmentLabel(answers.environment)}\n`;
  message += `- Besoins : ${answers.needs?.join(', ') || 'Non spécifié'}\n`;
  if (answers.date) {
    message += `- Date : ${answers.date}\n`;
  }
  message += `\nDétail des coûts :\n`;
  message += `- Pack : ${breakdown.base} €\n`;
  message += `- Livraison A/R : ${breakdown.delivery} €\n`;
  if (breakdown.extras > 0) {
    message += `- Options : ${breakdown.extras} €\n`;
  }
  if (breakdown.urgency > 0) {
    message += `- Majoration urgence : ${breakdown.urgency} €\n`;
  }
  message += `- Total TTC : ${totalPrice} €\n\n`;
  message += `Merci de me recontacter pour finaliser la réservation.`;

  return message;
}

// Fonctions utilitaires pour les labels
function getEventTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    mariage: 'Mariage',
    anniversaire: 'Anniversaire',
    association: 'Association',
    corporate: 'Corporate',
    eglise: 'Église',
    soiree: 'Soirée',
    autre: 'Autre',
  };
  return labels[type || ''] || 'Non spécifié';
}

function getGuestsLabel(guests?: string): string {
  const labels: Record<string, string> = {
    '0-50': '0-50 personnes',
    '50-100': '50-100 personnes',
    '100-200': '100-200 personnes',
    '200+': '200+ personnes',
  };
  return labels[guests || ''] || 'Non spécifié';
}

function getZoneLabel(zone?: string): string {
  const labels: Record<string, string> = {
    paris: 'Paris',
    petite_couronne: 'Petite couronne',
    grande_couronne: 'Grande couronne',
    retrait: 'Retrait sur place',
  };
  return labels[zone || ''] || 'Non spécifié';
}

function getEnvironmentLabel(environment?: string): string {
  const labels: Record<string, string> = {
    interieur: 'Intérieur',
    exterieur: 'Extérieur',
  };
  return labels[environment || ''] || 'Non spécifié';
}
