import { type HomeLocale, resolveHomeContentLocale } from '@/data/home-i18n';

export type ProjetMediaItem =
  | { type: 'image'; src: string; alt: string }
  | { type: 'video'; src: string };

export type ProjetCover =
  | { kind: 'image'; src: string; alt: string }
  | { kind: 'wordmark'; text: string; alt: string };

export type ProjetDefinition = {
  slug: string;
  name: string;
  description: string;
  nameEn: string;
  descriptionEn: string;
  cover: ProjetCover;
  media: ProjetMediaItem[];
  /** Si false : pas affiché sur la home / liste projets, URL détail en 404. */
  listed?: boolean;
};

export function getProjetLocalized(
  projet: ProjetDefinition,
  locale: HomeLocale
): { name: string; description: string } {
  const lang = resolveHomeContentLocale(locale);
  return lang === 'en'
    ? { name: projet.nameEn, description: projet.descriptionEn }
    : { name: projet.name, description: projet.description };
}

export const PROJETS: ProjetDefinition[] = [
  {
    slug: 'nude-project',
    name: 'Showroom',
    description: 'Installation technique et accompagnement événementiel',
    nameEn: 'Showroom',
    descriptionEn: 'Technical installation and on-site event support',
    cover: { kind: 'wordmark', text: 'Showroom', alt: 'Showroom — couverture' },
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
    name: 'Mariages',
    description: 'Son, lumière et régie sur site',
    nameEn: 'Weddings',
    descriptionEn: 'Sound, lighting and show control on site',
    cover: { kind: 'wordmark', text: 'Mariages', alt: 'Mariages — couverture' },
    media: [
      { type: 'video', src: '/videos/mariages-1.mp4' },
      { type: 'video', src: '/videos/mariages-3.mp4' },
    ],
  },
  {
    slug: 'grand-festival',
    listed: false,
    name: 'Grand festival',
    description: 'Déploiement technique pour grande capacité',
    nameEn: 'Major festival',
    descriptionEn: 'Technical deployment for large-capacity events',
    cover: {
      kind: 'image',
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
    listed: false,
    name: 'Scène monumentale',
    description: 'Installation et coordination technique complète',
    nameEn: 'Monumental stage',
    descriptionEn: 'Full technical installation and coordination',
    cover: {
      kind: 'image',
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
  const p = PROJETS.find((pr) => pr.slug === slug);
  if (!p || p.listed === false) return undefined;
  return p;
}

export function getAllProjets(): ProjetDefinition[] {
  return PROJETS.filter((p) => p.listed !== false);
}
