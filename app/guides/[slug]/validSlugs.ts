// Liste des slugs valides pour les guides
export const validGuideSlugs = [
  'installation-pack-s',
  'installation-caisson-basse',
  'entretien-micro-sans-fil',
  'configuration-sonorisation-evenement',
] as const;

export function isValidGuideSlug(slug: string): boolean {
  return validGuideSlugs.includes(slug as any);
}

