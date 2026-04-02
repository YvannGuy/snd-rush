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
  const [hovered, setHovered] = useState<number | null>(0);

  const services = copy.services;

  return (
    <section id="expertises" className="bg-[#0b0b0b] py-14 text-white sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <h2 className="mb-8 font-helvetica text-2xl font-bold tracking-display text-white sm:mb-10 sm:text-3xl">
          {copy.servicesTitle}
        </h2>

        {/* Mobile : cartes empilées, tap pour agrandir */}
        <div className="mt-2 flex flex-col gap-4 md:hidden">
          {services.map((service, index) => {
            const media = PANEL_MEDIA[index];
            if (!media) return null;

            const number = String(index + 1).padStart(2, '0');
            const isActive = hovered === index;
            const alt = contentLocale === 'fr' ? media.altFr : media.altEn;

            return (
              <article
                key={`${number}-${service.title}-mobile`}
                onClick={() => setHovered(index)}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  'relative overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.28)] transition-all duration-700',
                  isActive ? 'scale-[1.02] brightness-100' : 'scale-[0.9] brightness-[0.8]'
                )}
              >
                <div
                  className={cn(
                    'relative w-full transition-all duration-700',
                    isActive ? 'h-[340px]' : 'h-[220px]'
                  )}
                >
                  <Image
                    src={media.image}
                    alt={alt}
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.72),rgba(0,0,0,0.28))]" />
                  <div className="absolute inset-0 flex flex-col justify-between p-6">
                    <div className="space-y-2">
                      <p className="font-helvetica text-4xl font-black leading-none text-white">{number}</p>
                      <div className="h-px w-full bg-white/70" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-helvetica text-lg font-semibold uppercase tracking-[0.08em] text-white">
                        {service.title}
                      </p>
                      <div
                        className={cn(
                          'overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-smooth',
                          isActive
                            ? 'max-h-[240px] translate-y-0 opacity-100'
                            : 'max-h-0 translate-y-1 opacity-0'
                        )}
                        aria-hidden={!isActive}
                      >
                        <p className="text-sm leading-snug text-white/85">{service.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Desktop / tablette : panneaux interactifs étirables */}
        <div className="-mx-5 hidden gap-3 overflow-visible px-1 sm:gap-4 lg:gap-5 md:flex">
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
                onClick={() => setHovered(index)}
                className="group relative flex min-w-[75vw] md:min-w-0 cursor-pointer overflow-hidden bg-black/60 snap-start"
                style={{
                  flexGrow,
                  flexBasis: '0%',
                  transition: 'flex-grow 700ms cubic-bezier(0.25, 0.1, 0.25, 1)',
                }}
              >
                <div className="absolute inset-0">
                  <Image
                    src={media.image}
                    alt={alt}
                    fill
                    sizes="(max-width: 1024px) 70vw, 20vw"
                    className={cn(
                      'object-cover transition-transform duration-700 ease-smooth',
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
                        'overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-smooth',
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
