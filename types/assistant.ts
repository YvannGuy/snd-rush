// Types stricts pour l'assistant SoundRush Paris

export interface Answers {
  eventType?: 'mariage' | 'anniversaire' | 'association' | 'corporate' | 'eglise' | 'soiree' | 'autre';
  guests?: '0-50' | '50-100' | '100-200' | '200+';
  address?: string; // adresse ou code postal pour détection zone
  zone?: 'paris' | 'petite' | 'grande' | 'retrait';
  deliveryAR?: number; // 0, 80, 120, 156
  environment?: 'interieur' | 'exterieur';
  needs?: string[]; // ['son', 'lumiere', 'micros', 'dj']
  extras?: string[]; // ['promix16', 'lumiere_basique', 'technicien']
  noExtras?: boolean;
  startDate?: string; // format YYYY-MM-DD
  endDate?: string; // format YYYY-MM-DD
  startTime?: string; // format HH:MM
  endTime?: string; // format HH:MM
  micros?: 'none' | 'one' | 'multiple' | string[]; // Quantité de micros ou tableau de micros sélectionnés
  morePower?: boolean | string[]; // Puissance renforcée (enceintes/caissons supplémentaires) ou tableau d'options
  deliveryOptions?: string[]; // Options de livraison : ['livraison', 'installation', 'retrait'] - au moins un requis
}

export interface Pack {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  features: string[];
  capacity: {
    min: number;
    max: number;
  };
  isALaCarte?: boolean;
  priceId?: string; // Stripe price ID
}

export interface Pricing {
  packs: {
    essentiel: Pack;
    standard: Pack;
    premium: Pack;
    prestige: Pack;
  };
  aLaCarte: {
    enceinte: number;
    promix8: number;
    caisson: number;
  };
  delivery: {
    paris: number;
    petite_couronne: number;
    grande_couronne: number;
    retrait: number;
  };
  extras: {
    promix16: number;
    lumiere_basique: number;
    technicien: number;
    micros_filaire: number;
    micros_sans_fil: number;
  };
  urgencyMultiplier: number; // 1.2 = +20%
}

export interface Recommendation {
  pack: Pack;
  confidence: number;
  reasons: string[];
  totalPrice: number;
  breakdown: {
    base: number;
    delivery: number;
    extras: number;
    urgency: number;
  };
  compositionFinale?: string[];
  customConfig?: Array<{
    id: string;
    label: string;
    price: number;
    qty: number;
  }>;
  warnings?: string[]; // Avertissements sur le stock ou la disponibilité
}

export interface ReservationPayload {
  bookingType: 'info' | 'deposit';
  packName: string;
  packId: string;
  priceId?: string;
  basePrice: number;
  deliveryPrice: number;
  extrasPrice: number;
  urgencyPrice: number;
  totalPrice: number;
  depositAmount?: number; // 30% du total si bookingType === 'deposit'
  answers: Answers;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  eventDetails: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    postalCode: string;
    address?: string;
    specialRequests?: string;
  };
  cgvAccepted: boolean;
}

export interface Step {
  id: string;
  title: string;
  subtitle?: string;
  type: 'single' | 'multiple' | 'date' | 'text';
  options?: Array<{
    value: string;
    label: string;
    icon?: string;
    price?: number;
    allowMultiple?: boolean;
  }>;
  required: boolean;
  validation?: (value: any, allAnswers?: any) => boolean;
}

export interface UIState {
  currentStep: number;
  isOpen: boolean;
  showSummary: boolean;
  errors: Record<string, string>;
  isLoading: boolean;
}

// Constantes pour les IDs des packs (interne uniquement)
export const PACK_IDS = {
  essentiel: { id: 'pack_essentiel', priceId: 'price_essentiel' },
  standard: { id: 'pack_standard', priceId: 'price_standard' },
  premium: { id: 'pack_premium', priceId: 'price_premium' },
  prestige: { id: 'pack_prestige', priceId: 'price_prestige' },
} as const;

