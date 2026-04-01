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
    /** Si défini, affiché en orange après `titleLine1` (ex. « votre événement »). */
    titleLine1Accent?: string;
    titleLine2: string;
    body: string;
    cta: string;
    note: string;
  };
  expertiseStrip: string;
  servicesTitle: string;
  services: Array<{ title: string; description: string }>;
  eventScale: {
    titleLine1: string;
    titleLine2: string;
    titleLine3: string;
    body: string;
    bodyClosing: string;
    cap1: string;
    cap1Detail: string;
    cap2: string;
    cap2Detail: string;
    imgAlt1: string;
    imgAlt2: string;
  };
  stats: Array<{ figure?: string; label: string }>;
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
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=80',
] as const;

export function getServicesWithImages(
  copy: HomeCopy
): Array<{ label: string; title: string; description: string; image: string }> {
  return copy.services.map((s, i) => ({
    label: `${String(i + 1).padStart(2, '0')} — ${s.title}`,
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
    cta: 'Demander un devis',
  },
  hero: {
    kicker: 'Sndrush Paris · Son, lumière, audiovisuel, photo, vidéo et régie',
    titleLine1: 'Nous orchestrons',
    titleLine1Accent: 'votre événement',
    titleLine2: 'de A à Z',
    body:
      'Concert, conférence, mariage, événement d’entreprise ou grand rassemblement : Sndrush prend en charge le son, la lumière, les écrans LED, l’audiovisuel, la photo, la vidéo et la régie pour un rendu professionnel, fluide et fiable.',
    cta: 'Demander un devis',
    note: 'Paris · Île-de-France · France · Europe selon projet',
  },
  expertiseStrip: 'Son • Lumière • Écrans LED • Audiovisuel • Photo • Vidéo • Régie',
  servicesTitle: 'Nos services',
  services: [
    {
      title: 'Sonorisation',
      description:
        'Nous mettons en place le système son adapté à votre événement, du petit format aux grandes jauges.',
    },
    {
      title: 'Éclairage',
      description: 'Nous créons l’ambiance lumineuse adaptée à votre lieu, votre scène et votre public.',
    },
    {
      title: 'Écrans LED & audiovisuel',
      description:
        'Nous installons vos écrans LED et vos solutions audiovisuelles pour diffuser vos contenus avec clarté et impact.',
    },
    {
      title: 'Photo & vidéo',
      description:
        'Nous réalisons la couverture photo et vidéo de votre événement pour capturer chaque moment important et produire des contenus de qualité.',
    },
    {
      title: 'Régie technique',
      description:
        'Nous coordonnons l’ensemble du dispositif avant et pendant l’événement pour assurer un déroulement fluide.',
    },
  ],
  eventScale: {
    titleLine1: 'Des formats intimistes aux',
    titleLine2: 'productions de grande ampleur',
    titleLine3: '',
    body:
      'Nous accompagnons aussi bien les événements élégants en petit comité que les dispositifs techniques de grande ampleur.',
    bodyClosing:
      'Notre objectif reste le même : une installation fiable, un rendu propre et une exécution sans stress.',
    cap1: 'Événements soignés et formats sur mesure',
    cap1Detail:
      'Son, lumière, audiovisuel, photo, écrans LED et régie pour des événements qui demandent précision, fluidité et qualité d’exécution.',
    cap2: 'Productions de grande ampleur',
    cap2Detail:
      'Des dispositifs adaptés aux événements à forte jauge, aux lieux exigeants et aux organisations plus complexes.',
    imgAlt1: 'Console de mixage en régie, groupe sur scène en arrière-plan',
    imgAlt2: 'Production événementielle de grande ampleur',
  },
  stats: [
    { figure: '3+', label: 'ans d’expérience' },
    { figure: '50+', label: 'événements accompagnés' },
    { figure: '10 000+', label: 'Capacité sur grands événements' },
  ],
  clients: { sectionLabel: 'Ils nous ont fait confiance' },
  portfolio: { title: 'Nos réalisations', viewProject: 'Voir le projet' },
  methodology: {
    title: 'Comment nous travaillons',
    steps: [
      {
        title: 'Analyse du besoin',
        description:
          'Nous échangeons sur votre événement, votre lieu, vos contraintes et le rendu attendu.',
      },
      {
        title: 'Préparation technique',
        description:
          'Nous définissons le matériel, l’installation et l’organisation les plus adaptés.',
      },
      {
        title: 'Installation & exploitation',
        description:
          'Nous installons le dispositif, faisons les réglages et assurons le bon déroulement le jour J.',
      },
    ],
  },
  finalCta: {
    line1: 'Parlons de',
    line2: 'votre',
    line3: 'événement',
    button: 'Demander un devis',
  },
  footer: {
    mentions: 'Mentions',
    confidentialite: 'Confidentialité',
    intranet: 'Intranet',
    copyright: '© 2026 Sndrush Paris',
  },
  projectsIndex: {
    title: 'Nos réalisations',
    intro: 'Quelques exemples d’interventions — ouvrez une fiche pour la galerie.',
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
    cta: 'Request a quote',
  },
  hero: {
    kicker: 'Sndrush Paris · Sound, lighting, AV, photo, video and show control',
    titleLine1: 'We orchestrate',
    titleLine1Accent: 'your event',
    titleLine2: 'from A to Z',
    body:
      'Concerts, conferences, weddings, corporate events or large gatherings: Sndrush handles sound, lighting, LED screens, AV, photography, video and show control for a professional, smooth and reliable result.',
    cta: 'Request a quote',
    note: 'Paris · Île-de-France · France · Europe as needed',
  },
  expertiseStrip: 'Sound · Lighting · LED screens · AV · Photo · Video · Show control',
  servicesTitle: 'Our services',
  services: [
    {
      title: 'Sound',
      description:
        'We deploy the sound system suited to your event, from intimate formats to large crowds.',
    },
    {
      title: 'Lighting',
      description: 'We shape the lighting to fit your venue, stage and audience.',
    },
    {
      title: 'LED screens & AV',
      description:
        'We install your LED screens and AV solutions to show your content clearly and with impact.',
    },
    {
      title: 'Photo & video',
      description:
        'We cover your event in photo and video to capture key moments and deliver high-quality content.',
    },
    {
      title: 'Show control',
      description:
        'We coordinate the full setup before and during the event to keep everything running smoothly.',
    },
  ],
  eventScale: {
    titleLine1: 'From intimate formats to',
    titleLine2: 'large-scale productions',
    titleLine3: '',
    body:
      'We support both elegant small gatherings and large-scale technical productions.',
    bodyClosing:
      'Our goal stays the same: a reliable setup, polished results, and a stress-free experience.',
    cap1: 'Polished events and bespoke formats',
    cap1Detail:
      'Sound, lighting, AV, photography, LED screens and show control for events that demand precision, flow and flawless execution.',
    cap2: 'Large-scale productions',
    cap2Detail:
      'Setups suited to high-capacity events, demanding venues and more complex operations.',
    imgAlt1: 'Mixing console at FOH, live band on stage in the background',
    imgAlt2: 'Large-scale event production',
  },
  stats: [
    { figure: '3+', label: 'years of experience' },
    { figure: '50+', label: 'events supported' },
    { figure: '10,000+', label: 'Capacity for large-scale events' },
  ],
  clients: { sectionLabel: 'Trusted by clients and partners' },
  portfolio: { title: 'Our work', viewProject: 'View project' },
  methodology: {
    title: 'How we work',
    steps: [
      {
        title: 'Needs analysis',
        description:
          'We discuss your event, venue, constraints and the experience you want to deliver.',
      },
      {
        title: 'Technical preparation',
        description:
          'We define the equipment, setup and workflow that best fit your project.',
      },
      {
        title: 'Installation & show day',
        description:
          'We install and tune the system, then keep everything running smoothly on the day.',
      },
    ],
  },
  finalCta: {
    line1: 'Let’s discuss',
    line2: 'your',
    line3: 'event',
    button: 'Request a quote',
  },
  footer: {
    mentions: 'Legal notice',
    confidentialite: 'Privacy',
    intranet: 'Intranet',
    copyright: '© 2026 Sndrush Paris',
  },
  projectsIndex: {
    title: 'Our work',
    intro: 'A few examples of our work — open a case for the full gallery.',
    viewProject: 'View project',
    back: '← Work',
  },
  projectDetail: { back: '← Work' },
};

const COPIES: Record<'fr' | 'en', HomeCopy> = { fr: FR, en: EN };

export function getHomeCopy(locale: HomeLocale): HomeCopy {
  return COPIES[resolveHomeContentLocale(locale)];
}
