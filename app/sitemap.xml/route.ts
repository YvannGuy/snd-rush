import { NextResponse } from 'next/server';
import { BASE_PACKS } from '@/lib/packs/basePacks';

// Guides disponibles
const guides = [
  'installation-pack-s',
  'installation-caisson-basse',
  'entretien-micro-sans-fil',
  'configuration-sonorisation-evenement',
];

// Articles de blog disponibles
const blogArticles = [
  'enceinte-active-vs-passive',
  'micro-filaire-vs-sans-fil',
  'calculer-puissance-sonore-evenement',
  'sonorisation-mariage-guide-complet',
  '10-erreurs-eviter-location-sono',
  'budget-sonorisation-evenement-2025',
];

// Packs disponibles
const packKeys = Object.keys(BASE_PACKS);
const packIds = [1, 2, 3, 5, 6, 7, 8];

const baseUrl = 'https://www.sndrush.com';

function generateSitemapXML(): string {
  const currentDate = new Date().toISOString();
  
  // Pages statiques principales
  const staticPages = [
    { url: baseUrl, priority: '1.0', changefreq: 'daily' },
    { url: `${baseUrl}/catalogue`, priority: '0.9', changefreq: 'weekly' },
    { url: `${baseUrl}/packs`, priority: '0.9', changefreq: 'weekly' },
    { url: `${baseUrl}/location`, priority: '0.9', changefreq: 'weekly' },
    { url: `${baseUrl}/generateur_de_prix`, priority: '0.8', changefreq: 'monthly' },
    { url: `${baseUrl}/devis`, priority: '0.8', changefreq: 'monthly' },
    { url: `${baseUrl}/conference`, priority: '0.8', changefreq: 'monthly' },
    { url: `${baseUrl}/mariage`, priority: '0.8', changefreq: 'monthly' },
    { url: `${baseUrl}/soiree`, priority: '0.8', changefreq: 'monthly' },
    { url: `${baseUrl}/pro`, priority: '0.7', changefreq: 'monthly' },
    { url: `${baseUrl}/cgv`, priority: '0.5', changefreq: 'yearly' },
    { url: `${baseUrl}/mentions-legales`, priority: '0.5', changefreq: 'yearly' },
    { url: `${baseUrl}/politique-de-confidentialite`, priority: '0.5', changefreq: 'yearly' },
  ];

  // Pages de guides
  const guidePages = guides.map(slug => ({
    url: `${baseUrl}/guides/${slug}`,
    priority: '0.7',
    changefreq: 'monthly',
  }));

  // Pages de blog
  const blogPages = blogArticles.map(slug => ({
    url: `${baseUrl}/blog/${slug}`,
    priority: '0.8',
    changefreq: 'monthly',
  }));

  // Pages de packs
  const packPages = packIds.map(id => ({
    url: `${baseUrl}/packs/${id}`,
    priority: '0.8',
    changefreq: 'weekly',
  }));

  // Pages de réservation
  const bookPackPages = packKeys.map(key => ({
    url: `${baseUrl}/book/${key}`,
    priority: '0.7',
    changefreq: 'weekly',
  }));

  // Page blog index
  const blogIndexPage = {
    url: `${baseUrl}/blog`,
    priority: '0.8',
    changefreq: 'weekly',
  };

  // Combiner toutes les pages
  const allPages = [
    ...staticPages,
    blogIndexPage,
    ...guidePages,
    ...blogPages,
    ...packPages,
    ...bookPackPages,
  ];

  // Générer le XML
  const urls = allPages
    .map(
      (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export async function GET() {
  const sitemap = generateSitemapXML();
  
  return new NextResponse(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
    },
  });
}

