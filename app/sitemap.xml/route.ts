import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Guides disponibles
const guides = [
  { slug: 'installation-pack-s', lastmod: '2025-01-15' },
  { slug: 'installation-caisson-basse', lastmod: '2025-01-15' },
  { slug: 'entretien-micro-sans-fil', lastmod: '2025-01-15' },
  { slug: 'configuration-sonorisation-evenement', lastmod: '2025-01-15' },
];

// Articles de blog disponibles
const blogArticles = [
  { slug: 'enceinte-active-vs-passive', lastmod: '2025-01-20' },
  { slug: 'micro-filaire-vs-sans-fil', lastmod: '2025-01-20' },
  { slug: 'calculer-puissance-sonore-evenement', lastmod: '2025-01-20' },
  { slug: 'sonorisation-mariage-guide-complet', lastmod: '2025-01-20' },
  { slug: '10-erreurs-eviter-location-sono', lastmod: '2025-01-20' },
  { slug: 'budget-sonorisation-evenement-2025', lastmod: '2025-01-20' },
];

// Packs disponibles
const packIds = [1, 2, 3, 5, 6, 7, 8];

const baseUrl = 'https://www.sndrush.com';

// Fonction pour récupérer les produits depuis Supabase
async function getProducts() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return [];
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from('products')
      .select('id, slug, updated_at, created_at')
      .not('slug', 'is', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération produits pour sitemap:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    return [];
  }
}

export async function GET() {
  const currentDate = new Date().toISOString();
  
  // Récupérer les produits depuis Supabase
  const products = await getProducts();
  
  // Pages statiques principales
  const staticPages = [
    { url: baseUrl, priority: '1.0', changefreq: 'daily', lastmod: currentDate },
    { url: `${baseUrl}/catalogue`, priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
    { url: `${baseUrl}/packs`, priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
    { url: `${baseUrl}/location`, priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
    { url: `${baseUrl}/location-sono-paris`, priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
    { url: `${baseUrl}/location-enceinte-paris`, priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
    { url: `${baseUrl}/prestataire-audiovisuel-paris`, priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
    { url: `${baseUrl}/sonorisation-concert-paris`, priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
    { url: `${baseUrl}/guide-sonorisation`, priority: '0.8', changefreq: 'monthly', lastmod: currentDate },
    { url: `${baseUrl}/generateur_de_prix`, priority: '0.8', changefreq: 'monthly', lastmod: currentDate },
    { url: `${baseUrl}/devis`, priority: '0.8', changefreq: 'monthly', lastmod: currentDate },
    { url: `${baseUrl}/conference`, priority: '0.8', changefreq: 'monthly', lastmod: currentDate },
    { url: `${baseUrl}/mariage`, priority: '0.8', changefreq: 'monthly', lastmod: currentDate },
    { url: `${baseUrl}/soiree`, priority: '0.8', changefreq: 'monthly', lastmod: currentDate },
    { url: `${baseUrl}/cgv`, priority: '0.5', changefreq: 'yearly', lastmod: currentDate },
    { url: `${baseUrl}/mentions-legales`, priority: '0.5', changefreq: 'yearly', lastmod: currentDate },
    { url: `${baseUrl}/politique-de-confidentialite`, priority: '0.5', changefreq: 'yearly', lastmod: currentDate },
  ];

  // Pages de guides
  const guidePages = guides.map(guide => ({
    url: `${baseUrl}/guides/${guide.slug}`,
    priority: '0.7',
    changefreq: 'monthly',
    lastmod: guide.lastmod,
  }));

  // Pages de blog
  const blogPages = blogArticles.map(article => ({
    url: `${baseUrl}/blog/${article.slug}`,
    priority: '0.8',
    changefreq: 'monthly',
    lastmod: article.lastmod,
  }));

  // Pages de packs
  const packPages = packIds.map(id => ({
    url: `${baseUrl}/packs/${id}`,
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: currentDate,
  }));

  // Pages produits catalogue
  const productPages = products.map(product => ({
    url: `${baseUrl}/catalogue/${product.slug || product.id}`,
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: product.updated_at ? new Date(product.updated_at).toISOString() : (product.created_at ? new Date(product.created_at).toISOString() : currentDate),
  }));

  // Page blog index
  const blogIndexPage = {
    url: `${baseUrl}/blog`,
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: currentDate,
  };

  // Combiner toutes les pages
  const allPages = [
    ...staticPages,
    blogIndexPage,
    ...guidePages,
    ...blogPages,
    ...packPages,
    ...productPages,
  ];

  // Générer le XML
  const urls = allPages
    .map(
      (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  
  return new NextResponse(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
    },
  });
}

