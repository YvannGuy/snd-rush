'use client';

import { useHomeLocale } from '@/contexts/HomeLocaleContext';

const VALUES = ['15+', '500+', '0%'] as const;

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
            } flex items-end gap-3 pb-2 sm:px-6 lg:px-10`}
          >
            <p className="font-helvetica text-5xl font-bold leading-none tracking-display text-white lg:text-6xl">
              {VALUES[index]}
            </p>
            <p className="mb-1 font-helvetica text-[10px] font-bold tracking-display text-[#f36b21] sm:text-[11px]">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
