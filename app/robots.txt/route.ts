import { NextResponse } from 'next/server';

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://www.sndrush.com/sitemap.xml

# Pages à ne pas indexer (dashboards, admin, etc.)
Disallow: /dashboard/
Disallow: /admin/
Disallow: /auth/
Disallow: /api/
Disallow: /mes-reservations/
Disallow: /mes-contrats/
Disallow: /mes-factures/
Disallow: /mes-livraisons/
Disallow: /mes-etats-lieux/
Disallow: /mes-informations/
Disallow: /account/
Disallow: /checkout/
Disallow: /panier/
Disallow: /reservation/
Disallow: /sign-contract/
Disallow: /sign-quote/
Disallow: /suivi/
Disallow: /etat-materiel/
Disallow: /test-email-confirmation/
Disallow: /pro/

# Autoriser les pages importantes
Allow: /
Allow: /catalogue
Allow: /packs
Allow: /guides
Allow: /cgv
Allow: /mentions-legales
Allow: /politique-de-confidentialite
Allow: /devis
Allow: /generateur_de_prix
Allow: /conference
Allow: /mariage
Allow: /soiree
Allow: /book/
Allow: /blog
Allow: /location
Allow: /location-sono-paris
Allow: /location-enceinte-paris
Allow: /prestataire-audiovisuel-paris
Allow: /sonorisation-concert-paris
Allow: /guide-sonorisation
`;

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  });
}



