'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';
import type { HomeLocale } from '@/data/home-i18n';

const NUMBER_LOCALE: Record<HomeLocale, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  it: 'it-IT',
  es: 'es-ES',
  zh: 'en-US',
};

function parseStatFigure(figure: string): { target: number; suffix: string } | null {
  const trimmed = figure.trim();
  const plus = trimmed.endsWith('+');
  const numPart = plus ? trimmed.slice(0, -1) : trimmed;
  const digits = numPart.replace(/\D/g, '');
  const target = parseInt(digits, 10);
  if (!digits || Number.isNaN(target)) return null;
  return { target, suffix: plus ? '+' : '' };
}

function formatStatNumber(n: number, locale: HomeLocale): string {
  if (n < 1000) return String(n);
  const tag = NUMBER_LOCALE[locale] ?? 'fr-FR';
  return new Intl.NumberFormat(tag, { maximumFractionDigits: 0 })
    .format(n)
    .replace(/\u202f/g, ' ');
}

function AnimatedFigure({
  figure,
  locale,
  active,
}: {
  figure: string;
  locale: HomeLocale;
  active: boolean;
}) {
  const parsed = useMemo(() => parseStatFigure(figure), [figure]);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || !parsed) return;

    const reduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setValue(parsed.target);
      return;
    }

    let start: number | null = null;
    let raf = 0;
    const duration = 1600;
    const { target } = parsed;

    const loop = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - (1 - p) ** 3;
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, parsed]);

  if (!parsed) {
    return (
      <p className="shrink-0 font-helvetica text-5xl font-bold leading-none tracking-display text-white lg:text-6xl">
        {figure}
      </p>
    );
  }

  return (
    <p className="shrink-0 font-helvetica text-5xl font-bold leading-none tracking-display text-white tabular-nums lg:text-6xl">
      {formatStatNumber(value, locale)}
      {parsed.suffix}
    </p>
  );
}

export default function StatsSection() {
  const { copy, locale } = useHomeLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          ob.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -5% 0px' }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-[#050505] py-10 lg:py-14">
      <div className="mx-auto grid w-full max-w-[1240px] gap-7 px-5 sm:grid-cols-3 sm:gap-0 sm:px-8 lg:px-10">
        {copy.stats.map((item, index) => (
          <div
            key={item.label}
            className={`${
              index < copy.stats.length - 1 ? 'sm:border-r sm:border-white/15' : ''
            } flex items-end gap-3 pb-2 sm:px-6 lg:px-10 ${item.figure ? '' : 'sm:items-center'}`}
          >
            {item.figure ? (
              <AnimatedFigure figure={item.figure} locale={locale} active={visible} />
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
