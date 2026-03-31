'use client';

import Link from 'next/link';
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
import { SndrushMark } from '@/components/home/sndrush-mark';

export default function Header() {
  const { locale, setLocale, copy } = useHomeLocale();
  const selectedLang =
    HOME_LANGUAGE_OPTIONS.find((o) => o.key === locale) ?? HOME_LANGUAGE_OPTIONS[0];

  const navItems: { href: string; label: string }[] = [
    { href: '#expertises', label: copy.header.expertises },
    { href: '#realisations', label: copy.header.realisations },
    { href: '#methodologie', label: copy.header.methodologie },
    { href: '#contact', label: copy.header.contact },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-20 w-full max-w-[1240px] items-center justify-between gap-4 px-5 sm:h-[88px] lg:h-24 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="font-helvetica shrink-0 text-lg font-bold tracking-display transition-colors hover:opacity-90 md:text-xl lg:text-2xl"
        >
          <SndrushMark />
        </Link>

        <nav className="mx-auto hidden items-center gap-8 lg:gap-10 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-helvetica text-base font-bold tracking-display text-white/80 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-10 gap-2 rounded-sm px-2 text-white hover:bg-white/12 hover:text-white focus-visible:bg-white/12 focus-visible:text-white data-[state=open]:bg-white/12 data-[state=open]:text-white sm:h-11 sm:gap-2.5 sm:px-2.5 [&_svg]:text-white"
                aria-label="Changer de langue"
              >
                <Globe className="h-[18px] w-[18px] shrink-0 sm:h-5 sm:w-5" strokeWidth={1.75} />
                <span className="inline-flex items-center gap-1 font-helvetica text-sm font-bold tracking-[0.08em] sm:gap-1 sm:text-base">
                  <span>{selectedLang.short}</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-95 sm:h-4 sm:w-4" strokeWidth={2} />
                </span>
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

          <Link
            href="/contact"
            className="whitespace-nowrap rounded-sm bg-[#f36b21] px-3 py-2 font-helvetica text-xs font-bold tracking-[0.04em] text-white transition-colors hover:bg-[#ff7a33] sm:px-6 sm:py-3 sm:text-sm"
          >
            {copy.header.cta}
          </Link>
        </div>
      </div>
    </header>
  );
}
