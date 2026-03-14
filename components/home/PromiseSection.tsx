'use client';

import { Award, ShieldCheck, Truck } from 'lucide-react';

interface PromiseSectionProps {
  language: 'fr' | 'en';
}

export default function PromiseSection({ language }: PromiseSectionProps) {
  const texts = {
    fr: {
      title:
        'Avec SoundRush Paris, chaque evenement est une experience parfaite, pensee et executee par des professionnels.',
      badges: [
        { label: 'Evenements sur mesure', icon: Award },
        { label: 'Livraison & Installation', icon: Truck },
        { label: 'Support 24h / Urgence', icon: ShieldCheck },
      ],
    },
    en: {
      title:
        'With SoundRush Paris, every event is a flawless experience designed and executed by professionals.',
      badges: [
        { label: 'Custom-made events', icon: Award },
        { label: 'Delivery & Setup', icon: Truck },
        { label: '24/7 Emergency Support', icon: ShieldCheck },
      ],
    },
  };

  const currentTexts = texts[language];

  return (
    <section className="bg-black py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="max-w-4xl text-2xl font-semibold leading-tight text-white sm:text-4xl">
          {currentTexts.title}
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {currentTexts.badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.label}
                className="flex items-center gap-3 rounded-xl border border-[#C8A66A]/50 bg-white/[0.03] px-4 py-4"
              >
                <Icon className="h-5 w-5 text-[#C8A66A]" />
                <span className="text-sm font-medium text-white">{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
