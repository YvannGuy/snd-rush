'use client';

import { ShieldCheck, Timer, Wrench, Users } from 'lucide-react';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';
import { getContactCopy } from '@/data/contact-i18n';

const ICONS = {
  timer: Timer,
  shield: ShieldCheck,
  wrench: Wrench,
  users: Users,
};

export function TrustStrip() {
  const { locale } = useHomeLocale();
  const items = getContactCopy(locale).trust;

  return (
    <section className="bg-white">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-2 gap-4 px-5 py-5 sm:grid-cols-4 sm:gap-6 sm:px-8 sm:py-7 lg:px-10">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <div
              key={item.title}
              className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#171717] sm:text-sm"
            >
              <Icon className="h-5 w-5 text-[#f36b21]" strokeWidth={2} />
              <span>{item.title}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
