'use client';

import Image from 'next/image';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';
import QuoteCtaLink from '@/components/home/quote-cta-link';

export default function HeroSection() {
  const { copy } = useHomeLocale();
  const h = copy.hero;

  return (
    <section className="relative z-0 isolate -mt-20 min-h-[78vh] overflow-hidden bg-[#050505] sm:-mt-[88px] lg:-mt-24 lg:min-h-[86vh]">
      <Image
        src="/hero-background.png"
        alt={h.bgAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/60 to-black/42" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/90 to-transparent" />

      <div className="relative mx-auto flex w-full max-w-[1240px] px-5 pb-16 pt-44 sm:px-8 sm:pt-[11.5rem] lg:px-10 lg:pb-24 lg:pt-56">
        <div className="max-w-3xl">
          <p className="mb-5 font-helvetica text-sm font-bold tracking-display text-white/75 sm:text-base md:text-lg">
            {h.kicker}
          </p>

          <h1 className="font-helvetica text-5xl font-bold leading-[0.92] tracking-display text-white sm:text-6xl md:text-7xl lg:text-[84px] xl:text-[96px]">
            {h.titleLine1Accent ? (
              <>
                <span>{h.titleLine1}</span>{' '}
                <span className="text-[#f36b21]">{h.titleLine1Accent}</span>
              </>
            ) : (
              <span>{h.titleLine1}</span>
            )}
            <br />
            {h.titleLine2}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/78 sm:text-lg">{h.body}</p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <QuoteCtaLink href="#contact" label={h.cta} />
            <span className="font-helvetica text-sm font-bold tracking-display text-white/70 sm:text-base">
              {h.note}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
