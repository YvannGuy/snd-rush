'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';
import { resolveHomeContentLocale } from '@/data/home-i18n';
import { getAllProjets, getProjetLocalized } from '@/data/projets';

export default function PortfolioSection() {
  const { copy, locale } = useHomeLocale();
  const contentLocale = resolveHomeContentLocale(locale);
  const projets = getAllProjets();

  return (
    <section id="realisations" className="bg-[#f3f0eb] py-16 text-[#050505] lg:py-24">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <h2 className="font-helvetica text-3xl font-bold tracking-display sm:text-4xl">{copy.portfolio.title}</h2>
        <div className="mt-10 grid grid-cols-1 gap-8 gap-y-10 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12">
          {projets.map((projet) => {
            const { name, description } = getProjetLocalized(projet, contentLocale);
            return (
            <article key={projet.slug}>
              <div className="mb-3 space-y-1.5">
                <p className="font-helvetica text-[10px] font-bold tracking-display text-[#050505]">
                  {name}
                </p>
                <p className="text-sm leading-relaxed text-[#141414]/75">{description}</p>
              </div>
              <Link href={`/projets/${projet.slug}`} className="group block">
                <div className="relative h-52 overflow-hidden bg-[#e8e4df] sm:h-72 lg:h-80">
                  <Image
                    src={projet.cover.src}
                    alt={projet.cover.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-black/[0.06]" />
                </div>
                <span className="mt-4 inline-block font-helvetica text-[10px] font-bold tracking-display text-[#050505]/55 transition-colors group-hover:text-[#f36b21]">
                  {copy.portfolio.viewProject}
                </span>
              </Link>
            </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
