// Fonctions pures pour l'assistant SND Rush

import { Answers, Pack, Recommendation, PRICING_CONFIG, ReservationPayload } from '@/types/assistant';

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
    grande: 156, 
    retrait: 0 
  };
  return DELIVERY_AR[zone as keyof typeof DELIVERY_AR] || 0;
}

/**
 * Vérifie si un événement est urgent (dans moins de 48h)
 */
export function isUrgent(dateStr: string, timeStr?: string): boolean {
  if (!dateStr) return false;
  
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = (timeStr || "23:59").split(':').map(Number);
  const event = new Date(y, (m-1), d, hh || 23, mm || 59, 0);
  const now = new Date();
  const diffH = (event.getTime() - now.getTime()) / 36e5;
  
  return diffH <= 48;
}

/**
 * Recommande un pack basé sur les réponses
 */
export function recommendPack(answers: Answers, packs: Pack[]): Recommendation | null {
  if (!answers.guests || !answers.needs) return null;

  const guestCount = getGuestCount(answers.guests);
  const hasIntensiveNeeds = answers.needs.includes('dj') || answers.needs.includes('lumiere');
  const isOutdoor = answers.environment === 'exterieur';
  
  // Logique de recommandation
  let recommendedPack: Pack;
  let confidence = 0.8;
  const reasons: string[] = [];

  // Pack Essentiel : < 50 personnes, besoins simples
  if (guestCount <= 50 && !hasIntensiveNeeds && !isOutdoor) {
    recommendedPack = PRICING_CONFIG.packs.essentiel;
    reasons.push('Parfait pour petits événements');
    reasons.push('Solution économique');
    confidence = 0.9;
  }
  // Pack Standard : 50-100 personnes
  else if (guestCount <= 100) {
    recommendedPack = PRICING_CONFIG.packs.standard;
    reasons.push('Idéal pour événements moyens');
    reasons.push('Bon rapport qualité/prix');
    confidence = 0.85;
  }
  // Pack Premium : 100-250 personnes
  else if (guestCount <= 250) {
    recommendedPack = PRICING_CONFIG.packs.premium;
    reasons.push('Solution professionnelle');
    reasons.push('Puissance adaptée aux grands événements');
    confidence = 0.9;
  }
  // Pack Prestige : 250+ personnes ou besoins intensifs
  else {
    recommendedPack = PRICING_CONFIG.packs.prestige;
    reasons.push('Solution haut de gamme');
    reasons.push('Sur devis personnalisé');
    confidence = 0.95;
  }

  // Ajustements de confiance
  if (hasIntensiveNeeds) {
    confidence += 0.05;
    reasons.push('Besoins intensifs détectés');
  }
  
  if (isOutdoor) {
    confidence += 0.05;
    reasons.push('Environnement extérieur');
  }

  // Calcul du prix total
  const totalPrice = computePrice(
    recommendedPack.basePrice,
    answers,
    PRICING_CONFIG
  );

  return {
    pack: recommendedPack,
    confidence: Math.min(confidence, 1),
    reasons,
    totalPrice,
    breakdown: {
      base: recommendedPack.basePrice,
      delivery: getDeliveryPrice(answers.zone || ''),
      extras: getExtrasPrice(answers.extras || []),
      urgency: isUrgent(answers.date || '') ? totalPrice * 0.2 : 0,
    },
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
  if (isUrgent(answers.date || '', answers.time)) {
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
  // Les packs Premium et Prestige incluent la lumière par défaut
  return basePrice >= 1499;
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
      case 'promix16': return total + PRICING_CONFIG.extras.promix16;
      case 'lumiere_basique': return total + PRICING_CONFIG.extras.lumiere_basique;
      case 'technicien': return total + PRICING_CONFIG.extras.technicien;
      default: return total;
    }
  }, 0);
}

/**
 * Valide les réponses d'une étape
 */
export function validateStep(stepId: string, value: any): boolean {
  switch (stepId) {
    case 'eventType':
      return ['mariage', 'anniversaire', 'association', 'corporate', 'eglise', 'autre'].includes(value);
    case 'guests':
      return ['0-50', '50-100', '100-200', '200+'].includes(value);
    case 'address':
      return typeof value === 'string' && value.trim().length > 0;
    case 'zone':
      return ['paris', 'petite', 'grande', 'retrait'].includes(value);
    case 'environment':
      return ['interieur', 'exterieur'].includes(value);
    case 'needs':
      return Array.isArray(value) && value.length > 0;
    case 'extras':
      return true; // Optionnel
    case 'date':
      if (!value) return false;
      const date = new Date(value);
      const today = new Date();
      return date >= today;
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
  answers: Answers,
  personalInfo: ReservationPayload['personalInfo']
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
