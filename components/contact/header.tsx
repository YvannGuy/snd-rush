'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SndrushMark } from '@/components/home/sndrush-mark';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '#evenements', label: 'Événements' },
  { href: '#technique', label: 'Technique' },
  { href: '#studio', label: 'Studio' },
  { href: '#contact', label: 'Contact' },
];

export function ContactHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/90 backdrop-blur">
      <div className="mx-auto flex h-[76px] w-full max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="shrink-0 text-lg font-bold tracking-tight text-white transition hover:opacity-90"
          aria-label="Sndrush Paris"
        >
          <SndrushMark />
        </Link>

        <nav className="hidden items-center gap-7 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/80 transition-colors lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'transition-colors hover:text-white',
                item.href === '#contact' && 'text-white'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button
          asChild
          className="h-10 rounded-sm bg-[#f36b21] px-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white hover:bg-[#ff7a33] lg:h-11 lg:px-6"
        >
          <Link href="#contact">Devis</Link>
        </Button>
      </div>
    </header>
  );
}
