'use client';

import { useHomeLocale } from '@/contexts/HomeLocaleContext';
import { getContactCopy } from '@/data/contact-i18n';

export function MethodologySection() {
  const { locale } = useHomeLocale();
  const copy = getContactCopy(locale).methodology;

  return (
    <section className="bg-[#fbf9f5]" id="technique">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#6f6a63]">
          {copy.title}
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {copy.steps.map((step) => (
            <div key={step.number} className="border-t border-[#ddd6cd] pt-5">
              <span className="block font-black leading-none text-[#f36b21] text-[88px]">
                {step.number}
              </span>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-[#050505]">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#6f6a63]">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
