import { CartItem } from '@/types/db';

/**
 * Calcule le prix d'installation recommandé selon le contenu du panier
 * @param cartItems - Les items du panier
 * @returns Le prix d'installation en euros, ou null si sur devis
 */
export function calculateInstallationPrice(cartItems: CartItem[]): number | null {
  if (cartItems.length === 0) {
    return null;
  }

  // Vérifier si le panier contient un pack
  const packItem = cartItems.find(item => item.productId.startsWith('pack-'));
  if (packItem) {
    // Extraire l'ID du pack (format: "pack-1", "pack-2", etc.)
    const packIdMatch = packItem.productId.match(/pack-(\d+)/);
    if (packIdMatch) {
      const packId = parseInt(packIdMatch[1]);
      switch (packId) {
        case 1: // Pack S Petit
          return 60;
        case 2: // Pack M Confort
          return 80;
        case 3: // Pack L Grand
          return 120;
        case 4: // Pack XL Maxi
          return null; // Sur devis
        default:
          return null;
      }
    }
  }

  // Analyser les produits individuels
  let speakerCount = 0;
  let consoleCount = 0;
  let subwooferCount = 0;
  let micCount = 0;
  let lightCount = 0;

  cartItems.forEach(item => {
    const nameLower = item.productName.toLowerCase();
    
    // Compter les enceintes
    if (nameLower.includes('enceinte') || nameLower.includes('as 115') || nameLower.includes('as 108') || nameLower.includes('fbt')) {
      speakerCount += item.quantity;
    }
    
    // Compter les consoles
    if (nameLower.includes('promix') || nameLower.includes('console') || nameLower.includes('hpa')) {
      consoleCount += item.quantity;
    }
    
    // Compter les caissons
    if (nameLower.includes('caisson') || nameLower.includes('subwoofer') || nameLower.includes('basse')) {
      subwooferCount += item.quantity;
    }
    
    // Compter les micros
    if (nameLower.includes('micro')) {
      micCount += item.quantity;
    }
    
    // Compter les lumières
    if (nameLower.includes('led') || nameLower.includes('lumière') || nameLower.includes('lyre') || nameLower.includes('barre')) {
      lightCount += item.quantity;
    }
  });

  // Calculer le prix selon la complexité
  // Configuration complexe : 2 enceintes + caisson + console
  if (speakerCount >= 2 && subwooferCount >= 1 && consoleCount >= 1) {
    return 120;
  }
  
  // Configuration moyenne : 2 enceintes + console
  if (speakerCount >= 2 && consoleCount >= 1) {
    return 80;
  }
  
  // Configuration simple : enceinte + console
  if (speakerCount >= 1 && consoleCount >= 1) {
    return 60;
  }
  
  // 2 enceintes seules
  if (speakerCount >= 2) {
    return 60;
  }
  
  // 1 enceinte seule
  if (speakerCount === 1) {
    return 40;
  }
  
  // Lumières (selon complexité)
  if (lightCount > 0) {
    if (lightCount >= 3) {
      return 60;
    } else if (lightCount >= 2) {
      return 50;
    } else {
      return 40;
    }
  }
  
  // Micros seuls
  if (micCount > 0 && speakerCount === 0 && consoleCount === 0) {
    return 30;
  }
  
  // Console seule
  if (consoleCount >= 1 && speakerCount === 0) {
    return 40;
  }
  
  // Par défaut, sur devis
  return null;
}







