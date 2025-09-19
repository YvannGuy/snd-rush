import { useState, useEffect, useCallback } from 'react';
import { PackMatch } from './useRecommendation';

const CONFIG = {
  storageKey: 'sndrush_reco_draft',
};

export const useAssistantPersistence = () => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendation, setRecommendation] = useState<PackMatch | null>(null);

  useEffect(() => {
    // Ne pas charger depuis localStorage au refresh
    // Les réponses se remettent à zéro à chaque actualisation
    setAnswers({});
    setRecommendation(null);
  }, []);

  const saveDraft = useCallback((newAnswers: Record<string, string>, newRecommendation?: PackMatch) => {
    // Ne plus sauvegarder dans localStorage
    // Les réponses ne persistent plus après actualisation
    // Cette fonction est gardée pour la compatibilité mais ne fait rien
  }, []);

  return { answers, setAnswers, recommendation, setRecommendation, saveDraft };
};
