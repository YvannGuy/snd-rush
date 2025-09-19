import { useState, useEffect } from 'react';

export interface Pack {
  name: string;
  priceText: string;
  priceValue: number;
  description: string;
  features: string[];
  ideal: string;
  caution: string;
  capacity: 'small' | 'medium' | 'large';
}

// Packs par défaut - Coordonnés avec les nouveaux packs clé en main
const DEFAULT_PACKS: Pack[] = [
  {
    name: 'Pack STANDARD',
    priceText: 'À partir de 550 € TTC',
    priceValue: 550,
    description: 'Sonorisation professionnelle complète avec installation et technicien inclus.',
    features: ['Sonorisation pour 150 pers', '1 micro filaire', 'Livraison & Reprise', 'Installation & réglages par technicien', 'Démontage après l\'événement'],
    ideal: 'Jusqu\'à 150 personnes',
    caution: '0€',
    capacity: 'small'
  },
  {
    name: 'Pack PREMIUM',
    priceText: 'À partir de 700 € TTC',
    priceValue: 700,
    description: 'Système professionnel complet avec assistance technique pendant l\'événement.',
    features: ['Sonorisation 250 pers', '2 micros filaires', 'Livraison & Reprise', 'Installation + assistance technicien', 'Démontage complet'],
    ideal: 'Jusqu\'à 250 personnes',
    caution: '0€',
    capacity: 'medium'
  },
  {
    name: 'Pack PRESTIGE',
    priceText: 'À partir de 1 100 € TTC',
    priceValue: 1100,
    description: 'Configuration maximale avec supervision technique pendant l\'événement.',
    features: ['Sonorisation pro 500 pers', '2 micros sans fil', 'Livraison & Reprise en camion', 'Installation complète + assistance technicien', 'Démontage & rangement'],
    ideal: 'Jusqu\'à 500 personnes',
    caution: '0€',
    capacity: 'large'
  }
];

export const usePacks = () => {
  const [packs, setPacks] = useState<Pack[]>(DEFAULT_PACKS);

  useEffect(() => {
    // Essayer de charger les packs depuis window.__SNDRUSH_PACKS__ si disponible
    if (typeof window !== 'undefined' && (window as any).__SNDRUSH_PACKS__) {
      setPacks((window as any).__SNDRUSH_PACKS__);
    }
  }, []);

  return packs;
};

