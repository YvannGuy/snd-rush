export type HomeLocale = 'fr' | 'en' | 'it' | 'es' | 'zh';

export const HOME_LANGUAGE_OPTIONS: Array<{
  key: HomeLocale;
  label: string;
  short: string;
}> = [
  { key: 'fr', label: 'Français', short: 'FRA' },
  { key: 'en', label: 'English', short: 'ENG' },
  { key: 'it', label: 'Italiano', short: 'ITA' },
  { key: 'es', label: 'Español', short: 'ESP' },
  { key: 'zh', label: 'Mandarin', short: '中文' },
];

/** Contenu affiché : IT/ES/ZH réutilisent l’anglais (comme le header principal). */
export function resolveHomeContentLocale(locale: HomeLocale): 'fr' | 'en' {
  return locale === 'fr' ? 'fr' : 'en';
}

export type HomeCopy = {
  header: {
    expertises: string;
    realisations: string;
    methodologie: string;
    contact: string;
    cta: string;
  };
  hero: {
    kicker: string;
    titleLine1: string;
    titleLine2: string;
    body: string;
    cta: string;
    note: string;
  };
  expertiseStrip: string;
  polePrefix: string;
  services: Array<{ title: string; description: string }>;
  eventScale: {
    titleLine1: string;
    titleLine2: string;
    titleLine3: string;
    body: string;
    cap1: string;
    cap2: string;
    imgAlt1: string;
    imgAlt2: string;
  };
  stats: Array<{ label: string }>;
  clients: { sectionLabel: string };
  portfolio: { title: string; viewProject: string };
  methodology: {
    title: string;
    steps: Array<{ title: string; description: string }>;
  };
  finalCta: {
    line1: string;
    line2: string;
    line3: string;
    button: string;
  };
  footer: {
    mentions: string;
    confidentialite: string;
    intranet: string;
    copyright: string;
  };
  projectsIndex: {
    title: string;
    intro: string;
    viewProject: string;
    back: string;
  };
  projectDetail: { back: string };
};

const SERVICES_IMAGES = [
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1571266028243-5c385f0f66fd?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=80',
] as const;

export function getServicesWithImages(
  copy: HomeCopy
): Array<{ label: string; title: string; description: string; image: string }> {
  return copy.services.map((s, i) => ({
    label: String(i + 1).padStart(2, '0'),
    title: s.title,
    description: s.description,
    image: SERVICES_IMAGES[i],
  }));
}

const FR: HomeCopy = {
  header: {
    expertises: 'Expertises',
    realisations: 'Réalisations',
    methodologie: 'Méthodologie',
    contact: 'Contact',
    cta: 'Lancer votre projet',
  },
  hero: {
    kicker: 'Production scénique premium · Paris',
    titleLine1: 'Maîtrise technique',
    titleLine2: 'À grande échelle',
    body: 'Son, lumière, vidéo et régie réunis dans une direction technique unique pour des expériences événementielles impeccables.',
    cta: 'Démarrer votre projet',
    note: 'Opérations France & Europe',
  },
  expertiseStrip: 'Technique • Son • Lumière • Led • Vidéo • Régie',
  polePrefix: 'Pôle',
  services: [
    {
      title: 'Excellence Audio',
      description:
        'Systèmes calibrés avec précision pour une restitution puissante et maîtrisée.',
    },
    {
      title: 'Impact Visuel',
      description: 'Mise en scène vidéo et LED à fort impact, lisible à toute échelle.',
    },
    {
      title: 'Design Lumière',
      description: 'Ambiances sculptées et dynamiques lumineuses pensées pour l’émotion.',
    },
    {
      title: 'Régie Technique',
      description: 'Pilotage centralisé, coordination terrain et sécurisation complète.',
    },
  ],
  eventScale: {
    titleLine1: 'De l’élégance',
    titleLine2: 'Intime',
    titleLine3: 'À l’impact massif',
    body: 'Qu’il s’agisse d’un écrin confidentiel ou d’un format monumental, chaque production est conçue avec la même exigence : fluidité, précision, et signature visuelle forte.',
    cap1: 'Écrins de luxe',
    cap2: 'Stades & festivals',
    imgAlt1: 'Écrins de luxe',
    imgAlt2: 'Stades et festivals',
  },
  stats: [{ label: 'Ans d’expertise' }, { label: 'Événements réalisés' }, { label: 'Temps d’arrêt' }],
  clients: { sectionLabel: 'Références' },
  portfolio: { title: 'Projets', viewProject: 'Voir le projet' },
  methodology: {
    title: 'Méthodologie',
    steps: [
      {
        title: 'Audit',
        description:
          'Analyse des contraintes techniques, du lieu et des objectifs de rendu.',
      },
      {
        title: 'Déploiement',
        description:
          'Installation, réglages et répétitions avec supervision de production.',
      },
      {
        title: 'Commande',
        description:
          'Pilotage opérationnel le jour J, coordination et qualité de diffusion.',
      },
    ],
  },
  finalCta: {
    line1: 'Prêt à',
    line2: 'Commander la',
    line3: 'scène ?',
    button: 'Construisons votre événement',
  },
  footer: {
    mentions: 'Mentions',
    confidentialite: 'Confidentialité',
    intranet: 'Intranet',
    copyright: '© 2026 Sndrush Paris',
  },
  projectsIndex: {
    title: 'Projets',
    intro: 'Un aperçu de nos interventions : sélectionnez un projet pour le détail et la galerie.',
    viewProject: 'Voir le projet',
    back: '← Réalisations',
  },
  projectDetail: { back: '← Réalisations' },
};

