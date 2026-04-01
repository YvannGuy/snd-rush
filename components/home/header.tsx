'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';
import { HOME_LANGUAGE_OPTIONS, type HomeLocale } from '@/data/home-i18n';
import { cn } from '@/lib/utils';
import { SndrushMark } from '@/components/home/sndrush-mark';
import QuoteCtaLink from '@/components/home/quote-cta-link';

const LANG_TRIGGER_ON_DARK =
  'h-10 gap-2 rounded-sm px-2 text-white hover:bg-white/12 hover:text-white focus-visible:bg-white/12 focus-visible:text-white data-[state=open]:bg-white/12 data-[state=open]:text-white sm:h-11 sm:gap-2.5 sm:px-2.5 [&_svg]:text-white';

const LANG_TRIGGER_ON_LIGHT =
  'h-10 gap-2 rounded-sm px-2 text-[#141414] hover:bg-black/[0.06] hover:text-[#050505] focus-visible:bg-black/[0.06] focus-visible:text-[#050505] data-[state=open]:bg-black/[0.06] data-[state=open]:text-[#050505] sm:h-11 sm:gap-2.5 sm:px-2.5 [&_svg]:text-[#141414]';

function LanguageTriggerLabel({ short }: { short: string }) {
  return (
    <>
      <Globe className="h-[18px] w-[18px] shrink-0 sm:h-5 sm:w-5" strokeWidth={1.75} />
      <span className="inline-flex items-center gap-1 font-helvetica text-sm font-bold tracking-[0.08em] sm:gap-1 sm:text-base">
        <span>{short}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-95 sm:h-4 sm:w-4" strokeWidth={2} />
      </span>
    </>
  );
}

/** Radix peut produire des id différents SSR / client ; le menu ne monte qu’après hydratation. */
function HeaderLanguageMenu({ onDark }: { onDark: boolean }) {
  const [mounted, setMounted] = useState(false);
  const { locale, setLocale } = useHomeLocale();
  const selectedLang =
    HOME_LANGUAGE_OPTIONS.find((o) => o.key === locale) ?? HOME_LANGUAGE_OPTIONS[0];
  const triggerClass = onDark ? LANG_TRIGGER_ON_DARK : LANG_TRIGGER_ON_LIGHT;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        className={cn(triggerClass, 'pointer-events-none select-none')}
        aria-label="Changer de langue"
        aria-disabled
        tabIndex={-1}
      >
        <LanguageTriggerLabel short={selectedLang.short} />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" className={triggerClass} aria-label="Changer de langue">
          <LanguageTriggerLabel short={selectedLang.short} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {HOME_LANGUAGE_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.key}
            className={locale === opt.key ? 'bg-muted font-medium' : ''}
            onClick={() => setLocale(opt.key as HomeLocale)}
          >
            <span className="mr-2 text-xs text-muted-foreground">{opt.short}</span>
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { copy, locale } = useHomeLocale();
  const [scrolled, setScrolled] = useState(false);

  /** Home : hero sombre → header transparent ; pages claires → barre légère lisible */
  const onDarkHero = pathname === '/' || pathname === '';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems: { href: string; label: string }[] = [
    { href: onDarkHero ? '#expertises' : '/#expertises', label: copy.header.expertises },
    { href: onDarkHero ? '#realisations' : '/#realisations', label: copy.header.realisations },
    { href: onDarkHero ? '#methodologie' : '/#methodologie', label: copy.header.methodologie },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 backdrop-blur-md transition-all duration-300',
        onDarkHero
          ? cn('bg-transparent', scrolled ? 'border-b border-white/15' : 'border-b border-transparent')
          : 'border-b border-[#e5dfd6]/90 bg-[#f3f0eb]/88 shadow-[0_1px_0_rgba(0,0,0,0.04)]'
      )}
    >
      <div className="mx-auto flex h-20 w-full max-w-[1240px] items-center justify-between gap-4 px-5 sm:h-[88px] lg:h-24 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="font-helvetica shrink-0 text-lg font-bold tracking-display transition-opacity hover:opacity-90 md:text-xl lg:text-2xl"
        >
          <SndrushMark parisClassName={onDarkHero ? 'text-white/90' : 'text-[#141414]'} />
        </Link>

        <nav className="mx-auto hidden items-center gap-8 lg:gap-10 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'font-helvetica text-base font-bold tracking-display transition-colors',
                onDarkHero
                  ? 'text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.45)] hover:text-white'
                  : 'text-[#141414]/75 hover:text-[#050505]'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <HeaderLanguageMenu onDark={onDarkHero} />

          <QuoteCtaLink
            href="/contact"
            label={copy.header.cta}
            shortLabel={locale === 'fr' ? 'Devis' : 'Quote'}
            size="compact"
          />
        </div>
      </div>
    </header>
  );
}
