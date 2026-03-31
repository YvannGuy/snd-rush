import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Footer from '@/components/home/footer';
import Header from '@/components/home/header';
import ProjetBackLink from '@/components/home/projet-back-link';
import { ProjetMediaCell } from '@/components/home/projet-media';
import { getAllProjets, getProjetBySlug } from '@/data/projets';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllProjets().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const projet = getProjetBySlug(slug);
  if (!projet) return { title: 'Projet | Sndrush Paris' };
  return {
    title: `${projet.name} | Sndrush Paris`,
    description: projet.description,
  };
}

export default async function ProjetPage({ params }: PageProps) {
  const { slug } = await params;
  const projet = getProjetBySlug(slug);
  if (!projet) notFound();

  return (
    <div className="min-h-screen bg-[#f3f0eb] text-[#050505]">
      <Header />
      <main className="pb-20 pt-10 lg:pb-24 lg:pt-14">
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10">
          <ProjetBackLink />

          <header className="mt-10 max-w-3xl">
            <h1 className="font-helvetica text-3xl font-bold leading-tight tracking-display sm:text-4xl lg:text-5xl">
              {projet.name}
            </h1>
            <p className="mt-6 text-sm leading-relaxed text-[#141414]/80 sm:text-base">{projet.description}</p>
          </header>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {projet.media.map((item, i) => (
              <ProjetMediaCell key={`${projet.slug}-media-${i}`} item={item} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
