'use client';

import Link from 'next/link';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';

export default function FinalCTASection() {
  const { copy } = useHomeLocale();
  const c = copy.finalCta;

  return (
    <section id="contact" className="bg-[#050505] py-16 lg:py-24">
      <div className="mx-auto max-w-[900px] px-5 text-center sm:px-8">
        <h2 className="font-helvetica text-4xl font-bold leading-[0.9] tracking-display text-white sm:text-6xl lg:text-[82px]">
          {c.line1}
          <br />
          {c.line2}
          <br />
          {c.line3}
        </h2>
        <Link
          href="mailto:contact@guylocationevents.com"
          className="mt-9 inline-flex rounded-sm bg-[#f36b21] px-7 py-3 font-helvetica text-xs font-bold tracking-display text-white transition-colors hover:bg-[#ff7a33] sm:text-sm"
        >
          {c.button}
        </Link>
      </div>
    </section>
  );
}
