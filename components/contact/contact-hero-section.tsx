'use client';

import Image from 'next/image';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';
import { getContactCopy } from '@/data/contact-i18n';

const heroBg = '/concert.jpg';

export function ContactHeroSection() {
  const { locale } = useHomeLocale();
  const copy = getContactCopy(locale).hero;

  return (
    <section className="relative isolate overflow-hidden bg-[#050505]" id="evenements">
      <div className="absolute inset-0">
        <Image src={heroBg} alt={copy.bgAlt} fill priority className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/70 to-[#050505]/92" />
      </div>

      <div className="relative mx-auto flex min-h-[420px] w-full max-w-[1240px] flex-col justify-center px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 sm:text-[11px]">
          {copy.kicker}
        </p>
        <h1 className="max-w-3xl font-helvetica text-[30px] font-bold leading-[0.95] tracking-display text-white sm:text-[42px] lg:text-[58px]">
          <span>{copy.titleLine1}</span>{' '}
          <span className="text-[#f36b21]">{copy.titleLine1Accent}</span>
          <br />
          {copy.titleLine2}
        </h1>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-[#e8e3db] sm:text-[15px] lg:text-base">
          {copy.body}
        </p>
      </div>
    </section>
  );
}
