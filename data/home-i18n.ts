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
export function resolveHomeContentLocale(locale: HomeLocale): 'fr' | 'en' | 'it' | 'es' | 'zh' {
  if (locale === 'fr' || locale === 'en' || locale === 'it' || locale === 'es' || locale === 'zh') {
    return locale;
  }
  return 'en';
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
    titleLine1: string;
    /** Si défini, affiché en orange après `titleLine1` (ex. « votre événement »). */
    titleLine1Accent?: string;
    titleLine2: string;
    body: string;
    cta: string;
    note: string;
    bgAlt: string;
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
    cgv: string;
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
    titleLine1: 'Nous\u00a0orchestrons',
    titleLine1Accent: 'votre événement',
    titleLine2: 'de A à Z',
    body:
      'Concert, conférence, mariage, événement d’entreprise ou grand rassemblement : Sndrush prend en charge le son, la lumière, les écrans LED, l’audiovisuel, la photo, la vidéo et la régie pour un rendu professionnel, fluide et fiable.',
    cta: 'Demander un devis',
    note: 'Paris · Île-de-France · France · Europe selon projet',
    bgAlt:
      'Équipe technique en régie : son, lumière et captation, concert live et public',
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
    titleLine1: 'Des formats intimistes',
    titleLine2: 'aux\u00a0productions de grande ampleur',
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
    { figure: '100+', label: 'événements accompagnés' },
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
    cgv: 'CGV',
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
    titleLine1: 'We\u00a0orchestrate',
    titleLine1Accent: 'your event',
    titleLine2: 'from A to Z',
    body:
      'Concerts, conferences, weddings, corporate events or large gatherings: Sndrush handles sound, lighting, LED screens, AV, photography, video and show control for a professional, smooth and reliable result.',
    cta: 'Request a quote',
    note: 'Paris · Île-de-France · France · Europe as needed',
    bgAlt:
      'Technical crew at show control: sound, lighting and capture, live concert and audience',
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
    titleLine1: 'From intimate formats',
    titleLine2: 'to\u00a0large-scale productions',
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
    { figure: '100+', label: 'events supported' },
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
    cgv: 'T&Cs',
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

const IT: HomeCopy = {
  header: {
    expertises: 'Competenze',
    realisations: 'Progetti',
    methodologie: 'Metodo',
    contact: 'Contatto',
    cta: 'Richiedi un preventivo',
  },
  hero: {
    titleLine1: 'Orchestri',
    titleLine1Accent: 'il tuo evento',
    titleLine2: 'da A a Z',
    body:
      'Concerti, conferenze, matrimoni, eventi corporate o grandi platee: Sndrush gestisce audio, luci, schermi LED, AV, foto, video e regia per un risultato professionale, fluido e affidabile.',
    cta: 'Richiedi un preventivo',
    note: 'Parigi · Île-de-France · Francia · Europa su richiesta',
    bgAlt: 'Crew tecnica e regia, concerto live e pubblico',
  },
  expertiseStrip: 'Audio · Luci · Schermi LED · AV · Foto · Video · Regia',
  servicesTitle: 'I nostri servizi',
  services: [
    {
      title: 'Audio',
      description:
        'Configuriamo il sistema audio adatto al tuo evento, dai formati intimi alle grandi platee.',
    },
    {
      title: 'Luci',
      description: 'Progettiamo la luce per valorizzare venue, palco e pubblico.',
    },
    {
      title: 'Schermi LED & AV',
      description:
        'Installiamo schermi LED e soluzioni AV per mostrare i contenuti con chiarezza e impatto.',
    },
    {
      title: 'Foto & video',
      description:
        'Copriamo l’evento in foto e video per catturare i momenti chiave e produrre contenuti di qualità.',
    },
    {
      title: 'Regia tecnica',
      description:
        'Coordiniamo l’intero setup prima e durante l’evento per garantire fluidità e affidabilità.',
    },
  ],
  eventScale: {
    titleLine1: 'Da formati intimi',
    titleLine2: 'a\u00a0produzioni su larga scala',
    titleLine3: '',
    body:
      'Supportiamo eventi eleganti in piccolo comitato e produzioni tecniche complesse ad alta capienza.',
    bodyClosing:
      'L’obiettivo resta invariato: setup affidabile, resa pulita ed esecuzione senza stress.',
    cap1: 'Eventi curati e su misura',
    cap1Detail:
      'Audio, luci, AV, foto, schermi LED e regia per eventi che richiedono precisione, fluidità ed esecuzione impeccabile.',
    cap2: 'Produzioni di grande scala',
    cap2Detail:
      'Setup adatti a grandi platee, venue esigenti e organizzazioni complesse.',
    imgAlt1: 'Console di mixaggio in regia, band live sullo sfondo',
    imgAlt2: 'Produzione evento di grande scala',
  },
  stats: [
    { figure: '3+', label: 'Anni di esperienza' },
    { figure: '100+', label: 'Eventi seguiti' },
    { figure: '10.000+', label: 'Capienza su grandi eventi' },
  ],
  clients: { sectionLabel: 'Ci hanno scelto' },
  portfolio: { title: 'I nostri progetti', viewProject: 'Vedi progetto' },
  methodology: {
    title: 'Come lavoriamo',
    steps: [
      {
        title: 'Analisi del bisogno',
        description:
          'Parliamo di evento, venue, vincoli e resa attesa.',
      },
      {
        title: 'Preparazione tecnica',
        description:
          'Definiamo l’attrezzatura, l’installazione e l’organizzazione più adatte.',
      },
      {
        title: 'Installazione & conduzione',
        description:
          'Installiamo, eseguiamo i settaggi e supervisioniamo il live.',
      },
    ],
  },
  finalCta: {
    line1: 'Parliamo del',
    line2: 'tuo',
    line3: 'evento',
    button: 'Richiedi un preventivo',
  },
  footer: {
    mentions: 'Note legali',
    confidentialite: 'Privacy',
    cgv: 'CGA',
    intranet: 'Intranet',
    copyright: '© 2026 Sndrush Paris',
  },
  projectsIndex: {
    title: 'I nostri progetti',
    intro: 'Alcuni esempi di intervento — apri una scheda per la gallery.',
    viewProject: 'Vedi progetto',
    back: '← Progetti',
  },
  projectDetail: { back: '← Progetti' },
};

const ES: HomeCopy = {
  header: {
    expertises: 'Expertise',
    realisations: 'Proyectos',
    methodologie: 'Método',
    contact: 'Contacto',
    cta: 'Pedir presupuesto',
  },
  hero: {
    titleLine1: 'Orquestamos',
    titleLine1Accent: 'tu evento',
    titleLine2: 'de principio a fin',
    body:
      'Conciertos, conferencias, bodas, eventos corporativos o grandes aforos: Sndrush gestiona sonido, luces, LED, AV, foto, video y regiduría con una operación clara y fiable.',
    cta: 'Pedir presupuesto',
    note: 'París · Île-de-France · Francia · Europa según el proyecto',
    bgAlt: 'Equipo técnico en regiduría, concierto y público',
  },
  expertiseStrip: 'Sonido · Luces · Pantallas LED · AV · Foto · Video · Regiduría',
  servicesTitle: 'Nuestros servicios',
  services: [
    {
      title: 'Sonido',
      description: 'Instalamos el sistema sonoro adecuado, de formatos íntimos a grandes aforos.',
    },
    {
      title: 'Iluminación',
      description: 'Diseñamos la luz para el espacio, el escenario y el público.',
    },
    {
      title: 'Pantallas LED & AV',
      description: 'Montamos LED y soluciones AV para mostrar contenido con claridad e impacto.',
    },
    {
      title: 'Foto & video',
      description: 'Cubrimos el evento en foto y video para contenidos de calidad.',
    },
    {
      title: 'Regiduría técnica',
      description: 'Coordinamos todo el setup antes y durante el evento para máxima fluidez.',
    },
  ],
  eventScale: {
    titleLine1: 'De formatos íntimos',
    titleLine2: 'a\u00a0producciones a gran escala',
    titleLine3: '',
    body:
      'Acompañamos tanto eventos elegantes en pequeño comité como producciones técnicas complejas.',
    bodyClosing:
      'Objetivo: setup fiable, resultado pulido y ejecución sin estrés.',
    cap1: 'Eventos cuidados y a medida',
    cap1Detail:
      'Sonido, luces, AV, foto, pantallas LED y regiduría para eventos que exigen precisión y fluidez.',
    cap2: 'Grandes producciones',
    cap2Detail:
      'Setups pensados para grandes aforos, venues exigentes y operaciones complejas.',
    imgAlt1: 'Mesa de mezcla en FOH, banda en directo al fondo',
    imgAlt2: 'Producción de evento a gran escala',
  },
  stats: [
    { figure: '3+', label: 'Años de experiencia' },
    { figure: '100+', label: 'Eventos acompañados' },
    { figure: '10.000+', label: 'Capacidad para grandes eventos' },
  ],
  clients: { sectionLabel: 'Nos han elegido' },
  portfolio: { title: 'Nuestros proyectos', viewProject: 'Ver proyecto' },
  methodology: {
    title: 'Cómo trabajamos',
    steps: [
      {
        title: 'Análisis de la necesidad',
        description: 'Hablamos de evento, venue, restricciones y resultado esperado.',
      },
      {
        title: 'Preparación técnica',
        description: 'Definimos equipo, instalación y organización óptimos.',
      },
      {
        title: 'Instalación & operación',
        description: 'Instalamos, ajustamos y supervisamos el directo.',
      },
    ],
  },
  finalCta: {
    line1: 'Hablemos de',
    line2: 'tu',
    line3: 'evento',
    button: 'Pedir presupuesto',
  },
  footer: {
    mentions: 'Aviso legal',
    confidentialite: 'Privacidad',
    cgv: 'CGV',
    intranet: 'Intranet',
    copyright: '© 2026 Sndrush Paris',
  },
  projectsIndex: {
    title: 'Nuestros proyectos',
    intro: 'Algunos ejemplos — abre una ficha para ver la galería.',
    viewProject: 'Ver proyecto',
    back: '← Proyectos',
  },
  projectDetail: { back: '← Proyectos' },
};

const ZH: HomeCopy = {
  header: {
    expertises: '服务',
    realisations: '案例',
    methodologie: '方法',
    contact: '联系',
    cta: '索取报价',
  },
  hero: {
    titleLine1: '我们为你统筹',
    titleLine1Accent: '整场活动',
    titleLine2: '端到端',
    body:
      '音乐会、会议、婚礼、企业活动或大型现场：Sndrush 负责音响、灯光、LED、视听、摄影、视频与统筹，流程清晰、可靠。',
    cta: '索取报价',
    note: '巴黎 · 法国 · 欧洲（视项目而定）',
    bgAlt: '技术团队与控台，现场演出与观众',
  },
  expertiseStrip: '音响 · 灯光 · LED · 视听 · 摄影 · 视频 · 统筹',
  servicesTitle: '我们的服务',
  services: [
    {
      title: '音响',
      description: '为小型到大规模活动配置合适的扩声系统。',
    },
    {
      title: '灯光',
      description: '为场地、舞台与观众设计光线氛围。',
    },
    {
      title: 'LED 与视听',
      description: '安装 LED 与 AV 方案，确保内容清晰、有冲击力。',
    },
    {
      title: '摄影与视频',
      description: '全程摄影摄像，交付高质量内容。',
    },
    {
      title: '技术统筹',
      description: '演前到演中全链路协调，保证流畅与可靠。',
    },
  ],
  eventScale: {
    titleLine1: '从小型到',
    titleLine2: '大型制作',
    titleLine3: '',
    body: '既支持精致小型活动，也擅长复杂的大型技术制作。',
    bodyClosing: '目标不变：可靠配置、干净呈现、无压力执行。',
    cap1: '精致与定制',
    cap1Detail: '音响、灯光、AV、摄影、LED、统筹——精度与流畅兼顾。',
    cap2: '大规模制作',
    cap2Detail: '面向高容量、苛刻场地与复杂运营的方案。',
    imgAlt1: '前场调音台，台上乐队演出',
    imgAlt2: '大型活动制作',
  },
  stats: [
    { figure: '3+', label: '年经验' },
    { figure: '100+', label: '场活动' },
    { figure: '10,000+', label: '大型容量' },
  ],
  clients: { sectionLabel: '客户与合作伙伴' },
  portfolio: { title: '我们的案例', viewProject: '查看项目' },
  methodology: {
    title: '我们的方式',
    steps: [
      {
        title: '需求分析',
        description: '沟通活动、场地、限制与预期效果。',
      },
      {
        title: '技术筹备',
        description: '确定设备、布置与组织方式。',
      },
      {
        title: '安装与执行',
        description: '安装、调试并监督现场执行。',
      },
    ],
  },
  finalCta: {
    line1: '聊聊',
    line2: '你的',
    line3: '活动',
    button: '索取报价',
  },
  footer: {
    mentions: '法律声明',
    confidentialite: '隐私',
    cgv: '销售条款',
    intranet: '内网',
    copyright: '© 2026 Sndrush Paris',
  },
  projectsIndex: {
    title: '我们的案例',
    intro: '一些示例——打开卡片查看图库。',
    viewProject: '查看项目',
    back: '← 案例',
  },
  projectDetail: { back: '← 案例' },
};

const COPIES: Record<'fr' | 'en' | 'it' | 'es' | 'zh', HomeCopy> = { fr: FR, en: EN, it: IT, es: ES, zh: ZH };

export function getHomeCopy(locale: HomeLocale): HomeCopy {
  return COPIES[resolveHomeContentLocale(locale)];
}
