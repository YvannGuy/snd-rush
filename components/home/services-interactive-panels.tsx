'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';
import { resolveHomeContentLocale } from '@/data/home-i18n';
import { cn } from '@/lib/utils';

const PANEL_MEDIA: { image: string; altFr: string; altEn: string }[] = [
  {
    image: '/services/sono.png',
    altFr: 'Sonorisation événementielle',
    altEn: 'Event sound reinforcement',
  },
  {
    image: '/services/lumiere.png',
    altFr: 'Éclairage scénique',
    altEn: 'Stage lighting',
  },
  {
    image: '/services/murled.png',
    altFr: 'Mur LED et solutions audiovisuelles',
    altEn: 'LED wall and AV solutions',
  },
  {
    image: '/services/photo.png',
    altFr: 'Prise de vue photo et vidéo',
    altEn: 'Photo and video capture',
  },
  {
    image: '/services/regie.png',
    altFr: 'Régie technique et pilotage',
    altEn: 'Technical direction and show control',
  },
];

export default function ServicesInteractivePanels() {
  const { copy, locale } = useHomeLocale();
  const contentLocale = resolveHomeContentLocale(locale);
  const [hovered, setHovered] = useState<number | null>(null);

  const services = copy.services;

  return (
    <section id="expertises" className="bg-[#0b0b0b] py-14 text-white sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <h2 className="mb-8 font-helvetica text-2xl font-bold tracking-display text-white sm:mb-10 sm:text-3xl">
          {copy.servicesTitle}
        </h2>

        <div className="flex gap-3 sm:gap-4 lg:gap-5">
          {services.map((service, index) => {
            const media = PANEL_MEDIA[index];
            if (!media) return null;

            const number = String(index + 1).padStart(2, '0');
            const isActive = hovered === index;
            const flexGrow = hovered === null ? 1 : isActive ? 1.9 : 0.9;
            const alt = contentLocale === 'fr' ? media.altFr : media.altEn;

            return (
              <article
                key={`${number}-${service.title}`}
                aria-label={service.title}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                className="group relative flex min-w-0 cursor-pointer overflow-hidden rounded-md bg-black/60"
                style={{
                  flexGrow,
                  flexBasis: 0,
                  transition: 'flex-grow 700ms cubic-bezier(0.25, 0.1, 0.25, 1)',
                }}
              >
                <div className="absolute inset-0">
                  <Image
                    src={media.image}
                    alt={alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 20vw"
                    className={cn(
                      'object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
                      isActive ? 'scale-105' : 'scale-100'
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                </div>

                <div className="relative flex min-h-[360px] w-full flex-col justify-between p-4 sm:min-h-[460px] sm:p-6 lg:min-h-[560px] lg:p-7">
                  <div className="space-y-2">
                    <p className="font-helvetica text-4xl font-black leading-none sm:text-5xl">{number}</p>
                    <div className="h-[2px] w-9 bg-white/80" />
                  </div>

                  <div className="mt-auto space-y-2">
                    <p
                      className={cn(
                        'font-helvetica text-xs font-bold uppercase tracking-[0.08em] transition-opacity duration-500 sm:text-sm',
                        isActive ? 'text-white' : 'text-white/90'
                      )}
                    >
                      {service.title}
                    </p>
                    <div
                      className={cn(
                        'overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
                        isActive
                          ? 'max-h-[min(46vh,22rem)] translate-y-0 opacity-100'
                          : 'max-h-0 translate-y-1 opacity-0'
                      )}
                      aria-hidden={!isActive}
                    >
                      <p className="max-w-xl text-left text-[11px] leading-relaxed text-white/78 sm:text-sm sm:leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
