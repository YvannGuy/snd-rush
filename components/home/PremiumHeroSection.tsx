'use client';

import { ArrowRight, CalendarDays } from 'lucide-react';

interface PremiumHeroSectionProps {
  language: 'fr' | 'en';
  onPrimaryCta: () => void;
  onSecondaryCta: () => void;
}

export default function PremiumHeroSection({
  language,
  onPrimaryCta,
  onSecondaryCta,
}: PremiumHeroSectionProps) {
  const texts = {
    fr: {
      headline: 'SoundRush Paris votre evenement, notre excellence',
      subheadline:
        'De la conception a la realisation, nous gerons votre evenement cle en main, avec precision et style.',
      primaryCta: 'Planifiez votre projet',
      secondaryCta: 'Demandez votre consultation',
      label: 'Agence evenementielle premium',
    },
    en: {
      headline: 'SoundRush Paris - Your event, our excellence',
      subheadline:
        'From concept to execution, we manage your turnkey event with precision and style.',
      primaryCta: 'Plan your project',
      secondaryCta: 'Request your consultation',
      label: 'Premium event production agency',
    },
  };

  const currentTexts = texts[language];

  return (
    <section className="relative overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(200,166,106,0.25),transparent_45%),radial-gradient(circle_at_85%_15%,rgba(200,166,106,0.18),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.08),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-28 lg:px-8 lg:py-36">
        <span className="inline-flex items-center rounded-full border border-[#C8A66A]/50 bg-[#C8A66A]/10 px-4 py-1 text-xs uppercase tracking-[0.22em] text-[#E6D3A5]">
          {currentTexts.label}
        </span>
        <h1 className="mt-8 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
          {currentTexts.headline}
        </h1>
        <p className="mt-6 max-w-2xl text-base text-white/85 sm:text-lg lg:text-xl">
          {currentTexts.subheadline}
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={onPrimaryCta}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8A66A] px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:translate-y-[-1px] hover:bg-[#d7b97f]"
          >
            <CalendarDays className="h-4 w-4" />
            {currentTexts.primaryCta}
          </button>
          <button
            type="button"
            onClick={onSecondaryCta}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-[#C8A66A] hover:text-[#E6D3A5]"
          >
            {currentTexts.secondaryCta}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
