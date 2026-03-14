'use client';

import Image from 'next/image';

interface PortfolioSectionProps {
  language: 'fr' | 'en';
}

export default function PortfolioSection({ language }: PortfolioSectionProps) {
  const texts = {
    fr: {
      title: 'Portfolio',
      subtitle: 'Quelques productions recentes pour des marques, institutions et evenements prives.',
    },
    en: {
      title: 'Portfolio',
      subtitle: 'Recent productions for brands, institutions and private events.',
    },
  };

  const currentTexts = texts[language];
  const projects = [
    {
      title: 'Lancement premium - Paris 8e',
      image:
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Conference immersive - La Defense',
      image:
        'https://images.unsplash.com/photo-1472653816316-3ad6f10a6592?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Soiree privee - Hotel particulier',
      image:
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Showcase artistique - Paris centre',
      image:
        'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-black sm:text-4xl">{currentTexts.title}</h2>
        <p className="mt-4 max-w-3xl text-base text-gray-600 sm:text-lg">{currentTexts.subtitle}</p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.title}
              className="group relative overflow-hidden rounded-2xl border border-gray-200"
            >
              <div className="relative h-72 w-full">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <p className="absolute bottom-5 left-5 right-5 text-lg font-medium text-white">{project.title}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
