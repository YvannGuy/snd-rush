// Liste des slugs valides pour les articles de blog
export const validBlogSlugs = [
  'enceinte-active-vs-passive',
  'micro-filaire-vs-sans-fil',
  'calculer-puissance-sonore-evenement',
  'sonorisation-mariage-guide-complet',
  '10-erreurs-eviter-location-sono',
  'budget-sonorisation-evenement-2025',
] as const;

export function isValidBlogSlug(slug: string): boolean {
  return validBlogSlugs.includes(slug as any);
}

