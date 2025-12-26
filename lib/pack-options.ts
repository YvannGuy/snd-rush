// Options supplémentaires pour les packs (installation et récupération J+1)

/**
 * Prix de l'option installation selon le tier
 */
export function getInstallationPrice(tier: 'S' | 'M' | 'L'): number {
  // Installation incluse pour Pack S
  if (tier === 'S') return 0;
  // Option installation pour M et L
  if (tier === 'M') return 59;
  if (tier === 'L') return 89;
  return 0;
}

/**
 * Prix de l'option récupération J+1 selon la zone
 */
export function getPickupJPlus1Price(zone: 'paris' | 'petite' | 'grande' | null): number {
  if (!zone) return 0;
  
  const prices = {
    paris: 45,
    petite: 70,
    grande: 110,
  };
  
  return prices[zone] || 0;
}

/**
 * Libellé de l'option installation
 */
export function getInstallationLabel(tier: 'S' | 'M' | 'L', language: 'fr' | 'en'): string {
  if (tier === 'S') {
    return language === 'fr' 
      ? 'Installation incluse'
      : 'Installation included';
  }
  
  const price = getInstallationPrice(tier);
  return language === 'fr'
    ? `Installation & réglages (+${price}€)`
    : `Installation & setup (+${price}€)`;
}

/**
 * Libellé de l'option récupération J+1
 */
export function getPickupJPlus1Label(zone: 'paris' | 'petite' | 'grande' | null, language: 'fr' | 'en'): string {
  if (!zone) return '';
  
  const price = getPickupJPlus1Price(zone);
  return language === 'fr'
    ? `Récupération le lendemain (J+1) (+${price}€)`
    : `Pickup next day (J+1) (+${price}€)`;
}
