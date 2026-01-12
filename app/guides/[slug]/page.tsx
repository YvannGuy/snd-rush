import { notFound } from 'next/navigation';
import { isValidGuideSlug } from './validSlugs';
import GuidePageContent from './GuidePageContent';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function GuidePage(props: PageProps) {
  const params = await props.params;
  const { slug } = params;

  // Vérifier si le slug est valide, sinon retourner 404
  if (!isValidGuideSlug(slug)) {
    notFound();
  }

  return <GuidePageContent slug={slug} />;
}
