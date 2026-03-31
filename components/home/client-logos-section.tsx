'use client';

import { useHomeLocale } from '@/contexts/HomeLocaleContext';

const references = [
  'Référence Studios',
  'Unikorn Events',
  'The Maptique SRL',
  'Fédération Syndicale Étudiante',
  'American School of Paris',
  'Wave in Paris',
  'Synergie productions',
  'Restaurant Leriche',
  'Poltrona Fau',
  'Nude Project',
  'La Bourse de Paris',
] as const;

export default function ClientLogosSection() {
  const { copy } = useHomeLocale();

  return (
    <section className="bg-white py-16 text-[#050505] lg:py-24">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <h2 className="font-helvetica text-3xl font-bold tracking-display sm:text-4xl">
          {copy.clients.sectionLabel}
        </h2>
        <div className="mt-10 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div
            className="inline-flex flex-nowrap items-center font-helvetica text-sm font-medium tracking-display text-[#8b8b8b]"
            role="list"
          >
            {references.map((name, i) => (
              <span key={name} className="inline-flex shrink-0 items-center" role="listitem">
                {i > 0 ? <span className="px-3 text-[#d8d3cc]" aria-hidden>·</span> : null}
                <span>{name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
