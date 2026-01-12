import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductForMetadata } from '@/lib/products-server';
import ProductPageClient from './ProductPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const { id } = params;
  
  const product = await getProductForMetadata(id);
  
  if (!product) {
    return {
      title: 'Produit non trouvé | SoundRush Paris',
      description: 'Le produit demandé n\'existe pas.',
    };
  }

  const title = `Location ${product.name} | SoundRush Paris`;
  const description = product.long_description || product.description || `Location ${product.name} - Matériel professionnel disponible à Paris et Île-de-France.`;
  const imageUrl = product.images && product.images.length > 0 
    ? (product.images[0].startsWith('http') ? product.images[0] : `https://www.sndrush.com${product.images[0]}`)
    : 'https://www.sndrush.com/og-image.jpg';

  return {
    title,
    description,
    keywords: [
      `location ${product.name.toLowerCase()}`,
      `location ${product.category} Paris`,
      'location matériel audio Paris',
      'sonorisation professionnelle',
      'location sono Île-de-France',
    ],
    alternates: {
      canonical: `https://www.sndrush.com/catalogue/${product.slug || id}`,
      languages: {
        'fr-FR': `https://www.sndrush.com/catalogue/${product.slug || id}`,
        'en-US': `https://www.sndrush.com/catalogue/${product.slug || id}?lang=en`,
      },
    },
    openGraph: {
      title,
      description,
      url: `https://www.sndrush.com/catalogue/${product.slug || id}`,
      siteName: 'SoundRush Paris',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      locale: 'fr_FR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductPage(props: PageProps) {
  const params = await props.params;
  const { id } = params;
  
  // Vérifier que le produit existe (optionnel, pour éviter de rendre une page vide)
  const product = await getProductForMetadata(id);
  if (!product) {
    notFound();
  }

  return <ProductPageClient />;
}