// Configuration des prix
export const PRICING_CONFIG: Pricing = {
  packs: {
    petit: {
      id: PACK_IDS.essentiel.id,
      name: 'Pack S Petit',
      description: 'Pack S parfait pour les petits événements jusqu\'à 70 personnes, avec 1 enceinte Mac Mah AS 115 et console de mixage.',
      basePrice: 109,
      features: ['1 enceinte Mac Mah AS 115', '1 console de mixage'],
      capacity: { min: 30, max: 70 },
      priceId: PACK_IDS.essentiel.priceId,
    },
    confort: {
      id: PACK_IDS.standard.id,
      name: 'Pack M Confort',
      description: 'Pack M pour événements moyens jusqu\'à 150 personnes, avec 2 enceintes Mac Mah AS 115 et console HPA Promix 8.',
      basePrice: 129,
      features: ['2 enceintes Mac Mah AS 115', '1 console HPA Promix 8'],
      capacity: { min: 70, max: 150 },
      priceId: PACK_IDS.standard.priceId,
    },
    grand: {
      id: PACK_IDS.premium.id,
      name: 'Pack L Grand',
      description: 'Pack L idéal pour événements jusqu\'à 250 personnes, avec 2 enceintes FBT X-Lite 115A, 1 caisson X-Sub 118SA et console HPA Promix 16.',
      basePrice: 179,
      features: ['2 enceintes FBT X-Lite 115A', '1 caisson X-Sub 118SA', '1 console HPA Promix 16'],
      capacity: { min: 150, max: 250 },
      priceId: PACK_IDS.premium.priceId,
    },
    maxi: {
      id: PACK_IDS.prestige.id,
      name: 'Pack XL Maxi / Sur mesure',
      description: 'Solution sur mesure pour très grands événements',
      basePrice: null,
      features: ['Sonorisation pro', 'Micros HF & instruments', 'Technicien & régie', 'Logistique complète'],
      capacity: { min: 300, max: 1000 },
      priceId: PACK_IDS.prestige.priceId,
    },
  },
  aLaCarte: {
    enceinte: 70,
    promix8: 30,
    caisson: 90,
  },
  delivery: {
    paris: 80,
    petite_couronne: 120,
    grande_couronne: 160,
    retrait: 0,
  },
  extras: {
    promix16: 70,
    lumiere_basique: 80,
    technicien: 150,
    micros_filaire: 10,
    micros_sans_fil: 20,
  },
  urgencyMultiplier: 1.2,
};

