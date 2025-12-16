export interface Scenario {
  id: string;
  title: string;
  preview: string;
  prefillMessage: string;
  assistantPolicy: string;
  questions: string[];
  ctaPrimary: string;
  ctaSecondary: string;
}

export type ScenarioId = 
  | 'dj-lache'
  | 'evenement-2h'
  | 'materiel-choisir'
  | 'salle-compliquee'
  | 'micro-conference'
  | 'soiree-privee';
