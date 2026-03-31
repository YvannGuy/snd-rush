'use client';

import { useHomeLocale } from '@/contexts/HomeLocaleContext';

export default function ExpertiseStrip() {
  const { copy } = useHomeLocale();

  return (
    <section className="border-y border-black/10 bg-white py-4">
      <div className="mx-auto w-full max-w-[1280px] px-3 text-center">
        <p className="font-helvetica text-sm font-bold tracking-display text-[#050505] sm:text-xl lg:text-[34px] lg:leading-none">
          {copy.expertiseStrip}
        </p>
      </div>
    </section>
  );
}
