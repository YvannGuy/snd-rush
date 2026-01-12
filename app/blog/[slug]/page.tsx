import { notFound } from 'next/navigation';
import { isValidBlogSlug } from './validSlugs';
import BlogArticleClient from './BlogArticleClient';

interface PageProps {
  params: Promise<{ slug: string }>;
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
