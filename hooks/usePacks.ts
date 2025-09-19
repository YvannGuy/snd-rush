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

// Packs par défaut
const DEFAULT_PACKS: Pack[] = [
  {
    name: 'Pack STANDARD',
    priceText: '139€',
    priceValue: 139,
    description: 'Solution complète avec micro sans fil pour une sonorisation professionnelle.',
    features: ['2 enceintes', 'Console de mixage', 'Micro, technicien et livraison en option', 'Pieds + câbles inclus'],
    ideal: 'Idéal jusqu\'à 100 personnes',
    caution: '1000€',
    capacity: 'small'
  },
  {
    name: 'Pack PREMIUM',
    priceText: '169€',
    priceValue: 169,
    description: 'Système professionnel complet avec installation incluse pour une expérience premium.',
    features: ['2 enceintes + 1 caisson de basse', 'Console de mixage', 'Micro, technicien et installation en option', 'Pieds et câbles inclus'],
    ideal: 'Idéal jusqu\'à 200 personnes',
    caution: '1500€',
    capacity: 'medium'
  },
  {
    name: 'Pack PRESTIGE',
    priceText: '319€',
    priceValue: 319,
    description: 'Configuration maximale pour des événements nécessitant une puissance sonore exceptionnelle.',
    features: ['4 enceintes actives 15" avec trépieds', '1 mixeur professionnel', '1 caisson de basse', 'Câblage complet', 'Installation & technicien inclus'],
    ideal: 'Idéal jusqu\'à 500 personnes',
    caution: '2200€',
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

