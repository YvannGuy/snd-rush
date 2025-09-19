import { useMemo } from 'react';
import { Pack } from './usePacks';

export interface PackMatch {
  pack: Pack;
  confidence: number;
  reasons: string[];
  options: Pack[];
}

export const useRecommendation = (answers: Record<string, string>, packs: Pack[]): PackMatch | null => {
  return useMemo(() => {
    if (!answers.guests) return null;

    const { guests, usage, environment } = answers;
    
    // Score basé sur le nombre d'invités
    let capacityScore = { small: 0, medium: 0, large: 0 };
    
    switch(guests) {
      case '0-50':
        capacityScore = { small: 0.9, medium: 0.3, large: 0.1 };
        break;
      case '50-100':
        capacityScore = { small: 0.8, medium: 0.4, large: 0.1 };
        break;
      case '100-200':
        capacityScore = { small: 0.3, medium: 0.9, large: 0.4 };
        break;
      case '200+':
        capacityScore = { small: 0.1, medium: 0.2, large: 0.95 };
        break;
    }

    // Bonus pour usage intensif
    const usageBonus = {
      discours: { small: 0.1, medium: 0, large: 0 },
      ambiance: { small: 0.1, medium: 0, large: 0 },
      soiree: { small: -0.2, medium: 0.2, large: 0.1 },
      live: { small: -0.3, medium: 0.1, large: 0.3 }
    };

    // Bonus pour extérieur
    const environmentBonus = environment === 'exterieur' ? 
      { small: -0.2, medium: 0.1, large: 0.2 } : 
      { small: 0, medium: 0, large: 0 };

    // Calcul du score final
    const scores = packs.map(pack => {
      const baseScore = capacityScore[pack.capacity] || 0;
      const usageModifier = usageBonus[usage as keyof typeof usageBonus]?.[pack.capacity] || 0;
      const envModifier = environmentBonus[pack.capacity] || 0;
      
      return {
        pack,
        score: Math.max(0, Math.min(1, baseScore + usageModifier + envModifier))
      };
    });

    // Tri par score décroissant
    scores.sort((a, b) => b.score - a.score);
    
    const recommended = scores[0];
    const reasons = [];
    
    if (recommended.score > 0.7) {
      reasons.push(`Parfaitement adapté pour ${guests} personnes`);
    } else if (recommended.score > 0.5) {
      reasons.push(`Bien adapté pour votre événement`);
    } else {
      reasons.push(`Recommandation basée sur vos critères`);
    }

    if (usage === 'soiree' || usage === 'live') {
      reasons.push('Puissance adaptée pour la musique');
    }
    
    if (environment === 'exterieur') {
      reasons.push('Configuration robuste pour extérieur');
    }

    return {
      pack: recommended.pack,
      confidence: recommended.score,
      reasons,
      options: scores.slice(1, 3).map(s => s.pack)
    };
  }, [answers, packs]);
};

