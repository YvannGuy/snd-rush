import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { isValidBlogSlug } from './validSlugs';
import { blogArticlesData } from './articlesData';
import BlogArticleClient from './BlogArticleClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const { slug } = params;
  
  const article = blogArticlesData[slug as keyof typeof blogArticlesData];
  if (!article) {
    return {};
  }

  const articleData = article.fr; // Utiliser français par défaut pour SEO

  return {
    title: `${articleData.title} | SoundRush Paris Blog`,
    description: articleData.description,
    keywords: [
      'location sono Paris',
      'sonorisation professionnelle',
      'location matériel audio',
      'pack sono événement',
    ],
    alternates: {
      canonical: `https://www.sndrush.com/blog/${slug}`,
      languages: {
        'fr-FR': `https://www.sndrush.com/blog/${slug}`,
        'en-US': `https://www.sndrush.com/blog/${slug}?lang=en`,
      },
    },
    openGraph: {
      title: articleData.title,
      description: articleData.description,
      url: `https://www.sndrush.com/blog/${slug}`,
      siteName: 'SoundRush Paris',
      images: [
        {
          url: `https://www.sndrush.com${articleData.image}`,
          width: 1200,
          height: 630,
          alt: articleData.title,
        },
      ],
      locale: 'fr_FR',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: articleData.title,
      description: articleData.description,
      images: [`https://www.sndrush.com${articleData.image}`],
    },
  };
}

export default async function BlogArticlePage(props: PageProps) {
  const params = await props.params;
  const { slug } = params;

  // Vérifier si le slug est valide, sinon retourner 404
  if (!isValidBlogSlug(slug)) {
    notFound();
  }

  return <BlogArticleClient slug={slug} />;
}