// Configuration des étapes selon la méthode de conseil PRO
export const STEPS: Step[] = [
  {
    id: 'eventType',
    title: '🎧 Bonjour et bienvenue chez SoundRush Paris',
    subtitle: 'Je vous aide à choisir la sonorisation idéale pour votre événement, même si vous n\'êtes pas du tout expert.\n\n👉 Quel type d\'événement organisez-vous ?',
    type: 'single',
    options: [
      { value: 'mariage', label: 'Mariage', icon: '💒' },
      { value: 'anniversaire', label: 'Anniversaire', icon: '🎂' },
      { value: 'association', label: 'Association', icon: '👥' },
      { value: 'corporate', label: 'Corporate', icon: '🏢' },
      { value: 'eglise', label: 'Église', icon: '⛪' },
      { value: 'soiree', label: 'Soirée', icon: '🌙' },
      { value: 'autre', label: 'Autre', icon: '🎉' },
    ],
    required: true,
  },
  {
    id: 'guests',
    title: 'Super 👍',
    subtitle: 'Combien de personnes environ seront présentes ?',
    type: 'single',
    options: [
      { value: '0-50', label: '0-50 personnes', icon: '👥' },
      { value: '50-100', label: '50-100 personnes', icon: '👥👥' },
      { value: '100-200', label: '100-200 personnes', icon: '👥👥👥' },
      { value: '200+', label: '200+ personnes', icon: '👥👥👥👥' },
    ],
    required: true,
  },
  {
    id: 'environment',
    title: 'Très bien.',
    subtitle: 'L\'événement aura lieu en intérieur ou en extérieur ?',
    type: 'single',
    options: [
      { value: 'interieur', label: 'En intérieur', icon: '🏠' },
      { value: 'exterieur', label: 'En extérieur', icon: '🌳' },
    ],
    required: true,
  },
  {
    id: 'startDate',
    title: 'Pour bien organiser votre location, pouvez-vous me préciser la date de début de location ?',
    subtitle: 'Date de début de la location du matériel.',
    type: 'date',
    required: true,
    validation: (value: string) => {
      const date = new Date(value);
      const today = new Date();
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return dateOnly >= todayOnly;
    },
  },
  {
    id: 'endDate',
    title: 'Quelle est la date de fin de location ?',
    subtitle: 'Date de fin de la location du matériel (peut être la même que la date de début).',
    type: 'date',
    required: true,
    validation: (value: string, allAnswers?: any) => {
      if (!value) return false;
      const endDate = new Date(value);
      const startDate = allAnswers?.startDate ? new Date(allAnswers.startDate) : new Date();
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      return endDateOnly >= startDateOnly;
    },
  },
  {
    id: 'startTime',
    title: 'Merci 🙏',
    subtitle: 'À quelle heure commence l\'événement ?',
    type: 'time',
    required: false,
  },
  {
    id: 'endTime',
    title: '',
    subtitle: 'Heure de fin estimée',
    type: 'time',
    required: false,
  },
  {
    id: 'micros',
    title: 'Y aura-t-il des discours ou annonces pendant l\'événement ?',
    subtitle: 'Sélectionnez les micros dont vous avez besoin. Nous recommandons au moins 1 micro pour les mariages, églises et événements corporate.',
    type: 'multiple', // Changé en 'multiple' pour permettre l'affichage des cartes
    options: [], // Les options seront chargées dynamiquement depuis Supabase
    required: true, // Obligatoire
  },
  {
    id: 'morePower',
    title: 'Pour ce type d\'événement, souhaitez-vous un rendu plus puissant, avec plus de volume et de basses, surtout pour l\'ambiance dansante ?',
    subtitle: '👉 Pour éviter toute frustration sur le volume ou les basses, voici ce que nous recommandons :',
    type: 'multiple', // Changé en 'multiple' pour permettre l'affichage des cartes
    options: [], // Les options seront chargées dynamiquement depuis Supabase
    required: true, // Obligatoire
  },
  {
    id: 'deliveryOptions',
    title: 'Pour plus de confort le jour J, souhaitez-vous la livraison et l\'installation du matériel ?',
    subtitle: 'Sélectionnez au moins une option',
    type: 'multiple',
    options: [
      { value: 'livraison', label: 'Livraison', icon: '🚚' },
      { value: 'installation', label: 'Installation', icon: '🔧' },
      { value: 'retrait', label: 'Retrait sur place', icon: '🚗' },
    ],
    required: true, // Obligatoire - au moins un choix requis
  },
  {
    id: 'zone',
    title: 'Zone de livraison',
    subtitle: 'Sélectionnez votre zone pour calculer les frais de livraison A/R.',
    type: 'single',
    options: [
      { value: 'paris', label: 'Paris (75)', icon: '🏙️', price: 80 },
      { value: 'petite', label: 'Petite couronne (92, 93, 94)', icon: '🏘️', price: 120 },
      { value: 'grande', label: 'Grande couronne (77, 78, 91, 95)', icon: '🌆', price: 156 },
      { value: 'retrait', label: 'Retrait sur place', icon: '🚗', price: 0 },
    ],
    required: false, // Devient optionnel si deliveryInstallation = 'no'
  },
];
