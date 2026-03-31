'use client';

import { useHomeLocale } from '@/contexts/HomeLocaleContext';

export default function MethodologySection() {
  const { copy } = useHomeLocale();
  const m = copy.methodology;

  return (
    <section id="methodologie" className="bg-[#f3f0eb] py-16 text-[#050505] lg:py-24">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <h2 className="font-helvetica text-3xl font-bold tracking-display sm:text-4xl">{m.title}</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {m.steps.map((step, index) => (
            <article key={step.title} className="relative border-t border-[#d8d3cc] pt-7">
              <span className="pointer-events-none absolute -top-8 right-0 text-8xl font-black leading-none text-[#141414]/8">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="font-helvetica text-lg font-bold tracking-display">{step.title}</h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#141414]/75">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
