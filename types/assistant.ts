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

// Configuration des étapes
export const STEPS: Step[] = [
  {
    id: 'eventType',
    title: 'Quel type d\'événement organisez-vous ?',
    subtitle: 'Votre réponse nous aide à recommander le pack le plus adapté.',
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
    title: 'Combien d\'invités prévoyez-vous ?',
    subtitle: 'Plus le nombre d\'invités est élevé, plus il faut de puissance sonore.',
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
    required: true,
  },
  {
    id: 'environment',
    title: 'Votre événement se déroule-t-il ?',
    type: 'single',
    options: [
      { value: 'interieur', label: 'En intérieur', icon: '🏠' },
      { value: 'exterieur', label: 'En extérieur', icon: '🌳' },
    ],
    required: true,
  },
  {
    id: 'needs',
    title: 'Quels sont vos besoins ?',
    type: 'multiple',
    options: [
      { value: 'son', label: 'Son', icon: '🔊' },
      { value: 'lumiere', label: 'Lumière', icon: '💡' },
    ],
    required: true,
  },
  {
    id: 'extras',
    title: 'Options supplémentaires',
    type: 'multiple',
    options: [
      { value: 'micros_filaire', label: 'Micros filaires (+10 €)', icon: '🎤', price: 10, allowMultiple: true },
      { value: 'micros_sans_fil', label: 'Micros sans fil (+20 €)', icon: '🎤', price: 20, allowMultiple: true },
      { value: 'technicien', label: 'Technicien sur place (+150 €)', icon: '👨‍🔧', price: 150 },
    ],
    required: false,
  },
  {
    id: 'startDate',
    title: 'Quelle est la date de début de votre événement ?',
    subtitle: 'Date de début de la location du matériel.',
    type: 'date',
    required: true,
    validation: (value: string) => {
      const date = new Date(value);
      const today = new Date();
      // Comparer seulement les dates (sans l'heure) pour permettre la sélection d'aujourd'hui
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return dateOnly >= todayOnly;
    },
  },
  {
    id: 'endDate',
    title: 'Quelle est la date de fin de votre événement ?',
    subtitle: 'Date de fin de la location du matériel.',
    type: 'date',
    required: true,
    validation: (value: string, allAnswers?: any) => {
      if (!value) return false;
      const endDate = new Date(value);
      const startDate = allAnswers?.startDate ? new Date(allAnswers.startDate) : null;
      if (startDate) {
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        return endDateOnly >= startDateOnly;
      }
      const today = new Date();
      const dateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return dateOnly >= todayOnly;
    },
  },
  {
    id: 'startTime',
    title: 'À quelle heure commence votre événement ?',
    subtitle: 'Heure de début. Majoration d\'urgence +20% : événement dans moins de 2h, dimanche (toute la journée), ou samedi à partir de 15h.',
    type: 'text',
    required: false,
  },
  {
    id: 'endTime',
    title: 'À quelle heure se termine votre événement ?',
    subtitle: 'Heure de fin de l\'événement.',
    type: 'text',
    required: false,
  },
];
