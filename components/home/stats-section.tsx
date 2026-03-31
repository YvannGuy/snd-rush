'use client';

import { useHomeLocale } from '@/contexts/HomeLocaleContext';

export default function StatsSection() {
  const { copy } = useHomeLocale();

  return (
    <section className="bg-[#050505] py-10 lg:py-14">
      <div className="mx-auto grid w-full max-w-[1240px] gap-7 px-5 sm:grid-cols-3 sm:gap-0 sm:px-8 lg:px-10">
        {copy.stats.map((item, index) => (
          <div
            key={item.label}
            className={`${
              index < copy.stats.length - 1 ? 'sm:border-r sm:border-white/15' : ''
            } flex items-end gap-3 pb-2 sm:px-6 lg:px-10 ${item.figure ? '' : 'sm:items-center'}`}
          >
            {item.figure ? (
              <p className="shrink-0 font-helvetica text-5xl font-bold leading-none tracking-display text-white lg:text-6xl">
                {item.figure}
              </p>
            ) : null}
            <p
              className={`mb-1 font-helvetica font-bold tracking-display text-[#f36b21] ${
                item.figure ? 'text-[10px] sm:text-[11px]' : 'text-xs leading-snug sm:text-sm'
              }`}
            >
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
