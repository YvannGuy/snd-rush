'use client';

import { useHomeLocale } from '@/contexts/HomeLocaleContext';

const clients = ['Logitech', 'Partners', 'Brand', 'Global', 'Major'];

export default function ClientLogosSection() {
  const { copy } = useHomeLocale();

  return (
    <section className="bg-white py-14 text-[#050505] lg:py-20">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <p className="font-helvetica text-[10px] font-bold tracking-display text-[#8b8b8b]">
          {copy.clients.sectionLabel}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-9 gap-y-4 lg:gap-x-14">
          {clients.map((client) => (
            <span
              key={client}
              className="font-helvetica text-sm font-bold tracking-display text-[#141414]/65 transition-colors hover:text-[#141414]"
            >
              {client}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
