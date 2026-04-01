'use client';

import Image from 'next/image';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';

export default function EventScaleSection() {
  const { copy } = useHomeLocale();
  const e = copy.eventScale;

  return (
    <section className="bg-[#f3f0eb] py-16 text-[#050505] lg:py-24">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <h2 className="font-helvetica text-4xl font-bold leading-[0.88] tracking-display sm:text-6xl lg:text-[74px]">
            {e.titleLine1}
            <br />
            {e.titleLine2}
            {e.titleLine3 ? (
              <>
                <br />
                {e.titleLine3}
              </>
            ) : null}
          </h2>
          <div className="max-w-md space-y-4 text-sm leading-relaxed text-[#1f1f1f]/80 sm:text-base">
            <p>{e.body}</p>
            <p>{e.bodyClosing}</p>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <article>
            <div className="relative h-[360px] overflow-hidden bg-[#d8d3cc]">
              <Image
                src="/event-scale-soignes.png"
                alt={e.imgAlt1}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-black/15" />
            </div>
            <div className="mt-3 space-y-1.5">
              <p className="font-helvetica text-[11px] font-bold tracking-display text-[#050505]">
                {e.cap1}
              </p>
              <p className="text-sm leading-relaxed text-[#1f1f1f]/75">{e.cap1Detail}</p>
            </div>
          </article>

          <article>
            <div className="relative h-[360px] overflow-hidden bg-[#d8d3cc]">
              <Image
                src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80"
                alt={e.imgAlt2}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/25" />
            </div>
            <div className="mt-3 space-y-1.5">
              <p className="font-helvetica text-[11px] font-bold tracking-display text-[#050505]">
                {e.cap2}
              </p>
              <p className="text-sm leading-relaxed text-[#1f1f1f]/75">{e.cap2Detail}</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
