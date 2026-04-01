'use client';

import Link from 'next/link';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';
import { getContactCopy } from '@/data/contact-i18n';

export function ContactIntroPanel() {
  const { locale } = useHomeLocale();
  const copy = getContactCopy(locale).intro;

  return (
    <div className="flex flex-col gap-8 text-[#171717]">
      <div className="space-y-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#f36b21]">{copy.kicker}</p>
        <h2 className="font-helvetica text-3xl font-bold leading-[1.05] tracking-display text-[#050505] sm:text-4xl">
          {copy.title}{' '}
          <span className="text-[#f36b21]">{copy.highlight}</span>
        </h2>
        <p className="max-w-xl text-base leading-relaxed text-[#6f6a63]">
          {copy.body}
        </p>
      </div>

      <div className="rounded-sm border border-[#ddd6cd] bg-[#fbf9f5] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.04)]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#f36b21]">
          {copy.contactLabel}
        </p>
        <div className="mt-3 space-y-2 text-[#171717]">
          <Link href={`mailto:${copy.contactEmail}`} className="text-base font-semibold hover:text-[#f36b21]">
            {copy.contactEmail}
          </Link>
        </div>
      </div>

      <div className="relative rounded-sm border border-[#ddd6cd] bg-[#fbf9f5] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.04)]">
        <div className="absolute left-0 top-0 h-full w-[3px] bg-[#f36b21]" aria-hidden />
        <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#f36b21]">
          {copy.processLabel}
        </p>
        <div className="mt-4 space-y-4">
          {copy.steps.map((step) => (
            <div key={step.number} className="flex items-start gap-3">
              <span className="text-sm font-bold tracking-[0.2em] text-[#f36b21]">{step.number}</span>
              <p className="text-base leading-snug text-[#171717]">{step.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