const EN: HomeCopy = {
  header: {
    expertises: 'Expertise',
    realisations: 'Projects',
    methodologie: 'Method',
    contact: 'Contact',
    cta: 'Start your project',
  },
  hero: {
    kicker: 'Premium stage production · Paris',
    titleLine1: 'Technical mastery',
    titleLine2: 'At scale',
    body: 'Sound, lighting, video and show control under one technical direction for flawless live experiences.',
    cta: 'Start your project',
    note: 'Operations France & Europe',
  },
  expertiseStrip: 'Technical · Sound · Light · LED · Video · Control',
  polePrefix: 'Unit',
  services: [
    {
      title: 'Audio excellence',
      description: 'Precisely tuned systems for powerful, controlled reproduction.',
    },
    {
      title: 'Visual impact',
      description: 'Video and LED staging with strong impact, readable at any scale.',
    },
    {
      title: 'Light design',
      description: 'Sculpted atmospheres and dynamic lighting built for emotion.',
    },
    {
      title: 'Technical direction',
      description: 'Centralised control, field coordination and full risk coverage.',
    },
  ],
  eventScale: {
    titleLine1: 'From intimate',
    titleLine2: 'Elegance',
    titleLine3: 'To massive impact',
    body: 'Whether a private setting or a monumental format, every production meets the same bar: flow, precision, and a strong visual signature.',
    cap1: 'Luxury venues',
    cap2: 'Stadiums & festivals',
    imgAlt1: 'Luxury venues',
    imgAlt2: 'Stadiums and festivals',
  },
  stats: [{ label: 'Years of experience' }, { label: 'Events delivered' }, { label: 'Downtime' }],
  clients: { sectionLabel: 'References' },
  portfolio: { title: 'Projects', viewProject: 'View project' },
  methodology: {
    title: 'Methodology',
    steps: [
      {
        title: 'Audit',
        description: 'Technical constraints, venue and production goals analysed end to end.',
      },
      {
        title: 'Deployment',
        description: 'Install, tuning and rehearsals with full production supervision.',
      },
      {
        title: 'Show call',
        description: 'Live-day control, coordination and broadcast quality.',
      },
    ],
  },
  finalCta: {
    line1: 'Ready to',
    line2: 'Own the',
    line3: 'stage?',
    button: 'Let’s build your event',
  },
  footer: {
    mentions: 'Legal notice',
    confidentialite: 'Privacy',
    intranet: 'Intranet',
    copyright: '© 2026 Sndrush Paris',
  },
  projectsIndex: {
    title: 'Projects',
    intro: 'A selection of our work — open a project for details and the full gallery.',
    viewProject: 'View project',
    back: '← Work',
  },
  projectDetail: { back: '← Work' },
};

const COPIES: Record<'fr' | 'en', HomeCopy> = { fr: FR, en: EN };

export function getHomeCopy(locale: HomeLocale): HomeCopy {
  return COPIES[resolveHomeContentLocale(locale)];
}
