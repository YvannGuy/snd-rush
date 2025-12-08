export type PricingInput = {
  nbSpeakers: number;
  nbSubs: number;
  mixer: 'NONE'|'PROMIX8'|'PROMIX16';
  micsFilaire: number;
  micsSansFil: number;
  withInstallation: boolean;
  zone: 'PARIS'|'PETITE_COURONNE'|'GRANDE_COURONNE'|'RETRAIT';
  durationDays: number;
  dateISO: string|null;
};

export type QuoteResult = {
  totalTTC: string;
  breakdown: string;
  isUrgent: boolean;
};

export function computeQuote(input: PricingInput): QuoteResult {
  // Utilisation des mêmes prix que le générateur de prix existant
  const PRICING = {
    // Matériel TTC (par jour)
    ENCEINTE_AS108: 70,   // AS108 - Entrée de gamme pro
    ENCEINTE_AS115: 80,    // AS115 - Milieu de gamme équilibré
    ENCEINTE_FBT: 90,      // FBT X-Lite 115A - Premium fiable
    PROMIX8: 30,
    PROMIX16_UPGRADE: 40,
    CAISSON: 90,
    MIC_FIL: 10,
    MIC_SANSFIL: 10,
    
    // Services (TTC)
    INSTALLATION: 80,
    
    // Transport A/R TTC
    LIVRAISON_PARIS: 80,
    LIVRAISON_PC: 120,
    LIVRAISON_GC: 156,
    LIVRAISON_RETRAIT: 0,
    
    // Urgence
    URGENCE_MAJORATION: 0.20, // +20% si <2h
  };

  // Calcul du prix de base (matériel)
  let total = 0;
  
  // Enceintes (on utilise FBT par défaut pour les recommandations)
  total += input.nbSpeakers * PRICING.ENCEINTE_FBT;
  
  // Caissons
  total += input.nbSubs * PRICING.CAISSON;
  
  // Console
  if (input.mixer === 'PROMIX8') total += PRICING.PROMIX8;
  if (input.mixer === 'PROMIX16') total += PRICING.PROMIX8 + PRICING.PROMIX16_UPGRADE;
  
  // Micros
  total += input.micsFilaire * PRICING.MIC_FIL;
  total += input.micsSansFil * PRICING.MIC_SANSFIL;
  
  // Installation
  if (input.withInstallation) total += PRICING.INSTALLATION;

  // Frais de transport selon la zone
  const transportFees = {
    PARIS: PRICING.LIVRAISON_PARIS,
    PETITE_COURONNE: PRICING.LIVRAISON_PC,
    GRANDE_COURONNE: PRICING.LIVRAISON_GC,
    RETRAIT: PRICING.LIVRAISON_RETRAIT,
  };
  
  total += transportFees[input.zone];

  // Vérification urgence (< 48h selon le générateur)
  const isUrgent = input.dateISO ? isUrgentDate(input.dateISO) : false;
  if (isUrgent) {
    total *= (1 + PRICING.URGENCE_MAJORATION); // +20% pour urgence
  }

  // Génération du breakdown détaillé
  let breakdown = '';
  if (input.nbSpeakers > 0) breakdown += `${input.nbSpeakers}× enceintes FBT: ${input.nbSpeakers * PRICING.ENCEINTE_FBT}€\n`;
  if (input.nbSubs > 0) breakdown += `${input.nbSubs}× caissons: ${input.nbSubs * PRICING.CAISSON}€\n`;
  if (input.mixer === 'PROMIX8') breakdown += `Console Promix 8: ${PRICING.PROMIX8}€\n`;
  if (input.mixer === 'PROMIX16') breakdown += `Console Promix 16: ${PRICING.PROMIX8 + PRICING.PROMIX16_UPGRADE}€\n`;
  if (input.micsFilaire > 0) breakdown += `${input.micsFilaire}× micros filaires: ${input.micsFilaire * PRICING.MIC_FIL}€\n`;
  if (input.micsSansFil > 0) breakdown += `${input.micsSansFil}× micros sans fil: ${input.micsSansFil * PRICING.MIC_SANSFIL}€\n`;
  if (input.withInstallation) breakdown += `Installation: ${PRICING.INSTALLATION}€\n`;
  if (transportFees[input.zone] > 0) breakdown += `Transport: ${transportFees[input.zone]}€\n`;
  if (isUrgent) breakdown += `Urgence (+20%): ${Math.round(total * PRICING.URGENCE_MAJORATION)}€\n`;
  
  breakdown += `\nTotal TTC: ${Math.round(total)}€`;

  return {
    totalTTC: Math.round(total).toString(),
    breakdown,
    isUrgent,
  };
}

function isUrgentDate(dateISO: string): boolean {
  const eventDate = new Date(dateISO);
  const now = new Date();
  
  // Vérifier le jour de la semaine (0 = dimanche, 6 = samedi)
  const dayOfWeek = eventDate.getDay();
  
  // Condition 1: Dimanche (toute la journée) → majoration
  if (dayOfWeek === 0) {
    return true;
  }
  
  // Condition 2: Samedi à partir de 15h → majoration
  if (dayOfWeek === 6) {
    const eventHour = eventDate.getHours();
    if (eventHour >= 15) {
      return true;
    }
  }
  
  // Condition 3: Événement dans moins de 2 heures
  const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (diffHours > 0 && diffHours <= 2) {
    return true;
  }
  
  return false;
}
