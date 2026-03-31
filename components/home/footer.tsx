'use client';

import Link from 'next/link';
import { SndrushMark } from '@/components/home/sndrush-mark';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';

export default function Footer() {
  const { copy } = useHomeLocale();

  const socialLinks = [
    {
      href: 'https://www.linkedin.com/company/sndrush/?viewAsMember=true',
      label: 'LinkedIn',
      external: true as const,
    },
    {
      href: 'https://www.instagram.com/sndrush/',
      label: 'Instagram',
      external: true as const,
    },
  ] as const;

  const linkClass =
    'font-helvetica text-sm font-bold tracking-display text-white/70 transition-colors hover:text-white sm:text-base';
  const discreteClass =
    'font-helvetica text-sm font-bold tracking-display text-white/40 transition-colors hover:text-[#f36b21] sm:text-base';

  return (
    <footer className="border-t border-white/10 bg-[#0b0b0b] py-11 lg:py-12">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start justify-between gap-4 px-5 sm:px-8 lg:flex-row lg:items-center lg:px-10">
        <p className="font-helvetica text-lg font-bold tracking-display md:text-xl lg:text-2xl">
          <SndrushMark parisClassName="text-white/85" />
        </p>

        <nav className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-2 lg:justify-end">
          <div className="flex shrink-0 items-center gap-5">
            <Link href="/mentions-legales" className={linkClass}>
              {copy.footer.mentions}
            </Link>
            <Link href="/politique-de-confidentialite" className={linkClass}>
              {copy.footer.confidentialite}
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:pl-0">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {item.label}
              </a>
            ))}
            <Link href="/auth/admin/login" className={discreteClass}>
              {copy.footer.intranet}
            </Link>
          </div>
        </nav>

        <p className="font-helvetica text-sm font-bold tracking-display text-white/45 sm:text-base lg:shrink-0">
          {copy.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
