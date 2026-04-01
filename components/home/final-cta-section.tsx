'use client';

import { useHomeLocale } from '@/contexts/HomeLocaleContext';
import QuoteCtaLink from '@/components/home/quote-cta-link';

export default function FinalCTASection() {
  const { copy } = useHomeLocale();
  const c = copy.finalCta;

  return (
    <section id="contact" className="bg-[#050505] py-16 lg:py-24">
      <div className="mx-auto max-w-[900px] px-5 text-center sm:px-8">
        {/* Pleine largeur viewport pour le scroll horizontal : évite la coupe des bords */}
        <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-auto overflow-y-visible overscroll-x-contain px-4 pb-2 [scrollbar-width:thin] sm:px-8">
          <h2 className="mx-auto w-max max-w-none whitespace-nowrap px-2 font-helvetica text-[clamp(1.15rem,3.8vw+0.35rem,5.125rem)] font-bold leading-[0.92] tracking-display text-white sm:text-[clamp(1.35rem,4.2vw+0.5rem,5.125rem)]">
            <span>{c.line1}</span>{' '}
            <span className="text-[#f36b21]">
              {c.line2} {c.line3}
            </span>
          </h2>
        </div>
        <QuoteCtaLink
          href="/contact"
          label={c.button}
          className="mt-9"
        />
      </div>
    </section>
  );
}
