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
            <br />
            {e.titleLine3}
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-[#1f1f1f]/80 sm:text-base">{e.body}</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <article>
            <div className="relative h-[360px] overflow-hidden bg-[#d8d3cc]">
              <Image
                src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80"
                alt={e.imgAlt1}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/15" />
            </div>
            <p className="mt-3 font-helvetica text-[11px] font-bold tracking-display text-[#050505]/70">
              {e.cap1}
            </p>
          </article>

          <article>
            <div className="relative h-[360px] overflow-hidden bg-[#d8d3cc]">
              <Image
                src="https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80"
                alt={e.imgAlt2}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/25" />
            </div>
            <p className="mt-3 font-helvetica text-[11px] font-bold tracking-display text-[#050505]/70">
              {e.cap2}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
