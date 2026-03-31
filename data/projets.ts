export type ProjetMediaItem =
  | { type: 'image'; src: string; alt: string }
  | { type: 'video'; src: string };

export type ProjetDefinition = {
  slug: string;
  name: string;
  description: string;
  cover: { src: string; alt: string };
  media: ProjetMediaItem[];
};

export const PROJETS: ProjetDefinition[] = [
  {
    slug: 'nude-project',
    name: 'Nude Project',
    description:
      'Direction technique, son, lumière et captation pour un showroom immersif dédié à la marque. Une mise en scène sobre et puissante, pensée pour mettre en valeur la collection dans un écrin premium.',
    cover: { src: '/nude.jpg', alt: 'Nude Project — couverture' },
    media: [
      { type: 'video', src: '/IMG_1689.MOV' },
      { type: 'video', src: '/IMG_1765.MOV' },
      { type: 'video', src: '/IMG_1768.MOV' },
      { type: 'video', src: '/IMG_1775.MOV' },
      { type: 'video', src: '/IMG_1789.MOV' },
    ],
  },
  {
    slug: 'soiree-live',
    name: 'Soirée live',
    description:
      'Sonorisation et ambiance lumineuse pour une soirée live intimiste : clarté vocale, dynamique maîtrisée et ressenti chaleureux du premier au dernier titre.',
    cover: {
      src: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1300&q=80',
      alt: 'Soirée live',
    },
    media: [
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1400&q=80',
        alt: 'Soirée live — ambiance',
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1400&q=80',
        alt: 'Soirée live — public',
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1400&q=80',
        alt: 'Soirée live — scène',
      },
    ],
  },
  {
    slug: 'grand-festival',
    name: 'Grand festival',
    description:
      'Grand format outdoor : renfort de puissance, diffusion homogène sur zone étendue et coordination technique pour tenir la pression d’un festival, du soundcheck au dernier encore.',
    cover: {
      src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1300&q=80',
      alt: 'Grand festival',
    },
    media: [
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80',
        alt: 'Festival — installation',
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1400&q=80',
        alt: 'Festival — lumière',
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=80',
        alt: 'Festival — foule',
      },
    ],
  },
  {
    slug: 'scene-monumentale',
    name: 'Scène monumentale',
    description:
      'Scénographie et régie pour un plateau monumental : truss, LED, vidéo et audio synchronisés, avec une exécution millimétrée pour un impact visuel et sonore maximal.',
    cover: {
      src: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1300&q=80',
      alt: 'Scène monumentale',
    },
    media: [
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=80',
        alt: 'Scène — grand format',
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=80',
        alt: 'Scène — régie',
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1571266028243-5c385f0f66fd?auto=format&fit=crop&w=1400&q=80',
        alt: 'Scène — détail technique',
      },
    ],
  },
];

export function getProjetBySlug(slug: string): ProjetDefinition | undefined {
  return PROJETS.find((p) => p.slug === slug);
}

export function getAllProjets(): ProjetDefinition[] {
  return PROJETS;
}
