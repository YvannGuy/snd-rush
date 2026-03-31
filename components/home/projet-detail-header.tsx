'use client';

import { useHomeLocale } from '@/contexts/HomeLocaleContext';
import { resolveHomeContentLocale } from '@/data/home-i18n';
import { getProjetLocalized, type ProjetDefinition } from '@/data/projets';

export default function ProjetDetailHeader({ projet }: { projet: ProjetDefinition }) {
  const { locale } = useHomeLocale();
  const contentLocale = resolveHomeContentLocale(locale);
  const { name, description } = getProjetLocalized(projet, contentLocale);

  return (
    <header className="mt-10 max-w-3xl">
      <h1 className="font-helvetica text-3xl font-bold leading-tight tracking-display sm:text-4xl lg:text-5xl">
        {name}
      </h1>
      <p className="mt-6 text-sm leading-relaxed text-[#141414]/80 sm:text-base">{description}</p>
    </header>
  );
}
