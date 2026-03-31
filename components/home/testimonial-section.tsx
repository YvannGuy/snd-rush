'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';
import { resolveHomeContentLocale } from '@/data/home-i18n';
import { HOME_TESTIMONIAL_SLIDES } from '@/data/home-testimonials';

const AUTO_MS = 7500;

export default function TestimonialSection() {
  const { locale } = useHomeLocale();
  const lang = resolveHomeContentLocale(locale);

  const slides = useMemo(
    () =>
      HOME_TESTIMONIAL_SLIDES.map((s) => ({
        quote: lang === 'fr' ? s.quoteFr : s.quoteEn,
        name: s.name,
        role: lang === 'fr' ? s.roleFr : s.roleEn,
      })),
    [lang]
  );

  const [index, setIndex] = useState(0);

  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % slides.length) + slides.length) % slides.length);
    },
    [slides.length]
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const current = slides[index];
  const sectionAria = lang === 'fr' ? 'Avis clients' : 'Customer reviews';
  const tabsAria = lang === 'fr' ? 'Sélectionner un avis' : 'Choose a review';

  return (
    <section className="bg-white py-16 text-[#050505] lg:py-24" aria-label={sectionAria}>
      <div className="mx-auto max-w-[980px] px-5 text-center sm:px-8">
        <p className="mb-4 text-lg text-[#f36b21]">“</p>

        <div className="relative mx-auto min-h-[200px] max-w-3xl md:min-h-[240px] lg:min-h-[280px]">
          <div
            key={index}
            className="animate-testimonial-in flex flex-col items-center justify-center"
          >
            <blockquote className="text-2xl italic leading-tight text-[#141414] sm:text-3xl lg:text-[38px] whitespace-pre-line">
              {current.quote}
            </blockquote>
            <p className="mt-8 font-helvetica text-xs font-bold tracking-display text-[#141414]">
              {current.name}
            </p>
            <p className="mt-2 font-helvetica text-[11px] font-bold tracking-display text-[#8b8b8b]">
              {current.role}
            </p>
          </div>
        </div>

        <div
          className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-8 sm:gap-2.5"
          role="tablist"
          aria-label={tabsAria}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={
                lang === 'fr'
                  ? `Avis ${i + 1} sur ${slides.length}`
                  : `Review ${i + 1} of ${slides.length}`
              }
              onClick={() => goTo(i)}
              className={`aspect-square rounded-full transition-all duration-300 ${
                i === index
                  ? 'h-2.5 w-2.5 bg-[#f36b21] sm:h-3 sm:w-3'
                  : 'h-2 w-2 bg-[#d8d3cc] hover:bg-[#8b8b8b] sm:h-2.5 sm:w-2.5'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
