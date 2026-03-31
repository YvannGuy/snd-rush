'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';

export default function HeroSection() {
  const { copy } = useHomeLocale();
  const h = copy.hero;

  return (
    <section className="relative isolate min-h-[78vh] overflow-hidden bg-[#050505] lg:min-h-[86vh]">
      <Image
        src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=2200&q=80"
        alt="Production scénique immersive"
        fill
        priority
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/90 to-transparent" />

      <div className="relative mx-auto flex w-full max-w-[1240px] px-5 pb-16 pt-24 sm:px-8 lg:px-10 lg:pb-24 lg:pt-32">
        <div className="max-w-3xl">
          <p className="mb-5 font-helvetica text-sm font-bold tracking-display text-white/75 sm:text-base md:text-lg">
            {h.kicker}
          </p>

          <h1 className="font-helvetica text-5xl font-bold leading-[0.92] tracking-display text-white sm:text-6xl md:text-7xl lg:text-[96px]">
            <span className="lg:whitespace-nowrap">{h.titleLine1}</span>
            <br />
            {h.titleLine2}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/78 sm:text-lg">{h.body}</p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="#contact"
              className="rounded-sm bg-[#f36b21] px-7 py-3.5 font-helvetica text-base font-bold tracking-display text-white transition-colors hover:bg-[#ff7a33] sm:px-8 sm:py-4 sm:text-lg"
            >
              {h.cta}
            </Link>
            <span className="font-helvetica text-sm font-bold tracking-display text-white/70 sm:text-base">
              {h.note}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
